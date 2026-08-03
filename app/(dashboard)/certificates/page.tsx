import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CertificatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, certsRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase
      .from('certificates')
      .select('*, courses(title, category)')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false }),
  ])

  const profile = profileRes.data
  const certificates = certsRes.data ?? []

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '.8rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '.4rem' }}>Learn</p>
        <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.1rem)', color: 'var(--text-hi)', letterSpacing: '-.02em' }}>
          Certificates
        </h1>
        <p style={{ marginTop: '.5rem', color: 'var(--text-lo)', fontSize: '.9rem' }}>Your earned certificates of completion.</p>
      </div>

      {certificates.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 16,
        }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(94,201,87,.08)', border: '2px solid rgba(94,201,87,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
            </svg>
          </div>
          <h3 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-hi)', marginBottom: '.75rem' }}>
            No certificates yet
          </h3>
          <p style={{ color: 'var(--text-lo)', maxWidth: '40ch', margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
            Complete a course to earn your first certificate of completion. Each completed course earns you a certificate you can share.
          </p>
          <a href="/catalog" style={{
            display: 'inline-flex', alignItems: 'center', gap: '.5rem',
            background: 'var(--eden)', color: 'var(--bg-0)', fontWeight: 600,
            padding: '.75rem 1.5rem', borderRadius: 10, textDecoration: 'none', fontSize: '.9rem',
          }}>
            Start a Course
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: '1.5rem' }}>
          {certificates.map(cert => {
            const course = Array.isArray(cert.courses) ? cert.courses[0] : cert.courses
            const issuedDate = cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
            return (
              <div key={cert.id} style={{
                background: 'linear-gradient(135deg,#0c2018,#111f1d)',
                border: '1px solid rgba(94,201,87,.25)',
                borderRadius: 16, padding: '2rem',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(94,201,87,.06)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(94,201,87,.04)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(94,201,87,.15)', border: '2px solid rgba(94,201,87,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--eden)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '.2rem' }}>Certificate of Completion</p>
                    <p style={{ fontSize: '.75rem', color: 'var(--text-lo)' }}>Eden Life Academy</p>
                  </div>
                </div>
                <h3 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-hi)', marginBottom: '.5rem' }}>
                  {course?.title ?? 'Course Completed'}
                </h3>
                <p style={{ fontSize: '.85rem', color: 'var(--text-md)', marginBottom: '.5rem' }}>Awarded to {profile?.full_name ?? 'Member'}</p>
                <p style={{ fontSize: '.78rem', color: 'var(--text-lo)' }}>{issuedDate}</p>
                {cert.certificate_number && (
                  <p style={{ fontSize: '.68rem', color: 'var(--text-lo)', marginTop: '.75rem', fontFamily: 'monospace' }}>#{cert.certificate_number}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
