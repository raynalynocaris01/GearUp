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
      window.location.href = data.checkout_url;
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleCashPay = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/bookings/${bookingId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method: 'cash' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Could not confirm cash payment.');
        setLoading(false);
        return;
      }
      window.location.href = `/bookings/${bookingId}`;
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
    <div className="space-y-3">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-gearup-600 hover:bg-gearup-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition text-lg"
      >
        {loading ? 'Opening payment...' : `Pay Now - ₱${amount.toFixed(2)}`}
      </button>
      <button
        type="button"
        onClick={handleCashPay}
        disabled={loading}
        className="w-full bg-white hover:bg-gray-50 disabled:opacity-60 text-gearup-700 border-2 border-gearup-600 font-bold py-3 rounded-xl transition text-base"
      >
        {loading ? 'Processing...' : 'Pay with Cash (Pay on Arrival)'}
      </button>
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
      <p className="text-xs text-gray-500 text-center">
        Choose cash if you will pay upon arrival. Your booking will be confirmed immediately.
      </p>
    </div>
  );
}
