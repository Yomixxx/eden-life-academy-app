'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

const navGroups = [
  {
    label: 'LEARN',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
      },
      {
        label: 'My Courses',
        href: '/courses',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        ),
      },
      {
        label: 'Course Catalog',
        href: '/catalog',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        ),
      },
      {
        label: 'Certificates',
        href: '/certificates',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'WORD & MEDIA',
    items: [
      {
        label: 'Daily Word',
        href: '/devotion',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ),
      },
      {
        label: 'Bible',
        href: '/bible',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        ),
      },
      {
        label: 'Sermons',
        href: '/sermons',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'AI',
    items: [
      {
        label: 'Ask PG',
        href: '/ask',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: 'CHURCH',
    items: [
      {
        label: 'Announcements',
        href: '/announcements',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        ),
      },
      {
        label: 'Community',
        href: '/community',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      {
        label: 'Settings',
        href: '/settings',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ),
      },
    ],
  },
]

// Bottom nav — 4 primary items + More
const bottomNavItems = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    label: 'Courses',
    href: '/courses',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    label: 'Bible',
    href: '/bible',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    label: 'Ask PG',
    href: '/ask',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
]

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/courses': 'My Courses',
  '/catalog': 'Course Catalog',
  '/certificates': 'Certificates',
  '/bible': 'Bible',
  '/sermons': 'Sermons',
  '/media': 'Media',
  '/announcements': 'Announcements',
  '/community': 'Community',
  '/settings': 'Settings',
  '/ask': 'Ask PG',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => {
        if (data?.role === 'admin') setIsAdmin(true)
      })
    })
  }, [])

  const pageTitle = pageTitles[pathname] ?? 'Eden Life Academy'

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href

  return (
    <div style={{ display: 'flex', minHeight: '100svh', background: 'var(--bg-0)' }}>
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="sidebar-backdrop"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
            zIndex: 40, display: 'none',
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
        style={{
          width: 280,
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
        {/* Logo */}
        <div style={{
          padding: '1.5rem 1.5rem 1rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '.75rem',
        }}>
          <Image src="/logo-white.png" alt="Eden Life Experience Centre" width={44} height={44} style={{ height: 44, width: 'auto' }} />
          <span style={{
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: '.65rem',
            letterSpacing: '.3em',
            textTransform: 'uppercase',
            color: 'var(--eden)',
            paddingLeft: '.75rem',
            borderLeft: '1px solid var(--border-hi)',
          }}>Academy</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {navGroups.map(group => (
            <div key={group.label} style={{ marginBottom: '.5rem' }}>
              <div style={{
                padding: '.5rem 1.5rem .35rem',
                fontSize: '.68rem',
                fontWeight: 600,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: 'var(--text-lo)',
              }}>{group.label}</div>
              {group.items.map(item => {
                const active = isActive(item.href)
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '.75rem',
                      padding: '.8rem 1.5rem',
                      fontSize: '.9rem',
                      fontWeight: active ? 600 : 400,
                      color: active ? 'var(--eden)' : 'var(--text-md)',
                      borderLeft: active ? '2px solid var(--eden)' : '2px solid transparent',
                      background: active ? 'rgba(94,201,87,.07)' : 'transparent',
                      transition: 'color .15s, background .15s, border-color .15s',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      minHeight: 44,
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
                    <span style={{ opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                    {item.label}
                  </a>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Admin link */}
        {isAdmin && (
          <div style={{ padding: '0 0 .5rem' }}>
            <a href="/admin" style={{
              display: 'flex', alignItems: 'center', gap: '.75rem',
              padding: '.8rem 1.5rem', fontSize: '.9rem', fontWeight: 500,
              color: '#f97316', textDecoration: 'none',
              borderLeft: '2px solid transparent',
              transition: 'background .15s',
              minHeight: 44,
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              Admin Dashboard
            </a>
          </div>
        )}

        {/* Sign Out */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: '.75rem',
              width: '100%', padding: '.8rem 1rem',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-lo)', fontSize: '.9rem', borderRadius: 8,
              transition: 'color .15s, background .15s',
              fontFamily: 'var(--font-poppins), Poppins, sans-serif',
              minHeight: 44,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.background = 'rgba(239,68,68,.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-lo)'; e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Mobile topbar */}
        <header className="mobile-topbar" style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.25rem',
          height: 56,
          background: 'var(--bg-1)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
            <Image src="/logo-white.png" alt="" width={32} height={32} style={{ height: 32, width: 'auto' }} />
            <span style={{
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              fontWeight: 700, fontSize: '.95rem', color: 'var(--text-hi)',
            }}>{pageTitle}</span>
          </div>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-hi)', padding: '.5rem', borderRadius: 8,
              display: 'flex', alignItems: 'center', minWidth: 44, minHeight: 44,
              justifyContent: 'center',
            }}
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }} className="page-main">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <nav className="bottom-nav" style={{ display: 'none' }}>
        {bottomNavItems.map(item => {
          const active = isActive(item.href)
          return (
            <a
              key={item.href}
              href={item.href}
              className="bottom-nav-item"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: '.2rem', flex: 1,
                padding: '.5rem .25rem',
                color: active ? 'var(--eden)' : 'var(--text-lo)',
                textDecoration: 'none', fontSize: '.65rem', fontWeight: active ? 600 : 400,
                letterSpacing: '.02em',
                transition: 'color .15s',
                cursor: 'pointer',
                minHeight: 56,
              }}
            >
              <span style={{ opacity: active ? 1 : 0.55 }}>{item.icon}</span>
              {item.label}
            </a>
          )
        })}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="bottom-nav-item"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '.2rem', flex: 1,
            padding: '.5rem .25rem', background: 'transparent', border: 'none',
            color: 'var(--text-lo)', fontSize: '.65rem', fontWeight: 400,
            letterSpacing: '.02em', cursor: 'pointer', minHeight: 56,
            fontFamily: 'var(--font-poppins), Poppins, sans-serif',
          }}
          aria-label="More navigation options"
        >
          <span style={{ opacity: 0.55 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </span>
          More
        </button>
      </nav>

      <style>{`
        @media (max-width: 900px) {
          .sidebar {
            position: fixed !important;
            left: -280px;
            top: 0;
            height: 100svh;
            z-index: 50;
            transition: left .25s ease;
          }
          .sidebar.sidebar-open {
            left: 0;
          }
          .sidebar-backdrop {
            display: block !important;
          }
          .mobile-topbar {
            display: flex !important;
          }
          .bottom-nav {
            display: flex !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--bg-1);
            border-top: 1px solid var(--border);
            z-index: 30;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          .page-main {
            padding: 1.25rem !important;
            padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
          }
        }
        @media (min-width: 901px) {
          .bottom-nav { display: none !important; }
        }
      `}</style>
    </div>
  )
}
