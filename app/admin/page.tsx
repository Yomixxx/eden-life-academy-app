'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ACCENT = '#f97316'

interface Stats {
  courses: number
  published_courses: number
  sermons: number
  announcements: number
  members: number
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: courses }, { count: sermons }, { count: announcements }, { count: members }] =
        await Promise.all([
          supabase.from('courses').select('id, is_published'),
          supabase.from('sermons').select('id', { count: 'exact', head: true }),
          supabase.from('announcements').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
        ])
      setStats({
        courses: courses?.length ?? 0,
        published_courses: courses?.filter(c => c.is_published).length ?? 0,
        sermons: sermons ?? 0,
        announcements: announcements ?? 0,
        members: members ?? 0,
      })
    }
    load()
  }, [])

  const statCards = stats ? [
    { label: 'Courses', value: stats.courses, sub: `${stats.published_courses} published`, href: '/admin/courses' },
    { label: 'Sermons', value: stats.sermons, sub: 'in library', href: '/admin/sermons' },
    { label: 'Announcements', value: stats.announcements, sub: 'total', href: '/admin/announcements' },
    { label: 'Members', value: stats.members, sub: 'registered', href: '/admin/members' },
  ] : Array(4).fill(null)

  const quickActions = [
    {
      label: 'Upload Course',
      desc: 'Create a course with lessons and content',
      href: '/admin/courses',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      ),
    },
    {
      label: 'Add Sermon',
      desc: 'Upload a sermon with video or audio link',
      href: '/admin/sermons',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      ),
    },
    {
      label: 'Post Announcement',
      desc: 'Publish updates to the church community',
      href: '/admin/announcements',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
    },
    {
      label: 'Manage Members',
      desc: 'View members and assign roles',
      href: '/admin/members',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: ACCENT, marginBottom: '.4rem' }}>
          Super Admin
        </div>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-hi)', margin: 0 }}>
          Overview
        </h1>
        <p style={{ color: 'var(--text-lo)', fontSize: '.9rem', marginTop: '.4rem', margin: '.4rem 0 0' }}>
          Manage all content for Eden Life Academy.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {statCards.map((card, i) => (
          <a
            key={i}
            href={card?.href ?? '#'}
            style={{
              display: 'block', textDecoration: 'none',
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '1.25rem 1.5rem',
              cursor: 'pointer', transition: 'border-color .15s, background .15s',
              minHeight: 100,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = 'rgba(249,115,22,.05)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-2)' }}
          >
            {!card ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 36, background: 'var(--bg-3)', borderRadius: 8, width: '60%', opacity: 0.5 }} />
                <div style={{ height: 14, background: 'var(--bg-3)', borderRadius: 6, width: '80%', opacity: 0.4 }} />
                <div style={{ height: 12, background: 'var(--bg-3)', borderRadius: 6, width: '50%', opacity: 0.3 }} />
              </div>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '2.25rem', color: 'var(--text-hi)', lineHeight: 1 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text-hi)', marginTop: '.5rem' }}>{card.label}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-lo)', marginTop: '.2rem' }}>{card.sub}</div>
              </>
            )}
          </a>
        ))}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: '.75rem' }}>
          Quick Actions
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '.75rem' }}>
          {quickActions.map(action => (
            <a
              key={action.label}
              href={action.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                textDecoration: 'none', background: 'var(--bg-1)',
                border: '1px solid var(--border)', borderRadius: 12,
                padding: '1rem 1.25rem', cursor: 'pointer',
                transition: 'border-color .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hi)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ color: ACCENT, flexShrink: 0 }}>{action.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--text-hi)' }}>{action.label}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text-lo)', marginTop: 2 }}>{action.desc}</div>
              </div>
              <svg style={{ marginLeft: 'auto', flexShrink: 0, color: 'var(--text-lo)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
