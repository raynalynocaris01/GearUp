import { cookies } from 'next/headers';
import Link from 'next/link';
import { MyGearBookingsClient } from '@/components/MyGearBookingsClient';
import type { Booking } from '@gearup/shared';

export const dynamic = 'force-dynamic';
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function getMyGearBookings(token: string): Promise<Booking[]> {
  try {
    const res = await fetch(`${API_URL}/my/gear-bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function OwnerGearBookingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  const bookings = await getMyGearBookings(token);

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
            <Link
              href="/owner/gear"
              className="hover:text-gearup-600 transition"
            >
              My Gear
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-semibold">Rentals</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900">
            Gear Rentals
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Rentals of your own gear listings.
          </p>
        </div>
        <Link
          href="/owner/gear"
          className="text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 px-5 py-3 rounded-lg transition"
        >
          &larr; Back to My Gear
        </Link>
      </div>

      <MyGearBookingsClient
        bookings={bookings}
        detailHrefBase="/owner/gear/bookings"
      />
    </div>
  );
}