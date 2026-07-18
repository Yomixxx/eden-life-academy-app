'use client';

import { useActionState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signIn } from '@/app/actions/auth';
import GoogleSignInButton from '@/components/GoogleSignInButton';

type State = { error?: string };

async function action(_prev: State, formData: FormData): Promise<State> {
  const result = await signIn(formData);
  return result ?? {};
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<State, FormData>(action, {});

  return (
    <div
      className="auth-grid"
      style={{ minHeight: '100svh', display: 'grid', gridTemplateColumns: '1.05fr .95fr' }}
    >
      <aside
        className="brand-panel"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(150deg,#0c2018 0%,#081310 55%,#060d0b 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(90% 70% at 80% 5%,rgba(94,201,87,.22),transparent 55%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Image src="/logo-white.png" alt="Eden Life Experience Centre" width={74} height={74} style={{ height: 74, width: 'auto' }} />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '.7rem',
              letterSpacing: '.34em',
              textTransform: 'uppercase',
              color: 'var(--eden)',
              paddingLeft: '1rem',
              borderLeft: '1px solid var(--border-hi)',
            }}
          >
            Academy
          </span>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: '.65rem',
              fontWeight: 700,
              letterSpacing: '.26em',
              textTransform: 'uppercase',
              color: 'var(--eden)',
              marginBottom: '1.5rem',
            }}
          >
            Encounters. Equipping. Exploits.
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 'clamp(2rem,3.4vw,3.1rem)',
              lineHeight: 1.04,
              letterSpacing: '-.03em',
              color: 'var(--text-hi)',
            }}
          >
            Your discipleship
            <br />
            journey, all in
            <br />
            one place.
          </h1>
          <p style={{ marginTop: '1.25rem', maxWidth: '38ch', fontWeight: 300, lineHeight: 1.8, color: 'var(--text-md)' }}>
            Pick up where you left off. Track your progress through Growth Steps, courses, sermons, and
            leadership training — anytime, anywhere.
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '2.25rem' }}>
          <div>
            <b style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-hi)', display: 'block', letterSpacing: '-.02em' }}>2</b>
            <span style={{ fontSize: '.72rem', color: 'var(--text-lo)', letterSpacing: '.05em' }}>Campuses</span>
          </div>
          <div>
            <b style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-hi)', display: 'block', letterSpacing: '-.02em' }}>Sun</b>
            <span style={{ fontSize: '.72rem', color: 'var(--text-lo)', letterSpacing: '.05em' }}>10:00 AM</span>
          </div>
          <div>
            <b style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-hi)', display: 'block', letterSpacing: '-.02em' }}>Wed</b>
            <span style={{ fontSize: '.72rem', color: 'var(--text-lo)', letterSpacing: '.05em' }}>6:30 PM</span>
          </div>
        </div>
      </aside>

      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem', background: 'var(--bg-0)' }}>
        <form action={formAction} style={{ width: '100%', maxWidth: 400 }}>
          <div className="logo-mobile-auth" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '.6rem', marginBottom: '2rem' }}>
            <Image src="/logo-white.png" alt="Eden Life Experience Centre" width={60} height={60} style={{ height: 60, width: 'auto' }} />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '.64rem',
                letterSpacing: '.32em',
                textTransform: 'uppercase',
                color: 'var(--eden)',
              }}
            >
              Academy
            </span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.85rem', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>
            Welcome back
          </h2>
          <p style={{ marginTop: '.5rem', marginBottom: '1.75rem', fontSize: '.9rem', fontWeight: 300, color: 'var(--text-lo)' }}>
            Sign in to continue your journey.
          </p>

          {state?.error && (
            <div className="notice notice-error" style={{ marginBottom: '1.15rem' }} role="alert">
              {state.error}
            </div>
          )}

          <div style={{ marginBottom: '1.15rem' }}>
            <label className="field-label" htmlFor="email">Email address</label>
            <input className="field-input" type="email" id="email" name="email" placeholder="you@email.com" autoComplete="email" required />
          </div>
          <div style={{ marginBottom: '1.15rem' }}>
            <label className="field-label" htmlFor="password">Password</label>
            <input className="field-input" type="password" id="password" name="password" placeholder="••••••••" autoComplete="current-password" required />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '-.2rem 0 1.5rem', fontSize: '.82rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--text-md)', cursor: 'pointer' }}>
              <input type="checkbox" style={{ accentColor: 'var(--eden)', width: 15, height: 15 }} />
              Remember me
            </label>
            <Link href="/forgot-password" style={{ color: 'var(--eden)', fontWeight: 500 }}>Forgot password?</Link>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={pending}>
            {pending ? 'Signing in…' : 'Sign In'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.6rem 0', color: 'var(--text-lo)', fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            <span style={{ height: 1, background: 'var(--border)', flex: 1, display: 'block' }} />
            or
            <span style={{ height: 1, background: 'var(--border)', flex: 1, display: 'block' }} />
          </div>

          <GoogleSignInButton />

          <p style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '.88rem', color: 'var(--text-lo)' }}>
            New to Eden Life Academy? <Link href="/signup" style={{ color: 'var(--eden)', fontWeight: 600 }}>Create an account</Link>
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
  );
}
