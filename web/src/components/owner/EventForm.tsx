'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Event {
  id?: number;
  name: string;
  description: string;
  location: string;
  region: string;
  starts_at: string;
  ends_at: string;
  price_per_person: string;
  capacity: number;
  image_url: string;
  is_published: boolean;
}

interface Props {
  mode: 'create' | 'edit';
  initial?: Event;
}

const EMPTY: Event = {
  name: '',
  description: '',
  location: '',
  region: 'Negros Oriental',
  starts_at: '',
  ends_at: '',
  price_per_person: '',
  capacity: 20,
  image_url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
  is_published: true,
};

/**
 * Convert an ISO datetime string to the value format used by
 * <input type="datetime-local"> (YYYY-MM-DDTHH:mm).
 */
function toDateTimeLocal(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ mode, initial }: Props) {
  const router = useRouter();

  const [form, setForm] = useState<Event>(
    initial
      ? {
          ...initial,
          starts_at: toDateTimeLocal(initial.starts_at),
          ends_at: toDateTimeLocal(initial.ends_at),
        }
      : EMPTY,
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');

  const update = <K extends keyof Event>(key: K, value: Event[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setSubmitting(true);

    try {
      const payload = {
        name: form.name,
        description: form.description,
        location: form.location,
        region: form.region,
        starts_at: form.starts_at,
        ends_at: form.ends_at,
        price_per_person: Number(form.price_per_person),
        capacity: Number(form.capacity),
        image_url: form.image_url,
        is_published: form.is_published,
      };

      const url =
        mode === 'create'
          ? '/api/owner/events'
          : `/api/owner/events/${initial?.id}`;
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

      router.push('/owner/events');
      router.refresh();
    } catch {
      setGeneralError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="Event name" error={errors.name?.[0]}>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="e.g. Summer Camp Feast 2026"
          required
          className={inputClass}
        />
      </Field>

      <Field label="Description" error={errors.description?.[0]}>
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="What's the event about? What should attendees expect?"
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
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Starts at" error={errors.starts_at?.[0]}>
          <input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => update('starts_at', e.target.value)}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Ends at" error={errors.ends_at?.[0]}>
          <input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => update('ends_at', e.target.value)}
            required
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="Price per person (PHP)"
          error={errors.price_per_person?.[0]}
        >
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.price_per_person}
            onChange={(e) => update('price_per_person', e.target.value)}
            placeholder="250"
            required
            className={inputClass}
          />
        </Field>

        <Field label="Capacity" error={errors.capacity?.[0]}>
          <input
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => update('capacity', Number(e.target.value))}
            placeholder="20"
            required
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Image URL" error={errors.image_url?.[0]}>
        <input
          type="url"
          value={form.image_url}
          onChange={(e) => update('image_url', e.target.value)}
          placeholder="https://example.com/event.jpg"
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
              alt="Event preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      <Field label="Visibility">
        <label className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => update('is_published', e.target.checked)}
            className="w-4 h-4 accent-gearup-600"
          />
          <span className="text-sm text-gray-700">
            Publish this event (visible to customers)
          </span>
        </label>
      </Field>

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
              ? 'Create Event'
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