'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const sectionStyle = {
  background: 'var(--bg-2)' as const,
  border: '1px solid var(--border)' as const,
  borderRadius: 14,
  padding: '1.75rem',
  marginBottom: '1.5rem',
}

const buttonStyle = {
  display: 'inline-flex', alignItems: 'center', gap: '.5rem',
  border: 'none', padding: '.75rem 1.5rem', borderRadius: 10,
  fontWeight: 600, fontSize: '.9rem', cursor: 'pointer',
  fontFamily: 'var(--font-poppins), Poppins, sans-serif',
}

export default function TwoFactorSettings() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null)

  const [enrolling, setEnrolling] = useState(false)
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [confirmingDisable, setConfirmingDisable] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function refreshFactors() {
    const { data } = await supabase.auth.mfa.listFactors()
    const factor = data?.totp?.find(f => f.status === 'verified')
    setVerifiedFactorId(factor?.id ?? null)
  }

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const factor = data?.totp?.find(f => f.status === 'verified')
      setVerifiedFactorId(factor?.id ?? null)
      setLoading(false)
    })
  }, [])

  async function handleStartEnroll() {
    setMsg('')
    setBusy(true)
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    setBusy(false)
    if (error || !data) {
      setMsg(`Error: ${error?.message ?? 'Could not start enrollment.'}`)
      return
    }
    setPendingFactorId(data.id)
    setQrCode(data.totp.qr_code)
    setSecret(data.totp.secret)
    setEnrolling(true)
  }

  async function handleCancelEnroll() {
    if (pendingFactorId) {
      await supabase.auth.mfa.unenroll({ factorId: pendingFactorId })
    }
    setEnrolling(false)
    setPendingFactorId(null)
    setQrCode('')
    setSecret('')
    setCode('')
    setMsg('')
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingFactorId) return
    setMsg('')
    setBusy(true)

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: pendingFactorId })
    if (challengeError || !challenge) {
      setBusy(false)
      setMsg('Error: Could not verify right now. Please try again.')
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: pendingFactorId,
      challengeId: challenge.id,
      code,
    })
    setBusy(false)

    if (verifyError) {
      setMsg('Error: Incorrect code. Please try again.')
      setCode('')
      return
    }

    setEnrolling(false)
    setPendingFactorId(null)
    setQrCode('')
    setSecret('')
    setCode('')
    setMsg('Two-factor authentication is now enabled.')
    await refreshFactors()
    setTimeout(() => setMsg(''), 5000)
  }

  async function handleDisable() {
    if (!verifiedFactorId) return
    setBusy(true)
    const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactorId })
    setBusy(false)
    setConfirmingDisable(false)
    if (error) {
      setMsg(`Error: ${error.message}`)
      return
    }
    setMsg('Two-factor authentication has been disabled.')
    await refreshFactors()
    setTimeout(() => setMsg(''), 5000)
  }

  if (loading) return null

  return (
    <div style={sectionStyle}>
      <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-hi)', marginBottom: '.5rem' }}>Two-Factor Authentication</h2>
      <p style={{ fontSize: '.85rem', color: 'var(--text-lo)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Add an extra layer of security. Once enabled, you&apos;ll need a code from an authenticator app (like Google Authenticator or Authy) every time you sign in.
      </p>

      {msg && (
        <div style={{
          padding: '.75rem 1rem', borderRadius: 8, marginBottom: '1.25rem',
          background: msg.startsWith('Error') ? 'rgba(239,68,68,.1)' : 'rgba(94,201,87,.1)',
          color: msg.startsWith('Error') ? '#fca5a5' : 'var(--eden)',
          border: `1px solid ${msg.startsWith('Error') ? 'rgba(239,68,68,.2)' : 'rgba(94,201,87,.2)'}`,
          fontSize: '.85rem',
        }}>{msg}</div>
      )}

      {!enrolling && !verifiedFactorId && (
        <button type="button" onClick={handleStartEnroll} disabled={busy} style={{
          ...buttonStyle,
          background: busy ? 'var(--bg-3)' : 'var(--eden)',
          color: busy ? 'var(--text-lo)' : 'var(--bg-0)',
        }}>
          {busy ? 'Starting…' : 'Enable Two-Factor Authentication'}
        </button>
      )}

      {!enrolling && verifiedFactorId && !confirmingDisable && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', color: 'var(--eden)', fontSize: '.85rem', fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            Enabled
          </span>
          <button type="button" onClick={() => setConfirmingDisable(true)} style={{
            ...buttonStyle, background: 'var(--bg-3)', border: '1px solid var(--border-hi)', color: 'var(--text-hi)',
          }}>Disable</button>
        </div>
      )}

      {confirmingDisable && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 10 }}>
          <p style={{ fontSize: '.88rem', color: 'var(--text-hi)', marginBottom: '1rem' }}>
            Turn off two-factor authentication? Your account will only be protected by your password.
          </p>
          <div style={{ display: 'flex', gap: '.75rem' }}>
            <button type="button" onClick={handleDisable} disabled={busy} style={{ ...buttonStyle, background: '#ef4444', color: '#fff' }}>
              {busy ? 'Disabling…' : 'Yes, disable'}
            </button>
            <button type="button" onClick={() => setConfirmingDisable(false)} style={{ ...buttonStyle, background: 'transparent', color: 'var(--text-lo)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {enrolling && (
        <div>
          <p style={{ fontSize: '.85rem', color: 'var(--text-hi)', fontWeight: 600, marginBottom: '.75rem' }}>
            1. Scan this QR code with your authenticator app
          </p>
          <div
            className="totp-qr-code"
            style={{ width: 180, height: 180, background: '#fff', borderRadius: 10, padding: 10, marginBottom: '1rem', overflow: 'hidden', boxSizing: 'border-box' }}
            dangerouslySetInnerHTML={{ __html: qrCode.replace(/^data:image\/svg\+xml;utf-?8,/, '') }}
          />
          <p style={{ fontSize: '.78rem', color: 'var(--text-lo)', marginBottom: '1.5rem' }}>
            Can&apos;t scan it? Enter this code manually: <code style={{ color: 'var(--text-hi)', background: 'var(--bg-3)', padding: '.15rem .4rem', borderRadius: 4 }}>{secret}</code>
          </p>

          <form onSubmit={handleVerify}>
            <p style={{ fontSize: '.85rem', color: 'var(--text-hi)', fontWeight: 600, marginBottom: '.75rem' }}>
              2. Enter the 6-digit code it shows
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              required
              maxLength={6}
              style={{
                width: 160, boxSizing: 'border-box',
                background: 'var(--bg-3)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '.85rem 1rem',
                color: 'var(--text-hi)', fontSize: '1.2rem', letterSpacing: '.4em', textAlign: 'center',
                marginBottom: '1.25rem', display: 'block',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--eden)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button type="submit" disabled={busy || code.length !== 6} style={{
                ...buttonStyle,
                background: busy || code.length !== 6 ? 'var(--bg-3)' : 'var(--eden)',
                color: busy || code.length !== 6 ? 'var(--text-lo)' : 'var(--bg-0)',
              }}>
                {busy ? 'Verifying…' : 'Verify & Enable'}
              </button>
              <button type="button" onClick={handleCancelEnroll} style={{ ...buttonStyle, background: 'transparent', color: 'var(--text-lo)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
