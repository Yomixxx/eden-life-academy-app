'use client';

import { useActionState } from 'react';
import { updateProfile } from '@/app/actions/profile';
import type { Profile } from '@/lib/types';

type State = { error?: string; success?: boolean };

export default function ProfileForm({ profile }: { profile: Profile }) {
  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await updateProfile(formData);
    return result ?? {};
  }

  const [state, formAction, pending] = useActionState<State, FormData>(action, {});

  return (
    <form action={formAction} className="card" style={{ padding: '1.75rem', maxWidth: 560 }}>
      {state?.error && <div className="notice notice-error" style={{ marginBottom: '1.15rem' }}>{state.error}</div>}
      {state?.success && <div className="notice notice-success" style={{ marginBottom: '1.15rem' }}>Profile updated.</div>}

      <div style={{ marginBottom: '1.15rem' }}>
        <label className="field-label" htmlFor="full_name">Full name</label>
        <input className="field-input" id="full_name" name="full_name" defaultValue={profile.full_name ?? ''} required />
      </div>

      <div style={{ marginBottom: '1.15rem' }}>
        <label className="field-label" htmlFor="phone">Phone</label>
        <input className="field-input" id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ''} placeholder="080…" />
      </div>

      <div style={{ marginBottom: '1.15rem' }}>
        <label className="field-label" htmlFor="campus">Campus</label>
        <select className="field-select" id="campus" name="campus" defaultValue={profile.campus ?? ''}>
          <option value="">Not set</option>
          <option value="mainland">Mainland</option>
          <option value="island">Island</option>
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label className="field-label" htmlFor="bio">Bio</label>
        <textarea className="field-textarea" id="bio" name="bio" defaultValue={profile.bio ?? ''} placeholder="A little about you" />
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  );
}
