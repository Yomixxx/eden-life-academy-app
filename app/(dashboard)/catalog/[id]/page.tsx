import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EnrollButton from '@/components/EnrollButton'
import LessonItem from '@/components/LessonItem'
import LiveClassCard from '@/components/LiveClassCard'
import { CURRENT_COHORT_COURSE_ID } from '@/lib/academy'

const levelColors: Record<string, string> = {
  beginner: '#86efac',
  intermediate: '#fde68a',
  advanced: '#fca5a5',
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/catalog/${id}`)}`)

  const [courseRes, lessonsRes, enrollmentRes, progressRes] = await Promise.all([
    supabase.from('courses').select('*').eq('id', id).single(),
    supabase.from('lessons').select('*').eq('course_id', id).eq('is_published', true).order('sort_order', { ascending: true }),
    supabase.from('enrollments').select('*').eq('user_id', user.id).eq('course_id', id).maybeSingle(),
    supabase.from('lesson_progress').select('lesson_id, completed').eq('user_id', user.id).eq('course_id', id),
  ])

  if (!courseRes.data) notFound()

  const course = courseRes.data
  const lessons = lessonsRes.data ?? []
  const enrolled = !!enrollmentRes.data
  const locked = !enrolled || course.is_locked
  const academyLevel = enrollmentRes.data?.academy_level as string | null | undefined

  let classLink = null
  if (enrolled && course.id === CURRENT_COHORT_COURSE_ID && academyLevel) {
    const { data } = await supabase.from('class_links').select('*').eq('level', academyLevel).maybeSingle()
    classLink = data
  }
  const completedIds = new Set((progressRes.data ?? []).filter(p => p.completed).map(p => p.lesson_id))
  const completedCount = lessons.filter(l => completedIds.has(l.id)).length
  const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0
  const levelColor = levelColors[course.level?.toLowerCase() ?? ''] ?? 'var(--text-lo)'

  return (
    <div style={{ maxWidth: 800 }}>
      <a href="/catalog" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', color: 'var(--text-lo)', fontSize: '.85rem', fontWeight: 600, marginBottom: '1.5rem' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Catalog
      </a>

      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem', marginBottom: '1.75rem', boxShadow: '0 20px 46px -28px rgba(0,0,0,.7)' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,.12), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', marginBottom: '.75rem', position: 'relative' }}>
          {course.category && (
            <span style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--eden)' }}>{course.category}</span>
          )}
          {course.level && (
            <span style={{ fontSize: '.68rem', fontWeight: 600, background: 'rgba(255,255,255,.06)', color: levelColor, padding: '.3rem .7rem', borderRadius: 20, textTransform: 'capitalize' }}>{course.level}</span>
          )}
        </div>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem,3vw,2rem)', color: 'var(--text-hi)', letterSpacing: '-.02em', marginBottom: '.75rem', position: 'relative' }}>
          {course.title}
        </h1>
        {course.description && (
          <p style={{ color: 'var(--text-md)', fontSize: '.92rem', lineHeight: 1.7, marginBottom: '1.25rem', position: 'relative' }}>{course.description}</p>
        )}
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '.82rem', color: 'var(--text-lo)', marginBottom: enrolled ? '1.25rem' : '1.5rem', position: 'relative' }}>
          {lessons.length > 0 && <span>{lessons.length} lessons</span>}
          {course.duration_minutes && <span>{Math.round(course.duration_minutes / 60)}h {course.duration_minutes % 60}m</span>}
        </div>

        {enrolled ? (
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
              <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text-md)' }}>Your progress</span>
              <span style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--eden)' }}>{completedCount}/{lessons.length} · {progressPct}%</span>
            </div>
            <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--eden), var(--eden-glow))', borderRadius: 4, transition: 'width .3s' }} />
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}><EnrollButton courseId={course.id} /></div>
        )}
      </div>

      {academyLevel && <LiveClassCard level={academyLevel} initial={classLink} />}

      {enrolled && course.is_locked && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '.75rem',
          background: 'rgba(249,115,22,.08)', border: '1px solid rgba(249,115,22,.25)',
          borderRadius: 12, padding: '.9rem 1.1rem', marginBottom: '1.75rem',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p style={{ fontSize: '.85rem', color: 'var(--text-md)', margin: 0 }}>
            You&apos;re enrolled — lessons unlock once the session begins. We&apos;ll let you know when they&apos;re open.
          </p>
        </div>
      )}

      <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-hi)', marginBottom: '1rem' }}>
        Lessons
      </h2>

      {lessons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-lo)', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 16 }}>
          <p>No lessons published for this course yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {lessons.map((lesson, i) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              completed={completedIds.has(lesson.id)}
              locked={locked}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  )
}
