import Link from 'next/link';
import { signOut } from '@/app/actions/auth';
import type { Profile } from '@/lib/types';

export default function Nav({ profile }: { profile: Profile | null }) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--bg-0)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '1.1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.1rem',
              color: 'var(--text-hi)',
              letterSpacing: '-.02em',
            }}
          >
            Eden<span style={{ color: 'var(--eden)' }}>Life</span>
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '.62rem',
              letterSpacing: '.28em',
              textTransform: 'uppercase',
              color: 'var(--eden)',
              paddingLeft: '.75rem',
              borderLeft: '1px solid var(--border-hi)',
            }}
          >
            Academy
          </span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', fontSize: '.85rem' }}>
          <Link href="/dashboard" style={{ color: 'var(--text-md)' }}>Courses</Link>
          <Link href="/profile" style={{ color: 'var(--text-md)' }}>Profile</Link>
          {profile?.role === 'admin' && (
            <Link href="/admin" style={{ color: 'var(--eden)', fontWeight: 600 }}>Admin</Link>
          )}
          <form action={signOut}>
            <button type="submit" className="btn btn-ghost" style={{ padding: '.55rem 1rem', fontSize: '.82rem' }}>
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
