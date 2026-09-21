'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Props {
  bookingId: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export function OwnerBookingActions({ bookingId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<
    'confirm' | 'cancel' | 'complete' | null
  >(null);
  const [modal, setModal] = useState<'cancel' | 'complete' | null>(null);

  const act = async (action: 'confirm' | 'cancel' | 'complete') => {
    setLoading(action);
    try {
      const url =
        action === 'complete'
          ? `/api/owner/bookings/${bookingId}/complete`
          : `/api/owner/bookings/${bookingId}/${action}`;
      const res = await fetch(url, { method: 'POST' });
      if (res.ok) {
        setModal(null);
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

  if (status === 'completed') {
    return (
      <span className="text-xs font-bold tracking-wider text-blue-700 bg-blue-100 px-2 py-1 rounded">
        COMPLETED
      </span>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {status === 'pending' && (
          <button
            onClick={() => act('confirm')}
            disabled={loading !== null}
            className="text-xs font-semibold text-white bg-gearup-600 hover:bg-gearup-700 px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading === 'confirm' ? 'Confirming...' : 'Confirm'}
          </button>
        )}

        {status === 'confirmed' && (
          <button
            onClick={() => setModal('complete')}
            disabled={loading !== null}
            className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            Mark completed
          </button>
        )}

        <button
          onClick={() => setModal('cancel')}
          disabled={loading !== null}
          className="text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <ConfirmModal
        open={modal === 'cancel'}
        title="Cancel this booking?"
        message="The customer will see the booking as cancelled."
        confirmLabel="Cancel booking"
        variant="danger"
        loading={loading === 'cancel'}
        onConfirm={() => act('cancel')}
        onCancel={() => !loading && setModal(null)}
      />

      <ConfirmModal
        open={modal === 'complete'}
        title="Mark this booking as completed?"
        message="Use this after the guest has checked out. This unlocks the review flow for the customer."
        confirmLabel="Mark completed"
        variant="primary"
        loading={loading === 'complete'}
        onConfirm={() => act('complete')}
        onCancel={() => !loading && setModal(null)}
      />
    </>
  );
}