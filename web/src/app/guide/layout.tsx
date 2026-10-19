import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { GuideSidebar } from '@/components/guide/GuideSidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) redirect('/login');
  if (user.role !== 'guide') redirect('/');

  // Pending guide — show banner, no dashboard
  if (!user.is_approved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <div className="text-6xl mb-6">⏳</div>
          <h1 className="text-3xl font-black text-gray-900 mb-3">
            Your guide account is pending approval
          </h1>
          <p className="text-gray-600 leading-relaxed mb-8">
            Thanks for signing up to be a tour guide on GearUp. Our team is
            reviewing your application. You&apos;ll be able to accept bookings
            as soon as we approve it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <GuideSidebar
        guideName={user.name ?? 'Tour Guide'}
        guideEmail={user.email ?? ''}
      />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-6 py-10">{children}</div>
      </main>
    </div>
  );
}