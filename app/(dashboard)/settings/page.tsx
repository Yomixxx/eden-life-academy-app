'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { passwordStrengthError } from '@/lib/password-strength'
import TwoFactorSettings from '@/components/TwoFactorSettings'
import type { Profile } from '@/lib/types'

export default function SettingsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [campus, setCampus] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setFullName(data.full_name ?? '')
        setPhone(data.phone ?? '')
        setCampus(data.campus ?? '')
        setBio(data.bio ?? '')
      }
    }
    load()
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      phone,
      campus,
      bio,
    })
    setSaving(false)
    setSaveMsg(error ? `Error: ${error.message}` : 'Profile saved successfully.')
    setTimeout(() => setSaveMsg(''), 4000)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) { setPwMsg('Passwords do not match.'); return }
    const strengthError = passwordStrengthError(newPw)
    if (strengthError) { setPwMsg(strengthError); return }
    setPwSaving(true)
    setPwMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwSaving(false)
    if (error) {
      setPwMsg(`Error: ${error.message}`)
    } else {
      setPwMsg('Password updated successfully.')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    }
    setTimeout(() => setPwMsg(''), 5000)
  }

  const sectionStyle = {
    background: 'var(--bg-2)' as const,
    border: '1px solid var(--border)' as const,
    borderRadius: 14,
    padding: '1.75rem',
    marginBottom: '1.5rem',
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: '.72rem',
    fontWeight: 600,
    letterSpacing: '.08em',
    textTransform: 'uppercase' as const,
    color: 'var(--text-lo)',
    marginBottom: '.5rem',
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-3)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '.85rem 1rem',
    color: 'var(--text-hi)',
    fontSize: '.92rem',
    fontFamily: 'var(--font-poppins), Poppins, sans-serif',
  }

  const fieldStyle = { marginBottom: '1.15rem' }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '.8rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '.4rem' }}>Account</p>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.1rem)', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>
          Settings
        </h1>
        <p style={{ marginTop: '.5rem', color: 'var(--text-lo)', fontSize: '.9rem' }}>Manage your profile and account preferences.</p>
      </div>

      {/* Profile */}
      <div style={sectionStyle}>
        <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-hi)', marginBottom: '1.5rem' }}>Profile Information</h2>
        <form onSubmit={handleSaveProfile}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="settings-grid">
            <div style={fieldStyle}>
              <label style={labelStyle}>Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--eden)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={email} readOnly style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="settings-grid">
            <div style={fieldStyle}>
              <label style={labelStyle}>Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 801 234 5678" style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--eden)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Campus</label>
              <select value={campus} onChange={e => setCampus(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--eden)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <option value="">Select campus</option>
                <option value="Mainland - Ogudu">Mainland - Ogudu</option>
                <option value="Island - Ajah">Island - Ajah</option>
              </select>
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us a little about yourself..." rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--eden)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
          </div>

          {saveMsg && (
            <div style={{
              padding: '.75rem 1rem', borderRadius: 8, marginBottom: '1rem',
              background: saveMsg.startsWith('Error') ? 'rgba(239,68,68,.1)' : 'rgba(94,201,87,.1)',
              color: saveMsg.startsWith('Error') ? '#fca5a5' : 'var(--eden)',
              border: `1px solid ${saveMsg.startsWith('Error') ? 'rgba(239,68,68,.2)' : 'rgba(94,201,87,.2)'}`,
              fontSize: '.85rem',
            }}>{saveMsg}</div>
          )}

          <button type="submit" disabled={saving} style={{
            display: 'inline-flex', alignItems: 'center', gap: '.5rem',
            background: saving ? 'var(--bg-3)' : 'var(--eden)',
            color: saving ? 'var(--text-lo)' : 'var(--bg-0)',
            border: 'none', padding: '.75rem 1.5rem', borderRadius: 10,
            fontWeight: 600, fontSize: '.9rem', cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-poppins), Poppins, sans-serif',
          }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div style={sectionStyle}>
        <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-hi)', marginBottom: '1.5rem' }}>Change Password</h2>
        <form onSubmit={handleChangePassword}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Current Password</label>
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--eden)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="settings-grid">
            <div style={fieldStyle}>
              <label style={labelStyle}>New Password</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 10 characters" style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--eden)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--eden)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
            </div>
          </div>

          {pwMsg && (
            <div style={{
              padding: '.75rem 1rem', borderRadius: 8, marginBottom: '1rem',
              background: pwMsg.startsWith('Error') || pwMsg.includes('not match') ? 'rgba(239,68,68,.1)' : 'rgba(94,201,87,.1)',
              color: pwMsg.startsWith('Error') || pwMsg.includes('not match') ? '#fca5a5' : 'var(--eden)',
              border: `1px solid ${pwMsg.startsWith('Error') || pwMsg.includes('not match') ? 'rgba(239,68,68,.2)' : 'rgba(94,201,87,.2)'}`,
              fontSize: '.85rem',
            }}>{pwMsg}</div>
          )}

          <button type="submit" disabled={pwSaving} style={{
            display: 'inline-flex', alignItems: 'center', gap: '.5rem',
            background: 'var(--bg-3)', border: '1px solid var(--border-hi)',
            color: 'var(--text-hi)', padding: '.75rem 1.5rem', borderRadius: 10,
            fontWeight: 600, fontSize: '.9rem', cursor: pwSaving ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-poppins), Poppins, sans-serif',
            opacity: pwSaving ? 0.6 : 1,
          }}>
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <TwoFactorSettings />

      {/* Notifications - static */}
      <div style={sectionStyle}>
        <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-hi)', marginBottom: '1.5rem' }}>Notification Preferences</h2>
        {[
          { label: 'New announcements', description: 'Get notified when new announcements are posted', checked: true },
          { label: 'Course updates', description: 'Notifications when new lessons are added to your courses', checked: true },
          { label: 'Community activity', description: 'Updates from your community groups', checked: false },
        ].map(pref => (
          <div key={pref.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.9rem 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <p style={{ fontWeight: 500, color: 'var(--text-hi)', fontSize: '.9rem' }}>{pref.label}</p>
              <p style={{ fontSize: '.78rem', color: 'var(--text-lo)', marginTop: '.2rem' }}>{pref.description}</p>
            </div>
            <div style={{
              width: 44, height: 24, borderRadius: 12,
              background: pref.checked ? 'var(--eden)' : 'var(--bg-3)',
              border: `1px solid ${pref.checked ? 'var(--eden)' : 'var(--border-hi)'}`,
              position: 'relative', cursor: 'pointer', flexShrink: 0,
              transition: 'background .2s',
            }}>
              <div style={{
                position: 'absolute', top: 2, left: pref.checked ? 22 : 2,
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div style={{ ...sectionStyle, borderColor: 'rgba(239,68,68,.2)' }}>
        <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#fca5a5', marginBottom: '.75rem' }}>Delete Account</h2>
        <p style={{ fontSize: '.88rem', color: 'var(--text-lo)', marginBottom: '1rem', lineHeight: 1.7 }}>
          To delete your account and all associated data, please contact your campus team directly. This action cannot be undone.
        </p>
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 10 }}>
          <p style={{ fontSize: '.85rem', color: 'var(--text-md)' }}>
            <strong style={{ color: 'var(--text-hi)' }}>Mainland - Ogudu:</strong> mainland@edenlifeng.org
          </p>
          <p style={{ fontSize: '.85rem', color: 'var(--text-md)', marginTop: '.4rem' }}>
            <strong style={{ color: 'var(--text-hi)' }}>Island - Ajah:</strong> island@edenlifeng.org
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) { .settings-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
