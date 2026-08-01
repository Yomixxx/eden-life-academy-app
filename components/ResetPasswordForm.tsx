'use client';

import { useActionState } from 'react';
import { updatePassword } from '@/app/actions/auth';

type State = { error?: string };

async function action(_prev: State, formData: FormData): Promise<State> {
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirm_password') || '');

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const result = await updatePassword(formData);
  return result ?? {};
}

export default function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(action, {});

  return (
    <form action={formAction} style={{ width: '100%', maxWidth: 400 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>
        Set a new password
      </h2>
      <p style={{ marginTop: '.5rem', marginBottom: '1.75rem', fontSize: '.9rem', fontWeight: 300, color: 'var(--text-lo)' }}>
        Choose a new password for your account.
      </p>

      {state?.error && (
        <div className="notice notice-error" style={{ marginBottom: '1.15rem' }} role="alert">
          {state.error}
        </div>
      )}

      <div style={{ marginBottom: '1.15rem' }}>
        <label className="field-label" htmlFor="password">New password</label>
        <input
          className="field-input"
          type="password"
          id="password"
          name="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <label className="field-label" htmlFor="confirm_password">Confirm new password</label>
        <input
          className="field-input"
          type="password"
          id="confirm_password"
          name="confirm_password"
          placeholder="Re-enter new password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={pending}>
        {pending ? 'Updating…' : 'Update Password'}
      </button>
    </form>
  );
}
