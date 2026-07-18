import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Course, Lesson } from '@/lib/types';
import CourseEditForm from '@/components/CourseEditForm';
import AddLessonForm from '@/components/AddLessonForm';
import DeleteLessonButton from '@/components/DeleteLessonButton';

export default async function AdminCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: course }, { data: lessons }] = await Promise.all([
    supabase.from('courses').select('*').eq('id', id).single<Course>(),
    supabase.from('lessons').select('*').eq('course_id', id).order('sort_order').returns<Lesson[]>(),
  ]);

  if (!course) notFound();

  const nextSortOrder = (lessons?.length ?? 0) + 1;

  return (
    <div>
      <Link href="/admin" style={{ fontSize: '.85rem', color: 'var(--text-lo)' }}>← Back to courses</Link>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-hi)', margin: '1rem 0 1.75rem' }}>
        {course.title}
      </h1>

      <CourseEditForm course={course} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem', alignItems: 'start' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-hi)', marginBottom: '1rem' }}>
            Lessons ({lessons?.length ?? 0})
          </h2>

          {(!lessons || lessons.length === 0) ? (
            <div className="card" style={{ padding: '1.75rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-lo)', fontSize: '.88rem' }}>No lessons yet. Upload the first one.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
              {lessons.map((lesson) => (
                <div key={lesson.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', marginBottom: '.3rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-hi)', fontSize: '.92rem' }}>{lesson.title}</span>
                      {lesson.attachment_label && <span className="badge">{lesson.attachment_label}</span>}
                    </div>
                    <span style={{ fontSize: '.76rem', color: 'var(--text-dim)' }}>
                      {lesson.duration_minutes ? `${lesson.duration_minutes} min` : 'No duration set'}
                    </span>
                  </div>
                  <DeleteLessonButton
                    lessonId={lesson.id}
                    courseId={course.id}
                    videoUrl={lesson.video_url}
                    pdfUrl={lesson.pdf_url}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <AddLessonForm courseId={course.id} nextSortOrder={nextSortOrder} />
      </div>
    </div>
  );
}
