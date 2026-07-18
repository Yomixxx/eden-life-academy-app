'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleLessonComplete } from '@/app/actions/enrollment';
import type { Lesson } from '@/lib/types';

export default function LessonItem({
  lesson,
  courseId,
  index,
  completed,
}: {
  lesson: Lesson;
  courseId: string;
  index: number;
  completed: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    startTransition(async () => {
      await toggleLessonComplete(lesson.id, courseId, !completed);
      router.refresh();
    });
  }

  return (
    <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.4rem' }}>
            <span style={{ fontSize: '.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>{String(index).padStart(2, '0')}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-hi)' }}>{lesson.title}</span>
            {lesson.attachment_label && <span className="badge">{lesson.attachment_label}</span>}
          </div>
          {lesson.description && (
            <p style={{ fontSize: '.85rem', color: 'var(--text-lo)', lineHeight: 1.6, marginBottom: '.75rem' }}>{lesson.description}</p>
          )}

          {lesson.video_url && (
            <video controls src={lesson.video_url} style={{ width: '100%', borderRadius: 10, marginTop: '.5rem', maxHeight: 420 }} />
          )}

          {lesson.pdf_url && (
            <a
              href={lesson.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              style={{ marginTop: '.5rem', fontSize: '.82rem' }}
            >
              Open {lesson.attachment_label ?? 'attachment'} →
            </a>
          )}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.8rem', color: 'var(--text-lo)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input
            type="checkbox"
            checked={completed}
            onChange={handleToggle}
            disabled={pending}
            style={{ accentColor: 'var(--eden)', width: 16, height: 16 }}
          />
          Done
        </label>
      </div>
    </div>
  );
}
