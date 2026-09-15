'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const WARN = '#fbbf24'

/**
 * Turns "the change isn't showing up" into a visible, self-diagnosing signal.
 *
 * Every page's JavaScript is compiled from a known commit
 * (NEXT_PUBLIC_BUILD_SHA, stamped in next.config.mjs). /api/build-version is
 * answered by whatever build the edge is *actually* serving. If those two
 * differ, production is serving a stale build — an older deployment was
 * promoted/redeployed over the current one, exactly like the 15 Sep 2026
 * incident where a preview build one commit behind silently replaced the
 * correct production deploy.
 *
 * Without this banner the symptom is indistinguishable from a database or RLS
 * problem, and we burn a session "fixing" code that is already correct and
 * simply not being served.
 *
 * Shown to admins only: members cannot act on it, and a warning strip on
 * Sunday morning would cause a panic for something they cannot fix.
 */
export default function StaleDeploymentBanner() {
  const [state, setState] = useState<{ built: string; live: string; ref: string } | null>(null)

  // Inlined at build time. In tests/local runs without a git repo this is
  // undefined — stay quiet rather than show a false alarm.
  const builtAt = typeof process.env.NEXT_PUBLIC_BUILD_SHA === 'string'
    ? process.env.NEXT_PUBLIC_BUILD_SHA
    : ''

  useEffect(() => {
    if (!builtAt) return

    let cancelled = false

    async function check() {
      try {
        const [versionRes, supabase] = await Promise.all([
          fetch('/api/build-version', { cache: 'no-store' }),
          Promise.resolve(createClient()),
        ])
        if (!versionRes.ok) return

        const version = (await versionRes.json()) as {
          commit?: string
          shortCommit?: string
          ref?: string
        }

        // Admins only — see the note above.
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        if (profile?.role !== 'admin') return

        const live = typeof version.commit === 'string' ? version.commit : ''
        if (!live || live === builtAt || cancelled) return

        setState({
          built: builtAt.slice(0, 7),
          live: live.slice(0, 7),
          ref: typeof version.ref === 'string' ? version.ref : '',
        })
      } catch {
        // Diagnostics must never take the app down with them.
      }
    }

    check()
    // Re-check every 5 minutes: a promotion can land while someone is logged in.
    const timer = setInterval(check, 5 * 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [builtAt])

  if (!state) return null

  return (
    <div
      role="alert"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '.5rem .75rem',
        padding: '.6rem .9rem',
        background: 'rgba(24, 16, 2, .97)',
        borderBottom: `1px solid ${WARN}`,
        color: '#fde68a',
        fontSize: '.8rem', lineHeight: 1.45,
        fontFamily: 'var(--font-poppins), Poppins, sans-serif',
        boxShadow: '0 10px 30px rgba(0,0,0,.45)',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '1rem' }}>⚠️</span>
      <span>
        <strong style={{ color: WARN }}>Stale deployment is live.</strong>{' '}
        This page was built from{' '}
        <code style={{ fontFamily: 'monospace' }}>{state.built}</code> but the server is
        answering with{' '}
        <code style={{ fontFamily: 'monospace' }}>{state.live}</code>
        {state.ref ? <> (<code style={{ fontFamily: 'monospace' }}>{state.ref}</code>)</> : null}.
        Your changes are merged — an older build is being served. Fix: Redeploy the newest{' '}
        <code style={{ fontFamily: 'monospace' }}>main</code> commit from Vercel (RUNBOOK §3).
      </span>
      <button
        type="button"
        onClick={() => setState(null)}
        aria-label="Dismiss stale deployment warning"
        style={{
          marginLeft: 'auto', background: 'transparent', border: 'none',
          color: '#fde68a', fontSize: '1.05rem', lineHeight: 1, cursor: 'pointer',
          padding: '.15rem .3rem',
        }}
      >
        ✕
      </button>
    </div>
  )
}
