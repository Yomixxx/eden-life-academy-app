'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

const CAMPUSES = [
  { value: 'Mainland - Ogudu', label: 'Mainland', sub: 'Ogudu, Lagos' },
  { value: 'Island - Ajah', label: 'Island', sub: 'Ajah, Lagos' },
  { value: 'Online Church', label: 'Online Church', sub: 'Watch from anywhere' },
]

export default function SetupCampusPage() {
  const router = useRouter()
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { error: err } = await supabase
      .from('profiles')
      .update({ campus: selected })
      .eq('id', user.id)
    if (err) {
      setError('Could not save your campus. Please try again.')
      setLoading(false)
      return
    }

    // Auto-enrol in Growth Steps (first course, sort_order = 1)
    const { data: growthSteps } = await supabase
      .from('courses')
      .select('id')
      .ilike('title', '%growth steps%')
      .eq('is_published', true)
      .limit(1)
      .single()
    if (growthSteps) {
      await supabase.from('enrollments').upsert({ user_id: user.id, course_id: growthSteps.id }, { onConflict: 'user_id,course_id', ignoreDuplicates: true })
    }

    // Send welcome email via AI email agent (non-blocking)
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    const firstName = (profile?.full_name ?? user.user_metadata?.full_name ?? '').split(' ')[0] || 'Friend'
    fetch('/api/email-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'welcome', to: user.email, firstName, campus: selected }),
    }).catch(() => {})

    router.replace('/onboarding')
  }

  return (
    <div style={{
      minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-0)', padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.6rem', marginBottom: '2.5rem' }}>
          <Image src="/logo-white.png" alt="Eden Life Experience Centre" width={60} height={60} style={{ height: 60, width: 'auto' }} />
          <span style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '.64rem', letterSpacing: '.32em', textTransform: 'uppercase', color: 'var(--eden)' }}>Academy</span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-hi)', letterSpacing: '-.02em', textAlign: 'center' }}>
          Which campus do you attend?
        </h2>
        <p style={{ marginTop: '.5rem', marginBottom: '2rem', fontSize: '.9rem', color: 'var(--text-lo)', textAlign: 'center', lineHeight: 1.6 }}>
          This helps us personalise your experience with relevant sermons and announcements.
        </p>

        {error && (
          <div style={{ marginBottom: '1rem', padding: '.75rem 1rem', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, color: '#fca5a5', fontSize: '.85rem' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginBottom: '1.75rem' }}>
            {CAMPUSES.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelected(c.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem 1.25rem', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  background: selected === c.value ? 'rgba(94,201,87,.1)' : 'var(--bg-2)',
                  border: selected === c.value ? '2px solid var(--eden)' : '2px solid var(--border)',
                  transition: 'border-color .15s, background .15s',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: selected === c.value ? '6px solid var(--eden)' : '2px solid var(--border)',
                  background: selected === c.value ? 'var(--bg-0)' : 'transparent',
                  transition: 'border .15s',
                }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-hi)', fontSize: '.95rem', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>{c.label}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-lo)', marginTop: '.1rem' }}>{c.sub}</div>
                </div>
              </button>
            ))}
          </div>

          <button type="submit" disabled={!selected || loading} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
            width: '100%', border: 'none', borderRadius: 10,
            background: !selected || loading ? 'var(--bg-3)' : 'var(--eden)',
            color: !selected || loading ? 'var(--text-lo)' : 'var(--bg-0)',
            fontWeight: 600, fontSize: '.95rem', padding: '1rem',
            cursor: !selected || loading ? 'not-allowed' : 'pointer',
            transition: 'background .2s', boxShadow: selected ? '0 8px 26px rgba(94,201,87,.28)' : 'none',
          }}>
            {loading ? 'Saving…' : 'Continue to Dashboard'}
            {!loading && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
