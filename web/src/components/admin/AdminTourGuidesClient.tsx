'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TourGuide } from '@gearup/shared';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

type FilterKey = 'all' | 'attached' | 'independent';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'attached', label: 'Attached' },
  { key: 'independent', label: 'Independent' },
];

interface Props {
  guides: TourGuide[];
}

export function AdminTourGuidesClient({ guides }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contact_number: '',
    price_per_trip: '',
    location: '',
    email: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<TourGuide | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const counts = useMemo(
    () => ({
      all: guides.length,
      attached: guides.filter((g) => !g.is_independent).length,
      independent: guides.filter((g) => g.is_independent).length,
    }),
    [guides],
  );

  const visible = useMemo(() => {
    if (filter === 'attached') return guides.filter((g) => !g.is_independent);
    if (filter === 'independent')
      return guides.filter((g) => g.is_independent);
    return guides;
  }, [guides, filter]);

  const resetForm = () =>
    setForm({
      name: '',
      contact_number: '',
      price_per_trip: '',
      location: '',
      email: '',
      description: '',
    });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/tour-guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          contact_number: form.contact_number.trim(),
          price_per_trip: form.price_per_trip
            ? Number(form.price_per_trip)
            : 0,
          location: form.location.trim() || undefined,
          email: form.email.trim() || undefined,
          description: form.description.trim() || undefined,
          campsite_id: null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ??
            data?.errors?.name?.[0] ??
            'Could not create guide.',
        );
      }
      resetForm();
      setCreating(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      const res = await fetch(
        `/api/admin/tour-guides/${confirmDelete.id}`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        setConfirmDelete(null);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? 'Could not delete guide.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters + create button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                  active
                    ? 'bg-gearup-600 text-white border-gearup-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f.label}
                <span
                  className={`ml-2 text-xs font-bold ${
                    active ? 'text-white/80' : 'text-gray-400'
                  }`}
                >
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-2 bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-sm px-5 py-3 rounded-lg transition"
        >
          {creating ? 'Cancel' : '+ New independent guide'}
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
        >
          <h3 className="font-bold text-gray-900 text-lg">
            Create tour guide
          </h3>
          <p className="text-xs text-gray-500">
            Admin-created guides are independent (not attached to a campsite).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gearup-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contact number *
              </label>
              <input
                type="text"
                required
                value={form.contact_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contact_number: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gearup-600"
              />
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
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gearup-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Location (optional)
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="e.g. Negros Oriental"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gearup-600"
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
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gearup-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description (optional)
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gearup-600 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                resetForm();
                setError('');
              }}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-gearup-600 hover:bg-gearup-700 disabled:opacity-60 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition"
            >
              {submitting ? 'Adding...' : 'Add guide'}
            </button>
          </div>
        </form>
      )}

      {/* Guides list */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-base font-bold text-gray-900 mb-1">
            No guides {filter !== 'all' ? 'in this filter' : 'yet'}
          </p>
          <p className="text-sm text-gray-500">
            {filter === 'all'
              ? 'Create the first platform-wide guide.'
              : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          {visible.map((g) => (
            <div key={g.id} className="p-5 flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-gearup-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {g.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-gray-900">{g.name}</h3>
                  {g.is_independent ? (
                    <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                      INDEPENDENT
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded bg-green-100 text-green-700">
                      ATTACHED
                    </span>
                  )}
                </div>

                {g.campsite?.name && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    at{' '}
                    <span className="font-semibold text-gray-700">
                      {g.campsite.name}
                    </span>
                  </p>
                )}

                {g.creator?.name && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Created by{' '}
                    <span className="font-semibold text-gray-700">
                      {g.creator.name}
                    </span>
                  </p>
                )}

                <p className="text-sm text-gray-600 mt-1">
                  {g.contact_number}
                  {g.email ? ` - ${g.email}` : ''}
                </p>

                {g.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2 italic">
                    {g.description}
                  </p>
                )}

                {g.price_per_trip && Number(g.price_per_trip) > 0 && (
                  <p className="text-sm font-bold text-gearup-600 mt-2">
                    PHP {Number(g.price_per_trip).toFixed(0)} per trip
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setConfirmDelete(g)}
                disabled={deletingId === g.id}
                className="text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition disabled:opacity-50 shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmDelete !== null}
        title="Delete this tour guide?"
        message={`Delete ${confirmDelete?.name ?? ''}? This removes them from the entire platform.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deletingId === confirmDelete?.id}
        onConfirm={handleDelete}
        onCancel={() => !deletingId && setConfirmDelete(null)}
      />
    </div>
  );
}