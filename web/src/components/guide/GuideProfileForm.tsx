'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GuideProfile {
  id: number;
  name: string;
  price_per_trip: string;
  location: string | null;
  description: string | null;
  contact_number: string;
  is_independent: boolean;
  campsite_id: number | null;
  meeting_instructions?: string | null;
  facebook_url?: string | null;
  payment_mode?: 'online' | 'pay_at_campsite';
  down_payment_percent?: string | number;
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent';

export function GuideProfileForm({ profile }: { profile: GuideProfile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    price_per_trip: profile.price_per_trip,
    location: profile.location ?? '',
    contact_number: profile.contact_number,
    description: profile.description ?? '',
    meeting_instructions: profile.meeting_instructions ?? '',
    facebook_url: profile.facebook_url ?? '',
    payment_mode: profile.payment_mode ?? 'online',
    down_payment_percent: profile.down_payment_percent ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch('/api/guide/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_per_trip: Number(form.price_per_trip),
          location: form.location.trim() || null,
          contact_number: form.contact_number.trim(),
          description: form.description.trim() || null,
          meeting_instructions: form.meeting_instructions.trim() || null,
          facebook_url: form.facebook_url.trim() || null,
          payment_mode: form.payment_mode,
          down_payment_percent: Number(form.down_payment_percent),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.errors) {
          const firstError = Object.values(data.errors)[0];
          setError(Array.isArray(firstError) ? firstError[0] : 'Validation failed.');
        } else {
          setError(data?.message ?? 'Could not save profile.');
        }
        return;
      }

      setSuccess('Profile saved.');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white rounded-xl border border-gray-100 p-8">
      {/* Read-only context */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Account
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Name:</span> {profile.name}
        </p>
        <p className="text-sm text-gray-700 mt-1">
          <span className="font-semibold">Type:</span>{' '}
          {profile.is_independent
            ? 'Independent guide'
            : 'Attached to a campsite'}
        </p>
        <p className="text-xs text-gray-500 mt-2 italic">
          Name and account type are managed from your account settings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Price per trip (PHP) *
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.price_per_trip}
            onChange={(e) =>
              setForm({ ...form, price_per_trip: e.target.value })
            }
            placeholder="1500"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Meeting Area
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Valencia, Negros Oriental"
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            City, town, or general region where you meet customers.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Detailed meet-up instructions
          </label>
          <textarea
            value={form.meeting_instructions}
            onChange={(e) =>
              setForm({ ...form, meeting_instructions: e.target.value })
            }
            placeholder="e.g. Meet by the blue tent at the trail entrance. Arrive 15 minutes early. Call me when you reach the parking lot."
            rows={4}
            maxLength={500}
            className={`${inputClass} resize-none`}
          />
          <p className="text-xs text-gray-500 mt-1">
            {form.meeting_instructions.length}/500 characters. Shown to customers after they book.
          </p>
        </div>
                <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Facebook Profile Link
          </label>
          <input
            type="url"
            value={form.facebook_url}
            onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
            placeholder="https://www.facebook.com/markcedrix.ravelo"
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional. Shown to customers so they can message you directly.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Contact number *
          </label>
          <input
            type="text"
            value={form.contact_number}
            onChange={(e) =>
              setForm({ ...form, contact_number: e.target.value })
            }
            placeholder="09171234567"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Tell customers about your guiding experience, specialties, and what makes your trips memorable."
            rows={5}
            className={`${inputClass} resize-none`}
          />
          <p className="text-xs text-gray-500 mt-1">
            {form.description.length}/2000 characters
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Mode
          </label>
          <div className="space-y-2">
            <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${form.payment_mode === 'online' ? 'border-gearup-600 bg-gearup-50' : 'border-gray-200'}`}>
              <input
                type="radio"
                name="payment_mode"
                value="online"
                checked={form.payment_mode === 'online'}
                onChange={() => setForm({ ...form, payment_mode: 'online' })}
                className="mt-1"
              />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Online Payment</p>
                <p className="text-xs text-gray-500">Guests can pay online or choose to pay cash on arrival.</p>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${form.payment_mode === 'pay_at_campsite' ? 'border-gearup-600 bg-gearup-50' : 'border-gray-200'}`}>
              <input
                type="radio"
                name="payment_mode"
                value="pay_at_campsite"
                checked={form.payment_mode === 'pay_at_campsite'}
                onChange={() => setForm({ ...form, payment_mode: 'pay_at_campsite' })}
                className="mt-1"
              />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Pay Cash on Arrival</p>
                <p className="text-xs text-gray-500">Guests must pay cash on the day of the trip. Online payment options will be hidden.</p>
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
              value={form.down_payment_percent}
              onChange={(e) => setForm({ ...form, down_payment_percent: e.target.value })}
              className={inputClass}
              disabled={form.payment_mode === 'pay_at_campsite'}
            />
            <p className="text-xs text-gray-500 mt-1">
              How much of the total does the guest pay online to lock in the booking? The rest is due on arrival. Set to 0 for full online payment.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-gearup-600 hover:bg-gearup-700 disabled:opacity-60 text-white font-semibold text-sm px-6 py-3 rounded-lg transition"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}   