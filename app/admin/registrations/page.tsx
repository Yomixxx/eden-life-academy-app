'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ACADEMY_LEVELS, isIncompleteAcademyEnrollment } from '@/lib/academy'

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
  course_id?: string | null
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
  const [cohortFilter, setCohortFilter] = useState('')
  const [incompleteOnly, setIncompleteOnly] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [draftLevels, setDraftLevels] = useState<Record<string, string>>({})
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('enrollments')
      .select('id, enrolled_at, academy_level, cohort, matric_number, course_id, profiles(full_name, phone, email), courses(title)')
      .order('enrolled_at', { ascending: false })
    setRegistrations((data as unknown as Registration[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const monthOptions = useMemo(() => {
    const keys = new Set(registrations.map(r => monthKey(r.enrolled_at)).filter(Boolean))
    return Array.from(keys).sort().reverse()
  }, [registrations])

  const cohortOptions = useMemo(() => {
    const values = new Set(registrations.map(r => r.cohort).filter((c): c is string => !!c))
    return Array.from(values).sort()
  }, [registrations])

  const incompleteCount = useMemo(
    () => registrations.filter(r => isIncompleteAcademyEnrollment(r)).length,
    [registrations],
  )

  const filtered = registrations.filter(r => {
    if (incompleteOnly && !isIncompleteAcademyEnrollment(r)) return false
    if (levelFilter === '__none__') {
      if (r.academy_level) return false
    } else if (levelFilter && r.academy_level !== levelFilter) {
      return false
    }
    if (monthFilter && monthKey(r.enrolled_at) !== monthFilter) return false
    if (cohortFilter && r.cohort !== cohortFilter) return false
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

  async function completeRegistration(r: Registration) {
    const level = draftLevels[r.id] || r.academy_level || ''
    if (!level) {
      setRowErrors(prev => ({ ...prev, [r.id]: 'Choose a level first.' }))
      return
    }
    setSavingId(r.id)
    setRowErrors(prev => {
      const next = { ...prev }
      delete next[r.id]
      return next
    })
    try {
      const res = await fetch('/api/admin/registrations/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: r.id, academyLevel: level }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'Could not complete registration.')

      setRegistrations(prev => prev.map(row => row.id === r.id ? {
        ...row,
        academy_level: body.academyLevel ?? level,
        cohort: body.cohort ?? row.cohort,
        matric_number: body.matricNumber ?? row.matric_number,
      } : row))
    } catch (err) {
      setRowErrors(prev => ({
        ...prev,
        [r.id]: err instanceof Error ? err.message : 'Could not complete registration.',
      }))
    } finally {
      setSavingId(null)
    }
  }

  function exportCsv() {
    const header = ['Matric Number', 'Full Name', 'Email', 'Phone', 'Course', 'Level', 'Cohort', 'Enrolled At', 'Status']
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
        csvCell(isIncompleteAcademyEnrollment(r) ? 'incomplete' : 'complete'),
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
              {search || levelFilter || monthFilter || cohortFilter || incompleteOnly
                ? `${filtered.length} of ${registrations.length} registered`
                : `${registrations.length} registered`}
              {incompleteCount > 0 && (
                <span style={{ marginLeft: '.5rem', color: '#fbbf24' }}>
                  · {incompleteCount} missing level or matric
                </span>
              )}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
            <option value="__none__">No level set</option>
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
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={cohortFilter}
            onChange={e => setCohortFilter(e.target.value)}
          >
            <option value="">All cohorts</option>
            {cohortOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setIncompleteOnly(v => !v)}
            style={{
              ...btnSecondary,
              border: incompleteOnly ? '1px solid rgba(251,191,36,.5)' : '1px solid var(--border)',
              background: incompleteOnly ? 'rgba(251,191,36,.12)' : 'var(--bg-3)',
              color: incompleteOnly ? '#fbbf24' : 'var(--text-md)',
            }}
          >
            {incompleteOnly ? 'Showing incomplete' : 'Incomplete only'}
          </button>
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

      {incompleteCount > 0 && !incompleteOnly && (
        <div style={{
          marginBottom: '1.25rem', padding: '1rem 1.25rem', borderRadius: 12,
          background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.3)',
          color: 'var(--text-md)', fontSize: '.88rem', lineHeight: 1.55,
        }}>
          <strong style={{ color: '#fbbf24' }}>{incompleteCount} registration{incompleteCount === 1 ? '' : 's'}</strong>
          {' '}missing a level and/or matric number. Use the level dropdown on those rows and click <em>Set level</em>,
          or ask the student to open <code style={{ fontSize: '.8rem' }}>/register</code>. Click <em>Incomplete only</em> to focus the list.
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-lo)', fontSize: '.9rem', padding: '2rem 0' }}>Loading registrations…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--bg-1)', border: '1px dashed var(--border)', borderRadius: 14, padding: '3rem', textAlign: 'center', color: 'var(--text-lo)' }}>
          {search || levelFilter || monthFilter || cohortFilter || incompleteOnly ? 'No registrations match your filters.' : 'No one has registered yet.'}
        </div>
      ) : (
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Contact', 'Course', 'Level', 'Matric Number', 'Cohort', 'Enrolled', 'Fix'].map(h => (
                    <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontSize: '.72rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-lo)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const incomplete = isIncompleteAcademyEnrollment(r)
                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                        background: incomplete ? 'rgba(251,191,36,.04)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '.85rem 1rem', fontSize: '.88rem', fontWeight: 500, color: 'var(--text-hi)', whiteSpace: 'nowrap' }}>
                        {r.profiles?.full_name ?? 'Unnamed'}
                        {incomplete && (
                          <span style={{
                            marginLeft: '.5rem', fontSize: '.65rem', fontWeight: 700, letterSpacing: '.04em',
                            textTransform: 'uppercase', color: '#fbbf24',
                            background: 'rgba(251,191,36,.12)', border: '1px solid rgba(251,191,36,.3)',
                            borderRadius: 99, padding: '.15rem .45rem',
                          }}>
                            Incomplete
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '.85rem 1rem', fontSize: '.8rem', color: 'var(--text-lo)' }}>{r.profiles?.email ?? r.profiles?.phone ?? '—'}</td>
                      <td style={{ padding: '.85rem 1rem', fontSize: '.85rem', color: 'var(--text-md)' }}>{r.courses?.title ?? '—'}</td>
                      <td style={{ padding: '.85rem 1rem' }}>
                        {r.academy_level ? (
                          <span style={{ fontSize: '.72rem', padding: '.2rem .6rem', background: 'var(--bg-3)', borderRadius: 99, color: 'var(--text-lo)', whiteSpace: 'nowrap' }}>{r.academy_level} Level</span>
                        ) : (
                          <select
                            aria-label={`Set level for ${r.profiles?.full_name ?? 'member'}`}
                            value={draftLevels[r.id] ?? ''}
                            onChange={e => setDraftLevels(prev => ({ ...prev, [r.id]: e.target.value }))}
                            style={{
                              ...inputStyle, padding: '.35rem .55rem', fontSize: '.8rem', cursor: 'pointer',
                              borderColor: 'rgba(251,191,36,.4)',
                            }}
                          >
                            <option value="" disabled>Set level…</option>
                            {ACADEMY_LEVELS.map(l => <option key={l} value={l}>{l} Level</option>)}
                          </select>
                        )}
                      </td>
                      <td style={{ padding: '.85rem 1rem', fontSize: '.8rem', color: r.matric_number ? 'rgba(94,201,87,.9)' : '#fbbf24', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {r.matric_number ?? '—'}
                      </td>
                      <td style={{ padding: '.85rem 1rem', fontSize: '.8rem', color: 'var(--text-lo)', whiteSpace: 'nowrap' }}>{r.cohort ?? '—'}</td>
                      <td style={{ padding: '.85rem 1rem', fontSize: '.8rem', color: 'var(--text-lo)', whiteSpace: 'nowrap' }}>
                        {r.enrolled_at ? new Date(r.enrolled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '.85rem 1rem', whiteSpace: 'nowrap' }}>
                        {incomplete ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                            <button
                              type="button"
                              disabled={savingId === r.id || !(draftLevels[r.id] || r.academy_level)}
                              onClick={() => completeRegistration(r)}
                              style={{
                                background: 'var(--eden)', color: 'var(--bg-0)', border: 'none',
                                borderRadius: 8, padding: '.4rem .75rem', fontSize: '.78rem', fontWeight: 700,
                                cursor: savingId === r.id || !(draftLevels[r.id] || r.academy_level) ? 'not-allowed' : 'pointer',
                                opacity: savingId === r.id || !(draftLevels[r.id] || r.academy_level) ? 0.55 : 1,
                              }}
                            >
                              {savingId === r.id ? 'Saving…' : r.academy_level && !r.matric_number ? 'Assign matric' : 'Set level'}
                            </button>
                            {rowErrors[r.id] && (
                              <span style={{ fontSize: '.72rem', color: '#fca5a5', maxWidth: 160 }}>{rowErrors[r.id]}</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '.75rem', color: 'var(--text-lo)' }}>—</span>
                        )}
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
