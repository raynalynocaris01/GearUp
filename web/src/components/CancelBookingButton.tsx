'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CancelBookingButtonProps {
  bookingId: number;
}

export function CancelBookingButton({ bookingId }: CancelBookingButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' });
      setOpen(false);
      router.refresh();
    } catch {
      // ignore — refresh anyway
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-red-600 hover:text-red-700 font-semibold border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition"
      >
        Cancel booking
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Cancel booking?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This will cancel your reservation. You can always rebook later.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
              >
                Keep it
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? 'Cancelling...' : 'Cancel booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}