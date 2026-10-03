'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function MyGearDeleteButton({
  itemId,
  itemName,
}: {
  itemId: number;
  itemName: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const del = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/my/gear/${itemId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.message ?? 'Could not delete.');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs font-semibold text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg border border-red-200"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Delete "{itemName}"?</span>
      <button
        type="button"
        onClick={del}
        disabled={busy}
        className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg disabled:opacity-50"
      >
        {busy ? 'Deleting...' : 'Yes'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-xs font-semibold text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg"
      >
        No
      </button>
    </div>
  );
}