'use client'

import { useEffect } from 'react'

// Shared branded UI pieces — the dark card, eden-green accents, and Montserrat
// headings used across the devotion page, the new-user tour, and popups like
// Continue Course. Keeping them here means every "branded moment" in the app
// stays visually consistent instead of re-deriving the same styles per page.

export function BrandEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '1rem' }}>
      {children}
    </p>
  )
}

export function BrandIconBadge({ children, size = 64 }: { children: React.ReactNode; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size >= 56 ? 16 : 12,
      background: 'rgba(94,201,87,.1)', border: '1px solid rgba(94,201,87,.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 1.5rem', flexShrink: 0,
    }}>
      {children}
    </div>
  )
}

const arrowIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)

const buttonStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
  width: '100%', border: 'none', cursor: 'pointer', padding: '1rem', borderRadius: 10,
  background: 'var(--eden)', color: 'var(--bg-0)', fontWeight: 700, fontSize: '.95rem',
  boxShadow: '0 8px 26px rgba(94,201,87,.28)', textDecoration: 'none',
  fontFamily: 'var(--font-poppins), Poppins, sans-serif', transition: 'opacity .2s',
}

export function BrandButton({ href, onClick, children }: { href?: string; onClick?: () => void; children: React.ReactNode }) {
  if (href) {
    return <a href={href} style={buttonStyle}>{children}{arrowIcon}</a>
  }
  return <button onClick={onClick} style={buttonStyle}>{children}{arrowIcon}</button>
}

export function BrandProgressBar({ pct }: { pct: number }) {
  return (
    <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--eden)', borderRadius: 4, transition: 'width .3s' }} />
    </div>
  )
}

export function BrandModal({ onClose, children, maxWidth = 460 }: { onClose: () => void; children: React.ReactNode; maxWidth?: number }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth, background: 'var(--bg-1)', border: '1px solid var(--border-hi)',
          borderRadius: 20, padding: '2.25rem', textAlign: 'center', position: 'relative',
          boxShadow: '0 24px 60px rgba(0,0,0,.5)',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 8,
            border: 'none', background: 'transparent', color: 'var(--text-lo)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}
