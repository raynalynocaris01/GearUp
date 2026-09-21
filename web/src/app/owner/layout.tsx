import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { OwnerTabs } from '@/components/owner/OwnerTabs';

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

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Not logged in → login
  if (!user) redirect('/login');

  // Not an owner → home
  if (user.role !== 'owner') redirect('/');

  // Owner but not approved → pending page
  if (!user.is_approved) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <div className="text-6xl mb-6">⏳</div>
          <h1 className="text-3xl font-black text-gray-900 mb-3">
            Your account is pending approval
          </h1>
          <p className="text-gray-600 leading-relaxed mb-8">
            Thanks for signing up as a business owner on GearUp. Our team is
            reviewing your account. You'll be able to post your campsites as
            soon as we approve it.
          </p>
          <p className="text-sm text-gray-500">
            You can still browse and book as a customer in the meantime.
          </p>
          <a
            href="/"
            className="inline-block mt-8 bg-gearup-600 hover:bg-gearup-700 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Continue as Customer
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <OwnerTabs />
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}