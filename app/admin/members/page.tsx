'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const ACCENT = '#f97316'

interface Member {
  id: string
  full_name: string | null
  phone: string | null
  campus: string | null
  role: string | null
  bio: string | null
  created_at: string | null
}

const ROLES = ['member', 'leader', 'admin']

const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  member: { bg: 'rgba(148,163,184,.15)', text: '#94a3b8' },
  leader: { bg: 'rgba(99,102,241,.15)',  text: '#818cf8' },
  admin:  { bg: 'rgba(249,115,22,.15)',  text: '#fb923c' },
}

export default function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone, campus, role, bio, created_at')
      .order('created_at', { ascending: false })
    setMembers(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function changeRole(id: string, role: string) {
    setUpdatingId(id)
    await supabase.from('profiles').update({ role }).eq('id', id)
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m))
    setUpdatingId(null)
  }

  const filtered = members.filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.campus?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    )
  })

  const inputStyle = {
    background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '.6rem .85rem', color: 'var(--text-hi)', fontSize: '.9rem',
    fontFamily: 'var(--font-poppins), Poppins, sans-serif', outline: 'none',
  }

  function initials(name: string | null) {
    if (!name) return '?'
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: ACCENT, marginBottom: '.35rem' }}>Admin</div>
          <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-hi)', margin: 0 }}>Members</h1>
          {!loading && <p style={{ color: 'var(--text-lo)', fontSize: '.88rem', marginTop: '.35rem', margin: '.35rem 0 0' }}>{members.length} registered member{members.length !== 1 ? 's' : ''}</p>}
        </div>
        <input
          style={{ ...inputStyle, width: '100%', maxWidth: 240 }}
          placeholder="Search name, campus, role…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-lo)', fontSize: '.9rem', padding: '2rem 0' }}>Loading members…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--bg-1)', border: '1px dashed var(--border)', borderRadius: 14, padding: '3rem', textAlign: 'center', color: 'var(--text-lo)' }}>
          {search ? 'No members match your search.' : 'No members registered yet.'}
        </div>
      ) : (
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Member', 'Campus', 'Joined', 'Role'].map(h => (
                    <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontSize: '.72rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-lo)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((member, i) => {
                  const roleStyle = ROLE_STYLES[member.role ?? 'member'] ?? ROLE_STYLES.member
                  return (
                    <tr key={member.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '.75rem', fontWeight: 700, color: 'var(--text-md)',
                            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                          }}>
                            {initials(member.full_name)}
                          </div>
                          <div>
                            <div style={{ fontSize: '.9rem', fontWeight: 500, color: 'var(--text-hi)' }}>{member.full_name ?? 'Unnamed'}</div>
                            {member.phone && <div style={{ fontSize: '.72rem', color: 'var(--text-lo)' }}>{member.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '.85rem 1rem' }}>
                        <span style={{ fontSize: '.78rem', padding: '.2rem .6rem', background: 'var(--bg-3)', borderRadius: 99, color: 'var(--text-lo)', textTransform: 'capitalize' }}>
                          {member.campus ?? '—'}
                        </span>
                      </td>
                      <td style={{ padding: '.85rem 1rem', fontSize: '.82rem', color: 'var(--text-lo)', whiteSpace: 'nowrap' }}>
                        {member.created_at ? new Date(member.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '.85rem 1rem' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <select
                            value={member.role ?? 'member'}
                            disabled={updatingId === member.id}
                            onChange={e => changeRole(member.id, e.target.value)}
                            style={{
                              fontSize: '.75rem', fontWeight: 600, padding: '.25rem .55rem .25rem .65rem',
                              borderRadius: 99, border: 'none', cursor: 'pointer',
                              background: roleStyle.bg, color: roleStyle.text,
                              appearance: 'none', paddingRight: '1.5rem',
                              fontFamily: 'var(--font-poppins), Poppins, sans-serif',
                              opacity: updatingId === member.id ? 0.5 : 1,
                              textTransform: 'capitalize',
                            }}
                          >
                            {ROLES.map(r => (
                              <option key={r} value={r} style={{ background: 'var(--bg-2)', color: 'var(--text-hi)', textTransform: 'capitalize' }}>
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                              </option>
                            ))}
                          </select>
                          <svg style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: roleStyle.text }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
