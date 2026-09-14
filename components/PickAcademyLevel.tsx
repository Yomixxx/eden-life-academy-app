'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CURRENT_COHORT_COURSE_ID, CURRENT_COHORT_COURSE_TITLE, ACADEMY_LEVELS } from '@/lib/academy'

// Reached from /register only when we genuinely don't know which level this
// person is in — not in their auth metadata (they explored first, or signed
// in with Google) and not on an existing enrollment row. Without a level the
// live class banner, the course page card and attendance all key off nothing,
// so asking here is the difference between "no join button" and one.
export default function PickAcademyLevel() {
  const router = useRouter()
  const [level, setLevel] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!level || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: CURRENT_COHORT_COURSE_ID, academyLevel: level }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'Could not finish your registration. Please try again.')
      router.replace(`/catalog/${CURRENT_COHORT_COURSE_ID}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not finish your registration. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.6rem', marginBottom: '2.5rem' }}>
          <Image src="/logo-white.png" alt="Eden Life Experience Centre" width={60} height={60} style={{ height: 60, width: 'auto' }} />
          <span style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '.64rem', letterSpacing: '.32em', textTransform: 'uppercase', color: 'var(--eden)' }}>Academy</span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-hi)', letterSpacing: '-.02em', textAlign: 'center', margin: 0 }}>
          Which level are you in?
        </h2>
        <p style={{ marginTop: '.5rem', marginBottom: '2rem', fontSize: '.9rem', color: 'var(--text-lo)', textAlign: 'center', lineHeight: 1.6 }}>
          We need this to show you the right live class and its join button.
        </p>

        {error && (
          <div style={{ marginBottom: '1rem', padding: '.75rem 1rem', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, color: '#fca5a5', fontSize: '.85rem' }}>{error}</div>
        )}

        <form onSubmit={submit}>
          <select
            value={level}
            onChange={e => setLevel(e.target.value)}
            required
            aria-label="Your academy level"
            style={{
              width: '100%', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer',
              background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10,
              padding: '.95rem 1rem', color: 'var(--text-hi)', fontSize: '.95rem', marginBottom: '1rem',
            }}
          >
            <option value="" disabled>Select your level</option>
            {ACADEMY_LEVELS.map(l => <option key={l} value={l}>{l} Level</option>)}
          </select>

          <button
            type="submit"
            disabled={!level || busy}
            style={{
              width: '100%', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '.95rem', padding: '1rem',
              background: !level || busy ? 'var(--bg-3)' : 'var(--eden)',
              color: !level || busy ? 'var(--text-lo)' : 'var(--bg-0)',
              cursor: !level || busy ? 'not-allowed' : 'pointer',
              boxShadow: level && !busy ? '0 8px 26px rgba(94,201,87,.28)' : 'none',
            }}
          >
            {busy ? 'Saving…' : `Register for ${CURRENT_COHORT_COURSE_TITLE}`}
          </button>
        </form>
      </div>
    </div>
  )
}
