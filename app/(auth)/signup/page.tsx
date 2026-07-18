'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signUp } from '@/app/actions/auth';
import GoogleSignInButton from '@/components/GoogleSignInButton';

type State = { error?: string };

async function action(_prev: State, formData: FormData): Promise<State> {
  const result = await signUp(formData);
  return result ?? {};
}

export default function SignupPage() {
  const [state, formAction, pending] = useActionState<State, FormData>(action, {});

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', padding: '2.5rem 1.5rem' }}>
      <form action={formAction} style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '.68rem',
              letterSpacing: '.32em',
              textTransform: 'uppercase',
              color: 'var(--eden)',
            }}
          >
            Eden Life Academy
          </span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.85rem', color: 'var(--text-hi)', letterSpacing: '-.02em', textAlign: 'center' }}>
          Create your account
        </h2>
        <p style={{ marginTop: '.5rem', marginBottom: '1.75rem', fontSize: '.9rem', fontWeight: 300, color: 'var(--text-lo)', textAlign: 'center' }}>
          Start your discipleship journey today.
        </p>

        {state?.error && (
          <div className="notice notice-error" style={{ marginBottom: '1.15rem' }} role="alert">
            {state.error}
          </div>
        )}

        <div style={{ marginBottom: '1.15rem' }}>
          <label className="field-label" htmlFor="full_name">Full name</label>
          <input className="field-input" type="text" id="full_name" name="full_name" placeholder="Ada Okafor" autoComplete="name" required />
        </div>
        <div style={{ marginBottom: '1.15rem' }}>
          <label className="field-label" htmlFor="email">Email address</label>
          <input className="field-input" type="email" id="email" name="email" placeholder="you@email.com" autoComplete="email" required />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="field-label" htmlFor="password">Password</label>
          <input className="field-input" type="password" id="password" name="password" placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={pending}>
          {pending ? 'Creating account…' : 'Create Account'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.6rem 0', color: 'var(--text-lo)', fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>
          <span style={{ height: 1, background: 'var(--border)', flex: 1, display: 'block' }} />
          or
          <span style={{ height: 1, background: 'var(--border)', flex: 1, display: 'block' }} />
        </div>

        <GoogleSignInButton />

        <p style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '.88rem', color: 'var(--text-lo)' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--eden)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </form>
    </div>
  );
}
