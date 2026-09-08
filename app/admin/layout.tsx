'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

const ACCENT = '#f97316'

const navItems = [
  {
    label: 'Overview',
    href: '/admin',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    label: 'Courses',
    href: '/admin/courses',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    label: 'Registrations',
    href: '/admin/registrations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
        <rect x="8" y="2" width="8" height="4" rx="1"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/>
      </svg>
    ),
  },
  {
    label: 'Live Classes',
    href: '/admin/live-classes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
      </svg>
    ),
  },
  {
    label: 'Sermons',
    href: '/admin/sermons',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    ),
  },
  {
    label: 'Announcements',
    href: '/admin/announcements',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
  {
    label: 'Members',
    href: '/admin/members',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: 'Pastoral Care',
    href: '/admin/pastoral-care',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [openAlerts, setOpenAlerts] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => {
        if (data?.role !== 'admin') { router.replace('/dashboard'); return }
        setReady(true)
      })
    })
  }, [])

  useEffect(() => {
    if (!ready) return
    supabase.from('pastoral_alerts').select('id', { count: 'exact', head: true }).eq('reviewed', false)
      .then(({ count }) => setOpenAlerts(count ?? 0))
  }, [ready])

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const pageTitle = navItems.find(i => isActive(i.href))?.label ?? 'Admin'

  if (!ready) {
    return (
      <div style={{ background: 'var(--bg-0)', minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-lo)', fontSize: '.9rem' }}>Verifying access…</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100svh', background: 'var(--bg-0)' }}>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 40, display: 'none' }}
          className="admin-backdrop"
        />
      )}

      <aside
        className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar-open' : ''}`}
        style={{
          width: 260,
          flexShrink: 0,
          background: 'var(--bg-1)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          height: '100svh',
          position: 'sticky',
          top: 0,
          overflowY: 'auto',
        }}
      >
        <div style={{
          padding: '1.25rem 1.5rem 1rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '.75rem',
        }}>
          <Image src="/logo-white.png" alt="Eden Life Academy" width={38} height={38} style={{ height: 38, width: 'auto' }} />
          <div style={{ paddingLeft: '.75rem', borderLeft: '1px solid var(--border-hi)' }}>
            <div style={{
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              fontWeight: 800,
              fontSize: '.58rem',
              letterSpacing: '.28em',
              textTransform: 'uppercase',
              color: ACCENT,
            }}>Super Admin</div>
            <div style={{ fontSize: '.62rem', color: 'var(--text-lo)', marginTop: 2, letterSpacing: '.05em' }}>Control Panel</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {navItems.map(item => {
            const active = isActive(item.href)
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.75rem',
                  padding: '.7rem 1.5rem',
                  fontSize: '.9rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? ACCENT : 'var(--text-md)',
                  borderLeft: `2px solid ${active ? ACCENT : 'transparent'}`,
                  background: active ? 'linear-gradient(90deg, rgba(249,115,22,.14), rgba(251,191,36,.03))' : 'transparent',
                  boxShadow: active ? 'inset 0 0 0 1px rgba(249,115,22,.06)' : 'none',
                  transition: 'color .15s, background .15s, border-color .15s',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,.04)'
                    e.currentTarget.style.color = 'var(--text-hi)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-md)'
                  }
                }}
              >
                <span style={{ opacity: active ? 1 : 0.6, filter: active ? 'drop-shadow(0 0 5px rgba(249,115,22,.55))' : 'none' }}>{item.icon}</span>
                {item.label}
                {item.href === '/admin/pastoral-care' && openAlerts > 0 && (
                  <span style={{
                    marginLeft: 'auto', background: '#ef4444', color: '#fff',
                    fontSize: '.68rem', fontWeight: 700, borderRadius: 99,
                    padding: '.1rem .45rem', lineHeight: 1.4,
                  }}>{openAlerts}</span>
                )}
              </a>
            )
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <a
            href="/dashboard"
            style={{
              display: 'flex', alignItems: 'center', gap: '.65rem',
              padding: '.6rem 1rem', borderRadius: 8,
              color: 'var(--text-lo)', fontSize: '.85rem', textDecoration: 'none',
              transition: 'color .15s, background .15s', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-hi)'; e.currentTarget.style.background = 'rgba(255,255,255,.05)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-lo)'; e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Back to App
          </a>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: '.65rem',
              width: '100%', padding: '.6rem 1rem',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-lo)', fontSize: '.85rem', borderRadius: 8,
              transition: 'color .15s, background .15s',
              fontFamily: 'var(--font-poppins), Poppins, sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.background = 'rgba(239,68,68,.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-lo)'; e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header className="admin-topbar" style={{
          display: 'none', alignItems: 'center', gap: '1rem',
          padding: '1rem 1.25rem', background: 'var(--bg-1)',
          borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-hi)', padding: '.25rem', borderRadius: 6, display: 'flex', alignItems: 'center' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span style={{ color: ACCENT, fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '.65rem', letterSpacing: '.2em', textTransform: 'uppercase' }}>Admin</span>
          <span style={{ color: 'var(--text-hi)', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '1rem' }}>{pageTitle}</span>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }} className="admin-main">
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .admin-sidebar {
            position: fixed !important;
            left: -260px;
            top: 0;
            height: 100svh;
            z-index: 50;
            transition: left .25s ease;
          }
          .admin-sidebar.admin-sidebar-open { left: 0; }
          .admin-backdrop { display: block !important; }
          .admin-topbar { display: flex !important; }
          .admin-main { padding: 1.25rem !important; }
        }
      `}</style>
    </div>
  )
}
