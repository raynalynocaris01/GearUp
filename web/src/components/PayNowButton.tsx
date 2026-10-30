'use client';

import { useState } from 'react';

interface Props {
  bookingId: number;
  amount: number;
  balanceDue?: number;
  paymentStatus: string;
  paymentMode?: 'online' | 'pay_at_campsite';
}

export function PayNowButton({ bookingId, amount, balanceDue = 0, paymentStatus, paymentMode }: Props) {
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
    // Fully paid — no more balance
    if (balanceDue === 0) {
      return (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center space-y-1">
          <p className="text-sm font-bold text-green-900">Payment received</p>
          <p className="text-xs text-green-700">
            ₱{amount.toFixed(2)} has been paid in full.
          </p>
        </div>
      );
    }

    // Down payment paid — show "Pay Balance" panel
    return (
      <div className="space-y-3">
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center space-y-1">
          <p className="text-sm font-bold text-green-900">Down payment received</p>
          <p className="text-xs text-green-700">
            ₱{amount.toFixed(2)} has been paid.
          </p>
          <p className="text-xs font-semibold text-amber-700 mt-2 pt-2 border-t border-green-200">
            Balance due: ₱{balanceDue.toFixed(2)}
          </p>
        </div>
        <button
          type="button"
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition text-lg"
        >
          {loading ? 'Opening payment...' : `Pay Balance — ₱${balanceDue.toFixed(2)}`}
        </button>
        {loading && (
          <p className="text-xs text-gray-500 text-center -mt-1">
            Connecting to PayMongo... This may take a few seconds.
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}
      </div>
    );
  }

  // New: If owner restricted to cash only
  if (paymentMode === 'pay_at_campsite') {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
        <p className="text-sm font-bold text-amber-900">Pay at Campsite</p>
        <p className="text-xs text-amber-700 mt-1">
          This campsite requires cash payment upon arrival. Please prepare ₱{amount.toFixed(2)} for your visit. Your booking is confirmed.
        </p>
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
        {loading
          ? 'Opening payment...'
          : paymentStatus === 'paid' && balanceDue > 0
            ? `Pay Balance - ₱${amount.toFixed(2)}`
            : `Pay Now - ₱${amount.toFixed(2)}`}
      </button>
      {loading && (
        <p className="text-xs text-gray-500 text-center -mt-1">
          Connecting to PayMongo... This may take a few seconds.
        </p>
      )}
      {!(paymentStatus === 'paid' && balanceDue > 0) && (
        <button
          type="button"
          onClick={handleCashPay}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-50 disabled:opacity-60 text-gearup-700 border-2 border-gearup-600 font-bold py-3 rounded-xl transition text-base"
        >
          {loading ? 'Processing...' : 'Pay with Cash (Pay on Arrival)'}
        </button>
      )}
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
      {balanceDue > 0 ? (
        <p className="text-xs text-amber-700 text-center font-semibold bg-amber-50 rounded-lg p-2">
          After this down payment, ₱{balanceDue.toFixed(2)} is due on arrival.
        </p>
      ) : (
        <p className="text-xs text-gray-500 text-center">
          Choose cash if you will pay upon arrival. Your booking will be confirmed immediately.
        </p>
      )}
    </div>
  );
}