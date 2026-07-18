import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserAndProfile } from '@/lib/get-profile';
import Nav from '@/components/Nav';
import EnrollButton from '@/components/EnrollButton';
import LessonItem from '@/components/LessonItem';
import type { Course, Lesson } from '@/lib/types';
import { CATEGORY_LABELS, LEVEL_LABELS } from '@/lib/types';

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile } = await getCurrentUserAndProfile();
  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single<Course>();

  if (!course) notFound();

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', id)
    .eq('user_id', user!.id)
    .maybeSingle();

  const isEnrolled = Boolean(enrollment);

  const { data: lessons } = isEnrolled
    ? await supabase.from('lessons').select('*').eq('course_id', id).eq('is_published', true).order('sort_order').returns<Lesson[]>()
    : { data: null };

  const { data: progress } = isEnrolled
    ? await supabase.from('lesson_progress').select('lesson_id, completed').eq('user_id', user!.id).eq('course_id', id)
    : { data: null };

  const completedIds = new Set((progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id));

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg-1)' }}>
      <Nav profile={profile} />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <Link href="/dashboard" style={{ fontSize: '.85rem', color: 'var(--text-lo)' }}>← All courses</Link>

        <div style={{ marginTop: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.9rem' }}>
            <span className="badge">{CATEGORY_LABELS[course.category]}</span>
            <span style={{ fontSize: '.78rem', color: 'var(--text-dim)' }}>{LEVEL_LABELS[course.level]}</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.5rem,3vw,2rem)', color: 'var(--text-hi)', letterSpacing: '-.02em', marginBottom: '.75rem' }}>
            {course.title}
          </h1>
          {course.description && <p style={{ color: 'var(--text-lo)', fontSize: '.95rem', lineHeight: 1.7 }}>{course.description}</p>}
        </div>

        {!isEnrolled ? (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-md)', marginBottom: '1.5rem', fontSize: '.92rem' }}>
              Enroll to unlock all {course.total_lessons} lessons in this course.
            </p>
            <EnrollButton courseId={course.id} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {(!lessons || lessons.length === 0) ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-lo)', fontSize: '.9rem' }}>Lessons for this course are coming soon.</p>
              </div>
            ) : (
              lessons.map((lesson, i) => (
                <LessonItem
                  key={lesson.id}
                  lesson={lesson}
                  courseId={course.id}
                  index={i + 1}
                  completed={completedIds.has(lesson.id)}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
