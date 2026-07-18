import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserAndProfile } from '@/lib/get-profile';
import Nav from '@/components/Nav';
import type { Course, Enrollment } from '@/lib/types';
import { CATEGORY_LABELS, LEVEL_LABELS } from '@/lib/types';

export default async function DashboardPage() {
  const { user, profile } = await getCurrentUserAndProfile();
  const supabase = await createClient();

  const [{ data: courses }, { data: enrollments }] = await Promise.all([
    supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')
      .returns<Course[]>(),
    supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user!.id)
      .returns<Enrollment[]>(),
  ]);

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.course_id));

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg-1)' }}>
      <Nav profile={profile} />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.5rem,3vw,2.1rem)', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p style={{ marginTop: '.4rem', color: 'var(--text-lo)', fontSize: '.92rem' }}>
            Continue your discipleship journey below.
          </p>
        </div>

        {(!courses || courses.length === 0) ? (
          <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-lo)', fontSize: '.95rem' }}>
              No courses are available yet — check back soon.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="card" style={{ display: 'block', padding: '1.5rem', transition: 'border-color .2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.9rem' }}>
                  <span className="badge">{CATEGORY_LABELS[course.category]}</span>
                  <span style={{ fontSize: '.72rem', color: 'var(--text-dim)' }}>{LEVEL_LABELS[course.level]}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-hi)', marginBottom: '.5rem' }}>
                  {course.title}
                </h3>
                {course.description && (
                  <p style={{ fontSize: '.85rem', color: 'var(--text-lo)', lineHeight: 1.6, marginBottom: '1rem' }}>
                    {course.description}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '.78rem', color: 'var(--text-dim)' }}>
                  <span>{course.total_lessons} lessons</span>
                  <span style={{ color: enrolledIds.has(course.id) ? 'var(--eden)' : 'var(--text-dim)', fontWeight: 600 }}>
                    {enrolledIds.has(course.id) ? 'Continue →' : 'Start →'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
