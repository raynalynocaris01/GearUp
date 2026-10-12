import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { MyGearBookingActions } from '@/components/MyGearBookingActions';

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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  gear_start_date: string | null;
  gear_end_date: string | null;
  check_in: string | null;
  check_out: string | null;
  gear_quantity: number | null;
  total_price: string;
  gear_item_id: number | null;
  gear_item?: {
    id: number;
    name: string;
    category: string;
    price_per_day: string;
  } | null;
  gear_items?: BookingGearLine[];
  user?: { id: number; name: string; email: string } | null;
  campsite?: { id: number; name: string } | null;
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

export default async function OwnerGearBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) notFound();

  const booking = await getBooking(id, token);
  if (!booking) notFound();

  const isLegacy = !booking.gear_items || booking.gear_items.length === 0;
  const nights = daysBetween(
    booking.gear_start_date ?? booking.check_in,
    booking.gear_end_date ?? booking.check_out,
  );

  const shareTotal = isLegacy
    ? parseFloat(booking.total_price)
    : booking.gear_items!.reduce(
        (sum, l) => sum + parseFloat(l.pivot.subtotal),
        0,
      );

  const headerTitle = isLegacy
    ? booking.gear_item?.name ?? 'Gear rental'
    : booking.gear_items!.length === 1
      ? booking.gear_items![0].name
      : `${booking.gear_items!.length} gear items`;

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
          <Link
            href="/owner/gear"
            className="hover:text-gearup-600 transition"
          >
            My Gear
          </Link>
          <span>/</span>
          <Link
            href="/owner/gear/bookings"
            className="hover:text-gearup-600 transition"
          >
            Rentals
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">#{booking.id}</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900">{headerTitle}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Status + Customer */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
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

            {booking.user && (
              <div className="text-sm">
                <p className="text-xs text-gray-500 mb-1">Customer</p>
                <p className="font-semibold text-gray-900">
                  {booking.user.name}
                </p>
                <p className="text-xs text-gray-500">{booking.user.email}</p>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Rental dates
            </p>
            <p className="text-sm text-gray-900 font-semibold">
              {fmtDate(booking.gear_start_date ?? booking.check_in)} to{' '}
              {fmtDate(booking.gear_end_date ?? booking.check_out)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {nights} {nights === 1 ? 'day' : 'days'}
            </p>
            {booking.notes && (
              <p className="text-xs text-gray-500 italic mt-3">
                &quot;{booking.notes}&quot;
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
              Actions
            </p>
            <MyGearBookingActions
              bookingId={booking.id}
              status={booking.status}
            />
          </div>
        </div>

        {/* Price breakdown */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-green-50 border border-green-200 rounded-2xl p-6">
            <p className="text-xs font-bold text-green-900 uppercase tracking-wider mb-4">
              Your gear
            </p>

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
              </div>
            ) : (
              <div className="space-y-2 text-sm text-green-900">
                {booking.gear_items!.map((line) => (
                  <div key={line.id}>
                    <p className="font-semibold">{line.name}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">
                        PHP {parseFloat(line.price_per_day).toFixed(2)} x{' '}
                        {nights} {nights === 1 ? 'day' : 'days'} x{' '}
                        {line.pivot.quantity}
                      </span>
                      <span className="font-semibold">
                        PHP {parseFloat(line.pivot.subtotal).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-green-300 my-4" />

            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-green-900">
                Your share
              </span>
              <span className="text-2xl font-black text-green-900">
                PHP {shareTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}