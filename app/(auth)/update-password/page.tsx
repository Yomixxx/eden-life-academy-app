'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { passwordStrengthError } from '@/lib/password-strength'
import Image from 'next/image'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    const strengthError = passwordStrengthError(password)
    if (strengthError) { setError(strengthError); return }
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false) }
    else { setDone(true); setTimeout(() => router.push('/dashboard'), 2500) }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '.95rem 1rem',
    color: 'var(--text-hi)', fontSize: '.95rem',
    transition: 'border-color .2s, background .2s',
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.6rem', marginBottom: '2.5rem' }}>
          <Image src="/logo-white.png" alt="Eden Life Experience Centre" width={60} height={60} style={{ height: 60, width: 'auto' }} />
          <span style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '.64rem', letterSpacing: '.32em', textTransform: 'uppercase', color: 'var(--eden)' }}>Academy</span>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(94,201,87,.15)', border: '2px solid var(--eden)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-hi)', marginBottom: '.75rem' }}>Password updated</h2>
            <p style={{ color: 'var(--text-lo)' }}>Redirecting you to the dashboard…</p>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-hi)', letterSpacing: '-.02em', textAlign: 'center' }}>Choose a new password</h2>
            <p style={{ marginTop: '.5rem', marginBottom: '2rem', fontSize: '.9rem', fontWeight: 300, color: 'var(--text-lo)', textAlign: 'center' }}>
              At least 10 characters, with an uppercase letter, a lowercase letter, and a number.
            </p>

            {error && (
              <div style={{ marginBottom: '1rem', padding: '.75rem 1rem', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, color: '#fca5a5', fontSize: '.85rem' }}>{error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: '.5rem' }}>New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 10 characters" autoComplete="new-password" required minLength={10} style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--eden)'; e.currentTarget.style.background = 'var(--bg-3)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-2)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: '.5rem' }}>Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" autoComplete="new-password" required style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--eden)'; e.currentTarget.style.background = 'var(--bg-3)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-2)' }}
                />
              </div>
              <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? 'var(--bg-3)' : 'var(--eden)', color: loading ? 'var(--text-lo)' : 'var(--bg-0)', fontWeight: 600, fontSize: '.95rem', padding: '1rem', borderRadius: 10, transition: 'background .2s', boxShadow: '0 8px 26px rgba(94,201,87,.28)', fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}>
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
