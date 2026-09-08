'use client'

import { useEffect, useState, useCallback } from 'react'
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
  const supabase = createClient()

  const refresh = useCallback(async () => {
    const { data } = await supabase.from('class_links').select('*').eq('level', level).maybeSingle()
    if (data) setLink(data as ClassLink)
  }, [level])

  useEffect(() => {
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

  if (!link) return null

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
        {link.meet_url && (
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
            }}
          >
            Join Class
          </a>
        )}
      </div>

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
