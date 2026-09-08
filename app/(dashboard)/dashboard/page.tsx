import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LiveBanner, InviteCard } from './DashboardExtras'
import ContinueCoursePopup from '@/components/ContinueCoursePopup'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)
  const [profileRes, enrollmentsRes, announcementRes, devotionRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('enrollments').select('course_id, last_activity_date, matric_number, academy_level, cohort, courses(id, title)').eq('user_id', user.id).order('last_activity_date', { ascending: false, nullsFirst: false }),
    supabase.from('announcements').select('*').eq('is_pinned', true).order('published_at', { ascending: false }).limit(1).single(),
    supabase.from('daily_devotions').select('scripture_reference, scripture_text, body').eq('date', today).maybeSingle(),
  ])

  const profile = profileRes.data
  if (!profile?.campus) redirect('/setup-campus')
  const enrollments = enrollmentsRes.data ?? []
  const enrolledCount = enrollments.length
  const pinned = announcementRes.data
  const todayDevotion = devotionRes.data

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Friend'
  const academyEnrollment = enrollments.find(e => e.matric_number)

  // Find the most recently active course that's been started but not finished,
  // so we can nudge the user to pick it back up.
  let continueCourse: { id: string; title: string; completed: number; total: number } | null = null
  const courseIds = enrollments.map(e => e.course_id)
  if (courseIds.length > 0) {
    const [lessonsRes, progressRes] = await Promise.all([
      supabase.from('lessons').select('course_id').eq('is_published', true).in('course_id', courseIds),
      supabase.from('lesson_progress').select('course_id').eq('user_id', user.id).eq('completed', true).in('course_id', courseIds),
    ])
    const totalByCourse: Record<string, number> = {}
    for (const l of lessonsRes.data ?? []) totalByCourse[l.course_id] = (totalByCourse[l.course_id] ?? 0) + 1
    const completedByCourse: Record<string, number> = {}
    for (const p of progressRes.data ?? []) completedByCourse[p.course_id] = (completedByCourse[p.course_id] ?? 0) + 1

    for (const e of enrollments) {
      const course = Array.isArray(e.courses) ? e.courses[0] : e.courses
      if (!course) continue
      const total = totalByCourse[e.course_id] ?? 0
      const completed = completedByCourse[e.course_id] ?? 0
      if (total > 0 && completed > 0 && completed < total) {
        continueCourse = { id: course.id, title: course.title, completed, total }
        break
      }
    }
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      {continueCourse && (
        <ContinueCoursePopup
          course={{ id: continueCourse.id, title: continueCourse.title }}
          completed={continueCourse.completed}
          total={continueCourse.total}
        />
      )}
      <LiveBanner />
      {/* Welcome */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, padding: '1.75rem 2rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(94,201,87,.07), transparent 60%)' }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,.14), transparent 70%)', pointerEvents: 'none' }} />
        <p style={{ fontSize: '.8rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '.4rem', position: 'relative' }}>Welcome back</p>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: 'var(--text-hi)', letterSpacing: '-.02em', position: 'relative' }}>
          Good to see you, {firstName}
        </h1>
        <p style={{ marginTop: '.5rem', color: 'var(--text-lo)', fontSize: '.9rem', position: 'relative' }}>
          {enrolledCount > 0 ? 'Continue your discipleship journey where you left off.' : 'Begin your discipleship journey today.'}
        </p>
        {academyEnrollment && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '.5rem', marginTop: '1rem', position: 'relative',
            background: 'rgba(94,201,87,.1)', border: '1px solid rgba(94,201,87,.3)',
            borderRadius: 10, padding: '.55rem .9rem',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M7 14h4"/>
            </svg>
            <span style={{ fontSize: '.72rem', color: 'var(--text-lo)' }}>Matric No.</span>
            <span style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--eden)', fontFamily: 'monospace' }}>{academyEnrollment.matric_number}</span>
            {academyEnrollment.academy_level && (
              <span style={{ fontSize: '.72rem', color: 'var(--text-lo)', paddingLeft: '.4rem', borderLeft: '1px solid var(--border-hi)' }}>{academyEnrollment.academy_level} Level</span>
            )}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Enrolled Courses', value: enrolledCount, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
          { label: 'Campus', value: profile?.campus ?? '—', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { label: 'Role', value: profile?.role ?? 'Member', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14,
            padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
            boxShadow: '0 12px 30px -18px rgba(0,0,0,.6)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(94,201,87,.22), rgba(52,211,153,.1))',
              border: '1px solid rgba(94,201,87,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-hi)', lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-lo)', marginTop: '.2rem' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pinned announcement */}
      {pinned && (
        <div style={{
          background: 'linear-gradient(135deg,rgba(94,201,87,.1),rgba(94,201,87,.04))',
          border: '1px solid rgba(94,201,87,.25)',
          borderRadius: 14, padding: '1.25rem 1.5rem',
          marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start',
        }}>
          <div style={{ marginTop: 2, flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '.7rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '.35rem' }}>Latest Announcement</p>
            <p style={{ fontWeight: 600, color: 'var(--text-hi)', marginBottom: '.3rem' }}>{pinned.title}</p>
            {pinned.body && <p style={{ fontSize: '.88rem', color: 'var(--text-md)', lineHeight: 1.6 }}>{pinned.body}</p>}
          </div>
          <a href="/announcements" style={{ marginLeft: 'auto', flexShrink: 0, fontSize: '.8rem', color: 'var(--eden)', fontWeight: 500, whiteSpace: 'nowrap' }}>View all</a>
        </div>
      )}

      {/* Today's Word */}
      {todayDevotion && (
        <a href="/devotion" style={{ display: 'block', textDecoration: 'none', marginBottom: '1.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg,rgba(94,201,87,.08),rgba(94,201,87,.02))',
            border: '1px solid rgba(94,201,87,.2)',
            borderRadius: 14, padding: '1.25rem 1.5rem',
            transition: 'border-color .15s',
          }}>
            <p style={{ margin: '0 0 .5rem', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--eden)' }}>
              Today&apos;s Word — {todayDevotion.scripture_reference}
            </p>
            <p style={{ margin: '0 0 .6rem', fontFamily: 'Georgia, serif', fontSize: '.95rem', lineHeight: 1.7, color: 'var(--text-hi)', fontStyle: 'italic' }}>
              &ldquo;{todayDevotion.scripture_text.length > 120
                ? todayDevotion.scripture_text.slice(0, 120) + '…'
                : todayDevotion.scripture_text}&rdquo;
            </p>
            <p style={{ margin: 0, fontSize: '.82rem', color: 'var(--text-lo)', lineHeight: 1.65 }}>
              {todayDevotion.body.split('\n')[0].slice(0, 140)}{todayDevotion.body.split('\n')[0].length > 140 ? '…' : ''}
            </p>
            <p style={{ margin: '.75rem 0 0', fontSize: '.75rem', color: 'var(--eden)', fontWeight: 600 }}>Read full devotional →</p>
          </div>
        </a>
      )}

      {/* Two column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="dash-grid">

        {/* Continue Learning */}
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', boxShadow: '0 16px 40px -24px rgba(0,0,0,.65)' }}>
          <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-hi)', marginBottom: '1.25rem' }}>Continue Learning</h2>
          {enrolledCount > 0 ? (
            <div style={{ background: 'var(--bg-3)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ height: 6, background: 'var(--border)' }}>
                <div style={{ height: '100%', width: '10%', background: 'linear-gradient(90deg, var(--eden), var(--eden-glow))', borderRadius: 3 }} />
              </div>
              <div style={{ padding: '1rem 1.25rem' }}>
                <span style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--eden)' }}>
                  {enrolledCount} course{enrolledCount !== 1 ? 's' : ''} enrolled
                </span>
                <p style={{ fontWeight: 600, color: 'var(--text-hi)', margin: '.3rem 0 .2rem', fontSize: '.95rem' }}>Keep going, {firstName}</p>
                <p style={{ fontSize: '.8rem', color: 'var(--text-lo)' }}>Pick up where you left off.</p>
                <a href="/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', marginTop: '.9rem', fontSize: '.85rem', fontWeight: 600, color: 'var(--bg-0)', background: 'var(--eden)', padding: '.7rem 1.25rem', borderRadius: 7, textDecoration: 'none', minHeight: 44 }}>
                  My Courses
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </a>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-3)', borderRadius: 10, padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(94,201,87,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .85rem' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <p style={{ fontWeight: 600, color: 'var(--text-hi)', fontSize: '.9rem', marginBottom: '.3rem' }}>Start your first course</p>
              <p style={{ fontSize: '.8rem', color: 'var(--text-lo)', marginBottom: '.9rem' }}>Explore our learning tracks and begin your discipleship journey.</p>
              <a href="/catalog" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontSize: '.85rem', fontWeight: 600, color: 'var(--bg-0)', background: 'var(--eden)', padding: '.7rem 1.25rem', borderRadius: 7, textDecoration: 'none', minHeight: 44 }}>
                Browse Catalog
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* Live Sessions */}
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', boxShadow: '0 16px 40px -24px rgba(0,0,0,.65)' }}>
          <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-hi)', marginBottom: '1.25rem' }}>Upcoming Services</h2>
          {[
            { day: 'Sunday', time: '10:00 AM', campus: 'Mainland - Ogudu', type: 'Main Service' },
            { day: 'Sunday', time: '10:00 AM', campus: 'Island - Ajah', type: 'Main Service' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.75rem 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(94,201,87,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 500, color: 'var(--text-hi)', fontSize: '.88rem' }}>{s.type}</p>
                <p style={{ fontSize: '.78rem', color: 'var(--text-lo)' }}>{s.day} • {s.time} • {s.campus}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-hi)', marginBottom: '1rem' }}>Quick Access</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: '.75rem' }}>
          {[
            { label: 'Daily Word', href: '/devotion', color: '#5ec957', icon: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/> },
            { label: 'Sermons', href: '/sermons', color: '#a78bfa', icon: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></> },
            { label: 'Bible', href: '/bible', color: '#60a5fa', icon: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></> },
            { label: 'Community', href: '/community', color: '#f97316', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></> },
            { label: 'Announcements', href: '/announcements', color: '#fbbf24', icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></> },
            { label: 'Ask PG', href: '/ask-pg', color: '#ec4899', icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/> },
          ].map(item => (
            <a key={item.href} href={item.href} className="qa-link" style={{
              '--qa-color': item.color,
              background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '1rem', textAlign: 'center', color: 'var(--text-md)',
              fontSize: '.85rem', fontWeight: 500,
              textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.6rem',
            } as React.CSSProperties}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, ${item.color}33, ${item.color}14)`,
                border: `1px solid ${item.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
              </div>
              {item.label}
            </a>
          ))}
        </div>
      </div>

      <InviteCard />

      <style>{`
        @media (max-width: 700px) { .dash-grid { grid-template-columns: 1fr !important; } }
        .qa-link { transition: border-color .15s, color .15s; }
        .qa-link:hover { border-color: var(--qa-color) !important; color: var(--qa-color) !important; }
      `}</style>
    </div>
  )
}
