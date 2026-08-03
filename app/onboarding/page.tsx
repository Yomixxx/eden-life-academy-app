'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

const STEPS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 6.1H3M21 12.1H3M15.1 18H3"/>
      </svg>
    ),
    title: 'A Word From Pastor Gbenga Ajibola',
    desc: 'Beloved, I am glad you are here. Eden Life Academy exists to equip you for Christ and a life of exploits, not just to inform you, but to transform you. You are not a visitor. You are family.',
    cta: undefined,
    href: undefined,
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
    title: 'Your first course is ready',
    desc: 'Growth Steps is the foundation every Eden Life member builds on. Start Lesson 1 now — it takes about 20 minutes.',
    cta: 'Start Growth Steps',
    href: '/courses',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    title: 'Read Scripture every day',
    desc: 'The Bible section gives you access to all 66 books in multiple translations. Set aside 10 minutes daily.',
    cta: 'Open the Bible',
    href: '/bible',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
    title: 'Ask our AI Study Assistant',
    desc: 'Got a question about Scripture or Christian living? Ask our AI — it answers from a biblical, pastoral perspective.',
    cta: 'Ask a Question',
    href: '/ask',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('Friend')
  const [step, setStep] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      supabase.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => {
        if (data?.full_name) setName(data.full_name.split(' ')[0])
      })
    })
  }, [])

  const current = STEPS[step]

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem', marginBottom: '3rem' }}>
          <Image src="/logo-white.png" alt="Eden Life Experience Centre" width={52} height={52} style={{ height: 52, width: 'auto' }} />
          <span style={{ fontSize: '.6rem', fontWeight: 700, letterSpacing: '.32em', textTransform: 'uppercase', color: 'var(--eden)', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>Academy</span>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ height: 4, borderRadius: 99, transition: 'all .3s', background: i <= step ? 'var(--eden)' : 'var(--border)', width: i === step ? 32 : 16 }} />
          ))}
        </div>

        {/* Card */}
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-hi)', borderRadius: 20, padding: '2.5rem', textAlign: 'center' }}>
          {step === 0 && (
            <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '1rem' }}>Welcome, {name}!</p>
          )}

          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(94,201,87,.1)', border: '1px solid rgba(94,201,87,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            {current.icon}
          </div>

          <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.55rem', color: 'var(--text-hi)', letterSpacing: '-.02em', marginBottom: '.75rem', lineHeight: 1.2 }}>
            {current.title}
          </h2>
          <p style={{ color: 'var(--text-md)', lineHeight: 1.7, fontSize: '.95rem', marginBottom: '2rem' }}>
            {current.desc}
          </p>

          {current.href ? (
            <a href={current.href} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
              width: '100%', padding: '1rem', borderRadius: 10, textDecoration: 'none',
              background: 'var(--eden)', color: 'var(--bg-0)', fontWeight: 700, fontSize: '.95rem',
              boxShadow: '0 8px 26px rgba(94,201,87,.28)', transition: 'opacity .2s',
            }}>
              {current.cta}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          ) : (
            <button onClick={() => setStep(s => s + 1)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
              width: '100%', border: 'none', cursor: 'pointer', padding: '1rem', borderRadius: 10,
              background: 'var(--eden)', color: 'var(--bg-0)', fontWeight: 700, fontSize: '.95rem',
              boxShadow: '0 8px 26px rgba(94,201,87,.28)', transition: 'opacity .2s',
              fontFamily: 'var(--font-poppins), Poppins, sans-serif',
            }}>
              Continue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          )}

          {step < STEPS.length - 1 && current.href && (
            <button onClick={() => setStep(s => s + 1)} style={{ marginTop: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-lo)', fontSize: '.88rem', padding: '.5rem', fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}>
              Show me what else is here →
            </button>
          )}
          {step === STEPS.length - 1 && (
            <a href="/dashboard" style={{ display: 'block', marginTop: '1rem', color: 'var(--text-lo)', fontSize: '.88rem', textDecoration: 'none' }}>
              Go to my dashboard →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
