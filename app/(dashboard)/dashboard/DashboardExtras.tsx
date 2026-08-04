'use client'

import { useState, useEffect } from 'react'

const YOUTUBE_LIVE = 'https://www.youtube.com/@edenlifeglobal/live'

function useLagosTime() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const update = () => setNow(new Date())
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function LiveBanner() {
  const now = useLagosTime()
  if (!now) return null

  // Lagos is UTC+1
  const lagosOffset = 60
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000
  const lagos = new Date(utcMs + lagosOffset * 60000)
  const day = lagos.getDay() // 0=Sun
  const hour = lagos.getHours()
  const min = lagos.getMinutes()
  const totalMin = hour * 60 + min

  const isLive = day === 0 && totalMin >= 9 * 60 + 30 && totalMin < 13 * 60
  const isSundayToday = day === 0
  const minutesUntilService = isSundayToday && totalMin < 9 * 60 + 30
    ? (9 * 60 + 30) - totalMin
    : null

  if (isLive) {
    return (
      <a
        href={YOUTUBE_LIVE}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', flexWrap: 'wrap',
          background: 'linear-gradient(135deg,rgba(255,68,68,.18),rgba(255,68,68,.06))',
          border: '1px solid rgba(255,68,68,.35)',
          borderRadius: 14, padding: '1rem 1.5rem',
          marginBottom: '1.5rem', textDecoration: 'none', cursor: 'pointer',
          transition: 'border-color .15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,68,68,.6)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,68,68,.35)')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%', background: '#ff4444',
            display: 'inline-block', flexShrink: 0, animation: 'livepulse 1.4s ease-in-out infinite',
          }} />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '.95rem', color: '#ff6666' }}>Service is Live Now</p>
            <p style={{ margin: 0, fontSize: '.78rem', color: 'var(--text-lo)' }}>Eden Life Experience Centre — Sundays 10:00 AM Lagos</p>
          </div>
        </div>
        <span style={{
          background: '#ff4444', color: '#fff', fontSize: '.8rem', fontWeight: 600,
          padding: '.5rem 1.1rem', borderRadius: 8, flexShrink: 0,
        }}>
          Join Now
        </span>
      </a>
    )
  }

  if (minutesUntilService !== null) {
    const h = Math.floor(minutesUntilService / 60)
    const m = minutesUntilService % 60
    const label = h > 0 ? `${h}h ${m}m` : `${m} min`
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '1rem', flexWrap: 'wrap',
        background: 'linear-gradient(135deg,rgba(255,68,68,.1),rgba(255,68,68,.03))',
        border: '1px solid rgba(255,68,68,.2)',
        borderRadius: 14, padding: '1rem 1.5rem', marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '.95rem', color: 'var(--text-hi)' }}>Service starts in {label}</p>
            <p style={{ margin: 0, fontSize: '.78rem', color: 'var(--text-lo)' }}>Sunday 10:00 AM Lagos time</p>
          </div>
        </div>
        <a href={YOUTUBE_LIVE} target="_blank" rel="noopener noreferrer"
          style={{ background: 'rgba(255,68,68,.15)', color: '#ff6666', fontSize: '.8rem', fontWeight: 600, padding: '.5rem 1.1rem', borderRadius: 8, textDecoration: 'none' }}>
          YouTube
        </a>
      </div>
    )
  }

  return null
}

export function InviteCard() {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(`${window.location.origin}/signup`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(94,201,87,.1),rgba(94,201,87,.04))',
      border: '1px solid rgba(94,201,87,.2)',
      borderRadius: 14, padding: '1.25rem 1.5rem',
      marginTop: '1.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '1rem', flexWrap: 'wrap',
    }}>
      <div>
        <p style={{ margin: '0 0 .2rem', fontWeight: 700, fontSize: '.92rem', color: 'var(--text-hi)' }}>Invite Someone to Eden Life Academy</p>
        <p style={{ margin: 0, fontSize: '.78rem', color: 'var(--text-lo)' }}>Share the link — they sign up and join your church family online.</p>
      </div>
      <button
        onClick={copy}
        style={{
          display: 'flex', alignItems: 'center', gap: '.5rem',
          background: copied ? 'var(--eden)' : 'rgba(94,201,87,.15)',
          color: copied ? 'var(--bg-0)' : 'var(--eden)',
          border: '1px solid rgba(94,201,87,.3)',
          padding: '.6rem 1.1rem', borderRadius: 8,
          fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
          fontFamily: 'var(--font-poppins), Poppins, sans-serif',
          transition: 'background .2s, color .2s', minHeight: 40, flexShrink: 0,
        }}
      >
        {copied ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            Copy Invite Link
          </>
        )}
      </button>
      <style>{`@keyframes livepulse{0%,100%{opacity:1}50%{opacity:.2}}`}</style>
    </div>
  )
}
