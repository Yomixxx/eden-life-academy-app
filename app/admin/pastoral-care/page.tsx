'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const ACCENT = '#f97316'

interface Alert {
  id: string
  user_id: string | null
  source: string
  category: string
  message: string
  reviewed: boolean
  reviewed_at: string | null
  created_at: string
  profiles: { full_name: string | null; phone: string | null } | null
}

const CATEGORY_LABEL: Record<string, string> = {
  self_harm: 'Self-harm / suicidal ideation',
  abuse: 'Abuse disclosure',
  severe_distress: 'Severe distress',
}

export default function AdminPastoralCare() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showResolved, setShowResolved] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('pastoral_alerts')
      .select('*, profiles(full_name, phone)')
      .order('created_at', { ascending: false })
    setAlerts((data as unknown as Alert[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null))
    load()
  }, [load])

  async function markReviewed(id: string, reviewed: boolean) {
    setUpdatingId(id)
    const update = { reviewed, reviewed_by: reviewed ? userId : null, reviewed_at: reviewed ? new Date().toISOString() : null }
    await supabase.from('pastoral_alerts').update(update).eq('id', id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, ...update } : a))
    setUpdatingId(null)
  }

  const visible = alerts.filter(a => showResolved || !a.reviewed)
  const openCount = alerts.filter(a => !a.reviewed).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: ACCENT, marginBottom: '.35rem' }}>Admin</div>
          <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-hi)', margin: 0 }}>Pastoral Care</h1>
          <p style={{ margin: '.4rem 0 0', color: 'var(--text-lo)', fontSize: '.85rem' }}>
            Messages Ask PG flagged as crisis-level. {openCount} awaiting follow-up.
          </p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.55rem', cursor: 'pointer', fontSize: '.85rem', color: 'var(--text-md)' }}>
          <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} style={{ width: 15, height: 15 }} />
          Show resolved
        </label>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-lo)', fontSize: '.9rem', padding: '2rem 0' }}>Loading…</div>
      ) : visible.length === 0 ? (
        <div style={{ background: 'var(--bg-1)', border: '1px dashed var(--border)', borderRadius: 14, padding: '3rem', textAlign: 'center', color: 'var(--text-lo)' }}>
          {showResolved ? 'No alerts yet.' : 'Nothing awaiting follow-up. Every flagged message has been handled.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          {visible.map(alert => (
            <div key={alert.id} style={{
              background: 'var(--bg-1)', border: `1px solid ${alert.reviewed ? 'var(--border)' : 'rgba(239,68,68,.35)'}`,
              borderRadius: 14, padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap', marginBottom: '.6rem' }}>
                <span style={{
                  fontSize: '.68rem', fontWeight: 700, padding: '.2rem .6rem', borderRadius: 99,
                  background: alert.reviewed ? 'var(--bg-3)' : 'rgba(239,68,68,.15)',
                  color: alert.reviewed ? 'var(--text-lo)' : '#f87171',
                }}>
                  {CATEGORY_LABEL[alert.category] ?? alert.category}
                </span>
                <span style={{ fontSize: '.78rem', color: 'var(--text-hi)', fontWeight: 600 }}>
                  {alert.profiles?.full_name ?? 'Unknown member'}
                </span>
                {alert.profiles?.phone && (
                  <a href={`tel:${alert.profiles.phone}`} style={{ fontSize: '.78rem', color: ACCENT, textDecoration: 'none' }}>{alert.profiles.phone}</a>
                )}
                <span style={{ fontSize: '.72rem', color: 'var(--text-lo)', marginLeft: 'auto' }}>
                  {new Date(alert.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p style={{ margin: '0 0 .9rem', fontSize: '.88rem', color: 'var(--text-md)', lineHeight: 1.7, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                &ldquo;{alert.message}&rdquo;
              </p>
              <button
                onClick={() => markReviewed(alert.id, !alert.reviewed)}
                disabled={updatingId === alert.id}
                style={{
                  background: alert.reviewed ? 'var(--bg-3)' : ACCENT,
                  color: alert.reviewed ? 'var(--text-md)' : '#fff',
                  border: 'none', borderRadius: 8, padding: '.55rem 1.1rem',
                  fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-poppins), Poppins, sans-serif',
                  opacity: updatingId === alert.id ? 0.6 : 1,
                }}
              >
                {alert.reviewed ? 'Mark as not resolved' : 'Mark as followed up'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
