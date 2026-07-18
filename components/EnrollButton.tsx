'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { enrollInCourse } from '@/app/actions/enrollment';

export default function EnrollButton({ courseId }: { courseId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleEnroll() {
    startTransition(async () => {
      await enrollInCourse(courseId);
      router.refresh();
    });
  }

  return (
    <button type="button" className="btn btn-primary" onClick={handleEnroll} disabled={pending}>
      {pending ? 'Enrolling…' : 'Enroll in Course'}
    </button>
  );
}
