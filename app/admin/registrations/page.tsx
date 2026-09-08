'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ACADEMY_LEVELS } from '@/lib/academy'

const ACCENT = '#f97316'

function monthKey(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 7) // YYYY-MM
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

interface Registration {
  id: string
  enrolled_at: string | null
  academy_level: string | null
  cohort: string | null
  matric_number: string | null
  profiles: { full_name: string | null; phone: string | null; email: string | null } | null
  courses: { title: string } | null
}

function csvCell(value: string | null | undefined): string {
  const s = value ?? ''
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('enrollments')
      .select('id, enrolled_at, academy_level, cohort, matric_number, profiles(full_name, phone, email), courses(title)')
      .order('enrolled_at', { ascending: false })
    setRegistrations((data as unknown as Registration[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const monthOptions = useMemo(() => {
    const keys = new Set(registrations.map(r => monthKey(r.enrolled_at)).filter(Boolean))
    return Array.from(keys).sort().reverse()
  }, [registrations])

  const filtered = registrations.filter(r => {
    if (levelFilter && r.academy_level !== levelFilter) return false
    if (monthFilter && monthKey(r.enrolled_at) !== monthFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.profiles?.full_name?.toLowerCase().includes(q) ||
      r.profiles?.email?.toLowerCase().includes(q) ||
      r.matric_number?.toLowerCase().includes(q) ||
      r.courses?.title?.toLowerCase().includes(q) ||
      r.cohort?.toLowerCase().includes(q)
    )
  })

  function exportCsv() {
    const header = ['Matric Number', 'Full Name', 'Email', 'Phone', 'Course', 'Level', 'Cohort', 'Enrolled At']
    const lines = [header.join(',')]
    for (const r of filtered) {
      lines.push([
        csvCell(r.matric_number),
        csvCell(r.profiles?.full_name),
        csvCell(r.profiles?.email),
        csvCell(r.profiles?.phone),
        csvCell(r.courses?.title),
        csvCell(r.academy_level),
        csvCell(r.cohort),
        csvCell(r.enrolled_at),
      ].join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'registrations.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const inputStyle = {
    background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '.6rem .85rem', color: 'var(--text-hi)', fontSize: '.9rem',
    fontFamily: 'var(--font-poppins), Poppins, sans-serif', outline: 'none',
  }

  const btnSecondary = {
    background: 'var(--bg-3)', color: 'var(--text-md)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '.65rem 1.25rem',
    fontSize: '.88rem', fontWeight: 500, cursor: 'pointer',
    fontFamily: 'var(--font-poppins), Poppins, sans-serif',
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: ACCENT, marginBottom: '.35rem' }}>Admin</div>
          <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-hi)', margin: 0 }}>Registrations</h1>
          {!loading && (
            <p style={{ color: 'var(--text-lo)', fontSize: '.88rem', marginTop: '.35rem' }}>
              {search || levelFilter || monthFilter ? `${filtered.length} of ${registrations.length} registered` : `${registrations.length} registered`}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <input
            style={{ ...inputStyle, width: '100%', maxWidth: 260 }}
            placeholder="Search name, email, matric no…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
          >
            <option value="">All levels</option>
            {ACADEMY_LEVELS.map(l => <option key={l} value={l}>{l} Level</option>)}
          </select>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
          >
            <option value="">All time</option>
            {monthOptions.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <button
            onClick={exportCsv}
            disabled={!filtered.length}
            style={{
              ...btnSecondary, display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0,
              cursor: filtered.length ? 'pointer' : 'not-allowed',
              opacity: filtered.length ? 1 : 0.5,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-lo)', fontSize: '.9rem', padding: '2rem 0' }}>Loading registrations…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--bg-1)', border: '1px dashed var(--border)', borderRadius: 14, padding: '3rem', textAlign: 'center', color: 'var(--text-lo)' }}>
          {search || levelFilter || monthFilter ? 'No registrations match your filters.' : 'No one has registered yet.'}
        </div>
      ) : (
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Contact', 'Course', 'Level', 'Matric Number', 'Cohort', 'Enrolled'].map(h => (
                    <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontSize: '.72rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-lo)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '.85rem 1rem', fontSize: '.88rem', fontWeight: 500, color: 'var(--text-hi)', whiteSpace: 'nowrap' }}>{r.profiles?.full_name ?? 'Unnamed'}</td>
                    <td style={{ padding: '.85rem 1rem', fontSize: '.8rem', color: 'var(--text-lo)' }}>{r.profiles?.email ?? r.profiles?.phone ?? '—'}</td>
                    <td style={{ padding: '.85rem 1rem', fontSize: '.85rem', color: 'var(--text-md)' }}>{r.courses?.title ?? '—'}</td>
                    <td style={{ padding: '.85rem 1rem' }}>
                      {r.academy_level ? (
                        <span style={{ fontSize: '.72rem', padding: '.2rem .6rem', background: 'var(--bg-3)', borderRadius: 99, color: 'var(--text-lo)', whiteSpace: 'nowrap' }}>{r.academy_level} Level</span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '.85rem 1rem', fontSize: '.8rem', color: 'rgba(94,201,87,.9)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{r.matric_number ?? '—'}</td>
                    <td style={{ padding: '.85rem 1rem', fontSize: '.8rem', color: 'var(--text-lo)', whiteSpace: 'nowrap' }}>{r.cohort ?? '—'}</td>
                    <td style={{ padding: '.85rem 1rem', fontSize: '.8rem', color: 'var(--text-lo)', whiteSpace: 'nowrap' }}>
                      {r.enrolled_at ? new Date(r.enrolled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
