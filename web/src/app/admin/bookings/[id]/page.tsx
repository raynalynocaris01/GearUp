import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { BookingStatusTracker } from '@/components/BookingStatusTracker';
import { appImageSrc } from '@/components/AppImage';

export const dynamic = 'force-dynamic';
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface BookingGearLine {
  id: number;
  name: string;
  category: string;
  price_per_day: string;
  image_url: string | null;
  owner_id: number;
  pivot: {
    gear_item_id: number;
    quantity: number;
    subtotal: string;
  };
}

interface Booking {
  id: number;
  check_in: string | null;
  check_out: string | null;
  gear_start_date: string | null;
  gear_end_date: string | null;
  guests: number;
  total_price: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  user?: { id: number; name: string; email: string } | null;
  campsite?: {
    id: number;
    name: string;
    location: string;
    image_url: string;
    owner_id: number | null;
    owner?: { id: number; name: string; email: string } | null;
  } | null;
  tour_guide?: {
    id: number;
    name: string;
    price_per_trip: string;
  } | null;
  gear_item?: {
    id: number;
    name: string;
    category: string;
    price_per_day: string;
    image_url: string | null;
  } | null;
  gear_quantity: number | null;
  gear_items?: BookingGearLine[];
  review?: { id: number } | null;
}

async function getBooking(id: string, token: string): Promise<Booking | null> {
  try {
    const res = await fetch(`${API_URL}/admin/bookings/${id}`, {
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

function formatDate(iso: string | null): string {
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

function nightsBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

export default async function AdminBookingDetailPage({
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

  const cancelled = booking.status === 'cancelled';
  const isGearOnly = !booking.campsite && booking.gear_item;

  const startDate =
    isGearOnly && booking.gear_start_date
      ? booking.gear_start_date
      : booking.check_in;
  const endDate =
    isGearOnly && booking.gear_end_date
      ? booking.gear_end_date
      : booking.check_out;
  const nights = nightsBetween(startDate, endDate);

  const title =
    booking.campsite?.name ?? booking.gear_item?.name ?? 'Booking';

  const rawImage =
    booking.campsite?.image_url ?? booking.gear_item?.image_url ?? null;
  const imageUrl = rawImage ? appImageSrc(rawImage) : null;

  const hasMultiGear =
    booking.gear_items !== undefined && booking.gear_items.length > 0;

  // Full price breakdown
  const campsiteUnit = parseFloat(
    // campsite may not include price_per_night in the current endpoint,
    // so we guard with 0
    (booking.campsite as any)?.price_per_night ?? '0',
  );
  const isEntrance =
    (booking.campsite as any)?.price_unit === 'entrance';
  const campsiteSubtotal = booking.campsite
    ? isEntrance
      ? campsiteUnit * booking.guests
      : campsiteUnit * nights * booking.guests
    : 0;

  const guideSubtotal = booking.tour_guide
    ? parseFloat(booking.tour_guide.price_per_trip)
    : 0;

  const gearSubtotal = hasMultiGear
    ? booking.gear_items!.reduce(
        (sum, line) => sum + parseFloat(line.pivot.subtotal),
        0,
      )
    : booking.gear_item
      ? parseFloat(booking.gear_item.price_per_day) *
        nights *
        (booking.gear_quantity ?? 1)
      : 0;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
        <Link
          href="/admin/bookings"
          className="hover:text-gearup-600 transition"
        >
          Bookings
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">#{booking.id}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`inline-block text-[10px] font-extrabold tracking-wider px-2 py-1 rounded ${
                cancelled
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
              Booking #{booking.id}
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900">{title}</h1>
          {booking.campsite?.location && (
            <p className="text-sm text-gray-500 mt-1">
              {booking.campsite.location}
            </p>
          )}
          {isGearOnly && booking.gear_item?.category && (
            <p className="text-sm text-gearup-600 font-semibold mt-1">
              {booking.gear_item.category} - Rental only
            </p>
          )}
        </div>
        <Link
          href="/admin/bookings"
          className="text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition whitespace-nowrap"
        >
          &larr; Back
        </Link>
      </div>

      {/* Tracker */}
      <div className="mb-6">
        <BookingStatusTracker
          status={booking.status}
          createdAt={booking.created_at}
          confirmedAt={booking.confirmed_at}
          cancelledAt={booking.cancelled_at}
          completedAt={booking.completed_at}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {imageUrl && (
            <div className="relative h-56 bg-gray-100 rounded-2xl overflow-hidden">
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="768px"
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Customer */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Customer
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {booking.user?.name ?? 'Unknown'}
            </p>
            {booking.user?.email && (
              <p className="text-xs text-gray-500">{booking.user.email}</p>
            )}
          </div>

          {/* Campsite owner */}
          {booking.campsite && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Campsite Owner
              </p>
              {booking.campsite.owner ? (
                <>
                  <p className="text-sm font-semibold text-gray-900">
                    {booking.campsite.owner.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {booking.campsite.owner.email}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Platform-owned</p>
              )}
            </div>
          )}

          {/* Trip info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Trip
            </p>
            {startDate && endDate && (
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(startDate)} to {formatDate(endDate)}{' '}
                <span className="text-gray-500 font-normal">
                  ({nights} {nights === 1 ? 'day' : 'days'})
                </span>
              </p>
            )}
            {!isGearOnly && (
              <p className="text-sm text-gray-700 mt-1">
                {booking.guests}{' '}
                {booking.guests === 1 ? 'guest' : 'guests'}
              </p>
            )}
            {booking.tour_guide && (
              <Link
                href={`/tour-guides/${booking.tour_guide.id}`}
                className="mt-3 flex items-center gap-2 text-xs font-semibold text-gearup-700 bg-gearup-50 hover:bg-gearup-100 border border-gearup-200 rounded-lg px-3 py-2 transition"
              >
                Tour guide: {booking.tour_guide.name}
                <span className="ml-auto">&rarr;</span>
              </Link>
            )}
            {booking.notes && (
              <p className="text-xs text-gray-500 italic mt-4">
                &quot;{booking.notes}&quot;
              </p>
            )}
          </div>

          {/* Gear lines */}
          {hasMultiGear && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Gear Lines (all owners)
              </p>
              <div className="divide-y divide-gray-100">
                {booking.gear_items!.map((line) => (
                  <div
                    key={line.id}
                    className="py-3 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {line.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {line.category} - Owner #{line.owner_id}
                      </p>
                      <p className="text-xs text-gray-700 mt-1">
                        PHP {parseFloat(line.price_per_day).toFixed(2)} x{' '}
                        {nights} {nights === 1 ? 'day' : 'days'} x{' '}
                        {line.pivot.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                      PHP {parseFloat(line.pivot.subtotal).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: price breakdown */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-green-50 border border-green-200 rounded-2xl p-6">
            <p className="text-xs font-bold text-green-900 uppercase tracking-wider mb-4">
              Price Breakdown
            </p>

            <div className="space-y-2 text-sm text-green-900">
              {booking.campsite && campsiteSubtotal > 0 && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs">
                    Campsite x {nights}{' '}
                    {nights === 1 ? 'night' : 'nights'} x {booking.guests}
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    PHP {campsiteSubtotal.toFixed(2)}
                  </span>
                </div>
              )}

              {booking.tour_guide && guideSubtotal > 0 && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs">
                    Guide: {booking.tour_guide.name}
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    PHP {guideSubtotal.toFixed(2)}
                  </span>
                </div>
              )}

              {hasMultiGear && gearSubtotal > 0 && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs">
                    Gear ({booking.gear_items!.length} items)
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    PHP {gearSubtotal.toFixed(2)}
                  </span>
                </div>
              )}

              {!hasMultiGear && booking.gear_item && gearSubtotal > 0 && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs">
                    {booking.gear_item.name}
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    PHP {gearSubtotal.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-green-300 my-4" />

            <div className="flex justify-between items-center gap-2">
              <span className="text-sm font-bold text-green-900">
                Total
              </span>
              <span className="text-2xl font-black text-green-900 whitespace-nowrap">
                PHP {parseFloat(booking.total_price).toFixed(2)}
              </span>
            </div>

            <p className="text-[10px] text-green-700 mt-3 italic">
              Read-only. Contact the owner or customer for changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}