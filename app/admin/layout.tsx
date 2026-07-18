import { redirect } from 'next/navigation';
import { getCurrentUserAndProfile } from '@/lib/get-profile';
import Nav from '@/components/Nav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) redirect('/login');
  if (profile?.role !== 'admin') redirect('/dashboard');

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg-1)' }}>
      <Nav profile={profile} />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>{children}</main>
    </div>
  );
}
