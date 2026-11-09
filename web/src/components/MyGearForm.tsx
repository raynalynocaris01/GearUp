'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GearItem } from '@gearup/shared';
import { appImageSrc } from '@/components/AppImage';

interface Props {
  mode: 'create' | 'edit';
  initial?: GearItem;
}

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

export function MyGearForm({ mode, initial }: Props) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'Tent');
  const [pricePerDay, setPricePerDay] = useState(
    String(initial?.price_per_day ?? ''),
  );
  const [stock, setStock] = useState(String(initial?.stock ?? 1));
  const [isAvailable, setIsAvailable] = useState(
    initial?.is_available ?? true,
  );
  const [paymentMode, setPaymentMode] = useState<'online' | 'pay_at_campsite'>(
    (initial as any)?.payment_mode ?? 'online',
  );
  const [downPaymentPercent, setDownPaymentPercent] = useState(
    String((initial as any)?.down_payment_percent ?? 0),
  );

 

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initial?.image_url ?? null,
  );
  const [uploadingImage, setUploadingImage] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(initial?.image_url ?? null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const willUploadNewImage = !!imageFile;

     const payload: {
      name: string;
      description: string;
      category: string;
      price_per_day: number;
      stock: number;
      is_available: boolean;
      payment_mode: 'online' | 'pay_at_campsite';
      down_payment_percent: number;
      image_url?: string;
    } = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      price_per_day: Number(pricePerDay) || 0,
      stock: Number(stock) || 1,
      is_available: isAvailable,
      payment_mode: paymentMode,
      down_payment_percent: Number(downPaymentPercent) || 0,
      ...(willUploadNewImage ? {} : { image_url: initial?.image_url ?? '' }),
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
            'Save failed',
        );
      }

      const gearId = mode === 'create' ? data.id : initial?.id;

      if (imageFile && gearId) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadRes = await fetch(`/api/my/gear/${gearId}/image`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json().catch(() => ({}));
          throw new Error(uploadData.message ?? 'Image upload failed.');
        }
        setUploadingImage(false);
      }

      router.push('/my-gear');
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Network error.');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Name
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 2-person Camping Tent"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Description
        </label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Condition, size, what's included..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Price per day (PHP)
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            required
            value={pricePerDay}
            onChange={(e) => setPricePerDay(e.target.value)}
            placeholder="150"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Stock (units available)
        </label>
        <input
          type="number"
          min={1}
          required
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isAvailable}
          onChange={(e) => setIsAvailable(e.target.checked)}
          className="w-4 h-4 accent-green-600"
        />
        <span className="text-sm text-gray-700">Available for rent</span>
      </label>

      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Mode
        </label>
        <div className="space-y-2">
          <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${paymentMode === 'online' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>
            <input
              type="radio"
              name="payment_mode"
              value="online"
              checked={paymentMode === 'online'}
              onChange={() => setPaymentMode('online')}
              className="mt-1"
            />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Online Payment</p>
              <p className="text-xs text-gray-500">Guests can pay online or choose to pay cash on arrival.</p>
            </div>
          </label>
          <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${paymentMode === 'pay_at_campsite' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>
            <input
              type="radio"
              name="payment_mode"
              value="pay_at_campsite"
              checked={paymentMode === 'pay_at_campsite'}
              onChange={() => setPaymentMode('pay_at_campsite')}
              className="mt-1"
            />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Pay Cash on Pickup</p>
              <p className="text-xs text-gray-500">Guests must pay cash when they pick up the gear. Online payment options will be hidden.</p>
            </div>
          </label>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Down payment (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step="1"
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(e.target.value)}
            className={inputClass}
            disabled={paymentMode === 'pay_at_campsite'}
          />
          <p className="text-xs text-gray-500 mt-1">
            How much of the total does the guest pay online to lock in the booking? The rest is due on pickup. Set to 0 for full online payment.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        Pickup and delivery info is now set once in your{' '}
        <a href="/profile/pickup" className="font-semibold underline">
          profile settings
        </a>{' '}
        and automatically applies to all your gear listings.
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Gear image
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jfif"
          onChange={handleFileChange}
          className={inputClass}
        />
      </div>

      {previewUrl && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1.5">Preview</p>
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={appImageSrc(previewUrl)}
              alt="Gear preview"
              className="w-full h-full object-cover"
              onLoad={() => console.log('[preview] image loaded:', previewUrl)}
              onError={(e) => {
                console.error('[preview] failed to load:', previewUrl);
                (e.target as HTMLImageElement).style.opacity = '0.2';
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm px-6 py-3 rounded-lg transition"
        >
          {saving
            ? 'Saving...'
            : mode === 'create'
              ? 'Create listing'
              : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-3 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent';
