import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, streak_days, last_activity_date, courses(id, title, description, category, level, total_lessons, duration_minutes)')
    .eq('user_id', user.id)

  const enrolled = enrollments ?? []

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '.8rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '.4rem' }}>Learn</p>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.1rem)', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>
          My Courses
        </h1>
        <p style={{ marginTop: '.5rem', color: 'var(--text-lo)', fontSize: '.9rem' }}>Your enrolled courses and learning progress.</p>
      </div>

      {enrolled.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 16,
        }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(94,201,87,.1)', border: '2px solid rgba(94,201,87,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <h3 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-hi)', marginBottom: '.75rem' }}>
            No courses yet
          </h3>
          <p style={{ color: 'var(--text-lo)', marginBottom: '1.5rem', maxWidth: '36ch', margin: '0 auto 1.5rem' }}>
            You haven&apos;t enrolled in any courses. Explore the catalog to begin your discipleship journey.
          </p>
          <a href="/catalog" style={{
            display: 'inline-flex', alignItems: 'center', gap: '.5rem',
            background: 'var(--eden)', color: 'var(--bg-0)', fontWeight: 600,
            padding: '.75rem 1.5rem', borderRadius: 10, textDecoration: 'none', fontSize: '.9rem',
          }}>
            Browse Catalog
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
          {enrolled.map((enrollment) => {
            const course = Array.isArray(enrollment.courses) ? enrollment.courses[0] : enrollment.courses
            if (!course) return null
            const streak = (enrollment as any).streak_days ?? 0
            return (
              <div key={enrollment.course_id} style={{
                background: 'var(--bg-2)', border: '1px solid var(--border)',
                borderRadius: 14, overflow: 'hidden',
              }}>
                <div style={{ height: 6, background: 'var(--border)' }}>
                  <div style={{ height: '100%', width: '0%', background: 'var(--eden)', borderRadius: 3 }} />
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem', marginBottom: '.5rem' }}>
                    {course.category && (
                      <span style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--eden)' }}>{course.category}</span>
                    )}
                    {streak > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.72rem', fontWeight: 700, color: '#f97316', background: 'rgba(249,115,22,.12)', padding: '.25rem .65rem', borderRadius: 20 }}>
                        🔥 {streak}-day streak
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-hi)', marginBottom: '.5rem' }}>{course.title}</h3>
                  {course.description && (
                    <p style={{ fontSize: '.83rem', color: 'var(--text-lo)', lineHeight: 1.6, marginBottom: '.75rem' }}>{course.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '.78rem', color: 'var(--text-lo)', marginBottom: '1rem' }}>
                    {course.total_lessons && <span>{course.total_lessons} lessons</span>}
                    {course.duration_minutes && <span>{Math.round(course.duration_minutes / 60)}h {course.duration_minutes % 60}m</span>}
                    {course.level && <span style={{ textTransform: 'capitalize' }}>{course.level}</span>}
                  </div>
                  <a href={`/catalog/${course.id}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                    fontSize: '.82rem', fontWeight: 600, color: 'var(--eden)',
                    textDecoration: 'none',
                  }}>
                    Continue
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
