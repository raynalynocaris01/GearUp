'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Booking {
  id: number;
  check_in: string | null;
  check_out: string | null;
  guests: number;
  total_price: string;
  status: string;
  guide_status: 'pending' | 'accepted' | 'declined' | null;
  campsite?: { id: number; name: string; location: string } | null;
  user?: { id: number; name: string; email: string } | null;
}

type Filter = 'all' | 'pending' | 'accepted' | 'declined';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function GuideBookingsClient({
  bookings: initialBookings,
}: {
  bookings: Booking[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const filtered =
    filter === 'all'
      ? initialBookings
      : initialBookings.filter((b) => b.guide_status === filter);

  const handleAction = async (
    bookingId: number,
    action: 'accept' | 'decline',
  ) => {
    setBusyId(bookingId);
    setError('');
    try {
      const res = await fetch(
        `/api/guide/bookings/${bookingId}/${action}`,
        { method: 'PUT' },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? `Could not ${action} booking.`);
        return;
      }
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const counts = {
    all: initialBookings.length,
    pending: initialBookings.filter((b) => b.guide_status === 'pending').length,
    accepted: initialBookings.filter((b) => b.guide_status === 'accepted').length,
    declined: initialBookings.filter((b) => b.guide_status === 'declined').length,
  };

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'declined', label: 'Declined' },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-100 pb-2">
        {tabs.map((t) => {
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition ${
                active
                  ? 'bg-gearup-50 text-gearup-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}{' '}
              <span
                className={`text-xs ${active ? 'text-gearup-500' : 'text-gray-400'}`}
              >
                ({counts[t.key]})
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500 text-sm">
            {filter === 'all'
              ? 'No bookings yet. Customers will be able to hire you when they book a campsite and select your guide service.'
              : `No ${filter} bookings.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {filtered.map((booking) => {
            const isBusy = busyId === booking.id;
            return (
              <div key={booking.id} className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {booking.campsite?.name ?? 'Tour guide booking'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(booking.check_in)} —{' '}
                      {formatDate(booking.check_out)} · {booking.guests}{' '}
                      {booking.guests === 1 ? 'guest' : 'guests'}
                    </p>
                    {booking.user && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Customer: {booking.user.name}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gearup-600">
                      PHP {parseFloat(booking.total_price).toFixed(2)}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded mt-1 ${
                        booking.guide_status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : booking.guide_status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : booking.guide_status === 'declined'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {(booking.guide_status ?? 'PENDING').toUpperCase()}
                    </span>
                  </div>
                </div>

                {booking.guide_status === 'pending' && (
                  <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleAction(booking.id, 'decline')}
                      disabled={isBusy}
                      className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                    >
                      {isBusy ? 'Working...' : 'Decline'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(booking.id, 'accept')}
                      disabled={isBusy}
                      className="px-4 py-2 text-sm font-semibold text-white bg-gearup-600 hover:bg-gearup-700 rounded-lg transition disabled:opacity-50"
                    >
                      {isBusy ? 'Working...' : 'Accept'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}