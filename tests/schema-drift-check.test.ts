import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

/**
 * Keeps supabase/migrations/00_verify_schema_drift.sql honest.
 *
 * That script is the answer to "is Supabase in sync with the code?" — but only
 * if its expectation list still matches the code. A table added to the app and
 * forgotten there would make the check report a healthy database while a real
 * feature silently no-ops, which is the exact class of bug the script exists to
 * catch. (`groups` was the reverse case: listed but never queried, so it would
 * have raised a false alarm.)
 */
const ROOT = path.resolve(__dirname, '..')
const DRIFT_SQL = path.join(ROOT, 'supabase/migrations/00_verify_schema_drift.sql')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.(ts|tsx)$/.test(entry) ? [full] : []
  })
}

/** Every table the app actually talks to, via supabase.from('...'). */
function tablesUsedByCode(): Set<string> {
  // components/ matters too: LiveClassCard is what writes class_attendance.
  const files = ['app', 'lib', 'components'].flatMap(d => sourceFiles(path.join(ROOT, d)))
  const tables = new Set<string>()
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    // No closing-paren anchor: chains like `.from('class_attendance').insert({...})`
    // would otherwise be missed.
    for (const m of src.matchAll(/\.from\(\s*'([a-z_]+)'/g)) tables.add(m[1])
  }
  return tables
}

/** Tables listed in the MISSING TABLE section of the drift script. */
function tablesExpectedByDriftCheck(): Set<string> {
  const sql = readFileSync(DRIFT_SQL, 'utf8')
  const section = sql.split('-- 1. MISSING TABLES')[1].split('-- 2. MISSING COLUMNS')[0]
  const values = section.split('from (values')[1].split(') as t(table_name)')[0]
  return new Set([...values.matchAll(/\('([a-z_]+)'\)/g)].map(m => m[1]))
}

/** Removes string literals so DDL detection can't trip over fix_hint text. */
function withoutStringLiterals(sql: string): string {
  let out = ''
  let inString = false
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i]
    if (inString) {
      if (c === "'") {
        if (sql[i + 1] === "'") { i++; continue }
        inString = false
        out += ' '
      }
      continue
    }
    if (c === "'") { inString = true; continue }
    out += c
  }
  return out
}

/** Quote-aware parse: strip `--` comments, split on top-level `;`. */
function splitStatements(sql: string): string[] {
  const stmts: string[] = []
  let cur = ''
  let inString = false
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i]
    if (inString) {
      if (c === "'") {
        if (sql[i + 1] === "'") { cur += "''"; i++; continue }
        inString = false
      }
      cur += c
      continue
    }
    if (c === "'") { inString = true; cur += c; continue }
    if (c === '-' && sql[i + 1] === '-') {
      const nl = sql.indexOf('\n', i)
      i = nl === -1 ? sql.length : nl
      continue
    }
    if (c === ';') { stmts.push(cur); cur = ''; continue }
    cur += c
  }
  stmts.push(cur)
  return stmts.map(s => s.trim()).filter(Boolean)
}

describe('00_verify_schema_drift.sql', () => {
  const expected = tablesExpectedByDriftCheck()
  const used = tablesUsedByCode()

  it('expects every table the app queries', () => {
    const missing = [...used].filter(t => !expected.has(t)).sort()
    expect(missing, `add these to the MISSING TABLES section: ${missing.join(', ')}`).toEqual([])
  })

  it('does not expect tables the app never touches (false alarms)', () => {
    const extra = [...expected].filter(t => !used.has(t)).sort()
    expect(extra, `remove these from the MISSING TABLES section: ${extra.join(', ')}`).toEqual([])
  })

  it('is read-only, so it can be pasted into production SQL Editor safely', () => {
    const stmts = splitStatements(readFileSync(DRIFT_SQL, 'utf8'))
    expect(stmts.length).toBeGreaterThanOrEqual(10)
    for (const stmt of stmts) {
      expect(stmt).toMatch(/^(select|with)\b/i)
      // Check the code, not the quoted fix_hint text (hints legitimately
      // contain the repair SQL as a string).
      const code = withoutStringLiterals(stmt)
      expect(code, `DDL found in: ${code.slice(0, 80)}`).not.toMatch(
        /\b(alter|create|drop|insert|update|delete|truncate|grant|revoke)\s+(table|policy|policies|trigger|function|schema|database|index)\b/i,
      )
    }
  })

  it('has balanced quotes and parentheses in every statement', () => {
    for (const stmt of splitStatements(readFileSync(DRIFT_SQL, 'utf8'))) {
      const quotes = (stmt.match(/'/g) ?? []).length
      expect(quotes % 2, `odd quote count in: ${stmt.slice(0, 60)}`).toBe(0)
      const open = (stmt.match(/\(/g) ?? []).length
      const close = (stmt.match(/\)/g) ?? []).length
      expect(open, `unbalanced parens in: ${stmt.slice(0, 60)}`).toBe(close)
    }
  })

  it('points every problem at a fix (fix_hint column present in each check)', () => {
    const sql = readFileSync(DRIFT_SQL, 'utf8')
    const stmts = splitStatements(sql)
    for (const stmt of stmts.slice(0, -1)) {
      // The final statement is the VERDICT summary; the rest are checks.
      expect(stmt, `no fix_hint in: ${stmt.slice(0, 60)}`).toMatch(/fix_hint/)
    }
  })
})
