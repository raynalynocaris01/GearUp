'use client';

import { useState } from 'react';

interface Props {
  bookingId: number;
  amount: number;
  paymentStatus: string;
}

export function PayNowButton({ bookingId, amount, paymentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/bookings/${bookingId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Could not start payment.');
        setLoading(false);
        return;
      }
      // Redirect to PayMongo hosted checkout
      window.location.href = data.checkout_url;
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (paymentStatus === 'paid') {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
        <p className="text-sm font-bold text-green-900">Payment received</p>
        <p className="text-xs text-green-700 mt-1">This booking has been paid.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-gearup-600 hover:bg-gearup-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition text-lg"
      >
        {loading ? 'Opening payment...' : `Pay Now - ₱${amount.toFixed(2)}`}
      </button>
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
      <p className="text-xs text-gray-500 text-center">
        Secure payment via PayMongo. Accepts card, GCash, Maya, and GrabPay.
      </p>
    </div>
  );
}
