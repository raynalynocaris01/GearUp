import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { ProfilePickupForm } from '@/components/ProfilePickupForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/user`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getPickupInfo(token: string) {
  try {
    const res = await fetch(`${API_URL}/user/pickup`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.pickup_info ?? null;
  } catch {
    return null;
  }
}

export default async function ProfilePickupPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user = await getCurrentUser();
  if (!user || !token) redirect('/login');

  const initial = await getPickupInfo(token);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar user={user} />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-6">
          <Link
            href="/profile"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to profile
          </Link>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">
            Pickup & Delivery
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Set once. This information appears on all your gear listings.
          </p>
        </div>
        <ProfilePickupForm initial={initial} />
      </div>
    </div>
  );
}