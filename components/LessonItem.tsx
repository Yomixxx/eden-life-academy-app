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

  const isPdf = !!lesson.pdf_url && /\.pdf($|\?)/i.test(lesson.pdf_url)

  async function setCompleted(nextDone: boolean) {
    if (locked || saving) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
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
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          border: `2px solid ${isDone ? 'var(--eden)' : 'var(--border)'}`,
          background: isDone ? 'var(--eden)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isDone && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--bg-0)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '.68rem', color: 'var(--text-lo)', fontWeight: 600 }}>Lesson {index + 1}</div>
          <div style={{ fontSize: '.92rem', fontWeight: 600, color: 'var(--text-hi)' }}>{lesson.title}</div>
        </div>
        {lesson.duration_minutes && (
          <span style={{ fontSize: '.75rem', color: 'var(--text-lo)', flexShrink: 0 }}>{lesson.duration_minutes}m</span>
        )}
        {!locked && !open && (
          <span style={{
            fontSize: '.78rem', fontWeight: 700, color: 'var(--eden)', flexShrink: 0,
            padding: '.4rem .85rem', borderRadius: 8, background: 'rgba(94,201,87,.1)',
            border: '1px solid rgba(94,201,87,.25)', fontFamily: 'var(--font-poppins), Poppins, sans-serif',
          }}>
            {isDone ? 'Review' : 'Start'}
          </span>
        )}
        {!locked && open && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(180deg)', flexShrink: 0 }}>
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

          {lesson.pdf_url && isPdf && (
            <div style={{ marginTop: '.85rem', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-0)' }}>
              <iframe
                src={lesson.pdf_url}
                title={lesson.title}
                style={{ width: '100%', height: '75vh', border: 'none', display: 'block' }}
              />
            </div>
          )}

          {lesson.pdf_url && !isPdf && (
            <a href={lesson.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', marginTop: '.75rem', color: 'var(--eden)', fontWeight: 600, fontSize: '.85rem' }}>
              {lesson.attachment_label || 'Download attachment'} (opens in a new tab — this file type can&apos;t be shown in-app)
            </a>
          )}

          <button
            onClick={() => setCompleted(!isDone)}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
              width: '100%', marginTop: '1.25rem', border: 'none', borderRadius: 10,
              padding: '.85rem', cursor: saving ? 'not-allowed' : 'pointer',
              background: isDone ? 'var(--bg-3)' : 'var(--eden)',
              color: isDone ? 'var(--text-md)' : 'var(--bg-0)',
              fontWeight: 700, fontSize: '.9rem', opacity: saving ? 0.7 : 1,
              fontFamily: 'var(--font-poppins), Poppins, sans-serif', transition: 'opacity .15s',
            }}
          >
            {isDone ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Completed — mark as not done
              </>
            ) : (
              'Mark as Completed'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
