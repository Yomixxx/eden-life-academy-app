'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  ACADEMY_LEVELS,
  CURRENT_COHORT_COURSE_ID,
  CURRENT_COHORT_COURSE_TITLE,
} from '@/lib/academy'

type StatusPayload = {
  incomplete: boolean
  needsLevel: boolean
  justAssignedMatric?: boolean
  enrollment: {
    id: string
    academyLevel: string | null
    cohort: string | null
    matricNumber: string | null
  } | null
}

/**
 * Scans the signed-in member's Academy registration on every dashboard page.
 * If incomplete (no level), immediately blocks with a level picker. On save,
 * matric is assigned right away and shown before the user continues.
 *
 * If they already have a level but no matric, /api/registration/status assigns
 * it silently and we toast the number — no prompt.
 *
 * Intentionally a deterministic DB scan (not LLM): level/matric are structured
 * fields; an AI guess would be wrong and slower.
 */
export default function CompleteRegistrationGate() {
  const pathname = usePathname()
  const router = useRouter()
  const [scanning, setScanning] = useState(true)
  const [needsLevel, setNeedsLevel] = useState(false)
  const [level, setLevel] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [assignedMatric, setAssignedMatric] = useState<string | null>(null)
  const [assignedLevel, setAssignedLevel] = useState<string | null>(null)
  const [toastMatric, setToastMatric] = useState<string | null>(null)

  // Skip the gate on /register itself (that page already handles this flow).
  const skip = pathname === '/register' || pathname?.startsWith('/register/')

  const scan = useCallback(async () => {
    if (skip) {
      setScanning(false)
      return
    }
    setScanning(true)
    try {
      const res = await fetch('/api/registration/status', { cache: 'no-store' })
      if (!res.ok) {
        setScanning(false)
        return
      }
      const data = (await res.json()) as StatusPayload

      if (data.justAssignedMatric && data.enrollment?.matricNumber) {
        setToastMatric(data.enrollment.matricNumber)
        setTimeout(() => setToastMatric(null), 8000)
        router.refresh()
      }

      if (data.needsLevel) {
        setNeedsLevel(true)
      } else {
        setNeedsLevel(false)
      }
    } catch {
      // Never block the app if the scan fails — dashboard banner still helps.
    } finally {
      setScanning(false)
    }
  }, [skip, router])

  useEffect(() => {
    scan()
  }, [scan, pathname])

  async function submitLevel(e: React.FormEvent) {
    e.preventDefault()
    if (!level || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: CURRENT_COHORT_COURSE_ID,
          academyLevel: level,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error ?? 'Could not finish your registration. Please try again.')
      }

      const matric = typeof body.matricNumber === 'string' ? body.matricNumber : null
      setAssignedLevel(level)
      setAssignedMatric(matric)
      setNeedsLevel(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not finish your registration. Please try again.')
      setBusy(false)
    }
  }

  function dismissSuccess() {
    setAssignedMatric(null)
    setAssignedLevel(null)
    setBusy(false)
  }

  if (skip) return null

  return (
    <>
      {/* Silent matric assignment toast */}
      {toastMatric && !needsLevel && !assignedMatric && (
        <div
          role="status"
          style={{
            position: 'fixed', bottom: '5.5rem', left: '50%', transform: 'translateX(-50%)',
            zIndex: 90, maxWidth: 'min(420px, calc(100vw - 2rem))',
            background: 'var(--bg-1)', border: '1px solid rgba(94,201,87,.4)',
            borderRadius: 14, padding: '1rem 1.25rem',
            boxShadow: '0 18px 50px rgba(0,0,0,.45)',
          }}
        >
          <p style={{ margin: 0, fontSize: '.78rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--eden)' }}>
            Matric number assigned
          </p>
          <p style={{ margin: '.35rem 0 0', fontSize: '.95rem', fontWeight: 700, color: 'var(--text-hi)', fontFamily: 'monospace' }}>
            {toastMatric}
          </p>
          <p style={{ margin: '.35rem 0 0', fontSize: '.8rem', color: 'var(--text-lo)' }}>
            Your Academy registration is complete.
          </p>
          <button
            type="button"
            onClick={() => setToastMatric(null)}
            style={{
              marginTop: '.75rem', background: 'transparent', border: 'none',
              color: 'var(--text-lo)', fontSize: '.78rem', cursor: 'pointer', padding: 0,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Immediate level prompt — blocks until they choose */}
      {needsLevel && !assignedMatric && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="complete-reg-title"
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,.72)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.25rem',
          }}
        >
          <div style={{
            width: '100%', maxWidth: 440,
            background: 'var(--bg-1)', border: '1px solid var(--border-hi)',
            borderRadius: 18, padding: '1.75rem 1.5rem',
            boxShadow: '0 24px 80px rgba(0,0,0,.55)',
          }}>
            <p style={{
              margin: '0 0 .5rem', fontSize: '.68rem', fontWeight: 700,
              letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--eden)',
            }}>
              Finish registration
            </p>
            <h2
              id="complete-reg-title"
              style={{
                margin: 0, fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-hi)', letterSpacing: '-.02em',
              }}
            >
              Which level are you in?
            </h2>
            <p style={{ margin: '.55rem 0 1.25rem', fontSize: '.88rem', color: 'var(--text-lo)', lineHeight: 1.55 }}>
              We found your {CURRENT_COHORT_COURSE_TITLE} registration is missing a level.
              Pick one now — your matric number is assigned immediately after.
            </p>

            {error && (
              <div style={{
                marginBottom: '1rem', padding: '.75rem 1rem',
                background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)',
                borderRadius: 10, color: '#fca5a5', fontSize: '.85rem',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={submitLevel}>
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
                  width: '100%', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '.95rem',
                  padding: '1rem',
                  background: !level || busy ? 'var(--bg-3)' : 'var(--eden)',
                  color: !level || busy ? 'var(--text-lo)' : 'var(--bg-0)',
                  cursor: !level || busy ? 'not-allowed' : 'pointer',
                  boxShadow: level && !busy ? '0 8px 26px rgba(94,201,87,.28)' : 'none',
                }}
              >
                {busy ? 'Assigning matric number…' : 'Save level & get matric number'}
              </button>
            </form>

            {scanning && (
              <p style={{ margin: '.75rem 0 0', fontSize: '.75rem', color: 'var(--text-lo)', textAlign: 'center' }}>
                Checking your registration…
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success: show matric immediately after level save */}
      {assignedMatric !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="matric-assigned-title"
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,.72)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.25rem',
          }}
        >
          <div style={{
            width: '100%', maxWidth: 440,
            background: 'var(--bg-1)', border: '1px solid rgba(94,201,87,.35)',
            borderRadius: 18, padding: '1.75rem 1.5rem', textAlign: 'center',
            boxShadow: '0 24px 80px rgba(0,0,0,.55)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 1rem',
              background: 'rgba(94,201,87,.15)', border: '2px solid var(--eden)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2
              id="matric-assigned-title"
              style={{
                margin: 0, fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-hi)',
              }}
            >
              You&apos;re all set
            </h2>
            <p style={{ margin: '.5rem 0 1.25rem', fontSize: '.88rem', color: 'var(--text-lo)' }}>
              {assignedLevel} Level · registration complete
            </p>
            <div style={{
              background: 'rgba(94,201,87,.1)', border: '1px solid rgba(94,201,87,.3)',
              borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem',
            }}>
              <p style={{ margin: 0, fontSize: '.7rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--eden)' }}>
                Your matric number
              </p>
              <p style={{
                margin: '.4rem 0 0', fontSize: '1.25rem', fontWeight: 800,
                color: 'var(--eden)', fontFamily: 'monospace', letterSpacing: '.02em',
              }}>
                {assignedMatric || 'Assigning…'}
              </p>
              {!assignedMatric && (
                <p style={{ margin: '.5rem 0 0', fontSize: '.78rem', color: '#fbbf24' }}>
                  Level saved. Refresh in a moment if your matric doesn&apos;t appear.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={dismissSuccess}
              style={{
                width: '100%', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '.95rem',
                padding: '1rem', background: 'var(--eden)', color: 'var(--bg-0)', cursor: 'pointer',
              }}
            >
              Continue to Academy
            </button>
          </div>
        </div>
      )}
    </>
  )
}
