'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Mail } from 'lucide-react';
interface TourGuide {
  id: number;
  name: string;
  contact_number: string;
  email: string | null;
  description: string | null;
  price_per_trip?: string;
  campsite?: { name: string } | null;
}

interface Props {
  campsiteId: number;
  initialGuides: TourGuide[];
}

export function TourGuidesManager({ campsiteId, initialGuides }: Props) {
  const router = useRouter();
  const [guides, setGuides] = useState(initialGuides);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  // Pool of existing guides for the assign dropdown
  const [myGuides, setMyGuides] = useState<TourGuide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!adding) return;
    fetch('/api/owner/tour-guides')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMyGuides(Array.isArray(data) ? data : []))
      .catch(() => setMyGuides([]));
  }, [adding]);


  const [form, setForm] = useState({
    name: '',
    contact_number: '',
    price_per_trip: '',
    email: '',
    description: '',
  });

  const resetForm = () =>
    setForm({
      name: '',
      contact_number: '',
      price_per_trip: '',
      email: '',
      description: '',
    });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim()) {
      setError('Email is required.');
      return;
    }

    // NEW: if the user picked an existing guide from the dropdown, ATTACH it by ID.
    // This reuses the existing account — no duplicate user is created.
    if (selectedGuideId) {
      setLoading(true);
      try {
        const attachRes = await fetch('/api/owner/campsites/' + campsiteId + '/attach-guide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guide_id: Number(selectedGuideId) }),
        });
        const attachData = await attachRes.json();
        if (!attachRes.ok) {
          throw new Error(attachData.message || 'Could not attach guide.');
        }
        router.refresh();
        setAdding(false);
        setSelectedGuideId('');
        resetForm();
        return;
      } catch (err: any) {
        setError(err.message || 'Could not attach guide.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/owner/campsites/${campsiteId}/tour-guides`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            contact_number: form.contact_number,
            price_per_trip: form.price_per_trip
              ? Number(form.price_per_trip)
              : 0,
            email: form.email,
            description: form.description || undefined,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Could not add tour guide.');
        return;
      }

      const savedGuide = data.guide ?? data;
      setGuides((prev) => [...prev, savedGuide]);
      if (data.temp_password) setTempPassword(data.temp_password);
      resetForm();
      setAdding(false);
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };


  const [confirmGuide, setConfirmGuide] = useState<TourGuide | null>(null);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/owner/tour-guides/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setGuides((prev) => prev.filter((g) => g.id !== id));
        setConfirmGuide(null);
        router.refresh();
      } else {
        setError('Could not delete tour guide.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Guides list */}
      {guides.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">🧭</div>
          <p className="text-sm text-gray-500">
            No tour guides yet. Add one below so customers know who can guide
            their trip.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {guides.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start justify-between gap-4"
            >
                            <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-gray-900">{g.name}</h3>
                  {g.price_per_trip && Number(g.price_per_trip) > 0 && (
                    <span className="text-sm font-bold text-gearup-600 shrink-0">
                      PHP {Number(g.price_per_trip).toFixed(0)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {g.contact_number}
                </p>

                {g.email && (
                        <p className="text-sm text-gray-600"><Mail className="inline-block h-4 w-4 mr-1 text-gray-500" /> {g.email}</p>
                )}
                {g.description && (
                  <p className="text-sm text-gray-500 mt-2 italic">
                    {g.description}
                  </p>
                )}
              </div>
              <button
              onClick={() => setConfirmGuide(g)}
              disabled={deletingId === g.id}
              className="text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition disabled:opacity-50"
            >
              Remove
            </button>
            </div>
          ))}
          
        </div>
      )}
      
      <ConfirmModal
              open={confirmGuide !== null}
              title="Remove this tour guide?"
              message={`Remove ${confirmGuide?.name}? They will no longer appear on this campsite.`}
              confirmLabel="Remove"
              variant="danger"
              loading={deletingId === confirmGuide?.id}
              onConfirm={() => confirmGuide && handleDelete(confirmGuide.id)}
              onCancel={() => !deletingId && setConfirmGuide(null)}
            />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}

      {/* Add form */}
      {adding ? (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
        >
          <h3 className="font-bold text-gray-900 text-lg">
            Add a tour guide
          </h3>

          {/* Dropdown for assigning an existing guide */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign an existing guide from your pool
            </label>
            <div className="flex gap-2">
              <select
                value={selectedGuideId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedGuideId(id);
                  if (id) {
                    const guide = myGuides.find((g) => g.id === Number(id));
                    if (guide) {
                      setForm({
                        name: guide.name,
                        contact_number: guide.contact_number,
                        price_per_trip: guide.price_per_trip ?? '',
                        email: guide.email ?? '',
                        description: guide.description ?? '',
                      });
                    }
                  } else {
                    resetForm();
                  }
                }}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gearup-600"
              >
                <option value="">-- Select a guide --</option>
                {myGuides.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} {g.campsite ? '(currently at ' + g.campsite.name + ')' : '(independent)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR CREATE NEW</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Juan Dela Cruz"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contact number
              </label>
              <input
                type="text"
                required
                value={form.contact_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contact_number: e.target.value }))
                }
                placeholder="e.g. 0917-123-4567"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Price per trip (PHP)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.price_per_trip}
              onChange={(e) =>
                setForm((f) => ({ ...f, price_per_trip: e.target.value }))
              }
              placeholder="e.g. 1800"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="juan@example.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              placeholder="Experience, specialties, languages spoken…"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                resetForm();
                setError('');
              }}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gearup-600 hover:bg-gearup-700 disabled:opacity-60 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition"
            >
              {loading ? 'Adding...' : 'Add tour guide'}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl py-6 text-sm font-semibold text-gearup-600 transition"
        >
          + Add a tour guide
        </button>
      )}

      {/* Temp password display after successful creation */}
      {tempPassword && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-green-900 text-lg">
                Tour guide created
              </h3>
              <p className="text-sm text-green-800 mt-1">
                Share this temp password with the guide so they can log in:
              </p>
              <div className="mt-3 flex items-center gap-3 bg-white border border-green-300 rounded-lg px-4 py-3">
                <code className="font-mono text-base font-bold text-green-900 flex-1 break-all">
                  {tempPassword}
                </code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(tempPassword)}
                  className="text-xs font-semibold text-green-700 hover:text-green-900 px-3 py-1.5 rounded border border-green-300 bg-green-100 hover:bg-green-200 transition shrink-0"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-green-700 mt-2">
                They should change this password after first login.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTempPassword(null)}
              className="text-green-700 hover:text-green-900 text-xl font-bold leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
