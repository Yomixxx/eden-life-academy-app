'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const ACCENT = '#f97316'

interface Sermon {
  id: string
  title: string
  speaker: string | null
  series: string | null
  scripture_reference: string | null
  description: string | null
  video_url: string | null
  audio_url: string | null
  thumbnail_url: string | null
  campus: string | null
  preached_at: string | null
  duration_minutes: number | null
  is_published: boolean
  sort_order: number | null
}

const EMPTY: Omit<Sermon, 'id'> = {
  title: '', speaker: 'Pastor Gbenga Ajibola', series: '', scripture_reference: '',
  description: '', video_url: '', audio_url: '', thumbnail_url: '',
  campus: 'both', preached_at: '', duration_minutes: null, is_published: false, sort_order: null,
}

const CAMPUS_OPTIONS = ['mainland', 'island', 'both']

export default function AdminSermons() {
  const [sermons, setSermons] = useState<Sermon[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Sermon | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase.from('sermons').select('*').order('preached_at', { ascending: false }).order('sort_order', { ascending: true })
    setSermons(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setShowModal(true)
  }

  function openEdit(sermon: Sermon) {
    setEditing(sermon)
    setForm({ ...sermon })
    setShowModal(true)
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = {
      ...form,
      preached_at: form.preached_at || null,
    }
    if (editing) {
      await supabase.from('sermons').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('sermons').insert(payload)
    }
    setSaving(false)
    setShowModal(false)
    load()
  }

  async function togglePublish(sermon: Sermon) {
    await supabase.from('sermons').update({ is_published: !sermon.is_published }).eq('id', sermon.id)
    setSermons(prev => prev.map(s => s.id === sermon.id ? { ...s, is_published: !s.is_published } : s))
  }

  async function del(id: string) {
    await supabase.from('sermons').delete().eq('id', id)
    setSermons(prev => prev.filter(s => s.id !== id))
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
          <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-hi)', margin: 0 }}>Sermons</h1>
        </div>
        <button onClick={openCreate} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Sermon
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-lo)', fontSize: '.9rem', padding: '2rem 0' }}>Loading sermons…</div>
      ) : sermons.length === 0 ? (
        <div style={{ background: 'var(--bg-1)', border: '1px dashed var(--border)', borderRadius: 14, padding: '3rem', textAlign: 'center', color: 'var(--text-lo)' }}>
          No sermons yet. Add your first sermon.
        </div>
      ) : (
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Title', 'Speaker', 'Series', 'Campus', 'Date', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontSize: '.72rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-lo)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sermons.map((sermon, i) => (
                  <tr key={sermon.id} style={{ borderBottom: i < sermons.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '.85rem 1rem', maxWidth: 220 }}>
                      <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--text-hi)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sermon.title}</div>
                      {sermon.scripture_reference && <div style={{ fontSize: '.72rem', color: 'var(--text-lo)', marginTop: 2 }}>{sermon.scripture_reference}</div>}
                    </td>
                    <td style={{ padding: '.85rem 1rem', fontSize: '.85rem', color: 'var(--text-md)', whiteSpace: 'nowrap' }}>{sermon.speaker ?? '—'}</td>
                    <td style={{ padding: '.85rem 1rem', fontSize: '.85rem', color: 'var(--text-md)' }}>{sermon.series ?? '—'}</td>
                    <td style={{ padding: '.85rem 1rem' }}>
                      <span style={{ fontSize: '.72rem', padding: '.15rem .55rem', background: 'var(--bg-3)', borderRadius: 99, color: 'var(--text-lo)', textTransform: 'capitalize' }}>
                        {sermon.campus ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '.85rem 1rem', fontSize: '.82rem', color: 'var(--text-md)', whiteSpace: 'nowrap' }}>
                      {sermon.preached_at ? new Date(sermon.preached_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '.85rem 1rem' }}>
                      <button
                        onClick={() => togglePublish(sermon)}
                        style={{ fontSize: '.72rem', fontWeight: 600, padding: '.25rem .65rem', borderRadius: 99, border: 'none', cursor: 'pointer', background: sermon.is_published ? 'rgba(94,201,87,.15)' : 'var(--bg-3)', color: sermon.is_published ? '#5ec957' : 'var(--text-lo)', transition: 'background .15s, color .15s' }}
                      >
                        {sermon.is_published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td style={{ padding: '.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        <button onClick={() => openEdit(sermon)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-lo)', padding: '.25rem', display: 'flex', alignItems: 'center', transition: 'color .15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-hi)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-lo)'}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button onClick={() => setDeleteConfirm(sermon.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-lo)', padding: '.25rem', display: 'flex', alignItems: 'center', transition: 'color .15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#fca5a5'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-lo)'}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-hi)', borderRadius: 18, width: '100%', maxWidth: 560, maxHeight: '90svh', overflowY: 'auto', padding: '1.75rem' }}>
            <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-hi)', margin: '0 0 1.5rem' }}>
              {editing ? 'Edit Sermon' : 'New Sermon'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Sermon title" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Speaker</label>
                  <input style={inputStyle} value={form.speaker ?? ''} onChange={e => setForm(p => ({ ...p, speaker: e.target.value }))} placeholder="Pastor name" />
                </div>
                <div>
                  <label style={labelStyle}>Series</label>
                  <input style={inputStyle} value={form.series ?? ''} onChange={e => setForm(p => ({ ...p, series: e.target.value }))} placeholder="Series name" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Scripture Reference</label>
                  <input style={inputStyle} value={form.scripture_reference ?? ''} onChange={e => setForm(p => ({ ...p, scripture_reference: e.target.value }))} placeholder="e.g. John 3:16" />
                </div>
                <div>
                  <label style={labelStyle}>Date Preached</label>
                  <input type="date" style={inputStyle} value={form.preached_at ?? ''} onChange={e => setForm(p => ({ ...p, preached_at: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.description ?? ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Sermon summary" />
              </div>
              <div>
                <label style={labelStyle}>YouTube URL (paste full link — video will embed automatically)</label>
                <input style={inputStyle} value={form.video_url ?? ''} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." />
              </div>
              <div>
                <label style={labelStyle}>Audio URL</label>
                <input style={inputStyle} value={form.audio_url ?? ''} onChange={e => setForm(p => ({ ...p, audio_url: e.target.value }))} placeholder="Podcast / SoundCloud link" />
              </div>
              <div>
                <label style={labelStyle}>Thumbnail URL</label>
                <input style={inputStyle} value={form.thumbnail_url ?? ''} onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Campus</label>
                  <select style={inputStyle} value={form.campus ?? 'both'} onChange={e => setForm(p => ({ ...p, campus: e.target.value }))}>
                    {CAMPUS_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Duration (minutes)</label>
                  <input type="number" style={inputStyle} value={form.duration_minutes ?? ''} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value ? Number(e.target.value) : null }))} placeholder="e.g. 60" />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.65rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_published} onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <span style={{ fontSize: '.9rem', color: 'var(--text-md)' }}>Publish immediately</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button style={btnSecondary} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Sermon'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-hi)', borderRadius: 16, padding: '1.75rem', maxWidth: 380, width: '100%' }}>
            <div style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-hi)', marginBottom: '.75rem' }}>Delete Sermon?</div>
            <p style={{ color: 'var(--text-lo)', fontSize: '.9rem', margin: '0 0 1.5rem' }}>This will permanently delete this sermon. This cannot be undone.</p>
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
