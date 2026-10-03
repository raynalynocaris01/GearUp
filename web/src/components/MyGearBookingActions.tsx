'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Props {
  bookingId: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export function MyGearBookingActions({ bookingId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<
    'confirm' | 'cancel' | 'complete' | null
  >(null);
  const [modal, setModal] = useState<'cancel' | 'complete' | null>(null);

  const act = async (action: 'confirm' | 'cancel' | 'complete') => {
    setLoading(action);
    try {
      const res = await fetch(
        `/api/my/gear-bookings/${bookingId}/${action}`,
        { method: 'POST' },
      );
      if (res.ok) {
        setModal(null);
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  };

  if (status === 'cancelled' || status === 'completed') {
    return <span className="text-xs text-gray-400">-</span>;
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {status === 'pending' && (
          <button
            onClick={() => act('confirm')}
            disabled={loading !== null}
            className="text-xs font-semibold text-white bg-gearup-600 hover:bg-gearup-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            {loading === 'confirm' ? 'Confirming...' : 'Confirm'}
          </button>
        )}

        {status === 'confirmed' && (
          <button
            onClick={() => setModal('complete')}
            disabled={loading !== null}
            className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            Mark completed
          </button>
        )}

        <button
          onClick={() => setModal('cancel')}
          disabled={loading !== null}
          className="text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <ConfirmModal
        open={modal === 'cancel'}
        title="Cancel this rental?"
        message="The customer will see the rental as cancelled."
        confirmLabel="Cancel rental"
        variant="danger"
        loading={loading === 'cancel'}
        onConfirm={() => act('cancel')}
        onCancel={() => !loading && setModal(null)}
      />

      <ConfirmModal
        open={modal === 'complete'}
        title="Mark this rental as completed?"
        message="Use this after the customer has returned the gear."
        confirmLabel="Mark completed"
        variant="primary"
        loading={loading === 'complete'}
        onConfirm={() => act('complete')}
        onCancel={() => !loading && setModal(null)}
      />
    </>
  );
}