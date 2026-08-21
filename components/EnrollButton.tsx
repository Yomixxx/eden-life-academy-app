'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CURRENT_COHORT_COURSE_ID, ACADEMY_LEVELS } from '@/lib/academy'

export default function EnrollButton({ courseId }: { courseId: string }) {
  const router = useRouter()
  const isCohortCourse = courseId === CURRENT_COHORT_COURSE_ID
  const [choosingLevel, setChoosingLevel] = useState(false)
  const [level, setLevel] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState('')

  const btnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
    border: 'none', width: '100%', boxSizing: 'border-box' as const,
    fontWeight: 600, fontSize: '.9rem', padding: '.85rem 1.75rem', borderRadius: 10,
    transition: 'background .2s', boxShadow: '0 8px 26px rgba(94,201,87,.28)',
    fontFamily: 'var(--font-poppins), Poppins, sans-serif',
  }

  async function submitEnroll() {
    setEnrolling(true)
    setError('')
    try {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, academyLevel: isCohortCourse ? level : undefined }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Could not enroll right now. Please try again.')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enroll right now. Please try again.')
      setEnrolling(false)
    }
  }

  function handleEnrollClick() {
    if (isCohortCourse && !choosingLevel) {
      setChoosingLevel(true)
      return
    }
    submitEnroll()
  }

  if (choosingLevel) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', maxWidth: 320 }}>
        {error && <div style={{ fontSize: '.8rem', color: '#fca5a5' }}>{error}</div>}
        <select
          value={level}
          onChange={e => setLevel(e.target.value)}
          disabled={enrolling}
          style={{
            width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '.85rem 1rem', color: 'var(--text-hi)', fontSize: '.9rem', cursor: 'pointer',
            fontFamily: 'var(--font-poppins), Poppins, sans-serif',
          }}
        >
          <option value="" disabled>Which level are you enrolling for?</option>
          {ACADEMY_LEVELS.map(l => <option key={l} value={l}>{l} Level</option>)}
        </select>
        <button
          onClick={handleEnrollClick}
          disabled={!level || enrolling}
          style={{
            ...btnStyle,
            cursor: !level || enrolling ? 'not-allowed' : 'pointer',
            background: !level || enrolling ? 'var(--bg-3)' : 'var(--eden)',
            color: !level || enrolling ? 'var(--text-lo)' : 'var(--bg-0)',
          }}
        >
          {enrolling ? 'Enrolling…' : 'Confirm Enrollment'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 320 }}>
      {error && <div style={{ marginBottom: '.5rem', fontSize: '.8rem', color: '#fca5a5' }}>{error}</div>}
      <button
        onClick={handleEnrollClick}
        disabled={enrolling}
        style={{
          ...btnStyle,
          cursor: enrolling ? 'not-allowed' : 'pointer',
          background: enrolling ? 'var(--bg-3)' : 'var(--eden)',
          color: enrolling ? 'var(--text-lo)' : 'var(--bg-0)',
        }}
      >
        {enrolling ? 'Enrolling…' : 'Enroll Now'}
      </button>
    </div>
  )
}
