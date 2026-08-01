import { getCurrentUserAndProfile } from '@/lib/get-profile';
import Nav from '@/components/Nav';
import ProfileForm from '@/components/ProfileForm';

export default async function ProfilePage() {
  const { profile } = await getCurrentUserAndProfile();

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg-1)' }}>
      <Nav profile={profile} />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-hi)', letterSpacing: '-.02em', marginBottom: '2rem' }}>
          Your Profile
        </h1>

        {profile && <ProfileForm profile={profile} />}
      </main>
    </div>
  );
}
