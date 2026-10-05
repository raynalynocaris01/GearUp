'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TourGuide {
  id: number;
  name: string;
  price_per_trip: string;
}

interface Props {
  guide: TourGuide;
  onDone?: () => void;
}

function toDateInput(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function GuideBookingForm({ guide, onDone }: Props) {
  const router = useRouter();

  const tomorrow = useMemo(() => toDateInput(addDays(new Date(), 1)), []);
  const dayAfter = useMemo(() => toDateInput(addDays(new Date(), 2)), []);

  const [checkIn, setCheckIn] = useState(tomorrow);
  const [checkOut, setCheckOut] = useState(dayAfter);
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const tripPrice = parseFloat(guide.price_per_trip);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tour_guide_id: guide.id,
          check_in: checkIn,
          check_out: checkOut,
          guests,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ??
            data?.errors?.check_in?.[0] ??
            'Could not book this guide.',
        );
      }
      onDone?.();
      router.push('/bookings?success=1');
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5">
          Trip start
        </label>
        <input
          type="date"
          value={checkIn}
          min={tomorrow}
          onChange={(e) => setCheckIn(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gearup-500"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5">
          Trip end
        </label>
        <input
          type="date"
          value={checkOut}
          min={checkIn}
          onChange={(e) => setCheckOut(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gearup-500"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5">
          Number of people
        </label>
        <input
          type="number"
          min={1}
          max={20}
          value={guests}
          onChange={(e) =>
            setGuests(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
          }
          required
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gearup-500"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Anything the guide should know?"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gearup-500 resize-none"
        />
      </div>

      <div className="flex items-baseline justify-between pt-2 border-t border-gray-100">
        <span className="text-sm font-semibold text-gray-700">
          Total
        </span>
        <span className="text-2xl font-black text-gearup-600">
          PHP {tripPrice.toFixed(0)}
        </span>
      </div>

      {error && (
        <p className="text-xs font-semibold text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gearup-600 hover:bg-gearup-700 text-white font-bold text-sm py-3 rounded-lg transition disabled:opacity-50"
      >
        {submitting ? 'Booking...' : 'Confirm booking'}
      </button>
    </form>
  );
}