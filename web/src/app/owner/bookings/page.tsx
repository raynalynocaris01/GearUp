import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { OwnerBookingActions } from '@/components/owner/OwnerBookingActions';
export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface Booking {
  id: number;
  check_in: string | null;
  check_out: string | null;
  guests: number;
  total_price: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  user?: { id: number; name: string; email: string };
  campsite?: {
    id: number;
    name: string;
    image_url: string;
    location: string;
  } | null;
  tour_guide?: {
  id: number;
  name: string;
  price_per_trip: string;
} | null;
}

async function getBookings(token: string): Promise<Booking[]> {
  try {
    const res = await fetch(`${API_URL}/owner/bookings`, {
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function nightsBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

export default async function OwnerBookingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  const bookings = await getBookings(token);

  const pending = bookings.filter((b) => b.status === 'pending').length;
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Bookings</h1>
        <p className="text-gray-500 mt-2 text-sm">
          {bookings.length} total · {pending} pending · {confirmed} confirmed
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-lg font-semibold text-gray-700 mb-2">
            No bookings yet
          </p>
          <p className="text-sm text-gray-500">
            Once customers book your campsites, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const cancelled = b.status === 'cancelled';
            const nights = nightsBetween(b.check_in, b.check_out);

            return (
              <div
                key={b.id}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex ${
                  cancelled ? 'opacity-60' : ''
                }`}
              >
                <div className="relative w-40 shrink-0">
                  {b.campsite?.image_url ? (
                    <Image
                      src={b.campsite.image_url}
                      alt={b.campsite.name ?? 'Campsite'}
                      fill
                      sizes="160px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>

                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span
                        className={`inline-block text-[10px] font-extrabold tracking-wider px-2 py-1 rounded ${
                          cancelled
                            ? 'bg-red-100 text-red-700'
                            : b.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : b.status === 'completed'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {b.status.toUpperCase()}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 mt-2">
                        {b.campsite?.name ?? (b.tour_guide ? 'Tour Guide Booking' : 'Booking')}
                      </h3>
                      <p className="text-xs text-gray-500">
                        📍 {b.campsite?.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-gearup-600">
                        ₱{b.total_price}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Customer
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {b.user?.name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {b.user?.email}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {b.check_in && b.check_out ? 'Dates' : 'Details'}
                    </p>
                    {b.check_in && b.check_out ? (
                      <>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDate(b.check_in)} → {formatDate(b.check_out)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {nights} {nights === 1 ? 'night' : 'nights'} · {b.guests}{' '}
                          {b.guests === 1 ? 'guest' : 'guests'}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {b.guests} {b.guests === 1 ? 'guest' : 'guests'}
                      </p>
                    )}
                  </div>
                  </div>
                  {b.tour_guide && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-gearup-700 bg-gearup-50 border border-gearup-200 rounded-lg px-3 py-2">
                      🧭 Tour guide: {b.tour_guide.name}
                    </div>
                  )}

                  {b.notes && (
                    <p className="text-xs text-gray-500 mt-3 italic">
                      "{b.notes}"
                    </p>
                  )}

                  <div className="mt-4 flex justify-end">
                    <OwnerBookingActions
                      bookingId={b.id}
                      status={b.status}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}