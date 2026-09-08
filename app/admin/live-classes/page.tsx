'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ACADEMY_LEVELS } from '@/lib/academy'

const ACCENT = '#f97316'

interface ClassLink {
  level: string
  meet_url: string | null
  schedule_label: string | null
  is_live: boolean
}

export default function AdminLiveClasses() {
  const [links, setLinks] = useState<Record<string, ClassLink>>({})
  const [loading, setLoading] = useState(true)
  const [savingLevel, setSavingLevel] = useState<string | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase.from('class_links').select('*')
    const byLevel: Record<string, ClassLink> = {}
    for (const row of (data as ClassLink[] | null) ?? []) byLevel[row.level] = row
    setLinks(byLevel)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function updateField(level: string, field: 'meet_url' | 'schedule_label', value: string) {
    setLinks(prev => ({ ...prev, [level]: { ...prev[level], level, meet_url: prev[level]?.meet_url ?? '', schedule_label: prev[level]?.schedule_label ?? '', is_live: prev[level]?.is_live ?? false, [field]: value } }))
  }

  async function saveLevel(level: string) {
    setSavingLevel(level)
    const row = links[level]
    await supabase.from('class_links').update({
      meet_url: row.meet_url || null,
      schedule_label: row.schedule_label || null,
    }).eq('level', level)
    setSavingLevel(null)
  }

  async function toggleLive(level: string) {
    const row = links[level]
    const nextLive = !row.is_live
    setLinks(prev => ({ ...prev, [level]: { ...prev[level], is_live: nextLive } }))
    await supabase.from('class_links').update({ is_live: nextLive }).eq('level', level)
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '.6rem .85rem', color: 'var(--text-hi)', fontSize: '.88rem',
    fontFamily: 'var(--font-poppins), Poppins, sans-serif', outline: 'none',
  }

  const btnSecondary = {
    background: 'var(--bg-3)', color: 'var(--text-md)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '.6rem 1.1rem',
    fontSize: '.85rem', fontWeight: 500, cursor: 'pointer',
    fontFamily: 'var(--font-poppins), Poppins, sans-serif',
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: ACCENT, marginBottom: '.35rem' }}>Admin</div>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-hi)', margin: 0 }}>Live Classes</h1>
        <p style={{ color: 'var(--text-lo)', fontSize: '.88rem', marginTop: '.35rem' }}>
          Set each level&apos;s Google Meet link, then flip &quot;Go Live&quot; when you start the meeting — students see the join button light up and can mark their attendance.
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-lo)', fontSize: '.9rem', padding: '2rem 0' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {ACADEMY_LEVELS.map(level => {
            const row = links[level] ?? { level, meet_url: '', schedule_label: '', is_live: false }
            return (
              <div key={level} style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.75rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-hi)', margin: 0 }}>{level} Level</h2>
                  <button
                    onClick={() => toggleLive(level)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '.5rem',
                      fontSize: '.8rem', fontWeight: 700, padding: '.5rem 1rem',
                      borderRadius: 99, border: 'none', cursor: 'pointer',
                      background: row.is_live ? 'rgba(239,68,68,.15)' : 'var(--bg-3)',
                      color: row.is_live ? '#ef4444' : 'var(--text-lo)',
                    }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: row.is_live ? '#ef4444' : 'var(--text-lo)',
                      boxShadow: row.is_live ? '0 0 0 3px rgba(239,68,68,.25)' : 'none',
                    }} />
                    {row.is_live ? 'Live now — End Live' : 'Go Live'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: '.4rem' }}>Google Meet link</label>
                    <input
                      style={inputStyle}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      value={row.meet_url ?? ''}
                      onChange={e => updateField(level, 'meet_url', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: '.4rem' }}>Schedule</label>
                    <input
                      style={inputStyle}
                      placeholder="Saturdays 8:30–9:30AM"
                      value={row.schedule_label ?? ''}
                      onChange={e => updateField(level, 'schedule_label', e.target.value)}
                    />
                  </div>
                </div>

                <button onClick={() => saveLevel(level)} disabled={savingLevel === level} style={{ ...btnSecondary, opacity: savingLevel === level ? 0.6 : 1 }}>
                  {savingLevel === level ? 'Saving…' : 'Save'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
