'use client';

import { useState, useTransition } from 'react';
import { deleteLesson } from '@/app/actions/lessons';

function storagePathFromUrl(url: string | null) {
  if (!url) return null;
  const marker = '/lesson-files/';
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

export default function DeleteLessonButton({
  lessonId,
  courseId,
  videoUrl,
  pdfUrl,
}: {
  lessonId: string;
  courseId: string;
  videoUrl: string | null;
  pdfUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    const paths = [storagePathFromUrl(videoUrl), storagePathFromUrl(pdfUrl)].filter(
      (p): p is string => Boolean(p)
    );
    startTransition(async () => {
      await deleteLesson(lessonId, courseId, paths);
    });
  }

  if (confirming) {
    return (
      <span style={{ display: 'inline-flex', gap: '.5rem' }}>
        <button type="button" className="btn btn-danger" style={{ padding: '.45rem .8rem', fontSize: '.78rem' }} onClick={handleDelete} disabled={pending}>
          {pending ? 'Removing…' : 'Confirm'}
        </button>
        <button type="button" className="btn btn-ghost" style={{ padding: '.45rem .8rem', fontSize: '.78rem' }} onClick={() => setConfirming(false)}>
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button type="button" className="btn btn-ghost" style={{ padding: '.45rem .8rem', fontSize: '.78rem' }} onClick={() => setConfirming(true)}>
      Remove
    </button>
  );
}
