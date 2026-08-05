'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [campus, setCampus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, campus },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Fire welcome email (non-blocking)
    fetch('/api/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName, campus }),
    }).catch(() => {})

    if (data.session) {
      // Email confirmation is disabled on the Supabase project, so the
      // account is already active and signed in — there is no
      // confirmation email to wait for.
      router.push('/dashboard')
      router.refresh()
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '.95rem 1rem',
    color: 'var(--text-hi)',
    fontSize: '.95rem',
    transition: 'border-color .2s,background .2s',
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: '.72rem',
    fontWeight: 600,
    letterSpacing: '.08em',
    textTransform: 'uppercase' as const,
    color: 'var(--text-lo)',
    marginBottom: '.5rem',
  }

  return (
    <div className="auth-grid" style={{ minHeight: '100svh', display: 'grid', gridTemplateColumns: '1.05fr .95fr' }}>
      {/* Brand Panel */}
      <aside style={{
        position: 'relative', overflow: 'hidden', padding: '3rem',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        background: 'linear-gradient(150deg,#0c2018 0%,#081310 55%,#060d0b 100%)',
      }} className="brand-panel">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(90% 70% at 80% 5%,rgba(94,201,87,.22),transparent 55%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Image src="/logo-white.png" alt="Eden Life Experience Centre" width={74} height={74} style={{ height: 74, width: 'auto' }} />
          <span style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '.7rem', letterSpacing: '.34em', textTransform: 'uppercase', color: 'var(--eden)', paddingLeft: '1rem', borderLeft: '1px solid var(--border-hi)' }}>Academy</span>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ display: 'inline-block', fontSize: '.65rem', fontWeight: 700, letterSpacing: '.26em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '1.5rem' }}>Encounters. Equipping. Exploits.</span>
          <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 900, fontSize: 'clamp(2rem,3.4vw,3.1rem)', lineHeight: 1.04, letterSpacing: '-.03em', color: 'var(--text-hi)' }}>
            Begin your<br />discipleship<br />journey today.
          </h1>
          <p style={{ marginTop: '1.25rem', maxWidth: '38ch', fontWeight: 300, lineHeight: 1.8, color: 'var(--text-md)' }}>
            Join our growing community building their faith through courses, sermons, and biblical teaching — anytime, anywhere.
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '2.25rem' }}>
          {[['2', 'Campuses'], ['Sun', '10:00 AM'], ['Wed', '6:30 PM']].map(([val, label]) => (
            <div key={label}>
              <b style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-hi)', display: 'block', letterSpacing: '-.02em' }}>{val}</b>
              <span style={{ fontSize: '.72rem', color: 'var(--text-lo)', letterSpacing: '.05em' }}>{label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Form Panel */}
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem', background: 'var(--bg-0)' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div className="logo-mobile-auth" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '.6rem', marginBottom: '2rem' }}>
            <Image src="/logo-white.png" alt="Eden Life Experience Centre" width={60} height={60} style={{ height: 60, width: 'auto' }} />
            <span style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '.64rem', letterSpacing: '.32em', textTransform: 'uppercase', color: 'var(--eden)' }}>Academy</span>
          </div>

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(94,201,87,.15)', border: '2px solid var(--eden)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.85rem', color: 'var(--text-hi)', letterSpacing: '-.02em', marginBottom: '.75rem' }}>Check your email</h2>
              <p style={{ color: 'var(--text-md)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                We sent a confirmation link to <strong style={{ color: 'var(--text-hi)' }}>{email}</strong>. Click the link to activate your account.
              </p>
              <a href="/login" style={{ color: 'var(--eden)', fontWeight: 600, fontSize: '.9rem' }}>Back to Sign In</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.85rem', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>Create account</h2>
              <p style={{ marginTop: '.5rem', marginBottom: '2.25rem', fontSize: '.9rem', fontWeight: 300, color: 'var(--text-lo)' }}>Join Eden Life Academy today.</p>

              {error && (
                <div style={{ marginBottom: '1rem', padding: '.75rem 1rem', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, color: '#fca5a5', fontSize: '.85rem' }}>{error}</div>
              )}

              <div style={{ marginBottom: '1.15rem' }}>
                <label style={labelStyle}>Full name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" required style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--eden)'; e.currentTarget.style.background = 'var(--bg-3)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-2)' }} />
              </div>
              <div style={{ marginBottom: '1.15rem' }}>
                <label style={labelStyle}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" required style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--eden)'; e.currentTarget.style.background = 'var(--bg-3)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-2)' }} />
              </div>
              <div style={{ marginBottom: '1.15rem' }}>
                <label style={labelStyle}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password" required minLength={8} style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--eden)'; e.currentTarget.style.background = 'var(--bg-3)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-2)' }} />
              </div>
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={labelStyle}>Campus</label>
                <select value={campus} onChange={e => setCampus(e.target.value)} required style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--eden)'; e.currentTarget.style.background = 'var(--bg-3)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-2)' }}>
                  <option value="" disabled>Select your campus</option>
                  <option value="Mainland - Ogudu">Mainland — Ogudu</option>
                  <option value="Island - Ajah">Island — Ajah</option>
                  <option value="Online Church">Online Church</option>
                </select>
              </div>

              <button type="submit" disabled={loading} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
                width: '100%', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? 'var(--bg-3)' : 'var(--eden)',
                color: loading ? 'var(--text-lo)' : 'var(--bg-0)',
                fontWeight: 600, fontSize: '.95rem',
                padding: '1rem', borderRadius: 10,
                transition: 'background .2s', boxShadow: '0 8px 26px rgba(94,201,87,.28)',
              }}>
                {loading ? 'Creating account…' : 'Create Account'}
                {!loading && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                )}
              </button>

              <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '.82rem', color: 'var(--text-lo)', lineHeight: 1.6 }}>
                By creating an account you agree to our{' '}
                <a href="/privacy" style={{ color: 'var(--eden)' }}>Privacy Policy</a>.
              </p>

              <p style={{ marginTop: '.75rem', textAlign: 'center', fontSize: '.88rem', color: 'var(--text-lo)' }}>
                Already have an account?{' '}
                <a href="/login" style={{ color: 'var(--eden)', fontWeight: 600 }}>Sign In</a>
              </p>
            </form>
          )}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .brand-panel { display: none !important; }
          .logo-mobile-auth { display: flex !important; }
          .auth-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
