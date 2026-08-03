'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const ACCENT = '#f97316'

interface Announcement {
  id: string
  title: string
  body: string | null
  category: string | null
  campus: string | null
  is_pinned: boolean
  is_published: boolean
  published_at: string | null
  expires_at: string | null
  created_by: string | null
}

const EMPTY: Omit<Announcement, 'id' | 'created_by'> = {
  title: '', body: '', category: 'general', campus: 'both',
  is_pinned: false, is_published: false, published_at: null, expires_at: null,
}

const CATEGORIES = ['general', 'events', 'campus', 'urgent', 'prayer']
const CAMPUS_OPTIONS = ['mainland', 'island', 'both']

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  general:  { bg: 'rgba(148,163,184,.15)', text: '#94a3b8' },
  events:   { bg: 'rgba(99,102,241,.15)',  text: '#818cf8' },
  campus:   { bg: 'rgba(34,211,238,.12)',  text: '#22d3ee' },
  urgent:   { bg: 'rgba(239,68,68,.15)',   text: '#f87171' },
  prayer:   { bg: 'rgba(168,85,247,.15)',  text: '#c084fc' },
}

export default function AdminAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null))
    load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setShowModal(true)
  }

  function openEdit(item: Announcement) {
    setEditing(item)
    setForm({
      title: item.title, body: item.body, category: item.category,
      campus: item.campus, is_pinned: item.is_pinned, is_published: item.is_published,
      published_at: item.published_at, expires_at: item.expires_at,
    })
    setShowModal(true)
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    const isFirstPublish = form.is_published && !editing?.published_at
    const payload = {
      ...form,
      published_at: isFirstPublish ? new Date().toISOString() : form.published_at,
      expires_at: form.expires_at || null,
      created_by: userId,
    }
    if (editing) {
      await supabase.from('announcements').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('announcements').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    load()
    if (isFirstPublish) notifyMembers(form.title, form.body ?? '')
  }

  function notifyMembers(title: string, body: string) {
    fetch('/api/admin/announcements/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    }).catch(() => {})
  }

  async function togglePin(item: Announcement) {
    await supabase.from('announcements').update({ is_pinned: !item.is_pinned }).eq('id', item.id)
    setItems(prev => prev.map(a => a.id === item.id ? { ...a, is_pinned: !a.is_pinned } : a))
  }

  async function togglePublish(item: Announcement) {
    const isFirstPublish = !item.is_published && !item.published_at
    const update: Partial<Announcement> = { is_published: !item.is_published }
    if (isFirstPublish) update.published_at = new Date().toISOString()
    await supabase.from('announcements').update(update).eq('id', item.id)
    setItems(prev => prev.map(a => a.id === item.id ? { ...a, ...update } : a))
    if (isFirstPublish) notifyMembers(item.title, item.body ?? '')
  }

  async function del(id: string) {
    await supabase.from('announcements').delete().eq('id', id)
    setItems(prev => prev.filter(a => a.id !== id))
    setDeleteConfirm(null)
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '.65rem .85rem', color: 'var(--text-hi)', fontSize: '.9rem',
    fontFamily: 'var(--font-poppins), Poppins, sans-serif', outline: 'none',
  }
  const labelStyle = { fontSize: '.78rem', fontWeight: 600, color: 'var(--text-md)', marginBottom: '.3rem', display: 'block' as const }
  const btnPrimary = {
    background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '.65rem 1.25rem',
    fontSize: '.88rem', fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-poppins), Poppins, sans-serif', transition: 'opacity .15s',
  }
  const btnSecondary = {
    background: 'var(--bg-3)', color: 'var(--text-md)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '.65rem 1.25rem', fontSize: '.88rem', fontWeight: 500, cursor: 'pointer',
    fontFamily: 'var(--font-poppins), Poppins, sans-serif',
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: ACCENT, marginBottom: '.35rem' }}>Admin</div>
          <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-hi)', margin: 0 }}>Announcements</h1>
        </div>
        <button onClick={openCreate} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Announcement
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-lo)', fontSize: '.9rem', padding: '2rem 0' }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ background: 'var(--bg-1)', border: '1px dashed var(--border)', borderRadius: 14, padding: '3rem', textAlign: 'center', color: 'var(--text-lo)' }}>
          No announcements yet. Create your first one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {items.map(item => {
            const catColor = CATEGORY_COLORS[item.category ?? 'general'] ?? CATEGORY_COLORS.general
            return (
              <div key={item.id} style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                {item.is_pinned && (
                  <svg style={{ color: ACCENT, flexShrink: 0, marginTop: 2 }} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.35rem' }}>
                    <span style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--text-hi)' }}>{item.title}</span>
                    <span style={{ fontSize: '.68rem', padding: '.15rem .55rem', borderRadius: 99, background: catColor.bg, color: catColor.text, textTransform: 'capitalize', fontWeight: 600 }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '.68rem', padding: '.15rem .55rem', borderRadius: 99, background: 'var(--bg-3)', color: 'var(--text-lo)', textTransform: 'capitalize' }}>
                      {item.campus}
                    </span>
                  </div>
                  {item.body && <p style={{ fontSize: '.82rem', color: 'var(--text-lo)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.body}</p>}
                  {item.published_at && (
                    <div style={{ fontSize: '.72rem', color: 'var(--text-lo)', marginTop: '.35rem' }}>
                      Published {new Date(item.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {item.expires_at && ` · Expires ${new Date(item.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => togglePin(item)}
                    title={item.is_pinned ? 'Unpin' : 'Pin'}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: item.is_pinned ? ACCENT : 'var(--text-lo)', padding: '.25rem', display: 'flex', alignItems: 'center', borderRadius: 6, transition: 'color .15s' }}
                    onMouseEnter={e => { if (!item.is_pinned) e.currentTarget.style.color = 'var(--text-hi)' }}
                    onMouseLeave={e => { if (!item.is_pinned) e.currentTarget.style.color = 'var(--text-lo)' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => togglePublish(item)}
                    style={{ fontSize: '.72rem', fontWeight: 600, padding: '.25rem .65rem', borderRadius: 99, border: 'none', cursor: 'pointer', background: item.is_published ? 'rgba(94,201,87,.15)' : 'var(--bg-3)', color: item.is_published ? '#5ec957' : 'var(--text-lo)', transition: 'background .15s, color .15s' }}
                  >
                    {item.is_published ? 'Live' : 'Draft'}
                  </button>
                  <button onClick={() => openEdit(item)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-lo)', padding: '.25rem', display: 'flex', alignItems: 'center', transition: 'color .15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-hi)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-lo)'}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button onClick={() => setDeleteConfirm(item.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-lo)', padding: '.25rem', display: 'flex', alignItems: 'center', transition: 'color .15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fca5a5'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-lo)'}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/>
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-hi)', borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '90svh', overflowY: 'auto', padding: '1.75rem' }}>
            <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-hi)', margin: '0 0 1.5rem' }}>
              {editing ? 'Edit Announcement' : 'New Announcement'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" />
              </div>
              <div>
                <label style={labelStyle}>Body</label>
                <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} value={form.body ?? ''} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Full message content" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select style={inputStyle} value={form.category ?? 'general'} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Campus</label>
                  <select style={inputStyle} value={form.campus ?? 'both'} onChange={e => setForm(p => ({ ...p, campus: e.target.value }))}>
                    {CAMPUS_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Expires At (optional)</label>
                <input type="date" style={inputStyle} value={form.expires_at?.slice(0, 10) ?? ''} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value ? e.target.value + 'T23:59:59Z' : null }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.65rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(p => ({ ...p, is_pinned: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  <span style={{ fontSize: '.9rem', color: 'var(--text-md)' }}>Pin to top</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.65rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_published} onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  <span style={{ fontSize: '.9rem', color: 'var(--text-md)' }}>Publish immediately</span>
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button style={btnSecondary} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Post Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-hi)', borderRadius: 16, padding: '1.75rem', maxWidth: 380, width: '100%' }}>
            <div style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-hi)', marginBottom: '.75rem' }}>Delete Announcement?</div>
            <p style={{ color: 'var(--text-lo)', fontSize: '.9rem', margin: '0 0 1.5rem' }}>This will permanently remove this announcement. This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
              <button style={btnSecondary} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button style={{ ...btnPrimary, background: '#ef4444' }} onClick={() => del(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
