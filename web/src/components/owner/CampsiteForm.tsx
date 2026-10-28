'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PricingLinesEditor } from './PricingLinesEditor';

interface Campsite {
  id?: number;
  parent_campsite_id?: number | null;
  name: string;
  description: string;
  location: string;
  region: string;
  price_per_night: string;
  price_unit: string;
  image_url: string;
  capacity: number;
  is_available: boolean;
  payment_mode?: 'online' | 'pay_at_campsite';
  free_items?: string[];
  pricing_mode?: 'simple' | 'detailed';
  children?: Array<{
    id: number;
    name: string;
    description: string | null;
    price_per_night: string;
    price_unit: string;
    capacity: number;
    is_available: boolean;
  }>;
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
  is_available: true,
  pricing_mode: 'simple',
  payment_mode: 'online',
  free_items: [],
};

export function CampsiteForm({ mode, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<Campsite>(initial ?? EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initial?.image_url ?? null,
  );
  const [uploadingImage, setUploadingImage] = useState(false);

  const update = <K extends keyof Campsite>(
    key: K,
    value: Campsite[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrors({});
  setGeneralError('');
  setSubmitting(true);

  try {
    // 1. Save the campsite (create or update)
    const payload: Record<string, unknown> = {
      name: form.name,
      description: form.description,
      location: form.location,
      region: form.region,
      price_unit: form.price_unit,
      capacity: Number(form.capacity),
      is_available: form.is_available,
      pricing_mode: form.pricing_mode ?? 'simple',
      payment_mode: form.payment_mode ?? 'online',
      free_items: form.free_items ?? [],
    };
    // Only send price_per_night in simple mode. In detailed mode it is
    // unused and sending 0 would overwrite the preserved simple-mode value.
    if ((form.pricing_mode ?? 'simple') === 'simple') {
      payload.price_per_night = Number(form.price_per_night);
    }
    // Only send image_url if we're NOT uploading a new file
    if (!imageFile) {
      payload.image_url = form.image_url;
    }

    let campsiteId = initial?.id;

    if (mode === 'create') {
      const url = '/api/owner/campsites';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setGeneralError(data.message ?? 'Save failed');
        return;
      }
      campsiteId = data.id;
    } else if (initial) {
      const url = `/api/owner/campsites/${initial.id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setGeneralError(data.message ?? 'Save failed');
        return;
      }
    }

    // 2. Upload the image if one was selected
    if (imageFile && campsiteId) {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', imageFile);

      const imgRes = await fetch(
        `/api/owner/campsites/${campsiteId}/image`,
        {
          method: 'POST',
          body: formData,
        },
      );

      if (!imgRes.ok) {
        const data = await imgRes.json().catch(() => ({}));
        setGeneralError(
          data.message ?? 'Campsite saved but image upload failed.',
        );
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    router.push('/owner/campsites');
    router.refresh();
  } catch (err) {
    setGeneralError('Network error. Please try again.');
  } finally {
    setSubmitting(false);
  }
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

      {/* Room Variants (only in edit mode, and only if this is a parent campsite) */}
      {mode === 'edit' && initial?.id && !initial?.parent_campsite_id && (
        <RoomVariantsSection
          campsiteId={initial.id}
          rooms={initial.children ?? []}
          parentImageUrl={initial.image_url}
          parentRegion={initial.region}
        />
      )}

      {/* Pricing mode toggle */}
      <Field label="Pricing mode">
        <div className="space-y-2">
          <label
            className={`block border rounded-lg p-4 cursor-pointer transition ${
              (form.pricing_mode ?? 'simple') === 'simple'
                ? 'border-gearup-600 bg-gearup-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="pricing_mode"
                checked={(form.pricing_mode ?? 'simple') === 'simple'}
                onChange={() => update('pricing_mode', 'simple')}
                className="mt-1 h-4 w-4 accent-gearup-600"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">
                  Simple
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  One price per night or per entrance. Best for campsites
                  with a single rate.
                </p>
              </div>
            </div>
          </label>

          <label
            className={`block border rounded-lg p-4 cursor-pointer transition ${
              form.pricing_mode === 'detailed'
                ? 'border-gearup-600 bg-gearup-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${
              mode === 'create' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="pricing_mode"
                checked={form.pricing_mode === 'detailed'}
                onChange={() => update('pricing_mode', 'detailed')}
                disabled={mode === 'create'}
                className="mt-1 h-4 w-4 accent-gearup-600 disabled:opacity-50"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">
                  Detailed
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Itemize pricing — visitor fees, camping fees, per-tent
                  charges, etc. Add pricing lines below.
                  {mode === 'create' &&
                    ' Save the campsite first, then switch to Detailed to add lines.'}
                </p>
              </div>
            </div>
          </label>
        </div>
      </Field>

      {/* Simple mode: price fields */}
      {(form.pricing_mode ?? 'simple') === 'simple' && (
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
      )}

      {/* Detailed mode: pricing lines editor */}
      {form.pricing_mode === 'detailed' && mode === 'edit' && initial?.id && (
        <div className="border-t border-gray-100 pt-6">
          <PricingLinesEditor campsiteId={initial.id} />
        </div>
      )}

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

        <Field label="Campsite photo">
  <div className="space-y-3">
    {/* Preview */}
    {imagePreview && (
      <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagePreview}
          alt="Campsite preview"
          className="w-full h-full object-cover"
        />
      </div>
    )}

    {/* File picker */}
      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-gearup-600 hover:bg-gearup-50 rounded-lg py-4 cursor-pointer transition">
        <span className="text-2xl">📷</span>
        <span className="text-sm font-semibold text-gray-700">
          {imageFile ? imageFile.name : imagePreview ? 'Replace photo' : 'Upload photo'}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) {
              alert('File is larger than 2 MB.');
              return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
          }}
        />
      </label>
      <p className="text-xs text-gray-500">
        JPG, PNG, or WebP. Max 2 MB.
      </p>
    </div>
  </Field>
      </div>

            {/* Free items list */}
      <Field label="Free items provided by this campsite">
        <p className="text-xs text-gray-500 mb-2">
          One item per line. E.g. Firewood, Basic toiletries, Drinking water, Parking, etc.
        </p>
        <textarea
          rows={4}
          value={(form.free_items ?? []).join('\n')}
          onChange={(e) =>
            update(
              'free_items',
              e.target.value
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          placeholder="Firewood&#10;Basic toiletries&#10;Drinking water&#10;Parking"
          className={`${inputClass} resize-none`}
        />
      </Field>


      {/* Payment Mode Selector */}
      <Field label="Payment Mode">
        <div className="space-y-2">
          <label
            className={`block border rounded-lg p-4 cursor-pointer transition ${
              (form.payment_mode ?? 'online') === 'online'
                ? 'border-gearup-600 bg-gearup-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="payment_mode"
                checked={(form.payment_mode ?? 'online') === 'online'}
                onChange={() => update('payment_mode', 'online')}
                className="mt-1 h-4 w-4 accent-gearup-600"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">
                  Online Payment
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Guests can pay online (card/GCash) or choose to pay cash on arrival.
                </p>
              </div>
            </div>
          </label>

          <label
            className={`block border rounded-lg p-4 cursor-pointer transition ${
              form.payment_mode === 'pay_at_campsite'
                ? 'border-gearup-600 bg-gearup-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="payment_mode"
                checked={form.payment_mode === 'pay_at_campsite'}
                onChange={() => update('payment_mode', 'pay_at_campsite')}
                className="mt-1 h-4 w-4 accent-gearup-600"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">
                  Pay at Campsite (Cash Only)
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Guests must pay cash upon arrival. Online payment options will be hidden during booking.
                </p>
              </div>
            </div>
          </label>
        </div>
      </Field>

      {/* Availability toggle */}
      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">
              Accepting bookings
            </p>
            <p className="text-xs text-gray-500 mt-1">
              When off, customers can still see this campsite but cannot
              place new bookings. Existing bookings are not affected.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.is_available}
            onClick={() => update('is_available', !form.is_available)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
              form.is_available ? 'bg-gearup-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-slate-50 shadow transition ${
                form.is_available ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <div className="mt-2">
          <span
            className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${
              form.is_available
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {form.is_available ? 'BOOKINGS OPEN' : 'TEMPORARILY CLOSED'}
          </span>
        </div>
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
          {submitting || uploadingImage
            ? 'Saving…'
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

interface RoomVariantsProps {
  campsiteId: number;
  rooms: NonNullable<Campsite['children']>;
  parentImageUrl: string;
  parentRegion: string;
}

function RoomVariantsSection({
  campsiteId,
  rooms,
  parentImageUrl,
  parentRegion,
}: RoomVariantsProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price_per_night: '',
    capacity: 2,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    setError('');
    if (!form.name.trim() || !form.price_per_night) {
      setError('Name and price are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/owner/campsites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_campsite_id: campsiteId,
          name: form.name.trim(),
          description: form.description.trim() || 'Room variant',
          location: 'Same as parent',
          region: parentRegion,
          price_per_night: Number(form.price_per_night),
          price_unit: 'night',
          image_url: parentImageUrl,
          capacity: Number(form.capacity),
          is_available: true,
          pricing_mode: 'simple',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? 'Could not create room.');
      }

      setForm({ name: '', description: '', price_per_night: '', capacity: 2 });
      setAdding(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (room: RoomVariantsProps['rooms'][number]) => {
    if (!confirm(`Delete "${room.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/owner/campsites/${room.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.message ?? 'Could not delete room.');
        return;
      }
      router.refresh();
    } catch {
      alert('Network error.');
    }
  };

  return (
    <Field label="Room Variants">
      <p className="text-xs text-gray-500 mb-3">
        Add bookable rooms or sub-listings under this campsite (e.g.,
        Native Room, Aircon Room). Each room has its own price and capacity.
      </p>

      {rooms.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 text-sm text-gray-500 text-center mb-3">
          No rooms yet.
        </div>
      ) : (
        <div className="bg-slate-50 border border-gray-100 rounded-lg divide-y divide-gray-100 mb-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-start justify-between gap-3 p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">
                  {room.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  PHP {parseFloat(room.price_per_night).toFixed(2)} /{' '}
                  {room.price_unit} - Up to {room.capacity}{' '}
                  {room.capacity === 1 ? 'guest' : 'guests'}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href={`/owner/campsites/${room.id}/edit`}
                  className="text-xs font-semibold text-gearup-600 hover:underline px-2 py-1"
                >
                  Edit
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(room)}
                  className="text-xs font-semibold text-red-600 hover:underline px-2 py-1"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Room name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Native Room"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Price per night (PHP) *
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price_per_night}
                onChange={(e) =>
                  setForm({ ...form, price_per_night: e.target.value })
                }
                placeholder="800"
                required
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max guests *
              </label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) =>
                  setForm({ ...form, capacity: Number(e.target.value) || 1 })
                }
                placeholder="2"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="e.g., Simple native room"
                className={inputClass}
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-xs">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError('');
                setForm({
                  name: '',
                  description: '',
                  price_per_night: '',
                  capacity: 2,
                });
              }}
              className="text-xs font-semibold text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={submitting}
              className="text-xs font-semibold text-white bg-gearup-600 hover:bg-gearup-700 disabled:opacity-60 px-4 py-2 rounded-md"
            >
              {submitting ? 'Saving...' : 'Save Room'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full border-2 border-dashed border-gray-300 hover:border-gearup-600 hover:bg-gearup-50 rounded-lg py-2 text-sm font-semibold text-gray-600 hover:text-gearup-700 transition"
        >
          + Add Room
        </button>
      )}
    </Field>
  );
}