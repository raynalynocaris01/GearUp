import Image from 'next/image';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { CancelBookingButton } from '@/components/CancelBookingButton';
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
  campsite?: {
    id: number;
    name: string;
    location: string;
    image_url: string;
  } | null;
  tour_guide?: {
  id: number;
  name: string;
  price_per_trip: string;
} | null;
  review?: { id: number } | null;
}

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

async function getBookings(token: string): Promise<Booking[]> {
  try {
    const res = await fetch(`${API_URL}/bookings`, {
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

export default async function BookingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) redirect('/login');

  const [user, bookings] = await Promise.all([
    getCurrentUser(),
    getBookings(token),
  ]);

  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-900">
              My Bookings
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              {bookings.length}{' '}
              {bookings.length === 1 ? 'booking' : 'bookings'} total
            </p>
          </div>
          <Link
            href="/campsites"
            className="text-gearup-600 font-semibold text-sm hover:underline"
          >
            Browse more →
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-lg font-semibold text-gray-700 mb-2">
              No bookings yet
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Explore campsites and book your first adventure.
            </p>
            <Link
              href="/campsites"
              className="inline-block bg-gearup-600 hover:bg-gearup-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Explore Campsites
            </Link>
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
                  {/* Image */}
                  <div className="relative w-40 shrink-0">
                    {b.campsite?.image_url ? (
                      <Image
                        src={b.campsite.image_url}
                        alt={b.campsite.name}
                        fill
                        sizes="160px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
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
                          {cancelled
                            ? 'CANCELLED'
                            : b.status === 'pending'
                              ? 'PENDING'
                              : b.status === 'completed'
                                ? 'COMPLETED'
                                : 'CONFIRMED'}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 mt-2">
                          {b.campsite?.name ?? 'Campsite'}
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

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mt-4">
                      {b.check_in && b.check_out && (
                        <span>
                          📅 {formatDate(b.check_in)} → {formatDate(b.check_out)} (
                          {nights} {nights === 1 ? 'night' : 'nights'})
                        </span>
                      )}
                      <span>
                        👥 {b.guests} {b.guests === 1 ? 'guest' : 'guests'}
                      </span>
                      {b.tour_guide && (
                        <Link
                          href={`/tour-guides/${b.tour_guide.id}`}
                          className="flex items-center gap-1 text-gearup-700 font-semibold hover:underline"
                        >
                          🧭 Guide: {b.tour_guide.name}
                        </Link>
                      )}
                    </div>

                    {b.notes && (
                      <p className="text-xs text-gray-500 mt-3 italic">
                        "{b.notes}"
                      </p>
                    )}

                    {/* Action buttons — depend on status */}
                    {b.status === 'pending' || b.status === 'confirmed' ? (
                      <div className="mt-4 flex justify-end">
                        <CancelBookingButton bookingId={b.id} />
                      </div>
                    ) : b.status === 'completed' ? (
                    <div className="mt-4 flex justify-end">
                      {b.review ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gearup-700 bg-gearup-50 border border-gearup-200 px-4 py-2 rounded-lg">
                          ✓ Reviewed
                        </span>
                      ) : (
                        <a
                          href={`/campsites/${b.campsite?.id}`}
                          className="inline-block text-sm font-semibold text-white bg-gearup-600 hover:bg-gearup-700 px-5 py-2.5 rounded-lg transition"
                        >
                          Leave a review
                        </a>
                      )}
                    </div>
                  ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}