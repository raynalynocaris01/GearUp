import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { CancelBookingButton } from '@/components/CancelBookingButton';
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
  pivot: {
    gear_item_id: number;
    quantity: number;
    subtotal: string;
  };
}

interface BookingPricingLineLocal {
  id: number;
  booking_id: number;
  pricing_line_id: number;
  quantity: number;
  amount: string;
  subtotal: string;
  pricing_line?: {
    id: number;
    label: string;
    unit: 'per_person' | 'per_tent' | 'per_night' | 'flat';
    applies_to: 'any' | 'adult' | 'child' | 'senior' | 'pwd';
    is_optional: boolean;
  };
}

interface Booking {
  id: number;
  check_in: string | null;
  check_out: string | null;
  gear_start_date: string | null;
  gear_end_date: string | null;
  guests: number;
  adults?: number;
  children?: number;
  seniors?: number;
  pwd?: number;
  pricing_mode?: 'simple' | 'detailed';
  pricing_lines?: BookingPricingLineLocal[];
  guide_status?: 'pending' | 'accepted' | 'declined' | null;
  total_price: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  created_at?: string;
  confirmed_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  campsite?: {
    id: number;
    name: string;
    location: string;
    region?: string;
    image_url: string;
    price_per_night?: string;
    price_unit?: string;
  } | null;
  room_campsite?: {
    id: number;
    name: string;
    price_per_night: string;
    price_unit: string;
    capacity: number;
    image_url: string;
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
    const res = await fetch(`${API_URL}/bookings/${id}`, {
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
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

export default async function BookingDetailPage({
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
  const nights = daysBetween(startDate, endDate);

  const title =
    booking.campsite?.name ?? booking.gear_item?.name ?? 'Booking';

  const rawImage =
    booking.campsite?.image_url ?? booking.gear_item?.image_url ?? null;
  const imageUrl = rawImage ? appImageSrc(rawImage) : null;

  const hasMultiGear =
    booking.gear_items !== undefined && booking.gear_items.length > 0;

  // Price breakdown math
  const roomUnit = parseFloat(
    booking.room_campsite?.price_per_night ?? '0',
  );
  const isRoom = !!booking.room_campsite;

  const campsiteUnit = parseFloat(booking.campsite?.price_per_night ?? '0');
  const isEntrance = booking.campsite?.price_unit === 'entrance';

  const campsiteSubtotal = isRoom
    ? roomUnit * nights
    : booking.campsite
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
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gearup-600 mb-6"
        >
          ← Back to My Bookings
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Hero image */}
          <div className="relative h-56 bg-gray-100">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="768px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl">
                🎒
              </div>
            )}
          </div>

          <div className="p-8">
            {/* Status + title */}
            <div className="flex items-center gap-3 mb-3">
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

            <h1 className="text-3xl font-black text-gray-900 mb-1">
              {title}
            </h1>
            {booking.room_campsite && (
              <p className="text-sm font-semibold text-gearup-600 mb-1">
                Room: {booking.room_campsite.name}
              </p>
            )}
            {booking.campsite?.location && (
              <p className="text-sm text-gray-500">
                {booking.campsite.location}
                {booking.campsite.region
                  ? ` · ${booking.campsite.region}`
                  : ''}
              </p>
            )}
            {isGearOnly && booking.gear_item?.category && (
              <p className="text-sm text-gearup-600 font-semibold mt-1">
                {booking.gear_item.category} · Rental only
              </p>
            )}

            {/* Status tracker */}
            <div className="mt-6">
              <BookingStatusTracker
                status={booking.status}
                createdAt={booking.created_at ?? null}
                confirmedAt={booking.confirmed_at ?? null}
                completedAt={booking.completed_at ?? null}
                cancelledAt={booking.cancelled_at ?? null}
              />
            </div>

            {/* Guide declined banner */}
            {booking.guide_status === 'declined' && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
                <p className="font-semibold mb-1">Tour guide declined</p>
                <p>
                  Your tour guide couldn&apos;t make it. The guide fee has
                  been removed from your total — you&apos;re still booked for
                  the campsite. Contact support if you want to book a
                  different guide.
                </p>
              </div>
            )}

            {/* Trip info */}
            <div className="mt-6 space-y-2 text-sm text-gray-700">
              {startDate && endDate && (
                <div>
                  <span className="font-semibold text-gray-900">
                    {formatDate(startDate)} → {formatDate(endDate)}
                  </span>{' '}
                  <span className="text-gray-500">
                    ({nights} {nights === 1 ? 'day' : 'days'})
                  </span>
                </div>
              )}
              {!isGearOnly && (
                <div>
                  {booking.pricing_lines && booking.pricing_lines.length > 0
                    ? [
                        booking.adults && booking.adults > 0
                          ? `${booking.adults} ${booking.adults === 1 ? 'adult' : 'adults'}`
                          : null,
                        booking.children && booking.children > 0
                          ? `${booking.children} ${booking.children === 1 ? 'child' : 'children'}`
                          : null,
                        booking.seniors && booking.seniors > 0
                          ? `${booking.seniors} ${booking.seniors === 1 ? 'senior' : 'seniors'}`
                          : null,
                        booking.pwd && booking.pwd > 0
                          ? `${booking.pwd} PWD`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(', ')
                    : `${booking.guests} ${booking.guests === 1 ? 'guest' : 'guests'}`}
                </div>
              )}
              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-amber-900">Check-in / Check-out Policy</span>
                </div>
                <div className="flex flex-col gap-1 pl-7">
                  <span>Check-in: <strong>after 2:00 PM</strong></span>
                  <span>Check-out: <strong>before 12:00 PM</strong></span>
                                  <span className='mt-2 text-xs italic text-amber-700'>Need an early check-in? Contact the host.</span>
</div>
              </div>
              {booking.tour_guide && (
                <div>
                  Tour guide:{' '}
                  <Link
                    href={`/tour-guides/${booking.tour_guide.id}`}
                    className="font-semibold text-gearup-600 hover:underline"
                  >
                    {booking.tour_guide.name}
                  </Link>
                </div>
              )}
              {booking.notes && (
                <div className="italic text-gray-500 pt-2">
                  &quot;{booking.notes}&quot;
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
              <h2 className="text-sm font-bold text-green-900 uppercase tracking-wider mb-4">
                Price breakdown
              </h2>
              <div className="space-y-2 text-sm text-green-900">
                {isRoom && booking.room_campsite && (
                  <div className="flex justify-between items-center">
                    <span>
                      {booking.room_campsite.name}: ₱{roomUnit.toFixed(2)} ×{' '}
                      {nights} {nights === 1 ? 'night' : 'nights'}
                    </span>
                    <span className="font-semibold">
                      ₱{campsiteSubtotal.toFixed(2)}
                    </span>
                  </div>
                )}

                                {!isRoom && booking.campsite && booking.pricing_lines && booking.pricing_lines.length > 0 && (
                  <>
                    {booking.pricing_lines.map((line) => (
                      <div
                        key={line.id}
                        className="flex justify-between items-center"
                      >
                        <span>
                          {line.pricing_line?.label ?? `Line #${line.pricing_line_id}`}
                          {line.quantity !== 1 ? ` × ${line.quantity}` : ''}
                          {` × PHP ${parseFloat(line.amount).toFixed(2)}`}
                        </span>
                        <span className="font-semibold">
                          PHP {parseFloat(line.subtotal).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </>
                )}

                {!isRoom && booking.campsite && (!booking.pricing_lines || booking.pricing_lines.length === 0) && (
                  <div className="flex justify-between items-center">
                    <span>
                      Campsite: ₱{campsiteUnit.toFixed(2)} ×{' '}
                      {isEntrance
                        ? `${booking.guests} ${booking.guests === 1 ? 'guest' : 'guests'}`
                        : `${nights} ${nights === 1 ? 'night' : 'nights'} × ${booking.guests} ${booking.guests === 1 ? 'guest' :'guests'}`}
                    </span>
                    <span className="font-semibold">
                      ₱{campsiteSubtotal.toFixed(2)}
                    </span>
                  </div>
                )}

                {booking.tour_guide && (
                  <div className="flex justify-between items-center">
                    <span>Tour guide: {booking.tour_guide.name}</span>
                    <span className="font-semibold">
                      ₱{guideSubtotal.toFixed(2)}
                    </span>
                  </div>
                )}

                {hasMultiGear && (
                  <div className="pt-2">
                    <p className="text-xs font-bold text-green-900 uppercase tracking-wider mb-2">
                      Gear
                    </p>
                    <div className="space-y-2 pl-3 border-l-2 border-green-300">
                      {booking.gear_items!.map((line) => (
                        <div
                          key={line.id}
                          className="flex justify-between items-center"
                        >
                          <span>
                            {line.name}: ₱
                            {parseFloat(line.price_per_day).toFixed(2)} ×{' '}
                            {nights} {nights === 1 ? 'day' : 'days'} ×{' '}
                            {line.pivot.quantity}
                          </span>
                          <span className="font-semibold">
                            ₱{parseFloat(line.pivot.subtotal).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!hasMultiGear && booking.gear_item && (
                  <div className="flex justify-between items-center">
                    <span>
                      {booking.gear_item.name}: ₱
                      {parseFloat(booking.gear_item.price_per_day).toFixed(2)}{' '}
                      × {nights} {nights === 1 ? 'day' : 'days'} ×{' '}
                      {booking.gear_quantity ?? 1}
                    </span>
                    <span className="font-semibold">
                      ₱{gearSubtotal.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-green-300 my-4" />

              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-green-900">
                  Total
                </span>
                <span className="text-2xl font-black text-green-900">
                  ₱{parseFloat(booking.total_price).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <div>
                {booking.status === 'pending' ||
                booking.status === 'confirmed' ? (
                  <CancelBookingButton bookingId={booking.id} />
                ) : null}
              </div>

              {booking.status === 'completed' &&
                booking.campsite &&
                !booking.review && (
                  <Link
                    href={`/campsites/${booking.campsite.id}`}
                    className="inline-block text-sm font-semibold text-white bg-gearup-600 hover:bg-gearup-700 px-5 py-2.5 rounded-lg transition"
                  >
                    Leave a review
                  </Link>
                )}
              {booking.review && (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gearup-700 bg-gearup-50 border border-gearup-200 px-4 py-2 rounded-lg">
                  ✓ Reviewed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
