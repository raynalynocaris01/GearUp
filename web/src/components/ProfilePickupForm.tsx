'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  initial: {
    method?: string | null;
    address?: string | null;
    landmark?: string | null;
    hours?: string | null;
    instructions?: string | null;
    contact_number?: string | null;
    facebook_url?: string | null;
  } | null;
}

export function ProfilePickupForm({ initial }: Props) {
  const router = useRouter();

  const [pickupMethod, setPickupMethod] = useState<
    'meetup' | 'pickup' | 'deliver' | 'all'
  >((initial?.method as any) ?? 'meetup');
  const [pickupAddress, setPickupAddress] = useState(initial?.address ?? '');
  const [pickupLandmark, setPickupLandmark] = useState(
    initial?.landmark ?? '',
  );
  const [pickupHours, setPickupHours] = useState(initial?.hours ?? '');
  const [pickupInstructions, setPickupInstructions] = useState(
    initial?.instructions ?? '',
  );
  const [contactNumber, setContactNumber] = useState(
    initial?.contact_number ?? '',
  );
  const [facebookUrl, setFacebookUrl] = useState(
    initial?.facebook_url ?? '',
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedMessage('');

    const payload = {
      pickup_method: pickupMethod,
      pickup_address: pickupAddress.trim() || null,
      pickup_landmark: pickupLandmark.trim() || null,
      pickup_hours: pickupHours.trim() || null,
      pickup_instructions: pickupInstructions.trim() || null,
      pickup_contact_number: contactNumber.trim() || null,
      facebook_url: facebookUrl.trim() || null,
    };

    try {
      const res = await fetch('/api/user/pickup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ??
            data?.errors?.pickup_address?.[0] ??
            'Save failed',
        );
      }
      setSavedMessage('Pickup info saved.');
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Network error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How should renters get the gear?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {(
            [
              { value: 'meetup', label: 'Meet-up at a place' },
              { value: 'pickup', label: 'Pick up at my place' },
              { value: 'deliver', label: 'Deliver to them' },
              { value: 'all', label: 'All three options' },
            ] as const
          ).map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 cursor-pointer text-sm transition ${
                pickupMethod === opt.value
                  ? 'border-green-600 bg-green-50 text-green-800 font-semibold'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="pickup_method"
                value={opt.value}
                checked={pickupMethod === opt.value}
                onChange={() => setPickupMethod(opt.value)}
                className="w-4 h-4 accent-green-600"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {pickupMethod === 'meetup'
              ? 'Meet-up location'
              : 'Pickup address'}
            {['pickup', 'all'].includes(pickupMethod) && (
              <span className="text-red-600"> *</span>
            )}
          </label>
          <textarea
            rows={2}
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            placeholder="e.g. Purok 3, Brgy. San Jose, Valencia City, Bukidnon"
            className={`${inputClass} resize-none`}
          />
        </div>

        {['meetup', 'all'].includes(pickupMethod) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Landmark (optional but helpful)
            </label>
            <input
              type="text"
              value={pickupLandmark}
              onChange={(e) => setPickupLandmark(e.target.value)}
              placeholder="e.g. Near the barangay hall, blue gate"
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Pickup hours (optional)
          </label>
          <input
            type="text"
            value={pickupHours}
            onChange={(e) => setPickupHours(e.target.value)}
            placeholder="e.g. Mon–Sat 9AM–6PM, Sun by appointment"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Instructions (optional)
          </label>
          <textarea
            rows={2}
            value={pickupInstructions}
            onChange={(e) => setPickupInstructions(e.target.value)}
            placeholder="e.g. Text me 30 minutes before arriving."
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Contact number (optional)
          </label>
          <input
            type="tel"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder="e.g. 0917 123 4567"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Facebook Profile Link (optional)
          </label>
          <input
            type="url"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            placeholder="https://www.facebook.com/yourprofile"
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            Shown to customers so they can message you directly.
          </p>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {savedMessage && (
        <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
          {savedMessage}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold text-sm px-6 py-3 rounded-lg transition"
        >
          {saving ? 'Saving...' : 'Save pickup info'}
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