'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LessonItemProps {
  lesson: {
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
  }
  completed: boolean
  locked: boolean
  index: number
}

export default function LessonItem({ lesson, completed, locked, index }: LessonItemProps) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDone, setIsDone] = useState(completed)

  async function toggleComplete() {
    if (locked || saving) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const nextDone = !isDone
    const { error } = await supabase.from('lesson_progress').upsert({
      user_id: user.id,
      course_id: lesson.course_id,
      lesson_id: lesson.id,
      completed: nextDone,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' })
    setSaving(false)
    if (!error) {
      setIsDone(nextDone)
      router.refresh()
    }
  }

  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12,
      opacity: locked ? 0.55 : 1, overflow: 'hidden',
    }}>
      <button
        onClick={() => !locked && setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '.85rem',
          padding: '1rem 1.15rem', background: 'transparent', border: 'none',
          cursor: locked ? 'not-allowed' : 'pointer', textAlign: 'left',
        }}
      >
        <button
          onClick={e => { e.stopPropagation(); toggleComplete() }}
          disabled={locked || saving}
          style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            border: `2px solid ${isDone ? 'var(--eden)' : 'var(--border)'}`,
            background: isDone ? 'var(--eden)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: locked ? 'not-allowed' : 'pointer', padding: 0,
          }}
        >
          {isDone && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--bg-0)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '.68rem', color: 'var(--text-lo)', fontWeight: 600 }}>Lesson {index + 1}</div>
          <div style={{ fontSize: '.92rem', fontWeight: 600, color: 'var(--text-hi)' }}>{lesson.title}</div>
        </div>
        {lesson.duration_minutes && (
          <span style={{ fontSize: '.75rem', color: 'var(--text-lo)', flexShrink: 0 }}>{lesson.duration_minutes}m</span>
        )}
        {!locked && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
        {locked && (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
      </button>

      {open && !locked && (
        <div style={{ padding: '0 1.15rem 1.15rem', borderTop: '1px solid var(--border)' }}>
          {lesson.description && (
            <p style={{ marginTop: '1rem', color: 'var(--text-md)', fontSize: '.88rem', lineHeight: 1.7 }}>{lesson.description}</p>
          )}
          {lesson.video_url && (
            <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', marginTop: '.75rem', color: 'var(--eden)', fontWeight: 600, fontSize: '.85rem' }}>
              Watch video
            </a>
          )}
          {lesson.audio_url && (
            <a href={lesson.audio_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '.6rem', color: 'var(--eden)', fontWeight: 600, fontSize: '.85rem' }}>
              Listen to audio
            </a>
          )}
          {lesson.content && (
            <p style={{ marginTop: '.75rem', color: 'var(--text-md)', fontSize: '.88rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{lesson.content}</p>
          )}
          {lesson.pdf_url && (
            <a href={lesson.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', marginTop: '.75rem', color: 'var(--eden)', fontWeight: 600, fontSize: '.85rem' }}>
              {lesson.attachment_label || 'Download attachment'}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
