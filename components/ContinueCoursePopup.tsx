'use client'

import { useEffect, useState } from 'react'
import { BrandModal, BrandIconBadge, BrandEyebrow, BrandButton, BrandProgressBar } from './BrandUI'

interface ContinueCoursePopupProps {
  course: { id: string; title: string }
  completed: number
  total: number
}

export default function ContinueCoursePopup({ course, completed, total }: ContinueCoursePopupProps) {
  const [open, setOpen] = useState(false)
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const remaining = total - completed
  const storageKey = `continue-course-dismissed:${course.id}:${new Date().toISOString().slice(0, 10)}`

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) setOpen(true)
  }, [storageKey])

  function dismiss() {
    localStorage.setItem(storageKey, '1')
    setOpen(false)
  }

  if (!open) return null

  return (
    <BrandModal onClose={dismiss} maxWidth={440}>
      <BrandIconBadge>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </BrandIconBadge>

      <BrandEyebrow>Pick up where you left off</BrandEyebrow>

      <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-hi)', letterSpacing: '-.02em', marginBottom: '.6rem', lineHeight: 1.25 }}>
        {course.title}
      </h2>
      <p style={{ color: 'var(--text-md)', lineHeight: 1.7, fontSize: '.92rem', marginBottom: '1.5rem' }}>
        You&apos;re {pct}% of the way through. {remaining} lesson{remaining === 1 ? '' : 's'} left to finish strong.
      </p>

      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
          <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text-lo)' }}>Your progress</span>
          <span style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--eden)' }}>{completed}/{total} · {pct}%</span>
        </div>
        <BrandProgressBar pct={pct} />
      </div>

      <BrandButton href={`/catalog/${course.id}`}>Continue Course</BrandButton>

      <button
        onClick={dismiss}
        style={{ marginTop: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-lo)', fontSize: '.85rem', fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}
      >
        Maybe later
      </button>
    </BrandModal>
  )
}
