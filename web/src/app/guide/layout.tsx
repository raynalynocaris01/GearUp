import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { GuideSidebar } from '@/components/guide/GuideSidebar';
import Link from 'next/link';
import { Clock } from 'lucide-react';

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
          <Clock className="h-16 w-16 text-amber-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-gray-900 mb-3">
            Your guide account is pending approval
          </h1>
          <p className="text-gray-600 leading-relaxed mb-8">
            Thanks for signing up to be a tour guide on GearUp. Our team is
            reviewing your application. You&apos;ll be able to accept bookings
            as soon as we approve it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/guide-onboarding"
              className="inline-flex items-center gap-2 bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-sm px-6 py-3 rounded-lg transition"
            >
              Upload / replace resume
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm px-6 py-3 rounded-lg transition"
            >
              Continue as Customer
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <GuideSidebar
        guideName={user.name ?? 'Tour Guide'}
        guideEmail={user.email ?? ''}
      />
      <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden lg:w-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
