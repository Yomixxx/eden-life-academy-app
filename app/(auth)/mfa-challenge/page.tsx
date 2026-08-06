'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function MfaChallengePage() {
  const router = useRouter()
  const supabase = createClient()
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      const factor = data?.totp?.find(f => f.status === 'verified')
      if (error || !factor) {
        // Nothing to challenge — proxy would normally have redirected
        // already, but handle the edge case directly rather than getting stuck.
        router.replace('/dashboard')
        return
      }
      setFactorId(factor.id)
      setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId) return
    setError('')
    setLoading(true)

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeError || !challenge) {
      setError('Could not start verification. Please try again.')
      setLoading(false)
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    })

    if (verifyError) {
      setError('Incorrect code. Please try again.')
      setCode('')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleUseDifferentAccount() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!ready) return null

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.6rem', marginBottom: '2.5rem' }}>
          <Image src="/logo-white.png" alt="Eden Life Experience Centre" width={60} height={60} style={{ height: 60, width: 'auto' }} />
          <span style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '.64rem', letterSpacing: '.32em', textTransform: 'uppercase', color: 'var(--eden)' }}>Academy</span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-hi)', letterSpacing: '-.02em', textAlign: 'center' }}>
          Enter your code
        </h2>
        <p style={{ marginTop: '.5rem', marginBottom: '2rem', fontSize: '.9rem', fontWeight: 300, color: 'var(--text-lo)', textAlign: 'center' }}>
          Open your authenticator app and enter the 6-digit code for your account.
        </p>

        {error && (
          <div style={{ marginBottom: '1rem', padding: '.75rem 1rem', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, color: '#fca5a5', fontSize: '.85rem' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            required
            maxLength={6}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '.95rem 1rem',
              color: 'var(--text-hi)', fontSize: '1.4rem', letterSpacing: '.5em', textAlign: 'center',
              marginBottom: '1.5rem',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--eden)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', border: 'none', cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer',
              background: loading || code.length !== 6 ? 'var(--bg-3)' : 'var(--eden)',
              color: loading || code.length !== 6 ? 'var(--text-lo)' : 'var(--bg-0)',
              fontWeight: 600, fontSize: '.95rem',
              padding: '1rem', borderRadius: 10,
              transition: 'background .2s', boxShadow: '0 8px 26px rgba(94,201,87,.28)',
            }}
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        <p style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '.88rem', color: 'var(--text-lo)' }}>
          <button type="button" onClick={handleUseDifferentAccount} style={{ background: 'none', border: 'none', color: 'var(--eden)', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit' }}>
            Use a different account
          </button>
        </p>
      </div>
    </div>
  )
}
