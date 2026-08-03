'use client'

import { useState } from 'react'

const PINK = '#e1306c'

export default function InstagramPage() {
  const [description, setDescription] = useState('')
  const [caption, setCaption] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function generateAndPost() {
    setGenerating(true)
    setError('')
    setCaption('')
    setCopied(false)
    try {
      const res = await fetch('/api/admin/instagram/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      setCaption(json.caption)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setGenerating(false)
    }
  }

  async function copyAndOpen() {
    await navigator.clipboard.writeText(caption)
    setCopied(true)
    window.open('https://www.instagram.com/', '_blank')
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: PINK, marginBottom: '.4rem' }}>
          Super Admin
        </div>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-hi)', margin: 0 }}>
          Instagram
        </h1>
        <p style={{ color: 'var(--text-lo)', fontSize: '.9rem', margin: '.4rem 0 0' }}>
          Claude writes the caption. You post it in Instagram — already open in Chrome.
        </p>
      </div>

      {/* Post card */}
      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Step 1 */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: '.75rem' }}>
            Step 1 — Describe the photo (optional)
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Sunday service at Ogudu, congregation worshipping, hands raised…"
            rows={3}
            style={{
              width: '100%',
              padding: '.75rem 1rem',
              background: 'var(--bg-0)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: 'var(--text-hi)',
              fontSize: '.88rem',
              lineHeight: 1.6,
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Step 2 — Generate */}
        <div style={{ padding: '1.5rem', borderBottom: caption ? '1px solid var(--border)' : 'none' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: '.75rem' }}>
            Step 2 — Generate caption
          </div>
          <button
            onClick={generateAndPost}
            disabled={generating}
            style={{
              width: '100%',
              padding: '1rem',
              background: generating ? 'var(--bg-2)' : `linear-gradient(135deg,#833ab4,${PINK},#fcb045)`,
              color: generating ? 'var(--text-lo)' : '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: generating ? 'default' : 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '.6rem',
              transition: 'opacity .15s',
            }}
          >
            {generating ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Claude is writing…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                Generate Caption with Claude
              </>
            )}
          </button>
          {error && (
            <div style={{ marginTop: '.75rem', color: '#ef4444', fontSize: '.82rem', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '.6rem .9rem' }}>
              {error}
            </div>
          )}
        </div>

        {/* Step 3 — Caption + Post */}
        {caption && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: '.75rem' }}>
              Step 3 — Copy caption and post
            </div>

            {/* Caption preview */}
            <div style={{ background: 'var(--bg-0)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1rem', position: 'relative' }}>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={5}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-hi)',
                  fontSize: '.88rem',
                  lineHeight: 1.65,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: '.72rem', color: 'var(--text-lo)', marginTop: '.25rem' }}>
                Edit if needed before posting.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              {/* Copy + Open Instagram */}
              <button
                onClick={copyAndOpen}
                style={{
                  flex: 1,
                  padding: '.85rem 1.25rem',
                  background: copied ? '#22c55e' : PINK,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '.5rem',
                  transition: 'background .2s',
                  minWidth: 200,
                }}
              >
                {copied ? (
                  <>✓ Copied — Instagram is open</>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                    Copy Caption & Open Instagram
                  </>
                )}
              </button>

              {/* Regenerate */}
              <button
                onClick={generateAndPost}
                disabled={generating}
                style={{
                  padding: '.85rem 1.1rem',
                  background: 'var(--bg-0)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  color: 'var(--text-md)',
                  fontSize: '.82rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                Try Again
              </button>
            </div>

            {copied && (
              <div style={{ marginTop: '.75rem', fontSize: '.82rem', color: 'var(--text-lo)', lineHeight: 1.5 }}>
                Caption is in your clipboard. In Instagram: tap <strong style={{ color: 'var(--text-md)' }}>+</strong> to create a new post, upload your photo from Drive, then paste the caption.
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
