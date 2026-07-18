import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Course } from '@/lib/types';
import { CATEGORY_LABELS, LEVEL_LABELS } from '@/lib/types';

export default async function AdminCoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('sort_order')
    .returns<Course[]>();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>
            Course Management
          </h1>
          <p style={{ marginTop: '.35rem', color: 'var(--text-lo)', fontSize: '.88rem' }}>
            Create courses, then upload lesson documents or videos directly &mdash; no manual data entry.
          </p>
        </div>
        <Link href="/admin/courses/new" className="btn btn-primary">+ New Course</Link>
      </div>

      {(!courses || courses.length === 0) ? (
        <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-lo)', fontSize: '.95rem' }}>No courses yet. Create the first one.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/admin/courses/${course.id}`}
              className="card"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.4rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.3rem' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-hi)' }}>{course.title}</span>
                    {!course.is_published && (
                      <span className="badge" style={{ background: 'rgba(224,169,65,.14)', color: 'var(--warn)' }}>Draft</span>
                    )}
                  </div>
                  <span style={{ fontSize: '.78rem', color: 'var(--text-dim)' }}>
                    {CATEGORY_LABELS[course.category]} · {LEVEL_LABELS[course.level]} · {course.total_lessons} lessons
                  </span>
                </div>
              </div>
              <span style={{ color: 'var(--text-lo)', fontSize: '.85rem' }}>Manage →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
