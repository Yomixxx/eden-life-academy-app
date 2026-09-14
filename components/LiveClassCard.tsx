'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ClassLink {
  level: string
  meet_url: string | null
  schedule_label: string | null
  is_live: boolean
}

export default function LiveClassCard({ level, initial }: { level: string; initial: ClassLink | null }) {
  const [link, setLink] = useState<ClassLink | null>(initial)
  const [markedToday, setMarkedToday] = useState(false)
  const [checkedAttendance, setCheckedAttendance] = useState(false)
  const [marking, setMarking] = useState(false)
  // True once a read of class_links has failed repeatedly without ever
  // succeeding — the card then shows a small notice instead of rendering
  // nothing, so a broken table/policy is visible instead of silent.
  const [loadFailed, setLoadFailed] = useState(false)
  const everLoadedRef = useRef(initial != null)
  const failuresRef = useRef(0)
  const supabase = createClient()

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from('class_links').select('*').eq('level', level).maybeSingle()
    if (error) {
      // Keep the last known state on transient errors — never blank the
      // card. But if we have never loaded at all, surface it after a
      // couple of consecutive failures so it's not silently invisible.
      if (!everLoadedRef.current) {
        failuresRef.current += 1
        if (failuresRef.current >= 2) {
          console.error('[LiveClassCard] class_links read failed for level', level, error)
          setLoadFailed(true)
        }
      }
      return
    }
    failuresRef.current = 0
    if (data) {
      everLoadedRef.current = true
      setLoadFailed(false)
      setLink(data as ClassLink)
    }
  }, [level])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 20000)
    return () => clearInterval(id)
  }, [refresh])

  useEffect(() => {
    let cancelled = false
    async function checkAttendance() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const today = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('class_attendance')
        .select('id')
        .eq('user_id', user.id)
        .eq('level', level)
        .eq('class_date', today)
        .maybeSingle()
      if (!cancelled) { setMarkedToday(!!data); setCheckedAttendance(true) }
    }
    checkAttendance()
    return () => { cancelled = true }
  }, [level])

  async function markAttendance() {
    setMarking(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase.from('class_attendance').insert({ user_id: user.id, level })
      if (!error) setMarkedToday(true)
    }
    setMarking(false)
  }

  if (!link && !loadFailed) return null

  if (!link) {
    return (
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '1rem 1.5rem', marginBottom: '1.75rem',
      }}>
        <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--text-lo)' }}>
          We can&rsquo;t load live class information right now — please refresh the page in a minute.
        </p>
      </div>
    )
  }

  const live = link.is_live

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '.85rem',
      background: live ? 'rgba(239,68,68,.08)' : 'var(--bg-2)',
      border: `1px solid ${live ? 'rgba(239,68,68,.35)' : 'var(--border)'}`,
      borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          {live && (
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 0 4px rgba(239,68,68,.2)', flexShrink: 0 }} />
          )}
          <div>
            <div style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--text-hi)', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
              {live ? 'Class is live now' : `${level} Level class`}
            </div>
            {link.schedule_label && (
              <div style={{ fontSize: '.8rem', color: 'var(--text-lo)', marginTop: 2 }}>{link.schedule_label}</div>
            )}
          </div>
        </div>
        {link.meet_url ? (
          <a
            href={link.meet_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '.5rem',
              padding: '.65rem 1.25rem', borderRadius: 10, textDecoration: 'none',
              fontSize: '.85rem', fontWeight: 700,
              background: live ? '#ef4444' : 'var(--bg-3)',
              color: live ? '#fff' : 'var(--text-md)',
              minHeight: 42,
            }}
          >
            Join Class
          </a>
        ) : (
          // No link saved by the host yet. While live this is the "I can't
          // find the join button" case, so explain it instead of rendering
          // nothing; before class it's simply a disabled placeholder.
          <span
            aria-disabled="true"
            title={live ? 'Your host has not posted the meeting link yet.' : 'The link is posted when your class starts.'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '.5rem',
              padding: '.65rem 1.25rem', borderRadius: 10,
              fontSize: '.85rem', fontWeight: 700, minHeight: 42,
              background: live ? 'rgba(251,191,36,.12)' : 'var(--bg-3)',
              border: live ? '1px solid rgba(251,191,36,.35)' : '1px solid var(--border)',
              color: live ? '#fbbf24' : 'var(--text-lo)',
              cursor: 'default',
            }}
          >
            {live ? 'Link coming…' : 'Join Class'}
          </span>
        )}
      </div>

      {live && !link.meet_url && (
        <p style={{ margin: 0, fontSize: '.78rem', color: '#fbbf24' }}>
          Your host is posting the meeting link — it appears here automatically within about 20 seconds.
        </p>
      )}

      {live && checkedAttendance && (
        <button
          onClick={markAttendance}
          disabled={markedToday || marking}
          style={{
            alignSelf: 'flex-start',
            display: 'flex', alignItems: 'center', gap: '.5rem',
            padding: '.5rem 1rem', borderRadius: 8, border: '1px solid var(--border)',
            background: markedToday ? 'rgba(94,201,87,.12)' : 'var(--bg-3)',
            color: markedToday ? 'var(--eden)' : 'var(--text-md)',
            fontSize: '.8rem', fontWeight: 600, cursor: markedToday ? 'default' : 'pointer',
            opacity: marking ? 0.6 : 1,
          }}
        >
          {markedToday ? "✓ Attendance marked" : marking ? 'Marking…' : "I'm here — mark my attendance"}
        </button>
      )}
    </div>
  )
}
