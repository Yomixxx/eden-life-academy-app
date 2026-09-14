'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LiveClassInfo {
  level: string
  meet_url: string | null
  schedule_label: string | null
  is_live: boolean
}

// Shown on the student dashboard only while the student's level is live.
// Polls class_links so it appears within ~20 seconds of the admin going
// live, even if the dashboard was rendered before that.
export default function LiveClassBanner({ level, courseHref, initial }: {
  level: string
  courseHref: string
  initial: LiveClassInfo | null
}) {
  const [info, setInfo] = useState<LiveClassInfo | null>(initial)
  const supabase = createClient()

  useEffect(() => {
    let stopped = false
    async function poll() {
      const { data } = await supabase.from('class_links').select('*').eq('level', level).maybeSingle()
      if (!stopped && data) setInfo(data as LiveClassInfo)
    }
    poll()
    const id = setInterval(poll, 20000)
    return () => { stopped = true; clearInterval(id) }
  }, [level])

  if (!info?.is_live) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '1rem', flexWrap: 'wrap',
      background: 'linear-gradient(135deg,rgba(239,68,68,.14),rgba(239,68,68,.05))',
      border: '1px solid rgba(239,68,68,.35)',
      borderRadius: 14, padding: '1rem 1.5rem',
      marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%', background: '#ef4444',
          display: 'inline-block', flexShrink: 0, animation: 'livepulse 1.4s ease-in-out infinite',
        }} />
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '.95rem', color: '#ff6666' }}>
            {info.level} Level class is live now
          </p>
          {info.schedule_label && (
            <p style={{ margin: 0, fontSize: '.78rem', color: 'var(--text-lo)' }}>{info.schedule_label}</p>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '.6rem', flexShrink: 0, flexWrap: 'wrap' }}>
        {info.meet_url && (
          <a
            href={info.meet_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#ef4444', color: '#fff', fontSize: '.8rem', fontWeight: 700,
              padding: '.55rem 1.1rem', borderRadius: 8, textDecoration: 'none',
            }}
          >
            Join Class
          </a>
        )}
        <a
          href={courseHref}
          style={{
            background: 'rgba(239,68,68,.15)', color: '#ff6666', fontSize: '.8rem', fontWeight: 600,
            padding: '.55rem 1.1rem', borderRadius: 8, textDecoration: 'none',
          }}
        >
          Open course
        </a>
      </div>
      <style>{`@keyframes livepulse{0%,100%{opacity:1}50%{opacity:.2}}`}</style>
    </div>
  )
}
