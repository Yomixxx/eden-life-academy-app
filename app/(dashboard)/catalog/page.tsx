import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Course } from '@/lib/types'

const levelColors: Record<string, string> = {
  beginner: '#86efac',
  intermediate: '#fde68a',
  advanced: '#fca5a5',
}

function CourseCard({ course, enrollCount }: { course: Course; enrollCount: number }) {
  const levelColor = levelColors[course.level?.toLowerCase() ?? ''] ?? 'var(--text-lo)'
  return (
    <a href={`/catalog/${course.id}`} style={{
      background: 'var(--bg-2)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.5rem',
      textDecoration: 'none', color: 'inherit',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem' }}>
        {course.category && (
          <span style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--eden)' }}>{course.category}</span>
        )}
        {enrollCount > 0 && (
          <span style={{ fontSize: '.68rem', color: 'var(--text-lo)', whiteSpace: 'nowrap' }}>
            {enrollCount} member{enrollCount !== 1 ? 's' : ''} enrolled
          </span>
        )}
      </div>
      <h3 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-hi)', lineHeight: 1.3 }}>{course.title}</h3>
      {course.description && (
        <p style={{ fontSize: '.83rem', color: 'var(--text-lo)', lineHeight: 1.6 }}>{course.description}</p>
      )}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
        {course.level && (
          <span style={{ fontSize: '.68rem', fontWeight: 600, background: 'rgba(255,255,255,.06)', color: levelColor, padding: '.3rem .7rem', borderRadius: 20, textTransform: 'capitalize' }}>{course.level}</span>
        )}
        {course.total_lessons && (
          <span style={{ fontSize: '.68rem', color: 'var(--text-lo)', background: 'rgba(255,255,255,.04)', padding: '.3rem .7rem', borderRadius: 20 }}>{course.total_lessons} lessons</span>
        )}
        {course.duration_minutes && (
          <span style={{ fontSize: '.68rem', color: 'var(--text-lo)', background: 'rgba(255,255,255,.04)', padding: '.3rem .7rem', borderRadius: 20 }}>
            {Math.floor(course.duration_minutes / 60) > 0 ? `${Math.floor(course.duration_minutes / 60)}h ` : ''}{course.duration_minutes % 60 > 0 ? `${course.duration_minutes % 60}m` : ''}
          </span>
        )}
      </div>
      <span className="enroll-btn" style={{
        marginTop: '.75rem', padding: '.65rem 1rem', borderRadius: 8, textAlign: 'center',
        background: 'rgba(94,201,87,.1)', border: '1px solid rgba(94,201,87,.25)',
        color: 'var(--eden)', fontWeight: 600, fontSize: '.85rem',
        fontFamily: 'var(--font-poppins), Poppins, sans-serif',
      }}>
        View Course
      </span>
    </a>
  )
}

export default async function CatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [coursesRes, enrollmentsRes] = await Promise.all([
    supabase.from('courses').select('*').eq('is_published', true).order('sort_order', { ascending: true }),
    supabase.from('enrollments').select('course_id'),
  ])

  const enrollCountMap: Record<string, number> = {}
  for (const e of enrollmentsRes.data ?? []) {
    enrollCountMap[e.course_id] = (enrollCountMap[e.course_id] ?? 0) + 1
  }

  const allCourses: Course[] = coursesRes.data ?? []
  const categories = ['All', ...Array.from(new Set(allCourses.map(c => c.category).filter(Boolean) as string[]))]

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '.8rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '.4rem' }}>Learn</p>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.1rem)', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>
          Course Catalog
        </h1>
        <p style={{ marginTop: '.5rem', color: 'var(--text-lo)', fontSize: '.9rem' }}>All available learning tracks and courses.</p>
      </div>

      {/* Category filters — static display, filtering would need client component */}
      {categories.length > 1 && (
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
          {categories.map((cat, i) => (
            <span key={cat} style={{
              padding: '.45rem 1rem', borderRadius: 20, fontSize: '.8rem', fontWeight: 500,
              background: i === 0 ? 'var(--eden)' : 'var(--bg-2)',
              color: i === 0 ? 'var(--bg-0)' : 'var(--text-md)',
              border: i === 0 ? 'none' : '1px solid var(--border)',
              cursor: 'pointer',
            }}>{cat}</span>
          ))}
        </div>
      )}

      {allCourses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-lo)', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 16 }}>
          <p>No courses published yet. Check back soon.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
          {allCourses.map(course => <CourseCard key={course.id} course={course} enrollCount={enrollCountMap[course.id] ?? 0} />)}
        </div>
      )}

      {/* Static content if DB is empty — shows example tracks */}
      {allCourses.length === 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, color: 'var(--text-hi)', marginBottom: '1rem', fontSize: '1.1rem' }}>Coming Soon</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
            {[
              { title: 'Foundation Course', category: 'Foundation Track', level: 'beginner', description: 'Core doctrines and beliefs of the Christian faith.', total_lessons: 8 },
              { title: 'Growth Steps', category: 'Discipleship', level: 'beginner', description: 'Practical steps for growing in your walk with God.', total_lessons: 6 },
              { title: 'Leadership Foundations', category: 'Leadership', level: 'intermediate', description: 'Building servant-leaders for the church and marketplace.', total_lessons: 10 },
              { title: 'Word & Prayer', category: 'Spiritual Disciplines', level: 'beginner', description: 'Developing a consistent devotional life.', total_lessons: 5 },
            ].map(c => (
              <div key={c.title} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', opacity: 0.7 }}>
                <span style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--eden)' }}>{c.category}</span>
                <h3 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-hi)', margin: '.5rem 0' }}>{c.title}</h3>
                <p style={{ fontSize: '.83rem', color: 'var(--text-lo)', lineHeight: 1.6 }}>{c.description}</p>
                <div style={{ marginTop: '.75rem', fontSize: '.72rem', color: 'var(--text-lo)' }}>{c.total_lessons} lessons • Coming soon</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`
        .enroll-btn { transition: background .2s; }
        .enroll-btn:hover { background: rgba(94,201,87,.2) !important; }
      `}</style>
    </div>
  )
}
