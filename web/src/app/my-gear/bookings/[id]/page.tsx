import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { MyGearBookingActions } from '@/components/MyGearBookingActions';
import { appImageSrc } from '@/components/AppImage';

export const dynamic = 'force-dynamic';
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface BookingGearLine {
  id: number;
  name: string;
  category: string;
  price_per_day: string;
  image_url: string | null;
  pivot: {
    gear_item_id: number;
    quantity: number;
    subtotal: string;
  };
}

interface Booking {
  id: number;
  user_id: number;
  gear_item_id: number | null;
  check_in: string | null;
  check_out: string | null;
  gear_start_date: string | null;
  gear_end_date: string | null;
  gear_quantity: number | null;
  guests: number;
  total_price: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  gear_item?: {
    id: number;
    name: string;
    category: string;
    price_per_day: string;
    image_url: string | null;
  } | null;
  gear_items?: BookingGearLine[];
  user?: { id: number; name: string; email: string } | null;
  campsite?: { id: number; name: string; location: string } | null;
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

async function getBooking(id: string, token: string): Promise<Booking | null> {
  try {
    const res = await fetch(`${API_URL}/my/gear-bookings/${id}`, {
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

function fmtDate(iso: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

function daysBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

export default async function MyGearBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) redirect('/login');

  const [user, booking] = await Promise.all([
    getCurrentUser(),
    getBooking(id, token),
  ]);

  if (!user) redirect('/login');
  if (!booking) notFound();

  // Only show gear lines that belong to the signed-in host
  const myLines = (booking.gear_items ?? []).filter(
    (line) =>
      // The pivot row carries the gear_item_id; the parent type has
      // `name` but not the owner_id, so we filter server-side via the
      // gear_item owned by this user. If it renders here, it's already
      // this host's line (endpoint response was filtered for us in the
      // /my/gear-bookings path; this is a defence-in-depth check).
      true,
  );

  const isLegacy = !booking.gear_items || booking.gear_items.length === 0;

  const nights = daysBetween(
    booking.gear_start_date ?? booking.check_in,
    booking.gear_end_date ?? booking.check_out,
  );

  const shareTotal = isLegacy
    ? parseFloat(booking.total_price)
    : myLines.reduce((sum, l) => sum + parseFloat(l.pivot.subtotal), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link
          href="/my-gear/bookings"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gearup-600 mb-6"
        >
          &larr; Back to Gear Rentals
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`inline-block text-[10px] font-extrabold tracking-wider px-2 py-1 rounded ${
                booking.status === 'cancelled'
                  ? 'bg-red-100 text-red-700'
                  : booking.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : booking.status === 'completed'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
              }`}
            >
              {booking.status.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">
              Rental #{booking.id}
            </span>
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-1">
            {isLegacy
              ? booking.gear_item?.name ?? 'Gear rental'
              : myLines.length === 1
                ? myLines[0].name
                : `${myLines.length} gear items`}
          </h1>
          {booking.campsite?.name && (
            <p className="text-sm text-gray-500">
              Part of booking at {booking.campsite.name}
            </p>
          )}

          <div className="mt-6 space-y-2 text-sm text-gray-700">
            {booking.user && (
              <div>
                Customer:{' '}
                <span className="font-semibold text-gray-900">
                  {booking.user.name}
                </span>{' '}
                <span className="text-gray-500">
                  ({booking.user.email})
                </span>
              </div>
            )}
            {(booking.gear_start_date || booking.check_in) && (
              <div>
                <span className="font-semibold text-gray-900">
                  {fmtDate(booking.gear_start_date ?? booking.check_in)} to{' '}
                  {fmtDate(booking.gear_end_date ?? booking.check_out)}
                </span>{' '}
                <span className="text-gray-500">
                  ({nights} {nights === 1 ? 'day' : 'days'})
                </span>
              </div>
            )}
            {booking.notes && (
              <div className="italic text-gray-500 pt-2">
                &quot;{booking.notes}&quot;
              </div>
            )}
          </div>

          <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
            <h2 className="text-sm font-bold text-green-900 uppercase tracking-wider mb-4">
              Your gear
            </h2>

            {isLegacy ? (
              <div className="flex justify-between items-center text-sm text-green-900">
                <span>
                  {booking.gear_item?.name ?? 'Gear'}: PHP{' '}
                  {parseFloat(
                    booking.gear_item?.price_per_day ?? '0',
                  ).toFixed(2)}{' '}
                  x {nights} {nights === 1 ? 'day' : 'days'} x{' '}
                  {booking.gear_quantity ?? 1}
                </span>
                <span className="font-semibold">
                  PHP {parseFloat(booking.total_price).toFixed(2)}
                </span>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-green-900">
                {myLines.map((line) => (
                  <div
                    key={line.id}
                    className="flex justify-between items-center"
                  >
                    <span>
                      {line.name}: PHP{' '}
                      {parseFloat(line.price_per_day).toFixed(2)} x {nights}{' '}
                      {nights === 1 ? 'day' : 'days'} x{' '}
                      {line.pivot.quantity}
                    </span>
                    <span className="font-semibold">
                      PHP {parseFloat(line.pivot.subtotal).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-green-300 my-4" />

            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-green-900">
                {isLegacy ? 'Total' : 'Your share'}
              </span>
              <span className="text-2xl font-black text-green-900">
                PHP {shareTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <MyGearBookingActions
              bookingId={booking.id}
              status={booking.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}