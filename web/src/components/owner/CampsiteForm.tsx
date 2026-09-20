'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Campsite {
  id?: number;
  name: string;
  description: string;
  location: string;
  region: string;
  price_per_night: string;
  price_unit: string;
  image_url: string;
  capacity: number;
}

interface Props {
  mode: 'create' | 'edit';
  initial?: Campsite;
}

const EMPTY: Campsite = {
  name: '',
  description: '',
  location: '',
  region: 'Negros Oriental',
  price_per_night: '',
  price_unit: 'night',
  image_url: 'https://picsum.photos/seed/newcampsite/600/400',
  capacity: 4,
};

export function CampsiteForm({ mode, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<Campsite>(initial ?? EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');

  const update = <K extends keyof Campsite>(
    key: K,
    value: Campsite[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setSubmitting(true);

    const url =
      mode === 'create'
        ? '/api/owner/campsites'
        : `/api/owner/campsites/${initial!.id}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        price_per_night: Number(form.price_per_night),
        capacity: Number(form.capacity),
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      if (data.errors) setErrors(data.errors);
      else setGeneralError(data.message ?? 'Save failed');
      return;
    }

    router.push('/owner/campsites');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="Campsite name" error={errors.name?.[0]}>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="e.g. Grandi Vista Campsite"
          required
          className={inputClass}
        />
      </Field>

      <Field label="Description" error={errors.description?.[0]}>
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Tell customers what makes your campsite special…"
          rows={4}
          required
          className={`${inputClass} resize-none`}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Location" error={errors.location?.[0]}>
          <input
            type="text"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="e.g. Apolong, Valencia"
            required
            className={inputClass}
          />
        </Field>

        <Field label="Region" error={errors.region?.[0]}>
          <input
            type="text"
            value={form.region}
            onChange={(e) => update('region', e.target.value)}
            placeholder="e.g. Negros Oriental"
            required
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Price (₱)" error={errors.price_per_night?.[0]}>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.price_per_night}
            onChange={(e) => update('price_per_night', e.target.value)}
            placeholder="120"
            required
            className={inputClass}
          />
        </Field>

        <Field label="Price unit" error={errors.price_unit?.[0]}>
          <select
            value={form.price_unit}
            onChange={(e) => update('price_unit', e.target.value)}
            className={inputClass}
          >
            <option value="night">per night</option>
            <option value="entrance">per entrance</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Max guests" error={errors.capacity?.[0]}>
          <input
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => update('capacity', Number(e.target.value))}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Image URL" error={errors.image_url?.[0]}>
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => update('image_url', e.target.value)}
            placeholder="https://…"
            required
            className={inputClass}
          />
        </Field>
      </div>

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
              ? 'Post Campsite'
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