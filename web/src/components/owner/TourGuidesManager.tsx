'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TourGuide {
  id: number;
  name: string;
  contact_number: string;
  email: string | null;
  description: string | null;
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

  const [form, setForm] = useState({
    name: '',
    contact_number: '',
    email: '',
    description: '',
  });

  const resetForm = () =>
    setForm({ name: '', contact_number: '', email: '', description: '' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
            email: form.email || undefined,
            description: form.description || undefined,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Could not add tour guide.');
        return;
      }

      setGuides((prev) => [...prev, data]);
      resetForm();
      setAdding(false);
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm('Remove this tour guide? They will no longer appear on this campsite.')
    ) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/owner/tour-guides/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setGuides((prev) => prev.filter((g) => g.id !== id));
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
                <h3 className="font-bold text-gray-900">{g.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  📞 {g.contact_number}
                </p>
                {g.email && (
                  <p className="text-sm text-gray-600">✉️ {g.email}</p>
                )}
                {g.description && (
                  <p className="text-sm text-gray-500 mt-2 italic">
                    {g.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(g.id)}
                disabled={deletingId === g.id}
                className="text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition disabled:opacity-50"
              >
                {deletingId === g.id ? 'Removing...' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}

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
              Email (optional)
            </label>
            <input
              type="email"
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
    </div>
  );
}