'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  escalation?: boolean
}

const SUGGESTED = [
  'What does the Bible say about anxiety?',
  'How do I grow in prayer?',
  'Explain Romans 8 in simple terms',
  'What is the significance of baptism?',
]

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text?: string) {
    const question = (text ?? input).trim()
    if (!question || streaming) return
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', content: question }]
    setMessages(newMessages)
    setStreaming(true)

    const assistantIdx = newMessages.length
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      })
      if (!res.ok || !res.body) throw new Error('Request failed')
      const escalation = res.headers.get('X-Ask-PG-Escalation') === '1'
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setMessages(prev => prev.map((m, i) => i === assistantIdx ? { ...m, content: full, escalation } : m))
      }
    } catch {
      setMessages(prev => prev.map((m, i) => i === assistantIdx ? { ...m, content: 'Sorry, I couldn\'t reach the AI. Please try again.' } : m))
    } finally {
      setStreaming(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const empty = messages.length === 0

  return (
    <div className="ask-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100svh - 4rem)', maxWidth: 760, margin: '0 auto' }}>
      <style>{`
        @media (max-width: 900px) {
          .ask-container { height: calc(100svh - 56px - 72px - env(safe-area-inset-bottom, 0px)) !important; }
        }
      `}</style>
      {/* Header */}
      <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <p style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--eden)', margin: '0 0 .3rem' }}>Ask PG</p>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.4rem,2.5vw,1.8rem)', color: 'var(--text-hi)', margin: 0, letterSpacing: '-.02em' }}>Ask PG</h1>
        <p style={{ margin: '.35rem 0 0', color: 'var(--text-lo)', fontSize: '.85rem' }}>Biblical answers, pastoral guidance from Senior Pastor Gbenga Ajibola.</p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 0' }}>
        {empty ? (
          <div style={{ paddingTop: '1rem' }}>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(94,201,87,.15)', border: '1px solid rgba(94,201,87,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: '0 0 .4rem', fontWeight: 600, fontSize: '.92rem', color: 'var(--text-hi)' }}>Ask PG</p>
                  <p style={{ margin: 0, color: 'var(--text-md)', fontSize: '.9rem', lineHeight: 1.7 }}>
                    Peace to you. Ask me anything about Scripture, Christian living, prayer, or your faith journey. I am here to help you grow.
                  </p>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '.78rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: '.75rem' }}>Try asking</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {SUGGESTED.map(q => (
                <button key={q} onClick={() => send(q)} style={{
                  padding: '.75rem 1rem', background: 'var(--bg-1)', border: '1px solid var(--border)',
                  borderRadius: 10, color: 'var(--text-md)', fontSize: '.88rem', cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'var(--font-poppins), Poppins, sans-serif',
                  transition: 'border-color .15s, color .15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(94,201,87,.4)'; e.currentTarget.style.color = 'var(--text-hi)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-md)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: m.role === 'user' ? 'rgba(94,201,87,.15)' : 'var(--bg-2)',
                  border: m.role === 'user' ? '1px solid rgba(94,201,87,.3)' : '1px solid var(--border)',
                }}>
                  {m.role === 'user' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  )}
                </div>
                <div style={{
                  maxWidth: '82%', padding: '.85rem 1.1rem', borderRadius: 14,
                  background: m.escalation ? 'rgba(239,68,68,.08)' : m.role === 'user' ? 'rgba(94,201,87,.1)' : 'var(--bg-1)',
                  border: m.escalation ? '1px solid rgba(239,68,68,.35)' : m.role === 'user' ? '1px solid rgba(94,201,87,.2)' : '1px solid var(--border)',
                }}>
                  {m.role === 'assistant' && (
                    <p style={{ margin: '0 0 .4rem', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: m.escalation ? '#f87171' : 'var(--text-lo)' }}>
                      Ask PG · AI Assistant, not Pastor Gbenga
                    </p>
                  )}
                  {m.content ? (
                    <p style={{ margin: 0, color: 'var(--text-hi)', fontSize: '.9rem', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{m.content}</p>
                  ) : (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--eden)', opacity: 0.5, animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                      ))}
                    </div>
                  )}
                  {m.escalation && m.content && (
                    <div style={{ marginTop: '.9rem', paddingTop: '.9rem', borderTop: '1px solid rgba(239,68,68,.25)', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                      <a href="tel:112" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', background: '#ef4444', color: '#fff', borderRadius: 8, padding: '.7rem 1rem', fontSize: '.85rem', fontWeight: 700, textDecoration: 'none' }}>
                        Call 112 — Emergency
                      </a>
                      <a href="tel:08000787746" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', background: 'rgba(239,68,68,.12)', color: '#f87171', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '.7rem 1rem', fontSize: '.85rem', fontWeight: 700, textDecoration: 'none' }}>
                        Call SURPIN Helpline (free) — 0800 078 7746
                      </a>
                      <p style={{ margin: '.2rem 0 0', fontSize: '.75rem', color: 'var(--text-lo)', textAlign: 'center' }}>
                        Our pastoral team has been notified and will follow up with you directly.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-end', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, padding: '.75rem 1rem', transition: 'border-color .15s' }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(94,201,87,.4)')}
          onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask a biblical question…"
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
              color: 'var(--text-hi)', fontSize: '.92rem', lineHeight: 1.6,
              fontFamily: 'var(--font-poppins), Poppins, sans-serif', maxHeight: 160, overflowY: 'auto',
            }}
            onInput={e => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 160) + 'px'
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || streaming}
            style={{
              width: 44, height: 44, borderRadius: 8, border: 'none', cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed',
              background: input.trim() && !streaming ? 'var(--eden)' : 'var(--bg-3)',
              color: input.trim() && !streaming ? 'var(--bg-0)' : 'var(--text-lo)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'background .15s, color .15s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p style={{ margin: '.5rem 0 0', fontSize: '.72rem', color: 'var(--text-lo)', textAlign: 'center' }}>
          AI responses are for study and reflection. Consult your pastor for personal guidance.
        </p>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
      `}</style>
    </div>
  )
}
