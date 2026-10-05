'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { EventItem } from '@gearup/shared';
import { appImageSrc } from '@/components/AppImage';
type FilterKey = 'all' | 'published' | 'draft';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

function matches(event: EventItem, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'published') return event.is_published;
  return !event.is_published;
}

export function AdminEventsClient({ events }: { events: EventItem[] }) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const counts = useMemo(
    () =>
      ({
        all: events.length,
        published: events.filter((e) => e.is_published).length,
        draft: events.filter((e) => !e.is_published).length,
      }) as Record<FilterKey, number>,
    [events],
  );

  const visible = useMemo(
    () => events.filter((e) => matches(e, filter)),
    [events, filter],
  );

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
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

      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-base font-bold text-gray-900 mb-1">
            No events
          </p>
          <p className="text-sm text-gray-500">
            {filter === 'all'
              ? 'Owner events will appear here once they are created.'
              : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Event
                </th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                  Owner
                </th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">
                  Dates
                </th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {e.image_url ? (
                          <Image
                            src={appImageSrc(e.image_url)}
                            alt={e.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {e.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {e.location}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-sm text-gray-900">
                      {e.owner?.name ?? 'Platform'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {e.owner?.email ?? ''}
                    </p>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <p className="text-xs text-gray-700">
                      {formatDate(e.starts_at)} &rarr; {formatDate(e.ends_at)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Cap {e.capacity}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block text-[10px] font-extrabold tracking-wider px-2 py-1 rounded ${
                        e.is_published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {e.is_published ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right hidden sm:table-cell">
                    <p className="text-sm font-black text-gearup-600">
                      PHP {e.price_per_person}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}