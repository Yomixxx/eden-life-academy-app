'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface LiveClassInfo {
  level: string
  meet_url: string | null
  schedule_label: string | null
  is_live: boolean
}

// Shown on the student dashboard for every cohort student, live or not.
//
// This used to render nothing at all unless the admin had already flipped
// "Go Live", which meant a student who opened the app at 8:20 on a Saturday
// had no idea a class was happening, no schedule, and no join button — and
// when the host started the meeting without saving a Meet link, the banner
// said "class is live now" but still rendered no button. Both cases now
// render a visible card that explains itself. When a Meet link is available,
// the join button is visible before the class starts and turns red when live.
//
// Polls class_links so the button appears within ~20 seconds of the admin
// going live, even if the dashboard was rendered before that.
export default function LiveClassBanner({ level, courseHref, initial }: {
  level: string
  courseHref: string
  initial: LiveClassInfo | null
}) {
  const [info, setInfo] = useState<LiveClassInfo | null>(initial)
  const [checking, setChecking] = useState(false)
  // True once a read of class_links has failed repeatedly without ever
  // succeeding, so a broken table/policy is visible instead of silent.
  const [loadFailed, setLoadFailed] = useState(false)
  const everLoadedRef = useRef(initial != null)
  const failuresRef = useRef(0)
  const supabase = createClient()

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from('class_links').select('*').eq('level', level).maybeSingle()
    if (error) {
      // Keep the last known state on transient errors. But if we have never
      // loaded at all, surface it after a couple of consecutive failures
      // rather than quietly showing "not live yet" forever.
      if (!everLoadedRef.current) {
        failuresRef.current += 1
        if (failuresRef.current >= 2) {
          console.error('[LiveClassBanner] class_links read failed for level', level, error)
          setLoadFailed(true)
        }
      }
      return
    }
    failuresRef.current = 0
    everLoadedRef.current = true
    setLoadFailed(false)
    if (data) setInfo(data as LiveClassInfo)
  }, [level])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 20000)
    return () => clearInterval(id)
  }, [refresh])

  async function checkNow() {
    setChecking(true)
    await refresh()
    setChecking(false)
  }

  const live = !!info?.is_live
  const meetUrl = info?.meet_url ?? null
  const schedule = info?.schedule_label ?? null

  const heading = live ? `${level} Level class is live now` : `${level} Level class`
  const sub = live
    ? (schedule ?? 'Join using the button on the right.')
    : (schedule ?? 'Not live yet.')

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '1rem', flexWrap: 'wrap',
      background: live
        ? 'linear-gradient(135deg,rgba(239,68,68,.14),rgba(239,68,68,.05))'
        : 'var(--bg-2)',
      border: `1px solid ${live ? 'rgba(239,68,68,.35)' : 'var(--border)'}`,
      borderRadius: 14, padding: '1rem 1.5rem',
      marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
          background: live ? '#ef4444' : 'var(--text-lo)',
          animation: live ? 'livepulse 1.4s ease-in-out infinite' : 'none',
          opacity: live ? 1 : .5,
        }} />
        <div>
          <p style={{
            margin: 0, fontWeight: 700, fontSize: '.95rem',
            color: live ? '#ff6666' : 'var(--text-hi)',
          }}>
            {heading}
          </p>
          <p style={{ margin: 0, fontSize: '.78rem', color: 'var(--text-lo)' }}>{sub}</p>
          {!live && (
            <p style={{ margin: 0, fontSize: '.78rem', color: 'var(--text-lo)' }}>
              Your join button turns red when your host starts the class.
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '.6rem', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
        {meetUrl && (
          <a
            href={meetUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={!live ? 'Turns red when host starts' : undefined}
            style={{
              background: live ? '#ef4444' : 'var(--bg-3)',
              color: live ? '#fff' : 'var(--text-md)',
              fontSize: '.8rem', fontWeight: 700,
              padding: '.55rem 1.1rem', borderRadius: 8, textDecoration: 'none',
              minHeight: 40, display: 'inline-flex', alignItems: 'center',
            }}
          >
            {live ? 'Join Class' : 'Join Class — Not live yet'}
          </a>
        )}

        {!meetUrl && !live && (
          // Keep the join-button position occupied before the host has saved
          // a Meet link. This makes the dashboard predictable instead of
          // making the button appear to be missing.
          <span
            aria-disabled="true"
            title="The meeting link will appear here when your host posts it."
            style={{
              background: 'var(--bg-3)', color: 'var(--text-lo)',
              border: '1px solid var(--border)', fontSize: '.8rem', fontWeight: 700,
              padding: '.55rem 1.1rem', borderRadius: 8,
              minHeight: 40, display: 'inline-flex', alignItems: 'center',
              cursor: 'default',
            }}
          >
            Join Class
          </span>
        )}

        {live && !meetUrl && (
          // Live but no link saved by the host yet. Rendering nothing here is
          // exactly what "I can't find the live button" looked like, so say
          // what's happening and give a way to re-check without reloading.
          <span style={{
            fontSize: '.78rem', fontWeight: 600, color: '#fbbf24',
            background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.3)',
            borderRadius: 8, padding: '.55rem .85rem', maxWidth: '32ch',
          }}>
            Your host is posting the meeting link — it appears here automatically.
          </span>
        )}

        {live && !meetUrl && (
          <button
            onClick={checkNow}
            disabled={checking}
            style={{
              background: 'var(--bg-3)', color: 'var(--text-md)', border: '1px solid var(--border)',
              fontSize: '.8rem', fontWeight: 600, padding: '.55rem 1.1rem', borderRadius: 8,
              cursor: checking ? 'default' : 'pointer', opacity: checking ? .6 : 1,
              minHeight: 40,
            }}
          >
            {checking ? 'Checking…' : 'Check again'}
          </button>
        )}

        <a
          href={courseHref}
          style={{
            background: live ? 'rgba(239,68,68,.15)' : 'var(--bg-3)',
            color: live ? '#ff6666' : 'var(--text-md)',
            fontSize: '.8rem', fontWeight: 600,
            padding: '.55rem 1.1rem', borderRadius: 8, textDecoration: 'none',
            minHeight: 40, display: 'inline-flex', alignItems: 'center',
          }}
        >
          Open course
        </a>
      </div>

      {loadFailed && !info && (
        <p style={{ width: '100%', margin: 0, fontSize: '.78rem', color: '#fca5a5' }}>
          We can&rsquo;t load live class information right now — please refresh the page in a minute.
        </p>
      )}

      <style>{`@keyframes livepulse{0%,100%{opacity:1}50%{opacity:.2}}`}</style>
    </div>
  )
}
