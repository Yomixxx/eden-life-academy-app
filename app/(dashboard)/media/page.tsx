import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const mediaItems = [
  { id: 1, type: 'video', title: 'Sunday Service Highlight — June 2025', date: 'Jun 15, 2025', duration: '18:32', campus: 'Both Campuses', thumbnail: 'SH' },
  { id: 2, type: 'video', title: 'Youth Conference 2025 Recap', date: 'May 28, 2025', duration: '24:10', campus: 'Mainland - Ogudu', thumbnail: 'YC' },
  { id: 3, type: 'audio', title: 'Worship Night Recording — April 2025', date: 'Apr 20, 2025', duration: '1:12:45', campus: 'Island - Ajah', thumbnail: 'WN' },
  { id: 4, type: 'video', title: 'Leaders Forum Q1 2025', date: 'Mar 12, 2025', duration: '45:00', campus: 'Both Campuses', thumbnail: 'LF' },
  { id: 5, type: 'audio', title: 'Prayer & Fasting Week Day 1', date: 'Feb 3, 2025', duration: '38:22', campus: 'Both Campuses', thumbnail: 'PF' },
  { id: 6, type: 'video', title: 'New Year Crossover Service 2025', date: 'Jan 1, 2025', duration: '2:05:17', campus: 'Mainland - Ogudu', thumbnail: 'NY' },
]

const campusColors: Record<string, string> = {
  'Mainland - Ogudu': '#60a5fa',
  'Island - Ajah': '#a78bfa',
  'Both Campuses': '#5ec957',
}

export default async function MediaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '.8rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '.4rem' }}>Word &amp; Media</p>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.1rem)', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>
          Media Library
        </h1>
        <p style={{ marginTop: '.5rem', color: 'var(--text-lo)', fontSize: '.9rem' }}>Videos, recordings, and highlights from Eden Life Experience Centre.</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.75rem' }}>
        {['All', 'Videos', 'Audio', 'Live'].map((tab, i) => (
          <button key={tab} style={{
            padding: '.45rem 1.1rem', borderRadius: 20, fontSize: '.8rem', fontWeight: 500, cursor: 'pointer',
            background: i === 0 ? 'var(--eden)' : 'var(--bg-2)',
            color: i === 0 ? 'var(--bg-0)' : 'var(--text-md)',
            border: i === 0 ? 'none' : '1px solid var(--border)',
            fontFamily: 'var(--font-poppins), Poppins, sans-serif',
          }}>{tab}</button>
        ))}
      </div>

      {/* Featured */}
      <div style={{
        background: 'linear-gradient(135deg,#0c2018,#111f1d)',
        border: '1px solid var(--border)', borderRadius: 16,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
        marginBottom: '2rem', overflow: 'hidden',
      }} className="media-featured">
        <div style={{
          background: 'linear-gradient(135deg,#0c2018,#162421)',
          minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '1rem', position: 'relative',
        }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(94,201,87,.15)', border: '2px solid rgba(94,201,87,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: 'var(--eden)' }}>SH</div>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(94,201,87,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#080f0e" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'rgba(0,0,0,.6)', borderRadius: 6, padding: '.25rem .65rem', fontSize: '.72rem', color: 'var(--text-md)' }}>18:32</div>
        </div>
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '.65rem' }}>
          <span style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--eden)' }}>Latest Upload</span>
          <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-hi)', lineHeight: 1.3 }}>Sunday Service Highlight — June 2025</h2>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.7rem', fontWeight: 600, background: 'rgba(94,201,87,.1)', color: 'var(--eden)', padding: '.3rem .7rem', borderRadius: 20 }}>Both Campuses</span>
            <span style={{ fontSize: '.7rem', color: 'var(--text-lo)', background: 'rgba(255,255,255,.05)', padding: '.3rem .7rem', borderRadius: 20 }}>Jun 15, 2025</span>
          </div>
          <p style={{ fontSize: '.85rem', color: 'var(--text-md)', lineHeight: 1.7 }}>
            Catch the highlights from this week&apos;s powerful Sunday service. Worship, the Word, and transformation — all in one place.
          </p>
        </div>
      </div>

      {/* Grid */}
      <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-hi)', marginBottom: '1rem' }}>All Media</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
        {mediaItems.slice(1).map(item => (
          <div key={item.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{
              background: 'linear-gradient(135deg,#0c2018,#162421)',
              height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '.75rem', position: 'relative',
            }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(94,201,87,.12)', border: '1.5px solid rgba(94,201,87,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '.9rem', color: 'var(--eden)' }}>{item.thumbnail}</div>
              {item.type === 'video'
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              }
              <div style={{ position: 'absolute', bottom: '0.6rem', right: '0.6rem', background: 'rgba(0,0,0,.6)', borderRadius: 5, padding: '.2rem .55rem', fontSize: '.68rem', color: 'var(--text-md)' }}>{item.duration}</div>
            </div>
            <div style={{ padding: '1rem' }}>
              <h3 style={{ fontWeight: 600, color: 'var(--text-hi)', fontSize: '.88rem', lineHeight: 1.4, marginBottom: '.5rem' }}>{item.title}</h3>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '.67rem', color: campusColors[item.campus] ?? 'var(--text-lo)', background: 'rgba(255,255,255,.05)', padding: '.25rem .6rem', borderRadius: 20 }}>{item.campus}</span>
                <span style={{ fontSize: '.67rem', color: 'var(--text-lo)' }}>{item.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) { .media-featured { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
