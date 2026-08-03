import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PushSubscribe from '@/components/PushSubscribe'

export default async function DevotionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)

  const { data: devotion } = await supabase
    .from('daily_devotions')
    .select('*')
    .eq('date', today)
    .maybeSingle()

  const { data: recent } = await supabase
    .from('daily_devotions')
    .select('*')
    .order('date', { ascending: false })
    .limit(7)

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '.8rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '.4rem' }}>Daily Word</p>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.1rem)', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>
          Today's Devotional
        </h1>
        <div style={{ marginTop: '.75rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <p style={{ color: 'var(--text-lo)', fontSize: '.9rem', margin: 0 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <PushSubscribe />
        </div>
      </div>

      {devotion ? (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: '2rem' }}>
          {/* Scripture block */}
          <div style={{ background: 'linear-gradient(135deg,rgba(94,201,87,.12),rgba(94,201,87,.04))', borderBottom: '1px solid rgba(94,201,87,.2)', padding: '1.75rem 2rem' }}>
            <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--eden)', margin: '0 0 .6rem' }}>{devotion.scripture_reference}</p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-hi)', fontStyle: 'italic', margin: 0 }}>
              &ldquo;{devotion.scripture_text}&rdquo;
            </p>
          </div>

          {/* Devotional body */}
          <div style={{ padding: '1.75rem 2rem' }}>
            {devotion.body.split('\n').filter(Boolean).map((para: string, i: number) => (
              <p key={i} style={{ fontSize: '1rem', lineHeight: 1.85, color: 'var(--text-md)', margin: '0 0 1rem' }}>{para}</p>
            ))}

            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.65rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(94,201,87,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '.85rem', color: 'var(--text-hi)' }}>Senior Pastor Gbenga Ajibola</p>
                <p style={{ margin: 0, fontSize: '.75rem', color: 'var(--text-lo)' }}>Eden Life Experience Centre, Lagos</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-2)', border: '1px dashed var(--border)', borderRadius: 16, padding: '3rem', textAlign: 'center', marginBottom: '2rem' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', display: 'block', opacity: .4 }}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <p style={{ color: 'var(--text-lo)', fontSize: '.9rem', margin: 0 }}>
            Today&apos;s devotional will be here at 7:00 AM Lagos time. Check your email for it.
          </p>
        </div>
      )}

      {/* Recent devotionals */}
      {(recent ?? []).filter((d: { date: string }) => d.date !== today).length > 0 && (
        <div>
          <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-hi)', marginBottom: '1rem' }}>Recent Words</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {(recent ?? [])
              .filter((d: { date: string }) => d.date !== today)
              .map((d: { id: string; date: string; scripture_reference: string; body: string }) => (
                <div key={d.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '.5rem' }}>
                    <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--eden)' }}>{d.scripture_reference}</span>
                    <span style={{ fontSize: '.7rem', color: 'var(--text-lo)' }}>
                      {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--text-lo)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {d.body.split('\n')[0]}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
