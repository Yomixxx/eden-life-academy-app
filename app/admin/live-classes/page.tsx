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
  updated_at?: string | null
}

const EMPTY_ROW: Omit<ClassLink, 'level'> = { meet_url: null, schedule_label: null, is_live: false, updated_at: null }

interface RowStatus {
  kind: 'saving' | 'ok' | 'error'
  message?: string
}

function formatDbTime(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString()
}

export default function AdminLiveClasses() {
  const [links, setLinks] = useState<Record<string, ClassLink>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [status, setStatus] = useState<Record<string, RowStatus>>({})
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('class_links').select('*')
    if (error) {
      // Surface the real database error — an empty page here previously
      // looked like "no links saved" when actually the table/policies
      // were missing, and every save then failed silently.
      setLoadError(error.message)
    } else {
      setLoadError(null)
      const byLevel: Record<string, ClassLink> = {}
      for (const row of (data as ClassLink[] | null) ?? []) byLevel[row.level] = row
      setLinks(byLevel)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Re-read one row from the database after a write. The DB is the source
  // of truth — never trust the optimistically-flipped local state.
  async function syncFromDb(level: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('class_links')
      .select('*')
      .eq('level', level)
      .maybeSingle()
    if (!error && data) {
      setLinks(prev => ({ ...prev, [level]: { ...prev[level], ...(data as ClassLink) } }))
      return true
    }
    return false
  }

  function flash(level: string, s: RowStatus) {
    setStatus(prev => ({ ...prev, [level]: s }))
  }

  function updateField(level: string, field: 'meet_url' | 'schedule_label', value: string) {
    setLinks(prev => {
      const current = prev[level] ?? { level, ...EMPTY_ROW }
      return { ...prev, [level]: { ...current, [field]: value } }
    })
  }

  async function saveLevel(level: string) {
    const row = links[level] ?? { level, ...EMPTY_ROW }
    flash(level, { kind: 'saving' })
    const { error } = await supabase.from('class_links').update({
      meet_url: row.meet_url || null,
      schedule_label: row.schedule_label || null,
    }).eq('level', level)
    if (error) {
      flash(level, { kind: 'error', message: `Save failed — ${error.message}` })
      return
    }
    await syncFromDb(level)
    flash(level, { kind: 'ok', message: 'Saved to database' })
  }

  async function toggleLive(level: string) {
    const row = links[level] ?? { level, ...EMPTY_ROW }
    const nextLive = !row.is_live
    const previousLive = row.is_live
    setLinks(prev => ({ ...prev, [level]: { ...prev[level], is_live: nextLive } }))
    flash(level, { kind: 'saving' })
    const { error } = await supabase.from('class_links').update({ is_live: nextLive }).eq('level', level)
    if (error) {
      // Revert the optimistic flip so the button reflects the database,
      // and show exactly why the write was rejected.
      setLinks(prev => ({ ...prev, [level]: { ...prev[level], is_live: previousLive } }))
      flash(level, { kind: 'error', message: `Could not ${nextLive ? 'go live' : 'end live'} — ${error.message}` })
      return
    }
    await syncFromDb(level)
    flash(level, {
      kind: 'ok',
      message: nextLive
        ? 'Live in the database — students with the course page open will see it within ~20 seconds'
        : 'Live ended in the database',
    })
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

  const anyLive = ACADEMY_LEVELS.some(l => links[l]?.is_live)

  return (
    <div>
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: ACCENT, marginBottom: '.35rem' }}>Admin</div>
          <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-hi)', margin: 0 }}>Live Classes</h1>
          <p style={{ color: 'var(--text-lo)', fontSize: '.88rem', marginTop: '.35rem' }}>
            Set each level&apos;s Google Meet link, then flip &quot;Go Live&quot; when you start the meeting — students see the join button light up and can mark their attendance.
          </p>
          {anyLive && (
            <p style={{ color: '#ef4444', fontSize: '.85rem', fontWeight: 600, margin: '.5rem 0 0' }}>
              ● At least one level is live right now.
            </p>
          )}
        </div>
        <button onClick={load} disabled={loading} style={{ ...btnSecondary, opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Checking…' : 'Re-check from database'}
        </button>
      </div>

      {loadError && (
        <div style={{
          background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.35)',
          borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem',
        }}>
          <p style={{ fontSize: '.88rem', fontWeight: 700, color: '#ef4444', margin: '0 0 .35rem' }}>
            The live class data could not be loaded — nothing you save below will reach the database until this is fixed.
          </p>
          <p style={{ fontSize: '.82rem', color: 'var(--text-md)', margin: '0 0 .5rem', fontFamily: 'monospace', wordBreak: 'break-word' }}>
            {loadError}
          </p>
          <p style={{ fontSize: '.8rem', color: 'var(--text-lo)', margin: 0, lineHeight: 1.6 }}>
            If the error says the relation <code>class_links</code> does not exist, the database migration has not been applied: open the Supabase dashboard → SQL Editor and run <code>supabase/migrations/add_live_classes.sql</code>, then click &quot;Re-check from database&quot;. If it mentions row-level security, confirm this account&apos;s <code>role</code> is <code>admin</code> in the <code>profiles</code> table.
          </p>
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-lo)', fontSize: '.9rem', padding: '2rem 0' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {ACADEMY_LEVELS.map(level => {
            const row = links[level] ?? { level, ...EMPTY_ROW }
            const st = status[level]
            const savedAt = formatDbTime(row.updated_at)
            return (
              <div key={level} style={{ background: 'var(--bg-1)', border: `1px solid ${row.is_live ? 'rgba(239,68,68,.35)' : 'var(--border)'}`, borderRadius: 14, padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.75rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-hi)', margin: 0, display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                    {level} Level
                    {savedAt && (
                      <span style={{ fontSize: '.68rem', fontWeight: 500, color: 'var(--text-lo)', fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}>
                        last saved in DB {savedAt}
                      </span>
                    )}
                  </h2>
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <button onClick={() => saveLevel(level)} disabled={st?.kind === 'saving'} style={{ ...btnSecondary, opacity: st?.kind === 'saving' ? 0.6 : 1 }}>
                    {st?.kind === 'saving' ? 'Saving…' : 'Save'}
                  </button>
                  {st && (
                    <span style={{
                      fontSize: '.8rem', fontWeight: 600,
                      color: st.kind === 'error' ? '#ef4444' : st.kind === 'ok' ? '#5ec957' : 'var(--text-lo)',
                      wordBreak: 'break-word',
                    }}>
                      {st.message}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
