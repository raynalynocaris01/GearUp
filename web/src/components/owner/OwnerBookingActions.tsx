'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  bookingId: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export function OwnerBookingActions({ bookingId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<'confirm' | 'cancel' | null>(null);

  const act = async (action: 'confirm' | 'cancel') => {
    if (
      action === 'cancel' &&
      !confirm('Cancel this booking? The customer will be notified.')
    ) {
      return;
    }

    setLoading(action);
    try {
      const res = await fetch(`/api/owner/bookings/${bookingId}/${action}`, {
        method: 'POST',
      });
      if (res.ok) {
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
    <div className="flex items-center gap-2">
      {status === 'pending' && (
        <button
          onClick={() => act('confirm')}
          disabled={loading !== null}
          className="text-xs font-semibold text-white bg-gearup-600 hover:bg-gearup-700 px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          {loading === 'confirm' ? 'Confirming...' : 'Confirm'}
        </button>
      )}
      <button
        onClick={() => act('cancel')}
        disabled={loading !== null}
        className="text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition disabled:opacity-50"
      >
        {loading === 'cancel' ? 'Cancelling...' : 'Cancel'}
      </button>
    </div>
  );
}