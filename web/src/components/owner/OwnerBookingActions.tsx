'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Props {
  bookingId: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export function OwnerBookingActions({ bookingId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<'confirm' | 'cancel' | null>(null);
  const [showCancel, setShowCancel] = useState(false);

  const confirmBooking = async () => {
    setLoading('confirm');
    try {
      const res = await fetch(`/api/owner/bookings/${bookingId}/confirm`, {
        method: 'POST',
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const cancelBooking = async () => {
    setLoading('cancel');
    try {
      const res = await fetch(`/api/owner/bookings/${bookingId}/cancel`, {
        method: 'POST',
      });
      if (res.ok) {
        setShowCancel(false);
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  };

  if (status === 'cancelled') {
    return (
      <span className="text-xs font-bold tracking-wider text-red-700 bg-red-100 px-2 py-1 rounded">
        CANCELLED
      </span>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {status === 'pending' && (
          <button
            onClick={confirmBooking}
            disabled={loading !== null}
            className="text-xs font-semibold text-white bg-gearup-600 hover:bg-gearup-700 px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading === 'confirm' ? 'Confirming...' : 'Confirm'}
          </button>
        )}
        <button
          onClick={() => setShowCancel(true)}
          disabled={loading !== null}
          className="text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <ConfirmModal
        open={showCancel}
        title="Cancel this booking?"
        message="The customer will see the booking as cancelled. You can rebook if needed."
        confirmLabel="Cancel booking"
        variant="danger"
        loading={loading === 'cancel'}
        onConfirm={cancelBooking}
        onCancel={() => !loading && setShowCancel(false)}
      />
    </>
  );
}