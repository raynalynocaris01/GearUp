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

  const counts = useMemo(
    () => ({
      all: gear.length,
      owner: gear.filter((g) => g.owner?.role === 'owner').length,
      individual: gear.filter((g) => g.owner?.role !== 'owner').length,
    }),
    [gear],
  );

  const visible = useMemo(() => {
    if (filter === 'owner')
      return gear.filter((g) => g.owner?.role === 'owner');
    if (filter === 'individual')
      return gear.filter((g) => g.owner?.role !== 'owner');
    return gear;
  }, [gear, filter]);

  const emptyTitle =
    filter === 'all'
      ? 'No gear available yet'
      : filter === 'owner'
        ? 'No owner-provided gear'
        : 'No individual gear';

  const emptyBody =
    filter === 'all'
      ? 'Check back soon - owners are adding gear items.'
      : 'Try a different filter.';

  return (
    <div className="space-y-6">
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