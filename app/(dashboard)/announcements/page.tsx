import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Announcement } from '@/lib/types'

const categoryColors: Record<string, { bg: string; color: string }> = {
  urgent: { bg: 'rgba(239,68,68,.12)', color: '#fca5a5' },
  prayer: { bg: 'rgba(167,139,250,.12)', color: '#c4b5fd' },
  events: { bg: 'rgba(94,201,87,.12)', color: 'var(--eden)' },
  general: { bg: 'rgba(255,255,255,.07)', color: 'var(--text-lo)' },
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function AnnouncementCard({ item }: { item: Announcement }) {
  const cat = item.category?.toLowerCase() ?? 'general'
  const colors = categoryColors[cat] ?? categoryColors.general

  return (
    <div style={{
      background: 'var(--bg-2)',
      border: item.is_pinned ? '1px solid rgba(94,201,87,.3)' : '1px solid var(--border)',
      borderRadius: 14,
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {item.is_pinned && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: 'rgba(94,201,87,.15)', padding: '.35rem .75rem',
          borderBottomLeftRadius: 10, fontSize: '.65rem', fontWeight: 700,
          letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--eden)',
          display: 'flex', alignItems: 'center', gap: '.35rem',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--eden)" stroke="none">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
          Pinned
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '.9rem' }}>
        <h3 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-hi)', flex: 1, minWidth: '200px', paddingRight: item.is_pinned ? '80px' : '0' }}>
          {item.title}
        </h3>
        <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
          {item.category && (
            <span style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', background: colors.bg, color: colors.color, padding: '.3rem .7rem', borderRadius: 20 }}>
              {item.category}
            </span>
          )}
          {item.campus && (
            <span style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', background: 'rgba(255,255,255,.06)', color: 'var(--text-lo)', padding: '.3rem .7rem', borderRadius: 20 }}>
              {item.campus}
            </span>
          )}
        </div>
      </div>
      {item.body && (
        <p style={{ color: 'var(--text-md)', lineHeight: 1.7, fontSize: '.9rem', marginBottom: '.75rem' }}>{item.body}</p>
      )}
      <p style={{ fontSize: '.75rem', color: 'var(--text-lo)' }}>{formatDate(item.published_at)}</p>
    </div>
  )
}

export default async function AnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })

  const items: Announcement[] = announcements ?? []
  const pinned = items.filter(a => a.is_pinned)
  const regular = items.filter(a => !a.is_pinned)

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '.8rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '.4rem' }}>Church</p>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.1rem)', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>
          Announcements
        </h1>
        <p style={{ marginTop: '.5rem', color: 'var(--text-lo)', fontSize: '.9rem' }}>Stay informed about what&apos;s happening at Eden Life.</p>
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-lo)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', display: 'block', opacity: .4 }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <p>No announcements yet. Check back soon.</p>
        </div>
      )}

      {pinned.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: '1rem' }}>Pinned</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pinned.map(item => <AnnouncementCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {regular.length > 0 && (
        <div>
          <h2 style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: '1rem' }}>All Announcements</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {regular.map(item => <AnnouncementCard key={item.id} item={item} />)}
          </div>
        </div>
      )}
    </div>
  )
}
