'use client'

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--bg-0)', minHeight: '100svh', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <button
            onClick={() => window.history.back()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', color: 'var(--eden)', fontSize: '.85rem', fontWeight: 500, textDecoration: 'none', marginBottom: '2rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Back
          </button>
          <p style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--eden)', marginBottom: '.5rem' }}>Legal</p>
          <h1 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 800, fontSize: '2rem', color: 'var(--text-hi)', letterSpacing: '-.02em', margin: 0 }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-lo)', fontSize: '.88rem', marginTop: '.5rem' }}>Last updated: June 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', color: 'var(--text-md)', lineHeight: 1.75, fontSize: '.95rem' }}>

          <section>
            <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-hi)', marginBottom: '.75rem' }}>1. Who We Are</h2>
            <p>Eden Life Academy is operated by Eden Life Experience Centre, a church based in Lagos, Nigeria, with campuses on the Mainland (Ogudu) and Island (Ajah). This platform provides discipleship courses, sermon archives, and community resources for our members.</p>
            <p style={{ marginTop: '.75rem' }}>For questions about this policy, contact us at <a href="mailto:communication@edenlifeng.org" style={{ color: 'var(--eden)' }}>communication@edenlifeng.org</a>.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-hi)', marginBottom: '.75rem' }}>2. Information We Collect</h2>
            <p>When you create an account or use Eden Life Academy, we collect:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '.75rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              <li><strong style={{ color: 'var(--text-hi)' }}>Account information</strong> — your full name, email address, and campus location</li>
              <li><strong style={{ color: 'var(--text-hi)' }}>Profile information</strong> — phone number and bio, if you choose to provide them</li>
              <li><strong style={{ color: 'var(--text-hi)' }}>Activity data</strong> — courses you enrol in, lessons you complete, and progress through learning tracks</li>
              <li><strong style={{ color: 'var(--text-hi)' }}>Authentication data</strong> — if you sign in with Google, we receive your name, email address, and profile picture from Google</li>
              <li><strong style={{ color: 'var(--text-hi)' }}>Usage data</strong> — standard server logs including IP address and browser type</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-hi)', marginBottom: '.75rem' }}>3. How We Use Your Information</h2>
            <p>We use your information solely to:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '.75rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              <li>Provide you with access to courses, sermons, and content on the platform</li>
              <li>Track and display your learning progress and issued certificates</li>
              <li>Send you transactional emails (account confirmation, password reset)</li>
              <li>Send church announcements relevant to your campus</li>
              <li>Allow church leaders to support your discipleship journey</li>
            </ul>
            <p style={{ marginTop: '.75rem' }}>We do <strong style={{ color: 'var(--text-hi)' }}>not</strong> sell your personal data to any third party. We do not use your data for advertising.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-hi)', marginBottom: '.75rem' }}>4. Data Storage and Security</h2>
            <p>Your data is stored securely using <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--eden)' }}>Supabase</a> (hosted on AWS in the EU), and our platform is deployed on <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--eden)' }}>Vercel</a>. Both providers comply with industry-standard security practices. Access to your data is restricted to authorised church administrators only.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-hi)', marginBottom: '.75rem' }}>5. Your Rights (NDPA)</h2>
            <p>Under the Nigeria Data Protection Act (NDPA) 2023, you have the right to:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '.75rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              <li><strong style={{ color: 'var(--text-hi)' }}>Access</strong> — request a copy of the personal data we hold about you</li>
              <li><strong style={{ color: 'var(--text-hi)' }}>Correction</strong> — request that inaccurate data be corrected</li>
              <li><strong style={{ color: 'var(--text-hi)' }}>Deletion</strong> — request that your account and associated data be deleted</li>
              <li><strong style={{ color: 'var(--text-hi)' }}>Objection</strong> — object to specific uses of your data</li>
            </ul>
            <p style={{ marginTop: '.75rem' }}>To exercise any of these rights, email us at <a href="mailto:communication@edenlifeng.org" style={{ color: 'var(--eden)' }}>communication@edenlifeng.org</a>.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-hi)', marginBottom: '.75rem' }}>6. Cookies</h2>
            <p>We use session cookies strictly necessary for authentication. We do not use advertising or analytics cookies. No consent banner is required as we do not use non-essential cookies.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-hi)', marginBottom: '.75rem' }}>7. Children</h2>
            <p>Eden Life Academy is not directed at children under 13. If you believe a child has created an account, please contact us and we will delete it promptly.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-hi)', marginBottom: '.75rem' }}>8. Changes to This Policy</h2>
            <p>We may update this policy from time to time. We will notify you of significant changes via email or an in-app announcement. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section style={{ padding: '1.5rem', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 14 }}>
            <p style={{ margin: 0, fontSize: '.88rem' }}>
              <strong style={{ color: 'var(--text-hi)' }}>Questions?</strong> Contact our data protection team at{' '}
              <a href="mailto:communication@edenlifeng.org" style={{ color: 'var(--eden)', fontWeight: 500 }}>communication@edenlifeng.org</a>
              {' '}— Eden Life Experience Centre, Lagos, Nigeria.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
