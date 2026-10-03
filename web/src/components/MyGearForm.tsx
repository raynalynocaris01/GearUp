'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GearItem } from '@gearup/shared';

interface Props {
  mode: 'create' | 'edit';
  initial?: GearItem;
}

export function MyGearForm({ mode, initial }: Props) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'Tent');
  const [pricePerDay, setPricePerDay] = useState(
    String(initial?.price_per_day ?? ''),
  );
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '');
  const [stock, setStock] = useState(String(initial?.stock ?? 1));
  const [isAvailable, setIsAvailable] = useState(
    initial?.is_available ?? true,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      price_per_day: Number(pricePerDay),
      image_url: imageUrl.trim(),
      stock: Number(stock),
      is_available: isAvailable,
    };

    try {
      const url =
        mode === 'create'
          ? '/api/my/gear'
          : `/api/my/gear/${initial?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ??
            data?.errors?.name?.[0] ??
            'Could not save gear item.',
        );
      }
      router.push('/my-gear');
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={255}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gearup-500"
            placeholder="e.g. 2-person Camping Tent"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gearup-500 resize-none"
            placeholder="Condition, size, what's included..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Category
            </label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gearup-500"
              placeholder="Tent, Backpack, Cooking..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Price per day (PHP)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={pricePerDay}
              onChange={(e) => setPricePerDay(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gearup-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Stock (units available)
            </label>
            <input
              type="number"
              min={1}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gearup-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gearup-500"
              placeholder="https://..."
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="w-4 h-4 accent-gearup-600"
          />
          <span className="text-sm font-semibold text-gray-800">
            Available for rent
          </span>
        </label>

        {error && (
          <p className="text-xs font-semibold text-red-600">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {saving
              ? 'Saving...'
              : mode === 'create'
                ? 'Create listing'
                : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/my-gear')}
            className="text-sm font-semibold text-gray-500 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}