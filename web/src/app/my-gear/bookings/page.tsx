import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { MyGearBookingsClient } from '@/components/MyGearBookingsClient';

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

async function getBookings(token: string) {
  try {
    const res = await fetch(`${API_URL}/my/gear-bookings`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function MyGearBookingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user = await getCurrentUser();
  if (!user || !token) redirect('/login');

  const bookings = await getBookings(token);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">
              Gear Rentals
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Bookings on your own gear listings.
            </p>
          </div>
          <Link
            href="/my-gear"
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            &larr; My Gear
          </Link>
        </div>

        <MyGearBookingsClient bookings={bookings} />
      </div>
    </div>
  );
}