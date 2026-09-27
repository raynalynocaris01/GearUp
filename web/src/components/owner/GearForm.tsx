'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GearItem {
  id?: number;
  name: string;
  description: string;
  category: string;
  price_per_day: string;
  image_url: string;
  stock: number;
  is_available: boolean;
}

interface Props {
  mode: 'create' | 'edit';
  initial?: GearItem;
}

const EMPTY: GearItem = {
  name: '',
  description: '',
  category: 'Tent',
  price_per_day: '',
  image_url: 'https://picsum.photos/seed/newgear/600/400',
  stock: 1,
  is_available: true,
};

const CATEGORIES = [
  'Tent',
  'Sleeping',
  'Sleeping Bag',
  'Backpack',
  'Cooking',
  'Lighting',
  'Furniture',
  'Other',
];

export function GearForm({ mode, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<GearItem>(initial ?? EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');

  const update = <K extends keyof GearItem>(
    key: K,
    value: GearItem[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setSubmitting(true);

    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        price_per_day: Number(form.price_per_day),
        image_url: form.image_url,
        stock: Number(form.stock),
        is_available: form.is_available,
      };

      const url =
        mode === 'create'
          ? '/api/owner/gear'
          : `/api/owner/gear/${initial?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setGeneralError(data.message ?? 'Save failed');
        return;
      }

      router.push('/owner/gear');
      router.refresh();
    } catch {
      setGeneralError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="Gear name" error={errors.name?.[0]}>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="e.g. 4-Person Camping Tent"
          required
          className={inputClass}
        />
      </Field>

      <Field label="Description" error={errors.description?.[0]}>
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Describe the gear, condition, what's included..."
          rows={4}
          required
          className={`${inputClass} resize-none`}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Category" error={errors.category?.[0]}>
          <select
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Price per day (₱)" error={errors.price_per_day?.[0]}>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.price_per_day}
            onChange={(e) => update('price_per_day', e.target.value)}
            placeholder="150"
            required
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Stock (units available)" error={errors.stock?.[0]}>
          <input
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => update('stock', Number(e.target.value))}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Availability" error={errors.is_available?.[0]}>
          <label className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={(e) => update('is_available', e.target.checked)}
              className="w-4 h-4 accent-gearup-600"
            />
            <span className="text-sm text-gray-700">
              Available for rent
            </span>
          </label>
        </Field>
      </div>

      <Field label="Image URL" error={errors.image_url?.[0]}>
        <input
          type="url"
          value={form.image_url}
          onChange={(e) => update('image_url', e.target.value)}
          placeholder="https://example.com/photo.jpg"
          required
          className={inputClass}
        />
      </Field>

      {form.image_url && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1.5">
            Preview
          </p>
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.image_url}
              alt="Gear preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {generalError && (
        <p className="text-red-600 text-sm">{generalError}</p>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-3 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-gearup-600 hover:bg-gearup-700 disabled:opacity-60 text-white font-semibold text-sm px-6 py-3 rounded-lg transition"
        >
          {submitting
            ? 'Saving...'
            : mode === 'create'
              ? 'Add Gear Item'
              : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent';

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}