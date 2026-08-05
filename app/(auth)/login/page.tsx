'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { authErrorMessage } from '@/lib/auth-error'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if (err) setError(decodeURIComponent(err))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(authErrorMessage(error, 'We could not sign you in right now. Please try again in a moment.'))
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleGoogle() {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(authErrorMessage(error, 'We could not sign you in with Google right now. Please try again in a moment.'))
  }

  return (
    <div className="auth-grid" style={{
      minHeight: '100svh',
      display: 'grid',
      gridTemplateColumns: '1.05fr .95fr',
    }}>
      {/* Brand Panel */}
      <aside style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '3rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(150deg,#0c2018 0%,#081310 55%,#060d0b 100%)',
      }} className="brand-panel">
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(90% 70% at 80% 5%,rgba(94,201,87,.22),transparent 55%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Image src="/logo-white.png" alt="Eden Life Experience Centre" width={74} height={74} style={{ height: 74, width: 'auto' }} />
          <span style={{
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: '.7rem',
            letterSpacing: '.34em',
            textTransform: 'uppercase',
            color: 'var(--eden)',
            paddingLeft: '1rem',
            borderLeft: '1px solid var(--border-hi)',
          }}>Academy</span>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{
            display: 'inline-block',
            fontSize: '.65rem',
            fontWeight: 700,
            letterSpacing: '.26em',
            textTransform: 'uppercase',
            color: 'var(--eden)',
            marginBottom: '1.5rem',
          }}>Encounters. Equipping. Exploits.</span>
          <h1 style={{
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(2rem,3.4vw,3.1rem)',
            lineHeight: 1.04,
            letterSpacing: '-.03em',
            color: 'var(--text-hi)',
          }}>Your discipleship<br />journey, all in<br />one place.</h1>
          <p style={{ marginTop: '1.25rem', maxWidth: '38ch', fontWeight: 300, lineHeight: 1.8, color: 'var(--text-md)' }}>
            Pick up where you left off. Track your progress through Growth Steps, courses, sermons, and leadership training — anytime, anywhere.
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
      <main style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem',
        background: 'var(--bg-0)',
      }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <div className="logo-mobile-auth" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '.6rem', marginBottom: '2rem' }}>
            <Image src="/logo-white.png" alt="Eden Life Experience Centre" width={60} height={60} style={{ height: 60, width: 'auto' }} />
            <span style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '.64rem', letterSpacing: '.32em', textTransform: 'uppercase', color: 'var(--eden)' }}>Academy</span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.85rem', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>Welcome back</h2>
          <p style={{ marginTop: '.5rem', marginBottom: '2.25rem', fontSize: '.9rem', fontWeight: 300, color: 'var(--text-lo)' }}>Sign in to continue your journey.</p>

          {error && (
            <div style={{
              marginBottom: '1rem',
              padding: '.75rem 1rem',
              background: 'rgba(239,68,68,.12)',
              border: '1px solid rgba(239,68,68,.3)',
              borderRadius: 10,
              color: '#fca5a5',
              fontSize: '.85rem',
            }}>{error}</div>
          )}

          <div style={{ marginBottom: '1.15rem' }}>
            <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: '.5rem' }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              required
              style={{
                width: '100%',
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '.95rem 1rem',
                color: 'var(--text-hi)',
                fontSize: '.95rem',
                transition: 'border-color .2s,background .2s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--eden)'; e.currentTarget.style.background = 'var(--bg-3)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-2)' }}
            />
          </div>

          <div style={{ marginBottom: '1.15rem' }}>
            <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: '.5rem' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '.95rem 1rem',
                color: 'var(--text-hi)',
                fontSize: '.95rem',
                transition: 'border-color .2s,background .2s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--eden)'; e.currentTarget.style.background = 'var(--bg-3)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-2)' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '-.2rem 0 1.5rem', fontSize: '.82rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--text-md)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--eden)', width: 15, height: 15 }}
              />
              Remember me
            </label>
            <a href="/forgot-password" style={{ color: 'var(--eden)', fontWeight: 500 }}>Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
              width: '100%', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'var(--bg-3)' : 'var(--eden)',
              color: loading ? 'var(--text-lo)' : 'var(--bg-0)',
              fontWeight: 600, fontSize: '.95rem',
              padding: '1rem', borderRadius: 10,
              transition: 'background .2s,transform .2s,box-shadow .2s',
              boxShadow: '0 8px 26px rgba(94,201,87,.28)',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
            {!loading && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.6rem 0', color: 'var(--text-lo)', fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            <span style={{ height: 1, background: 'var(--border)', flex: 1, display: 'block' }} />
            or
            <span style={{ height: 1, background: 'var(--border)', flex: 1, display: 'block' }} />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.65rem',
              width: '100%', background: 'var(--bg-2)',
              border: '1px solid var(--border)', color: 'var(--text-hi)',
              fontWeight: 500, fontSize: '.9rem',
              padding: '.9rem', borderRadius: 10, cursor: 'pointer',
              transition: 'border-color .2s,background .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hi)'; e.currentTarget.style.background = 'var(--bg-3)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-2)' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '.88rem', color: 'var(--text-lo)' }}>
            New to Eden Life Academy?{' '}
            <a href="/signup" style={{ color: 'var(--eden)', fontWeight: 600 }}>Create an account</a>
          </p>
        </form>
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
