'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { GearItem } from '@gearup/shared';

type FilterKey = 'all' | 'owner' | 'individual';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'owner', label: 'Owner-provided' },
  { key: 'individual', label: 'Individual' },
];

interface Props {
  gear: GearItem[];
}

export function GearRentalGrid({ gear }: Props) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  const searchMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return gear;
    return gear.filter((g) => {
      const haystack = [g.name, g.description ?? '', g.category]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [gear, search]);

  const counts = useMemo(
    () => ({
      all: searchMatches.length,
      owner: searchMatches.filter((g) => g.owner?.role === 'owner').length,
      individual: searchMatches.filter((g) => g.owner?.role !== 'owner').length,
    }),
    [searchMatches],
  );

  const visible = useMemo(() => {
    if (filter === 'owner')
      return searchMatches.filter((g) => g.owner?.role === 'owner');
    if (filter === 'individual')
      return searchMatches.filter((g) => g.owner?.role !== 'owner');
    return searchMatches;
  }, [searchMatches, filter]);

  const hasSearch = search.trim().length > 0;

  const emptyTitle = hasSearch
    ? `No gear matches "${search.trim()}"`
    : filter === 'all'
      ? 'No gear available yet'
      : filter === 'owner'
        ? 'No owner-provided gear'
        : 'No individual gear';

  const emptyBody = hasSearch
    ? 'Try a different search term or clear the search.'
    : filter === 'all'
      ? 'Check back soon - owners are adding gear items.'
      : 'Try a different filter.';

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search gear by name, category, or description..."
          className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600"
        />
        {search.length > 0 && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters */}
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

      {/* Grid or empty state */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">🎒</div>
          <p className="text-lg font-semibold text-gray-700 mb-2">
            {emptyTitle}
          </p>
          <p className="text-sm text-gray-500">{emptyBody}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visible.map((g) => (
            <Link
              key={g.id}
              href={`/gear-rental/${g.id}`}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition"
            >
              <div className="relative h-48 bg-gray-100">
                {g.image_url ? (
                  <Image
                    src={g.image_url}
                    alt={g.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    🎒
                  </div>
                )}
                {!g.is_available && (
                  <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    Unavailable
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gearup-600 bg-gearup-50 px-2 py-1 rounded">
                    {g.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    Stock: {g.stock}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 line-clamp-1">
                  {g.name}
                </h3>

                {g.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {g.description}
                  </p>
                )}

                <div className="flex items-end justify-between mt-4">
                  <div>
                    <p className="text-lg font-black text-gearup-600">
                      ₱{g.price_per_day}
                    </p>
                    <p className="text-xs text-gray-500">per day</p>
                  </div>
                  {g.owner && (
                    <p className="text-xs text-gray-500 truncate max-w-[100px]">
                      by {g.owner.name}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}