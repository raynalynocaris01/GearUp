'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Props {
  campsiteId: number;
  name: string;
}

export function DeleteCampsiteButton({ campsiteId, name }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/owner/campsites/${campsiteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Could not delete.');
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition"
      >
        Delete
      </button>

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}

      <ConfirmModal
        open={open}
        title="Delete campsite?"
        message={`Delete "${name}"? This will remove all tour guides and cannot be undone. Bookings will be preserved.`}
        confirmLabel="Delete campsite"
        variant="danger"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => !loading && setOpen(false)}
      />
    </>
  );
}