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
            Location
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Valencia, Negros Oriental"
            className={inputClass}
          />
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