'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Props {
  campsiteId: number;
  name: string;
  isFeatured: boolean;
}

export function AdminCampsiteActions({
  campsiteId,
  name,
  isFeatured,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const toggleFeatured = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/campsites/${campsiteId}/feature`,
        { method: 'POST' },
      );
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campsites/${campsiteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setShowDelete(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-end">
        <button
          onClick={toggleFeatured}
          disabled={loading}
          className={`text-xs font-semibold border px-3 py-2 rounded-lg transition disabled:opacity-50 ${
            isFeatured
              ? 'text-yellow-700 border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
              : 'text-gray-600 border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          {isFeatured ? '★ Unfeature' : '☆ Feature'}
        </button>
        <button
          onClick={() => setShowDelete(true)}
          disabled={loading}
          className="text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      <ConfirmModal
        open={showDelete}
        title="Delete this campsite?"
        message={`Delete "${name}"? This will also remove all associated tour guides. Bookings will be preserved. This cannot be undone.`}
        confirmLabel="Delete campsite"
        variant="danger"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => !loading && setShowDelete(false)}
      />
    </>
  );
}