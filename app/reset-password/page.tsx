import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ResetPasswordForm from '@/components/ResetPasswordForm';

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', padding: '2.5rem 1.5rem' }}>
      {user ? (
        <ResetPasswordForm />
      ) : (
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>
            Link expired
          </h2>
          <p style={{ marginTop: '.75rem', marginBottom: '1.75rem', fontSize: '.9rem', fontWeight: 300, color: 'var(--text-lo)' }}>
            This password reset link is invalid or has expired. Request a new one to continue.
          </p>
          <Link href="/forgot-password" className="btn btn-primary" style={{ width: '100%' }}>
            Request a new link
          </Link>
        </div>
      )}
    </div>
  );
}
