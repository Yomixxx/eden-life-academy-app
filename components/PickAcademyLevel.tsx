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
//
// On save, matric is assigned immediately and shown before redirect.
export default function PickAcademyLevel() {
  const router = useRouter()
  const [level, setLevel] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [matricNumber, setMatricNumber] = useState<string | null>(null)

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
      setMatricNumber(typeof body.matricNumber === 'string' ? body.matricNumber : '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not finish your registration. Please try again.')
      setBusy(false)
    }
  }

  function continueToCourse() {
    router.replace(`/catalog/${CURRENT_COHORT_COURSE_ID}`)
    router.refresh()
  }

  if (matricNumber !== null) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 460, textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.6rem', marginBottom: '2rem' }}>
            <Image src="/logo-white.png" alt="Eden Life Experience Centre" width={60} height={60} style={{ height: 60, width: 'auto' }} />
          </div>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 1rem',
            background: 'rgba(94,201,87,.15)', border: '2px solid var(--eden)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-hi)', letterSpacing: '-.02em', margin: 0 }}>
            You&apos;re registered
          </h2>
          <p style={{ margin: '.5rem 0 1.5rem', fontSize: '.9rem', color: 'var(--text-lo)' }}>
            {level} Level · {CURRENT_COHORT_COURSE_TITLE}
          </p>
          <div style={{
            background: 'rgba(94,201,87,.1)', border: '1px solid rgba(94,201,87,.3)',
            borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
          }}>
            <p style={{ margin: 0, fontSize: '.7rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--eden)' }}>
              Your matric number
            </p>
            <p style={{ margin: '.45rem 0 0', fontSize: '1.35rem', fontWeight: 800, color: 'var(--eden)', fontFamily: 'monospace' }}>
              {matricNumber || 'Assigned on your dashboard'}
            </p>
          </div>
          <button
            type="button"
            onClick={continueToCourse}
            style={{
              width: '100%', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '.95rem', padding: '1rem',
              background: 'var(--eden)', color: 'var(--bg-0)', cursor: 'pointer',
              boxShadow: '0 8px 26px rgba(94,201,87,.28)',
            }}
          >
            Continue to course
          </button>
        </div>
      </div>
    )
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
          Pick your level — your matric number is assigned immediately after, and we use the level for your live class join button.
        </p>

        {error && (
          <div style={{ marginBottom: '1rem', padding: '.75rem 1rem', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, color: '#fca5a5', fontSize: '.85rem' }}>{error}</div>
        )}

        <form onSubmit={submit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginBottom: '1.15rem' }}>
            {ACADEMY_LEVELS.map(l => {
              const selected = level === l
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  disabled={busy}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '.85rem',
                    padding: '.9rem 1.1rem', borderRadius: 12, cursor: busy ? 'default' : 'pointer',
                    textAlign: 'left',
                    background: selected ? 'rgba(94,201,87,.12)' : 'var(--bg-2)',
                    border: selected ? '2px solid var(--eden)' : '2px solid var(--border)',
                    color: 'var(--text-hi)', fontWeight: 600, fontSize: '.95rem',
                  }}
                >
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: selected ? '6px solid var(--eden)' : '2px solid var(--border)',
                    background: selected ? 'var(--bg-0)' : 'transparent',
                  }} />
                  {l} Level
                </button>
              )
            })}
          </div>

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
            {busy ? 'Assigning matric number…' : `Save level & get matric number`}
          </button>
        </form>
      </div>
    </div>
  )
}
