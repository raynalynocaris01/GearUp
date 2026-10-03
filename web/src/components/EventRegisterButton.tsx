'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Registration {
  id: number;
  guests: number;
  total_price: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface Props {
  eventId: number;
  isLoggedIn: boolean;
  existingRegistration: Registration | null;
  capacity: number;
}

export function EventRegisterButton({
  eventId,
  isLoggedIn,
  existingRegistration,
  capacity,
}: Props) {
  const router = useRouter();
  const [guests, setGuests] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const reg = existingRegistration;
  const isActive = reg && reg.status !== 'cancelled';

  const handleRegister = async () => {
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guests }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? 'Could not register.');
      setMsg({ ok: true, text: 'You are registered!' });
      router.refresh();
    } catch (err: any) {
      setMsg({ ok: false, text: err?.message ?? 'Something went wrong.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!reg) return;
    setCancelling(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/registrations/${reg.id}/cancel`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? 'Could not cancel.');
      setMsg({ ok: true, text: 'Registration cancelled.' });
      router.refresh();
    } catch (err: any) {
      setMsg({ ok: false, text: err?.message ?? 'Something went wrong.' });
    } finally {
      setCancelling(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <a
        href="/login"
        className="block w-full bg-gearup-600 hover:bg-gearup-700 text-white font-bold text-center px-5 py-3 rounded-lg transition"
      >
        Log in to register
      </a>
    );
  }

  if (isActive && reg) {
    return (
      <div className="space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-bold text-green-800">
            You are registered
          </p>
          <p className="text-xs text-green-700 mt-1">
            {reg.guests} {reg.guests === 1 ? 'guest' : 'guests'} - PHP{' '}
            {reg.total_price}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full border border-red-200 hover:bg-red-50 text-red-700 font-semibold text-sm px-5 py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {cancelling ? 'Cancelling...' : 'Cancel registration'}
        </button>
        {msg && (
          <p
            className={`text-xs font-semibold ${
              msg.ok ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {msg.text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5">
          Number of guests
        </label>
        <input
          type="number"
          min={1}
          max={Math.min(20, capacity)}
          value={guests}
          onChange={(e) =>
            setGuests(
              Math.max(1, Math.min(capacity, Number(e.target.value) || 1)),
            )
          }
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gearup-500 focus:border-transparent"
        />
      </div>
      <button
        type="button"
        onClick={handleRegister}
        disabled={submitting}
        className="w-full bg-gearup-600 hover:bg-gearup-700 text-white font-bold text-sm px-5 py-3 rounded-lg transition disabled:opacity-50"
      >
        {submitting ? 'Registering...' : 'Register for this event'}
      </button>
      {msg && (
        <p
          className={`text-xs font-semibold ${
            msg.ok ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}