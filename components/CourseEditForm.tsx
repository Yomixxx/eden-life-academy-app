'use client';

import { useActionState } from 'react';
import { updateCourse, deleteCourseFormAction } from '@/app/actions/courses';
import { CATEGORY_LABELS, LEVEL_LABELS, type Course } from '@/lib/types';

type State = { error?: string };

export default function CourseEditForm({ course }: { course: Course }) {
  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await updateCourse(course.id, formData);
    return result ?? {};
  }

  const [state, formAction, pending] = useActionState<State, FormData>(action, {});

  return (
    <form action={formAction} className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      {state?.error && <div className="notice notice-error" style={{ marginBottom: '1.15rem' }}>{state.error}</div>}

      <div style={{ marginBottom: '1.15rem' }}>
        <label className="field-label" htmlFor="title">Title</label>
        <input className="field-input" id="title" name="title" defaultValue={course.title} required />
      </div>

      <div style={{ marginBottom: '1.15rem' }}>
        <label className="field-label" htmlFor="description">Description</label>
        <textarea className="field-textarea" id="description" name="description" defaultValue={course.description ?? ''} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.15rem' }}>
        <div>
          <label className="field-label" htmlFor="category">Category</label>
          <select className="field-select" id="category" name="category" defaultValue={course.category}>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="level">Level</label>
          <select className="field-select" id="level" name="level" defaultValue={course.level}>
            {Object.entries(LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.5rem', fontSize: '.88rem', color: 'var(--text-md)', cursor: 'pointer' }}>
        <input type="checkbox" name="is_published" defaultChecked={course.is_published} style={{ accentColor: 'var(--eden)', width: 16, height: 16 }} />
        Published (visible to students)
      </label>

      <div style={{ display: 'flex', gap: '.75rem' }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Saving…' : 'Save Changes'}
        </button>
        <input type="hidden" name="course_id" value={course.id} />
        <button type="submit" formAction={deleteCourseFormAction} className="btn btn-danger">
          Delete Course
        </button>
      </div>
    </form>
  );
}
