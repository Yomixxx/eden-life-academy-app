'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createCourse } from '@/app/actions/courses';
import { CATEGORY_LABELS, LEVEL_LABELS } from '@/lib/types';

type State = { error?: string };

async function action(_prev: State, formData: FormData): Promise<State> {
  const result = await createCourse(formData);
  return result ?? {};
}

export default function NewCoursePage() {
  const [state, formAction, pending] = useActionState<State, FormData>(action, {});

  return (
    <div style={{ maxWidth: 560 }}>
      <Link href="/admin" style={{ fontSize: '.85rem', color: 'var(--text-lo)' }}>← Back to courses</Link>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-hi)', margin: '1rem 0 1.75rem' }}>
        New Course
      </h1>

      <form action={formAction} className="card" style={{ padding: '1.75rem' }}>
        {state?.error && <div className="notice notice-error" style={{ marginBottom: '1.15rem' }}>{state.error}</div>}

        <div style={{ marginBottom: '1.15rem' }}>
          <label className="field-label" htmlFor="title">Title</label>
          <input className="field-input" id="title" name="title" required placeholder="e.g. Foundation — New Beginnings" />
        </div>

        <div style={{ marginBottom: '1.15rem' }}>
          <label className="field-label" htmlFor="description">Description</label>
          <textarea className="field-textarea" id="description" name="description" placeholder="What will students learn in this course?" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <label className="field-label" htmlFor="category">Category</label>
            <select className="field-select" id="category" name="category" defaultValue="foundation">
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="level">Level</label>
            <select className="field-select" id="level" name="level" defaultValue="beginner">
              {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Creating…' : 'Create Course & Add Lessons'}
        </button>
      </form>
    </div>
  );
}
