'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Campsite {
  id: number;
  name: string;
  location: string;
  price_per_night: string;
  price_unit: string;
  capacity: number;
}

interface BookingFormProps {
  campsite: Campsite;
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

export function BookingForm({ campsite }: BookingFormProps) {
  const router = useRouter();

  const tomorrow = useMemo(() => toDateInput(addDays(new Date(), 1)), []);
  const dayAfter = useMemo(() => toDateInput(addDays(new Date(), 2)), []);

  const [checkIn, setCheckIn] = useState(tomorrow);
  const [checkOut, setCheckOut] = useState(dayAfter);
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');
  const [guides, setGuides] = useState<
  {
    id: number;
    name: string;
      description: string | null;
      price_per_trip: string;
    }[]
  >([]);

  const [selectedGuideId, setSelectedGuideId] = useState<number | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/tour-guides?campsite_id=${campsite.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setGuides(data);
      } catch {
        // silent
      }
    })();
  }, [campsite.id]);


  // Live price preview
  const { nights, campsitePrice, guidePrice, totalPrice } = useMemo(() => {
  const start = new Date(checkIn + 'T00:00:00');
  const end = new Date(checkOut + 'T00:00:00');
  const diffMs = end.getTime() - start.getTime();
  const n = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  const unit = parseFloat(campsite.price_per_night);

  const cPrice =
    campsite.price_unit === 'entrance'
      ? unit * guests
      : unit * n * guests;

  const selectedGuide = guides.find((g) => g.id === selectedGuideId);
  const gPrice = selectedGuide
    ? parseFloat(selectedGuide.price_per_trip)
    : 0;

  return {
    nights: campsite.price_unit === 'entrance' ? 0 : n,
    campsitePrice: cPrice,
    guidePrice: gPrice,
    totalPrice: cPrice + gPrice,
  };
}, [campsite, checkIn, checkOut, guests, guides, selectedGuideId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    if (checkIn >= checkOut) {
      setGeneralError('Check-out must be after check-in.');
      return;
    }
    if (guests > campsite.capacity) {
      setGeneralError(`This campsite allows up to ${campsite.capacity} guests.`);
      return;
    }

    setSubmitting(true);

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
      campsite_id: campsite.id,
      tour_guide_id: selectedGuideId,
      check_in: checkIn,
      check_out: checkOut,
      guests,
      notes: notes.trim() || null,
    }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      if (data.errors) setErrors(data.errors);
      else setGeneralError(data.message ?? 'Booking failed');
      return;
    }

    router.push('/bookings?success=1');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dates */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Dates
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Check-in
            </label>
            <input
              type="date"
              value={checkIn}
              min={tomorrow}
              onChange={(e) => setCheckIn(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
            />
            {errors.check_in && (
              <p className="text-red-600 text-xs mt-1">{errors.check_in[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Check-out
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
            />
            {errors.check_out && (
              <p className="text-red-600 text-xs mt-1">{errors.check_out[0]}</p>
            )}
          </div>
        </div>
      </div>

      {/* Guests */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Guests
        </h3>
        <div className="flex items-center justify-between border border-gray-300 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Number of guests
            </p>
            <p className="text-xs text-gray-500">
              Max {campsite.capacity} for this campsite
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              className="w-9 h-9 rounded-full border-2 border-gearup-600 text-gearup-600 text-xl font-bold hover:bg-gearup-50 transition flex items-center justify-center"
              aria-label="Decrease guests"
            >
              −
            </button>
            <span className="text-lg font-bold text-gray-900 min-w-[2ch] text-center">
              {guests}
            </span>
            <button
              type="button"
              onClick={() =>
                setGuests((g) => Math.min(campsite.capacity, g + 1))
              }
              className="w-9 h-9 rounded-full border-2 border-gearup-600 text-gearup-600 text-xl font-bold hover:bg-gearup-50 transition flex items-center justify-center"
              aria-label="Increase guests"
            >
              +
            </button>
          </div>
        </div>
        {errors.guests && (
          <p className="text-red-600 text-xs mt-1">{errors.guests[0]}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Notes (optional)
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything the host should know?"
          rows={3}
          maxLength={500}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent resize-none"
        />
      </div>
      {/* Tour guide picker — only if this campsite has guides */}
{guides.length > 0 && (
  <div>
    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
      Add a tour guide? (optional)
    </h3>
    <div className="space-y-2">
      {/* No guide option */}
      <label
        className={`block border rounded-lg p-4 cursor-pointer transition ${
          selectedGuideId === null
            ? 'border-gearup-600 bg-gearup-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-start gap-3">
          <input
            type="radio"
            name="guide"
            checked={selectedGuideId === null}
            onChange={() => setSelectedGuideId(null)}
            className="mt-1 h-4 w-4 accent-gearup-600"
          />
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">
              No guide
            </p>
            <p className="text-xs text-gray-500">
              Just book the campsite.
            </p>
          </div>
        </div>
      </label>

      {/* Each guide option */}
      {guides.map((g) => {
        const price = parseFloat(g.price_per_trip);
        const active = selectedGuideId === g.id;
        return (
          <label
            key={g.id}
            className={`block border rounded-lg p-4 cursor-pointer transition ${
              active
                ? 'border-gearup-600 bg-gearup-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="guide"
                checked={active}
                onChange={() => setSelectedGuideId(g.id)}
                className="mt-1 h-4 w-4 accent-gearup-600"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-900 text-sm">
                    {g.name}
                  </p>
                  <p className="text-sm font-bold text-gearup-600 shrink-0">
                    {price > 0 ? `+₱${price.toFixed(0)}` : 'Free'}
                  </p>
                </div>
                {g.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {g.description}
                  </p>
                )}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  </div>
)}

      {/* Price summary */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
      <div className="space-y-2 text-sm text-green-900">
        {/* Campsite line */}
        <div className="flex justify-between items-center">
          <span>
            {campsite.price_unit === 'entrance'
              ? `Campsite: ₱${campsite.price_per_night} × ${guests} ${guests === 1 ? 'guest' : 'guests'}`
              : `Campsite: ₱${campsite.price_per_night} × ${nights} ${nights === 1 ? 'night' : 'nights'} × ${guests} ${guests === 1 ? 'guest' : 'guests'}`}
          </span>
          <span className="font-semibold">
            ₱{campsitePrice.toFixed(2)}
          </span>
        </div>

        {/* Guide line — only if selected */}
        {selectedGuideId !== null && (
          <div className="flex justify-between items-center">
            <span>
              Tour guide: {guides.find((g) => g.id === selectedGuideId)?.name}
            </span>
            <span className="font-semibold">
              ₱{guidePrice.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-green-300 my-4" />

      <div className="flex justify-between items-center">
        <span className="text-base font-bold text-green-900">Total</span>
        <span className="text-2xl font-black text-green-900">
          ₱{totalPrice.toFixed(2)}
        </span>
      </div>
    </div>

      {generalError && (
        <p className="text-red-600 text-sm text-center">{generalError}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gearup-600 hover:bg-gearup-700 disabled:opacity-60 text-white font-semibold py-4 rounded-xl transition"
      >
        {submitting ? 'Confirming...' : 'Confirm Booking'}
      </button>
    </form>
  );
}