import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { BookingStatusTracker } from '@/components/BookingStatusTracker';
import { PayNowButton } from '@/components/PayNowButton';
import { AutoRedirect } from './AutoRedirect';

export const dynamic = 'force-dynamic';
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface Booking {
  id: number;
  check_in: string | null;
  check_out: string | null;
  gear_start_date: string | null;
  gear_end_date: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_price: number | string;
  amount_paid?: number | string;
  balance_due?: number | string;
  payment_status: string;
  preferred_arrival?: string | null;
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  campsite?: {
    id: number;
    name: string;
    location: string;
    payment_mode?: 'online' | 'pay_at_campsite';
  } | null;
  gear_item?: {
    id: number;
    name: string;
  } | null;
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

export default async function BookingConfirmedPage({
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

  const isGearOnly = !booking.campsite && booking.gear_item;

  const startDate =
    isGearOnly && booking.gear_start_date
      ? booking.gear_start_date
      : booking.check_in;
  const endDate =
    isGearOnly && booking.gear_end_date
      ? booking.gear_end_date
      : booking.check_out;

  const title =
    booking.campsite?.name ?? booking.gear_item?.name ?? 'your booking';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Celebration */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gearup-50 border-2 border-gearup-600 mb-5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#15803d"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Booking confirmed!
          </h1>
          <p className="text-sm text-gray-500">
            Your reservation at{' '}
            <span className="font-semibold text-gray-900">{title}</span> has
            been placed.
          </p>
        </div>

        {/* Tracker */}
        <div className="mb-6">
          <BookingStatusTracker
            status={booking.status}
            createdAt={booking.created_at}
            confirmedAt={booking.confirmed_at}
            completedAt={booking.completed_at}
            cancelledAt={booking.cancelled_at}
          />
        </div>

        {/* Summary card */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Booking #{booking.id}
            </span>
            <span
              className={`inline-block text-[10px] font-extrabold tracking-wider px-2 py-1 rounded ${
                booking.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : booking.status === 'confirmed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              {booking.status.toUpperCase()}
            </span>
          </div>

          {startDate && endDate && (
            <div className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">
                {fmtDate(startDate)} → {fmtDate(endDate)}
              </span>
            </div>
          )}
          {booking.campsite?.location && (
            <p className="text-xs text-gray-500 mt-1">
              {booking.campsite.location}
            </p>
          )}

          {/* Price breakdown */}
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Total</span>
              <span className="font-semibold text-gray-900">
                ₱{Number(booking.total_price).toFixed(2)}
              </span>
            </div>
            {Number(booking.amount_paid) > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gearup-700 font-semibold">
                    Down payment ({Math.round((Number(booking.amount_paid) / Number(booking.total_price)) * 100)}%)
                  </span>
                  <span className="font-semibold text-gearup-700">
                    ₱{Number(booking.amount_paid).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">
                    Balance due on arrival
                  </span>
                  <span className="font-semibold text-amber-700">
                    ₱{Number(booking.balance_due ?? 0).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Payment actions — only render one panel based on state */}
          {(() => {
            const isPaid = booking.payment_status === 'paid';
            const hasBalance = Number(booking.balance_due ?? 0) > 0;
            const hasDownPayment = Number(booking.amount_paid ?? 0) > 0;

            // Nothing to pay: show "Payment received" green card
            if (isPaid && !hasBalance) {
              return (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <PayNowButton
                    bookingId={booking.id}
                    amount={Number(booking.total_price)}
                    paidAmount={Number(booking.amount_paid)}
                    balanceDue={0}
                    paymentStatus="paid"
                  />
                </div>
              );
            }

            // Down payment paid, balance remaining: show "Pay Balance" panel
            if (isPaid && hasBalance) {
              return (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <PayNowButton
                    bookingId={booking.id}
                    amount={Number(booking.balance_due)}
                    paidAmount={Number(booking.amount_paid)}
                    balanceDue={Number(booking.balance_due)}
                    paymentStatus="paid"
                    paymentMode={booking.campsite?.payment_mode}
                  />
                </div>
              );
            }

            // Not paid yet: show the initial payment panel
            return (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <PayNowButton
                  bookingId={booking.id}
                  amount={
                    hasDownPayment
                      ? Number(booking.amount_paid)
                      : Number(booking.total_price)
                  }
                  balanceDue={Number(booking.balance_due ?? 0)}
                  paymentStatus={booking.payment_status}
                  paymentMode={booking.campsite?.payment_mode}
                />
              </div>
            );
          })()}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/bookings/${booking.id}`}
            className="flex-1 text-center bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-sm px-5 py-3 rounded-lg transition"
          >
            View booking details
          </Link>
          <Link
            href="/"
            className="flex-1 text-center border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm px-5 py-3 rounded-lg transition"
          >
            Back to home
          </Link>
        </div>

        {/* Auto-redirect with countdown */}
        <AutoRedirect
          href={`/bookings/${booking.id}`}
          seconds={5}
        />
      </div>
    </div>
  );
}
