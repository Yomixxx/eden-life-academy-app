'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setPending(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', padding: '2.5rem 1.5rem' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>
          Reset your password
        </h2>
        <p style={{ marginTop: '.5rem', marginBottom: '1.75rem', fontSize: '.9rem', fontWeight: 300, color: 'var(--text-lo)' }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {error && <div className="notice notice-error" style={{ marginBottom: '1.15rem' }}>{error}</div>}
        {sent && <div className="notice notice-success" style={{ marginBottom: '1.15rem' }}>Check your inbox for a reset link.</div>}

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="field-label" htmlFor="email">Email address</label>
          <input
            className="field-input"
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={pending || sent}>
          {pending ? 'Sending…' : sent ? 'Link sent' : 'Send reset link'}
        </button>

        <p style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '.88rem', color: 'var(--text-lo)' }}>
          <Link href="/login" style={{ color: 'var(--eden)', fontWeight: 600 }}>Back to sign in</Link>
        </p>
      </form>
    </div>
  );
}
