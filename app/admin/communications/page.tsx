'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const ACCENT = '#f97316'
const NAVY = '#0f2044'

interface Campaign {
  id: string
  subject: string
  message: string
  channels: string[]
  recipient_filter: string
  status: string
  sent_email: number
  sent_whatsapp: number
  total_recipients: number
  scheduled_at: string | null
  created_at: string
}

const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
}

const STATUS_COLOR: Record<string, string> = {
  sent: '#22c55e',
  sending: '#f97316',
  scheduled: '#60a5fa',
  failed: '#ef4444',
  pending: 'var(--text-lo)',
}

const TEMPLATES = [
  {
    id: 'we-care',
    label: 'We Care',
    emoji: '🙏',
    subject: 'You Are Covered — Eden Life Is Praying For You',
    body: `Dear Family,

We want you to know that you are not forgotten. Whatever this week has brought your way — pressure at work, challenges at home, questions in your heart — Eden Life is praying for you today.

Christ has already secured your victory. You are not fighting for victory; you are fighting from a place of victory that was won at Calvary. Every challenge you face this week is already under His feet.

God is your Provider. He who did not spare His own Son will freely give you all things. He knows what you need before you ask, and His supply never runs dry.

I declare over you today: every need in your life is met according to His riches in glory. Provision, peace, and breakthrough are yours in Jesus name.

We love you. Eden Life is your family.`,
  },
  {
    id: 'sunday-service',
    label: 'Sunday Service',
    emoji: '⛪',
    subject: 'See You This Sunday — 10:00 AM',
    body: `Dear Family,

This Sunday, we gather together at Eden Life Experience Centre. Come expecting — God always shows up for His people.

Sunday Service: 10:00 AM
Mainland Campus: Ogudu
Island Campus: Ajah

Bring a friend. Come hungry for what God has prepared. We cannot wait to worship with you.`,
  },
  {
    id: 'sermon-series',
    label: 'New Series',
    emoji: '📖',
    subject: 'New Teaching Series Starting This Sunday',
    body: `Dear Family,

This Sunday we begin a brand new teaching series that will change the way you see this season of your life.

[Series Name] is a journey through [scripture/theme]. Every message is designed to give you a fresh perspective and practical tools for your daily walk with God.

Invite someone who needs to hear this. Come ready to receive.`,
  },
  {
    id: 'new-member',
    label: 'New Member Welcome',
    emoji: '🤝',
    subject: 'Welcome to the Eden Life Family',
    body: `Dear Family,

Welcome home. We are so glad you are here.

Eden Life Experience Centre is not just a church — it is a family, a community, a place where you belong. From the moment you walked through our doors, you became one of us.

Here is what is available to you:
- Eden Life Academy: discipleship courses designed for your growth
- Weekly devotionals: a word from God to start your day
- Sunday services: Mainland and Island — 10:00 AM

You are not a visitor here. You are family.`,
  },
  {
    id: 'event',
    label: 'Event Invite',
    emoji: '🎉',
    subject: 'You Are Invited — [Event Name]',
    body: `Dear Family,

We have something special coming up and we want you to be there.

[Event Name]
Date: [Date]
Time: [Time]
Venue: [Location]

[Brief description of the event and why they should come.]

This event is free. Bring your family, bring your friends, bring whoever God puts on your heart. We will see you there.`,
  },
  {
    id: 'giving',
    label: 'Giving & Tithing',
    emoji: '💛',
    subject: 'Partner With What God Is Building at Eden Life',
    body: `Dear Family,

Eden Life Experience Centre is a move of God — and moves of God require the partnership of God's people.

Every seed you sow into this house is an investment in transformed lives, discipleship, outreach, and the advancement of God's kingdom in Lagos and beyond.

God is not a debtor. He will honor your sacrifice and multiply what you give back to you pressed down, shaken together, and running over.

To partner with Eden Life, you can give through [payment method] or speak with our team on Sunday. Thank you for your faithfulness.`,
  },
  {
    id: 'prayer',
    label: 'Corporate Prayer',
    emoji: '🕊️',
    subject: 'Let Us Pray Together This Week',
    body: `Dear Family,

This week, Eden Life is joining in corporate prayer. There is nothing more powerful than the people of God agreeing together in prayer.

[Specific prayer focus for this week]

Whether you are at home, at work, or on the go — take a moment to pause and pray. We are standing with you and you are standing with us.

Together we are stronger. Together we will see God move.`,
  },
  {
    id: 'testimony',
    label: 'Testimony & Thanksgiving',
    emoji: '🔥',
    subject: 'Look What God Has Done — A Report From Eden Life',
    body: `Dear Family,

We want to take a moment to give God glory for what He has been doing in and through this church.

[Testimony 1 — a life changed, a need met, a miracle received]

[Testimony 2 — growth, impact, outreach]

This is what happens when God's people come together. This is what your prayers, your presence, and your giving are building.

Thank you for being part of something bigger than any one of us. The best is still ahead.`,
  },
]

export default function CommunicationsPage() {
  const supabase = createClient()

  // Settings
  const [sheetUrl, setSheetUrl] = useState('')
  const [savedSheetUrl, setSavedSheetUrl] = useState('')
  const [savingSheet, setSavingSheet] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Compose
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [channels, setChannels] = useState<Record<string, boolean>>({ email: true, whatsapp: false })
  const [recipientFilter, setRecipientFilter] = useState('all')
  const [campuses, setCampuses] = useState<string[]>([])
  const [memberCount, setMemberCount] = useState<number | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('10:00')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Test email
  const [testEmail, setTestEmail] = useState('communication@edenlifeng.org')
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadSettings(); loadCampuses(); loadCampaigns() }, [])
  useEffect(() => { loadMemberCount() }, [recipientFilter])

  async function loadSettings() {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'sheet_csv_url').single()
    if (data?.value) { setSheetUrl(data.value); setSavedSheetUrl(data.value) }
  }

  async function saveSheetUrl() {
    setSavingSheet(true)
    await supabase.from('app_settings').upsert({ key: 'sheet_csv_url', value: sheetUrl, updated_at: new Date().toISOString() })
    setSavedSheetUrl(sheetUrl)
    setSavingSheet(false)
  }

  async function loadCampuses() {
    const { data } = await supabase.from('profiles').select('campus').not('campus', 'is', null)
    if (data) {
      const unique = [...new Set(data.map((p: { campus: string | null }) => p.campus).filter(Boolean))] as string[]
      setCampuses(unique.sort())
    }
  }

  async function loadMemberCount() {
    let query = supabase.from('profiles').select('id', { count: 'exact', head: true })
    if (recipientFilter !== 'all') query = query.eq('campus', recipientFilter)
    const { count } = await query
    setMemberCount(count ?? 0)
  }

  async function loadCampaigns() {
    setLoadingCampaigns(true)
    const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(20)
    setCampaigns(data ?? [])
    setLoadingCampaigns(false)
  }

  function applyTemplate(t: typeof TEMPLATES[0]) {
    setSubject(t.subject)
    setMessage(t.body)
  }

  async function handleImageFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const preview = URL.createObjectURL(file)
    setImagePreview(preview)
    setUploadingImage(true)
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const { data, error } = await supabase.storage.from('broadcast-images').upload(path, file, { upsert: false })
    if (error || !data) { setUploadingImage(false); return }
    const { data: { publicUrl } } = supabase.storage.from('broadcast-images').getPublicUrl(data.path)
    setImageUrl(publicUrl)
    setUploadingImage(false)
  }

  function removeImage() {
    setImageUrl(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const selectedChannels = Object.entries(channels).filter(([, v]) => v).map(([k]) => k)
  const canSend = subject.trim() && message.trim() && selectedChannels.length > 0

  async function handleSend() {
    if (!canSend || sending) return
    setSending(true)
    setResult(null)
    try {
      const scheduledAt = scheduleMode === 'later' && scheduleDate
        ? new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString()
        : null

      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          channels: selectedChannels,
          recipientFilter,
          imageUrl: imageUrl ?? null,
          scheduledAt,
          sheetCsvUrl: savedSheetUrl || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Broadcast failed')
      setResult({ success: true, message: json.message ?? 'Success.' })
      setSubject(''); setMessage(''); removeImage()
      setChannels({ email: true, whatsapp: false })
      setRecipientFilter('all'); setScheduleMode('now')
      loadCampaigns()
    } catch (err: unknown) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Something went wrong.' })
    } finally {
      setSending(false)
    }
  }

  async function sendTest() {
    setSendingTest(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: testEmail, type: 'keep-in-touch' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      setTestResult({ success: true, message: json.message })
    } catch (err: unknown) {
      setTestResult({ success: false, message: err instanceof Error ? err.message : 'Failed to send test.' })
    } finally {
      setSendingTest(false)
    }
  }

  // Tomorrow as min date for schedule
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().slice(0, 10)

  return (
    <div style={{ maxWidth: 880 }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: ACCENT, marginBottom: '.4rem' }}>
          Super Admin
        </div>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-hi)', margin: 0 }}>
          Communications
        </h1>
        <p style={{ color: 'var(--text-lo)', fontSize: '.9rem', marginTop: '.4rem', margin: '.4rem 0 0' }}>
          Broadcast to all Eden Life members via Email and WhatsApp. Sent as <strong style={{ color: 'var(--text-md)' }}>Edenlife Global</strong>.
        </p>
      </div>

      {/* Settings panel */}
      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, marginBottom: '1.25rem', overflow: 'hidden' }}>
        <button
          onClick={() => setSettingsOpen(v => !v)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-hi)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 1.41 14.14M4.93 4.93A10 10 0 0 0 3.52 19.07M12 2v2M12 20v2M2 12h2M20 12h2"/>
            </svg>
            <span style={{ fontSize: '.9rem', fontWeight: 600 }}>Settings — Google Sheet Recipients</span>
            {savedSheetUrl && <span style={{ fontSize: '.72rem', background: 'rgba(34,197,94,.15)', color: '#22c55e', padding: '.15rem .5rem', borderRadius: 6 }}>Connected</span>}
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: settingsOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {settingsOpen && (
          <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '.82rem', color: 'var(--text-lo)', marginTop: '1rem', marginBottom: '.75rem', lineHeight: 1.6 }}>
              Paste your Google Sheet CSV export URL below. In Google Sheets: <strong style={{ color: 'var(--text-md)' }}>File → Share → Publish to web → Select CSV format → Publish</strong>. This pulls all emails from your sheet automatically at every send.
            </p>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <input
                type="url"
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/…/export?format=csv"
                style={{
                  flex: 1, minWidth: 260, padding: '.7rem 1rem',
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  borderRadius: 9, color: 'var(--text-hi)', fontSize: '.85rem',
                  outline: 'none', fontFamily: 'var(--font-poppins), Poppins, sans-serif',
                }}
              />
              <button
                onClick={saveSheetUrl}
                disabled={savingSheet || !sheetUrl.trim()}
                style={{ padding: '.7rem 1.25rem', background: ACCENT, color: '#fff', border: 'none', borderRadius: 9, fontSize: '.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', opacity: savingSheet ? 0.7 : 1 }}
              >
                {savingSheet ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Test email panel */}
      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem 1.5rem', marginBottom: '1.25rem' }}>
        <p style={{ margin: '0 0 .75rem', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-lo)' }}>
          Send Test Keep-in-Touch Email
        </p>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <input
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="Email address"
              style={{ width: '100%', padding: '.65rem .9rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text-hi)', fontSize: '.88rem', outline: 'none', fontFamily: 'var(--font-poppins), Poppins, sans-serif', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={sendTest}
            disabled={sendingTest || !testEmail.trim()}
            style={{ padding: '.65rem 1.25rem', background: sendingTest ? 'var(--bg-3)' : 'var(--bg-2)', color: sendingTest ? 'var(--text-lo)' : 'var(--text-hi)', border: '1px solid var(--border)', borderRadius: 9, fontSize: '.85rem', fontWeight: 600, cursor: sendingTest ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-poppins), Poppins, sans-serif', transition: 'background .15s', flexShrink: 0 }}
          >
            {sendingTest ? 'Sending…' : 'Send Test'}
          </button>
        </div>
        {testResult && (
          <p style={{ margin: '.6rem 0 0', fontSize: '.8rem', color: testResult.success ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
            {testResult.message}
          </p>
        )}
      </div>

      {/* Template picker */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: '.6rem' }}>
          Email Templates — click to apply
        </p>
        <div style={{ display: 'flex', gap: '.5rem', overflowX: 'auto', paddingBottom: '.4rem' }} className="templates-scroll">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => applyTemplate(t)}
              style={{
                display: 'flex', alignItems: 'center', gap: '.4rem', flexShrink: 0,
                padding: '.5rem .9rem', background: 'var(--bg-1)', border: '1px solid var(--border)',
                borderRadius: 20, fontSize: '.8rem', fontWeight: 500, color: 'var(--text-md)',
                cursor: 'pointer', transition: 'border-color .15s, color .15s',
                fontFamily: 'var(--font-poppins), Poppins, sans-serif',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-md)' }}
            >
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compose */}
      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-hi)', margin: 0 }}>
            Compose Broadcast
          </h2>
          <span style={{ fontSize: '.75rem', color: 'var(--text-lo)', padding: '.25rem .75rem', background: 'var(--bg-2)', borderRadius: 20, border: '1px solid var(--border)' }}>
            From: <strong style={{ color: 'var(--text-md)' }}>Edenlife Global</strong>
          </span>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-lo)', marginBottom: '.4rem', letterSpacing: '.04em', textTransform: 'uppercase' }}>
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. You Are Covered — Eden Life Is Praying For You"
            style={{
              width: '100%', padding: '.75rem 1rem',
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text-hi)', fontSize: '.9rem',
              outline: 'none', fontFamily: 'var(--font-poppins), Poppins, sans-serif', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Banner image upload */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-lo)', marginBottom: '.4rem', letterSpacing: '.04em', textTransform: 'uppercase' }}>
            Banner Image (optional)
          </label>
          {imagePreview ? (
            <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', maxHeight: 220 }}>
              <img src={imagePreview} alt="Banner preview" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
              {uploadingImage && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '.85rem' }}>Uploading…</span>
                </div>
              )}
              {!uploadingImage && (
                <button
                  onClick={removeImage}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239,68,68,.9)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border)', borderRadius: 10, padding: '1.5rem',
                textAlign: 'center', cursor: 'pointer', transition: 'border-color .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '.5rem' }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--text-lo)' }}>Click to upload PNG or JPG</p>
              <p style={{ margin: '.3rem 0 0', fontSize: '.75rem', color: 'var(--text-lo)', opacity: 0.6 }}>Recommended: 600px wide · max 5MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }}
          />
        </div>

        {/* Message body */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-lo)', marginBottom: '.4rem', letterSpacing: '.04em', textTransform: 'uppercase' }}>
            Message Body
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Start with 'Dear Family,' and write your message…"
            rows={10}
            style={{
              width: '100%', padding: '.85rem 1rem',
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text-hi)', fontSize: '.9rem',
              outline: 'none', resize: 'vertical',
              fontFamily: 'Georgia, serif',
              lineHeight: 1.75, boxSizing: 'border-box',
            }}
          />
          <p style={{ fontSize: '.72rem', color: 'var(--text-lo)', marginTop: '.3rem', textAlign: 'right' }}>
            {message.length} characters
          </p>
        </div>

        {/* Channels + Recipients */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }} className="comms-grid">
          <div>
            <p style={{ margin: '0 0 .5rem', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-lo)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Channels</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {(['email', 'whatsapp'] as const).map(ch => (
                <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', cursor: 'pointer', padding: '.6rem .85rem', background: channels[ch] ? 'rgba(249,115,22,.08)' : 'var(--bg-2)', border: `1px solid ${channels[ch] ? ACCENT : 'var(--border)'}`, borderRadius: 8, transition: 'all .15s' }}>
                  <input type="checkbox" checked={channels[ch]} onChange={() => setChannels(prev => ({ ...prev, [ch]: !prev[ch] }))} style={{ accentColor: ACCENT, width: 15, height: 15, cursor: 'pointer' }} />
                  <div>
                    <span style={{ fontSize: '.88rem', fontWeight: 600, color: channels[ch] ? ACCENT : 'var(--text-hi)' }}>{CHANNEL_LABELS[ch]}</span>
                    <span style={{ fontSize: '.72rem', color: 'var(--text-lo)', marginLeft: '.5rem' }}>
                      {ch === 'email' ? 'via Gmail' : 'via Meta API'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p style={{ margin: '0 0 .5rem', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-lo)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Recipients</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {['all', ...campuses].map(val => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', cursor: 'pointer', padding: '.6rem .85rem', background: recipientFilter === val ? 'rgba(249,115,22,.08)' : 'var(--bg-2)', border: `1px solid ${recipientFilter === val ? ACCENT : 'var(--border)'}`, borderRadius: 8, transition: 'all .15s' }}>
                  <input type="radio" name="recipients" value={val} checked={recipientFilter === val} onChange={() => setRecipientFilter(val)} style={{ accentColor: ACCENT, cursor: 'pointer' }} />
                  <span style={{ fontSize: '.88rem', fontWeight: 600, color: recipientFilter === val ? ACCENT : 'var(--text-hi)' }}>
                    {val === 'all' ? 'All Members' : val}
                  </span>
                </label>
              ))}
            </div>
            <p style={{ fontSize: '.75rem', color: 'var(--text-lo)', marginTop: '.5rem' }}>
              {memberCount !== null ? `${memberCount} in database` : ''}
              {savedSheetUrl ? ' + sheet contacts' : ''}
            </p>
          </div>
        </div>

        {/* Schedule */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 .5rem', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-lo)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Send Time</p>
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem', flexWrap: 'wrap' }}>
            {(['now', 'later'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setScheduleMode(mode)}
                style={{
                  padding: '.5rem 1.1rem', borderRadius: 8, fontSize: '.85rem', fontWeight: 600,
                  border: `1px solid ${scheduleMode === mode ? ACCENT : 'var(--border)'}`,
                  background: scheduleMode === mode ? 'rgba(249,115,22,.08)' : 'var(--bg-2)',
                  color: scheduleMode === mode ? ACCENT : 'var(--text-md)',
                  cursor: 'pointer', transition: 'all .15s',
                  fontFamily: 'var(--font-poppins), Poppins, sans-serif',
                }}
              >
                {mode === 'now' ? 'Send Now' : 'Schedule for Later'}
              </button>
            ))}
          </div>
          {scheduleMode === 'later' && (
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <input
                type="date"
                value={scheduleDate}
                min={minDate}
                onChange={e => setScheduleDate(e.target.value)}
                style={{ padding: '.65rem .9rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text-hi)', fontSize: '.88rem', outline: 'none', fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}
              />
              <input
                type="time"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
                style={{ padding: '.65rem .9rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text-hi)', fontSize: '.88rem', outline: 'none', fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}
              />
            </div>
          )}
        </div>

        {/* Result banner */}
        {result && (
          <div style={{ padding: '.85rem 1rem', borderRadius: 10, marginBottom: '1rem', background: result.success ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', border: `1px solid ${result.success ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`, color: result.success ? '#22c55e' : '#ef4444', fontSize: '.88rem', fontWeight: 500 }}>
            {result.message}
          </div>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend || sending || (scheduleMode === 'later' && !scheduleDate)}
          style={{
            display: 'flex', alignItems: 'center', gap: '.6rem',
            background: canSend && !sending ? NAVY : 'var(--bg-3)',
            color: canSend && !sending ? '#fff' : 'var(--text-lo)',
            border: 'none', borderRadius: 10, padding: '.9rem 2rem',
            fontSize: '.9rem', fontWeight: 700,
            cursor: canSend && !sending ? 'pointer' : 'not-allowed',
            transition: 'background .15s', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
          }}
        >
          {sending ? (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Sending…</>
          ) : scheduleMode === 'later' ? (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Schedule Broadcast</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Send Now</>
          )}
        </button>
      </div>

      {/* Campaign history */}
      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem' }}>
        <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-hi)', margin: '0 0 1.25rem' }}>
          Campaign History
        </h2>
        {loadingCampaigns ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: 60, background: 'var(--bg-2)', borderRadius: 10, opacity: 0.5 }} />)}
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-lo)', fontSize: '.9rem' }}>
            No broadcasts yet. Send your first message above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {campaigns.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.85rem 1rem', background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '.88rem', color: 'var(--text-hi)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 360 }}>
                    {c.subject}
                  </p>
                  <p style={{ margin: '.15rem 0 0', fontSize: '.72rem', color: 'var(--text-lo)' }}>
                    {c.status === 'scheduled' && c.scheduled_at
                      ? `Scheduled: ${new Date(c.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                      : new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {' · '}{c.recipient_filter === 'all' ? 'All Members' : c.recipient_filter}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '.35rem', flexShrink: 0 }}>
                  {c.channels.map(ch => (
                    <span key={ch} style={{ fontSize: '.7rem', fontWeight: 600, padding: '.2rem .55rem', borderRadius: 6, background: 'rgba(249,115,22,.1)', color: ACCENT }}>
                      {CHANNEL_LABELS[ch] ?? ch}
                    </span>
                  ))}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '.78rem', fontWeight: 700, color: STATUS_COLOR[c.status] ?? 'var(--text-lo)', textTransform: 'capitalize' }}>
                    {c.status}
                  </span>
                  {c.status === 'sent' && (
                    <p style={{ margin: '.1rem 0 0', fontSize: '.7rem', color: 'var(--text-lo)' }}>
                      {c.sent_email > 0 ? `${c.sent_email} emails` : ''}{c.sent_email > 0 && c.sent_whatsapp > 0 ? ' · ' : ''}{c.sent_whatsapp > 0 ? `${c.sent_whatsapp} WA` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) { .comms-grid { grid-template-columns: 1fr !important; } }
        .templates-scroll::-webkit-scrollbar { height: 4px; }
        .templates-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type="text"]:focus, input[type="url"]:focus, textarea:focus { border-color: ${ACCENT} !important; }
        input[type="date"]:focus, input[type="time"]:focus { border-color: ${ACCENT} !important; }
      `}</style>
    </div>
  )
}
