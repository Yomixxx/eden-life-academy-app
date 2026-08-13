'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const ACCENT = '#f97316'
const MAX_LESSON_FILE_SIZE_BYTES = 100 * 1024 * 1024

interface Course {
  id: string
  title: string
  description: string | null
  category: string | null
  level: string | null
  thumbnail_url: string | null
  duration_minutes: number | null
  total_lessons: number | null
  is_published: boolean
  sort_order: number | null
}

interface Lesson {
  id: string
  course_id: string
  title: string
  description: string | null
  video_url: string | null
  audio_url: string | null
  content: string | null
  pdf_url: string | null
  attachment_label: string | null
  duration_minutes: number | null
  sort_order: number | null
  is_published: boolean
}

interface Enrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string | null
  academy_level: string | null
  cohort: string | null
  matric_number: string | null
  profiles: { full_name: string | null; phone: string | null; email: string | null } | null
}

function csvCell(value: string | null | undefined): string {
  const s = value ?? ''
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const EMPTY_COURSE: Omit<Course, 'id'> = {
  title: '', description: '', category: 'foundation', level: 'beginner',
  thumbnail_url: '', duration_minutes: null, total_lessons: null,
  is_published: false, sort_order: null,
}

const EMPTY_LESSON: Omit<Lesson, 'id' | 'course_id'> = {
  title: '', description: '', video_url: '', audio_url: '',
  content: '', pdf_url: null, attachment_label: null,
  duration_minutes: null, sort_order: null, is_published: false,
}

const CATEGORIES = ['foundation', 'leadership', 'ministry', 'bible_study', 'discipleship']
const LEVELS = ['beginner', 'intermediate', 'advanced']

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE)
  const [saving, setSaving] = useState(false)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({})
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON)
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [enrollments, setEnrollments] = useState<Record<string, Enrollment[]>>({})
  const [removingEnrollmentId, setRemovingEnrollmentId] = useState<string | null>(null)
  const supabase = createClient()

  async function uploadLessonFile(file: File) {
    if (file.size > MAX_LESSON_FILE_SIZE_BYTES) {
      alert('File is too large. Lesson files must be 100MB or smaller.')
      return
    }
    setUploadingFile(true)
    const ext = file.name.split('.').pop()
    const path = `lessons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('lesson-files').upload(path, file, { upsert: false })
    if (error) {
      alert('Upload failed: ' + error.message)
      setUploadingFile(false)
      return
    }
    const { data } = supabase.storage.from('lesson-files').getPublicUrl(path)
    setLessonForm(p => ({ ...p, pdf_url: data.publicUrl, attachment_label: file.name }))
    setUploadingFile(false)
  }

  const load = useCallback(async () => {
    const { data } = await supabase.from('courses').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false })
    setCourses(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function loadLessons(courseId: string) {
    if (lessons[courseId]) return
    const { data } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('sort_order', { ascending: true })
    setLessons(prev => ({ ...prev, [courseId]: data ?? [] }))
  }

  async function loadEnrollments(courseId: string) {
    if (enrollments[courseId]) return
    const { data } = await supabase
      .from('enrollments')
      .select('id, user_id, course_id, enrolled_at, academy_level, cohort, matric_number, profiles(full_name, phone, email)')
      .eq('course_id', courseId)
      .order('enrolled_at', { ascending: true })
    setEnrollments(prev => ({ ...prev, [courseId]: (data as unknown as Enrollment[]) ?? [] }))
  }

  async function removeEnrollment(enrollment: Enrollment) {
    setRemovingEnrollmentId(enrollment.id)
    await supabase.from('enrollments').delete().eq('id', enrollment.id)
    setEnrollments(prev => ({
      ...prev,
      [enrollment.course_id]: prev[enrollment.course_id]?.filter(e => e.id !== enrollment.id) ?? [],
    }))
    setRemovingEnrollmentId(null)
  }

  function exportEnrollmentsCsv(course: Course) {
    const rows = enrollments[course.id] ?? []
    const header = ['Matric Number', 'Full Name', 'Email', 'Phone', 'Level', 'Cohort', 'Enrolled At']
    const lines = [header.join(',')]
    for (const e of rows) {
      lines.push([
        csvCell(e.matric_number),
        csvCell(e.profiles?.full_name),
        csvCell(e.profiles?.email),
        csvCell(e.profiles?.phone),
        csvCell(e.academy_level),
        csvCell(e.cohort),
        csvCell(e.enrolled_at),
      ].join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${course.title.replace(/[^\w\- ]+/g, '').trim() || 'enrollments'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function openCreateCourse() {
    setEditingCourse(null)
    setCourseForm(EMPTY_COURSE)
    setShowCourseModal(true)
  }

  function openEditCourse(course: Course) {
    setEditingCourse(course)
    setCourseForm({ ...course })
    setShowCourseModal(true)
  }

  async function saveCourse() {
    if (!courseForm.title.trim()) return
    setSaving(true)
    if (editingCourse) {
      await supabase.from('courses').update(courseForm).eq('id', editingCourse.id)
    } else {
      await supabase.from('courses').insert(courseForm)
    }
    setSaving(false)
    setShowCourseModal(false)
    load()
  }

  async function togglePublish(course: Course) {
    await supabase.from('courses').update({ is_published: !course.is_published }).eq('id', course.id)
    setCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_published: !c.is_published } : c))
  }

  async function deleteCourse(id: string) {
    await supabase.from('courses').delete().eq('id', id)
    setCourses(prev => prev.filter(c => c.id !== id))
    setDeleteConfirm(null)
  }

  function toggleExpand(courseId: string) {
    if (expandedCourse === courseId) {
      setExpandedCourse(null)
    } else {
      setExpandedCourse(courseId)
      loadLessons(courseId)
      loadEnrollments(courseId)
    }
  }

  function openCreateLesson(courseId: string) {
    setActiveCourseId(courseId)
    setEditingLesson(null)
    setLessonForm(EMPTY_LESSON)
    setShowLessonModal(true)
  }

  function openEditLesson(lesson: Lesson) {
    setActiveCourseId(lesson.course_id)
    setEditingLesson(lesson)
    setLessonForm({ ...lesson })
    setShowLessonModal(true)
  }

  async function saveLesson() {
    if (!lessonForm.title.trim() || !activeCourseId) return
    setSaving(true)
    if (editingLesson) {
      await supabase.from('lessons').update(lessonForm).eq('id', editingLesson.id)
    } else {
      await supabase.from('lessons').insert({ ...lessonForm, course_id: activeCourseId })
    }
    setSaving(false)
    setShowLessonModal(false)
    const { data } = await supabase.from('lessons').select('*').eq('course_id', activeCourseId).order('sort_order', { ascending: true })
    setLessons(prev => ({ ...prev, [activeCourseId]: data ?? [] }))
  }

  async function deleteLesson(lesson: Lesson) {
    await supabase.from('lessons').delete().eq('id', lesson.id)
    setLessons(prev => ({
      ...prev,
      [lesson.course_id]: prev[lesson.course_id]?.filter(l => l.id !== lesson.id) ?? [],
    }))
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '.65rem .85rem',
    color: 'var(--text-hi)', fontSize: '.9rem',
    fontFamily: 'var(--font-poppins), Poppins, sans-serif',
    outline: 'none',
  }

  const labelStyle = { fontSize: '.78rem', fontWeight: 600, color: 'var(--text-md)', marginBottom: '.3rem', display: 'block' as const }

  const btnPrimary = {
    background: ACCENT, color: '#fff', border: 'none',
    borderRadius: 8, padding: '.65rem 1.25rem',
    fontSize: '.88rem', fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-poppins), Poppins, sans-serif',
    transition: 'opacity .15s',
  }

  const btnSecondary = {
    background: 'var(--bg-3)', color: 'var(--text-md)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '.65rem 1.25rem',
    fontSize: '.88rem', fontWeight: 500, cursor: 'pointer',
    fontFamily: 'var(--font-poppins), Poppins, sans-serif',
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: ACCENT, marginBottom: '.35rem' }}>Admin</div>
          <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-hi)', margin: 0 }}>Courses</h1>
        </div>
        <button onClick={openCreateCourse} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Course
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-lo)', fontSize: '.9rem', padding: '2rem 0' }}>Loading courses…</div>
      ) : courses.length === 0 ? (
        <div style={{ background: 'var(--bg-1)', border: '1px dashed var(--border)', borderRadius: 14, padding: '3rem', textAlign: 'center', color: 'var(--text-lo)' }}>
          No courses yet. Create your first course.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {courses.map(course => (
            <div key={course.id} style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => toggleExpand(course.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-lo)', padding: 0, display: 'flex', alignItems: 'center', transition: 'transform .15s', transform: expandedCourse === course.id ? 'rotate(90deg)' : 'rotate(0deg)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
                <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                  <div style={{ fontSize: '.95rem', fontWeight: 600, color: 'var(--text-hi)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</div>
                  <div style={{ display: 'flex', gap: '.5rem', marginTop: '.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '.7rem', padding: '.15rem .55rem', background: 'var(--bg-3)', borderRadius: 99, color: 'var(--text-lo)', textTransform: 'capitalize' }}>{course.category?.replace('_', ' ')}</span>
                    <span style={{ fontSize: '.7rem', padding: '.15rem .55rem', background: 'var(--bg-3)', borderRadius: 99, color: 'var(--text-lo)', textTransform: 'capitalize' }}>{course.level}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0 }}>
                  <button
                    onClick={() => togglePublish(course)}
                    style={{
                      fontSize: '.72rem', fontWeight: 600, padding: '.3rem .75rem',
                      borderRadius: 99, border: 'none', cursor: 'pointer',
                      background: course.is_published ? 'rgba(94,201,87,.15)' : 'var(--bg-3)',
                      color: course.is_published ? '#5ec957' : 'var(--text-lo)',
                      transition: 'background .15s, color .15s',
                    }}
                  >
                    {course.is_published ? 'Published' : 'Draft'}
                  </button>
                  <button onClick={() => openEditCourse(course)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-lo)', padding: '.25rem', borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color .15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-hi)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-lo)'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button onClick={() => setDeleteConfirm(course.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-lo)', padding: '.25rem', borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color .15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fca5a5'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-lo)'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </div>

              {expandedCourse === course.id && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem', background: 'rgba(0,0,0,.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                    <div style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-lo)' }}>Lessons</div>
                    <button onClick={() => openCreateLesson(course.id)} style={{ ...btnPrimary, padding: '.4rem .85rem', fontSize: '.78rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add Lesson
                    </button>
                  </div>
                  {!lessons[course.id] ? (
                    <div style={{ color: 'var(--text-lo)', fontSize: '.85rem' }}>Loading…</div>
                  ) : lessons[course.id].length === 0 ? (
                    <div style={{ color: 'var(--text-lo)', fontSize: '.85rem' }}>No lessons yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                      {lessons[course.id].map((lesson, idx) => (
                        <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '.65rem 1rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '.75rem', color: 'var(--text-lo)', width: 24, textAlign: 'center', flexShrink: 0 }}>{idx + 1}</span>
                          <div style={{ flex: '1 1 160px', minWidth: 160 }}>
                            <div style={{ fontSize: '.88rem', fontWeight: 500, color: 'var(--text-hi)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lesson.title}</div>
                            <div style={{ fontSize: '.72rem', color: 'var(--text-lo)', marginTop: 2 }}>
                              {lesson.duration_minutes ? `${lesson.duration_minutes} min` : ''}
                              {lesson.video_url ? ' · Video' : ''}
                              {lesson.audio_url ? ' · Audio' : ''}
                            </div>
                          </div>
                          <span style={{ fontSize: '.68rem', padding: '.15rem .5rem', borderRadius: 99, background: lesson.is_published ? 'rgba(94,201,87,.12)' : 'var(--bg-3)', color: lesson.is_published ? '#5ec957' : 'var(--text-lo)' }}>
                            {lesson.is_published ? 'Live' : 'Draft'}
                          </span>
                          <button onClick={() => openEditLesson(lesson)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-lo)', padding: '.2rem', display: 'flex', alignItems: 'center', transition: 'color .15s' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-hi)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-lo)'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button onClick={() => deleteLesson(lesson)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-lo)', padding: '.2rem', display: 'flex', alignItems: 'center', transition: 'color .15s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#fca5a5'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-lo)'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6"/><path d="M14 11v6"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1.5rem 0 .75rem' }}>
                    <div style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-lo)' }}>
                      Enrolled Members{enrollments[course.id] ? ` (${enrollments[course.id].length})` : ''}
                    </div>
                    <button
                      onClick={() => exportEnrollmentsCsv(course)}
                      disabled={!enrollments[course.id]?.length}
                      style={{
                        ...btnSecondary, padding: '.4rem .85rem', fontSize: '.78rem', display: 'flex', alignItems: 'center', gap: '.4rem',
                        cursor: enrollments[course.id]?.length ? 'pointer' : 'not-allowed',
                        opacity: enrollments[course.id]?.length ? 1 : 0.5,
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Export CSV
                    </button>
                  </div>
                  {!enrollments[course.id] ? (
                    <div style={{ color: 'var(--text-lo)', fontSize: '.85rem' }}>Loading…</div>
                  ) : enrollments[course.id].length === 0 ? (
                    <div style={{ color: 'var(--text-lo)', fontSize: '.85rem' }}>No one has enrolled in this course yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                      {enrollments[course.id].map(enrollment => (
                        <div key={enrollment.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '.65rem 1rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 200px', minWidth: 200 }}>
                            <div style={{ fontSize: '.88rem', fontWeight: 500, color: 'var(--text-hi)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {enrollment.profiles?.full_name ?? 'Unnamed'}
                            </div>
                            <div style={{ fontSize: '.72rem', color: 'var(--text-lo)', marginTop: 2 }}>
                              {enrollment.profiles?.email ?? enrollment.profiles?.phone ?? '—'} · Enrolled {enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </div>
                          </div>
                          {enrollment.academy_level && (
                            <span style={{ fontSize: '.7rem', padding: '.15rem .55rem', background: 'var(--bg-3)', borderRadius: 99, color: 'var(--text-lo)' }}>{enrollment.academy_level} Level</span>
                          )}
                          {enrollment.matric_number && (
                            <span style={{ fontSize: '.7rem', padding: '.15rem .55rem', background: 'rgba(94,201,87,.12)', borderRadius: 99, color: '#5ec957', fontFamily: 'monospace' }}>{enrollment.matric_number}</span>
                          )}
                          <button
                            onClick={() => { if (confirm(`Remove ${enrollment.profiles?.full_name ?? 'this member'} from this course?`)) removeEnrollment(enrollment) }}
                            disabled={removingEnrollmentId === enrollment.id}
                            style={{
                              background: 'transparent', border: '1px solid var(--border)', borderRadius: 8,
                              padding: '.35rem .75rem', fontSize: '.78rem', fontWeight: 500,
                              cursor: removingEnrollmentId === enrollment.id ? 'not-allowed' : 'pointer',
                              color: 'var(--text-lo)', opacity: removingEnrollmentId === enrollment.id ? 0.5 : 1,
                              transition: 'color .15s, border-color .15s',
                              fontFamily: 'var(--font-poppins), Poppins, sans-serif',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.borderColor = '#fca5a5' }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-lo)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                          >
                            {removingEnrollmentId === enrollment.id ? 'Removing…' : 'Remove'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCourseModal(false) }}
        >
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-hi)', borderRadius: 18, width: '100%', maxWidth: 540, maxHeight: '90svh', overflowY: 'auto', padding: '1.75rem' }}>
            <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-hi)', margin: '0 0 1.5rem' }}>
              {editingCourse ? 'Edit Course' : 'New Course'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input style={inputStyle} value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} placeholder="Course title" />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={courseForm.description ?? ''} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select style={inputStyle} value={courseForm.category ?? 'foundation'} onChange={e => setCourseForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Level</label>
                  <select style={inputStyle} value={courseForm.level ?? 'beginner'} onChange={e => setCourseForm(p => ({ ...p, level: e.target.value }))}>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Thumbnail URL</label>
                <input style={inputStyle} value={courseForm.thumbnail_url ?? ''} onChange={e => setCourseForm(p => ({ ...p, thumbnail_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Duration (minutes)</label>
                  <input type="number" style={inputStyle} value={courseForm.duration_minutes ?? ''} onChange={e => setCourseForm(p => ({ ...p, duration_minutes: e.target.value ? Number(e.target.value) : null }))} placeholder="e.g. 120" />
                </div>
                <div>
                  <label style={labelStyle}>Sort Order</label>
                  <input type="number" style={inputStyle} value={courseForm.sort_order ?? ''} onChange={e => setCourseForm(p => ({ ...p, sort_order: e.target.value ? Number(e.target.value) : null }))} placeholder="e.g. 1" />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.65rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={courseForm.is_published} onChange={e => setCourseForm(p => ({ ...p, is_published: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <span style={{ fontSize: '.9rem', color: 'var(--text-md)' }}>Publish immediately</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button style={btnSecondary} onClick={() => setShowCourseModal(false)}>Cancel</button>
              <button style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={saveCourse} disabled={saving}>
                {saving ? 'Saving…' : editingCourse ? 'Save Changes' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setShowLessonModal(false) }}
        >
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-hi)', borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '90svh', overflowY: 'auto', padding: '1.75rem' }}>
            <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-hi)', margin: '0 0 1.5rem' }}>
              {editingLesson ? 'Edit Lesson' : 'New Lesson'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input style={inputStyle} value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} placeholder="Lesson title" />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={lessonForm.description ?? ''} onChange={e => setLessonForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description" />
              </div>
              <div>
                <label style={labelStyle}>Video URL</label>
                <input style={inputStyle} value={lessonForm.video_url ?? ''} onChange={e => setLessonForm(p => ({ ...p, video_url: e.target.value }))} placeholder="YouTube / Vimeo link" />
              </div>
              <div>
                <label style={labelStyle}>Audio URL</label>
                <input style={inputStyle} value={lessonForm.audio_url ?? ''} onChange={e => setLessonForm(p => ({ ...p, audio_url: e.target.value }))} placeholder="Podcast / audio link" />
              </div>
              <div>
                <label style={labelStyle}>Upload File (PDF, PPT, PPTX, MP4, MOV) — up to 100MB</label>
                <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{
                    display: 'inline-flex', alignItems: 'center', gap: '.5rem',
                    padding: '.55rem 1rem', borderRadius: 8, cursor: uploadingFile ? 'not-allowed' : 'pointer',
                    background: 'var(--bg-3)', border: '1px solid var(--border)',
                    fontSize: '.85rem', color: 'var(--text-md)', fontWeight: 500,
                    opacity: uploadingFile ? 0.6 : 1,
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    {uploadingFile ? 'Uploading…' : 'Choose file'}
                    <input type="file" accept=".pdf,.ppt,.pptx,.mp4,.mov,.avi,.webm" disabled={uploadingFile} onChange={e => { const f = e.target.files?.[0]; if (f) uploadLessonFile(f) }} style={{ display: 'none' }} />
                  </label>
                  {lessonForm.pdf_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <span style={{ fontSize: '.82rem', color: 'var(--eden)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lessonForm.attachment_label || 'File uploaded'}
                      </span>
                      <button type="button" onClick={() => setLessonForm(p => ({ ...p, pdf_url: null, attachment_label: null }))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-lo)', padding: 0, display: 'flex', alignItems: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Content / Notes</label>
                <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={lessonForm.content ?? ''} onChange={e => setLessonForm(p => ({ ...p, content: e.target.value }))} placeholder="Lesson notes or transcript" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Duration (minutes)</label>
                  <input type="number" style={inputStyle} value={lessonForm.duration_minutes ?? ''} onChange={e => setLessonForm(p => ({ ...p, duration_minutes: e.target.value ? Number(e.target.value) : null }))} placeholder="e.g. 30" />
                </div>
                <div>
                  <label style={labelStyle}>Sort Order</label>
                  <input type="number" style={inputStyle} value={lessonForm.sort_order ?? ''} onChange={e => setLessonForm(p => ({ ...p, sort_order: e.target.value ? Number(e.target.value) : null }))} placeholder="e.g. 1" />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.65rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={lessonForm.is_published} onChange={e => setLessonForm(p => ({ ...p, is_published: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <span style={{ fontSize: '.9rem', color: 'var(--text-md)' }}>Publish immediately</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button style={btnSecondary} onClick={() => setShowLessonModal(false)}>Cancel</button>
              <button style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={saveLesson} disabled={saving}>
                {saving ? 'Saving…' : editingLesson ? 'Save Changes' : 'Add Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-hi)', borderRadius: 16, padding: '1.75rem', maxWidth: 380, width: '100%' }}>
            <div style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-hi)', marginBottom: '.75rem' }}>Delete Course?</div>
            <p style={{ color: 'var(--text-lo)', fontSize: '.9rem', margin: '0 0 1.5rem' }}>This will permanently delete the course and all its lessons. This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
              <button style={btnSecondary} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button style={{ ...btnPrimary, background: '#ef4444' }} onClick={() => deleteCourse(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
