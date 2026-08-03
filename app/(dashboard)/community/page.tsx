'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Prayer {
  id: string
  request: string
  is_anonymous: boolean
  prayer_count: number | null
  is_answered: boolean
  created_at: string
}

interface Supporter {
  prayer_request_id: string
  user_id: string
  full_name: string | null
}

function formatRelativeDate(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

function prayerLabel(supporters: Supporter[], myId: string): string {
  if (supporters.length === 0) return 'Pray'
  const names = supporters.slice(0, 2).map(s => s.full_name?.split(' ')[0] ?? 'Someone')
  const extra = supporters.length - 2
  if (supporters.length === 1) return `${names[0]} is praying`
  if (supporters.length === 2) return `${names[0]} & ${names[1]} are praying`
  return `${names[0]}, ${names[1]} & ${extra} other${extra > 1 ? 's' : ''} are praying`
}

export default function CommunityPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [prayers, setPrayers] = useState<Prayer[]>([])
  const [supporters, setSupporters] = useState<Record<string, Supporter[]>>({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newRequest, setNewRequest] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const load = useCallback(async (uid: string) => {
    const [prayersRes, supportersRes] = await Promise.all([
      supabase.from('prayer_requests').select('*').eq('is_public', true).order('created_at', { ascending: false }).limit(20),
      supabase.from('prayer_supporters').select('prayer_request_id, user_id, profiles(full_name)'),
    ])

    setPrayers(prayersRes.data ?? [])

    const map: Record<string, Supporter[]> = {}
    for (const s of (supportersRes.data ?? []) as any[]) {
      const pid = s.prayer_request_id
      if (!map[pid]) map[pid] = []
      map[pid].push({ prayer_request_id: pid, user_id: s.user_id, full_name: s.profiles?.full_name ?? null })
    }
    setSupporters(map)
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      load(user.id)
    })
  }, [load])

  async function togglePrayer(prayerId: string) {
    if (!userId || toggling) return
    setToggling(prayerId)
    const existing = (supporters[prayerId] ?? []).find(s => s.user_id === userId)
    if (existing) {
      await supabase.from('prayer_supporters').delete().eq('prayer_request_id', prayerId).eq('user_id', userId)
      setSupporters(prev => ({ ...prev, [prayerId]: (prev[prayerId] ?? []).filter(s => s.user_id !== userId) }))
    } else {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
      await supabase.from('prayer_supporters').insert({ prayer_request_id: prayerId, user_id: userId })
      setSupporters(prev => ({
        ...prev,
        [prayerId]: [...(prev[prayerId] ?? []), { prayer_request_id: prayerId, user_id: userId, full_name: profile?.full_name ?? null }],
      }))
    }
    setToggling(null)
  }

  async function submitRequest() {
    if (!newRequest.trim() || !userId || submitting) return
    setSubmitting(true)
    const { data } = await supabase.from('prayer_requests').insert({
      user_id: userId,
      request: newRequest.trim(),
      is_anonymous: anonymous,
      is_public: true,
      is_answered: false,
      prayer_count: 0,
    }).select().single()
    if (data) setPrayers(prev => [data as Prayer, ...prev])
    setNewRequest('')
    setAnonymous(false)
    setShowModal(false)
    setSubmitting(false)
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '.8rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '.4rem' }}>Church</p>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.1rem)', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>
          Prayer Wall
        </h1>
        <p style={{ marginTop: '.5rem', color: 'var(--text-lo)', fontSize: '.9rem' }}>Stand in faith together. Post a request. Pray for others.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '.5rem',
            background: 'var(--eden)', color: 'var(--bg-0)',
            border: 'none', borderRadius: 9, padding: '.65rem 1.2rem',
            fontSize: '.88rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-poppins), Poppins, sans-serif',
            minHeight: 44, transition: 'opacity .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Share a Request
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', height: 100, animation: 'shimmer 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : prayers.length === 0 ? (
        <div style={{ background: 'var(--bg-2)', border: '1px dashed var(--border)', borderRadius: 14, padding: '3rem', textAlign: 'center', color: 'var(--text-lo)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto .85rem', display: 'block', opacity: .4 }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <p style={{ fontSize: '.9rem', margin: 0 }}>No prayer requests yet. Be the first to share one.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {prayers.map(prayer => {
            const pSupporters = supporters[prayer.id] ?? []
            const iAmPraying = pSupporters.some(s => s.user_id === userId)
            return (
              <div key={prayer.id} style={{
                background: 'var(--bg-2)', border: `1px solid ${iAmPraying ? 'rgba(94,201,87,.3)' : 'var(--border)'}`,
                borderRadius: 12, padding: '1.25rem',
                transition: 'border-color .2s',
              }}>
                {prayer.is_answered && (
                  <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Answered
                  </div>
                )}
                <p style={{ fontSize: '.88rem', color: 'var(--text-md)', lineHeight: 1.75, marginBottom: '.85rem' }}>
                  {prayer.is_anonymous && <em style={{ color: 'var(--text-lo)', fontSize: '.82rem' }}>Anonymous: </em>}
                  {prayer.request}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                    <span style={{ fontSize: '.72rem', color: 'var(--text-lo)' }}>{formatRelativeDate(prayer.created_at)}</span>
                    {pSupporters.length > 0 && (
                      <span style={{ fontSize: '.72rem', color: iAmPraying ? 'var(--eden)' : 'var(--text-lo)' }}>
                        {prayerLabel(pSupporters, userId ?? '')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => togglePrayer(prayer.id)}
                    disabled={toggling === prayer.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '.4rem',
                      fontSize: '.8rem', fontWeight: 600,
                      color: iAmPraying ? 'var(--eden)' : 'var(--text-lo)',
                      background: iAmPraying ? 'rgba(94,201,87,.12)' : 'rgba(255,255,255,.05)',
                      border: `1px solid ${iAmPraying ? 'rgba(94,201,87,.3)' : 'var(--border)'}`,
                      padding: '.5rem .9rem', borderRadius: 20, cursor: 'pointer',
                      fontFamily: 'var(--font-poppins), Poppins, sans-serif',
                      minHeight: 40, transition: 'all .2s',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={iAmPraying ? 'var(--eden)' : 'none'} stroke={iAmPraying ? 'var(--eden)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {iAmPraying ? 'Praying' : 'Pray'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Submit modal */}
      {showModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-hi)', borderRadius: 18, width: '100%', maxWidth: 480, padding: '1.75rem' }}>
            <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-hi)', margin: '0 0 1.25rem' }}>Share a Prayer Request</h2>
            <textarea
              value={newRequest}
              onChange={e => setNewRequest(e.target.value)}
              placeholder="What would you like the church to pray about?"
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10,
                padding: '.75rem 1rem', color: 'var(--text-hi)', fontSize: '.9rem',
                fontFamily: 'var(--font-poppins), Poppins, sans-serif',
                outline: 'none', resize: 'vertical', lineHeight: 1.65,
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(94,201,87,.4)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginTop: '.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} style={{ width: 15, height: 15 }} />
              <span style={{ fontSize: '.85rem', color: 'var(--text-md)' }}>Post anonymously</span>
            </label>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'var(--bg-3)', color: 'var(--text-md)', border: '1px solid var(--border)', borderRadius: 8, padding: '.65rem 1.2rem', fontSize: '.88rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}
              >Cancel</button>
              <button
                onClick={submitRequest}
                disabled={!newRequest.trim() || submitting}
                style={{
                  background: newRequest.trim() ? 'var(--eden)' : 'var(--bg-3)',
                  color: newRequest.trim() ? 'var(--bg-0)' : 'var(--text-lo)',
                  border: 'none', borderRadius: 8, padding: '.65rem 1.2rem',
                  fontSize: '.88rem', fontWeight: 600, cursor: newRequest.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-poppins), Poppins, sans-serif', transition: 'background .2s, color .2s',
                }}
              >{submitting ? 'Sharing…' : 'Share Request'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes shimmer{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
    </div>
  )
}
