'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { Review } from '@gearup/shared';

type FilterKey = 'all' | '5' | '4' | '3' | 'low';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: '5', label: '5 stars' },
  { key: '4', label: '4 stars' },
  { key: '3', label: '3 stars' },
  { key: 'low', label: 'Below 3' },
];

function StarRow({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={n <= rounded ? '#f59e0b' : 'none'}
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function matches(review: Review, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'low') return review.rating < 3;
  return review.rating === Number(filter);
}

export function AdminReviewsClient({ reviews }: { reviews: Review[] }) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const counts = useMemo(
    () =>
      ({
        all: reviews.length,
        '5': reviews.filter((r) => r.rating === 5).length,
        '4': reviews.filter((r) => r.rating === 4).length,
        '3': reviews.filter((r) => r.rating === 3).length,
        low: reviews.filter((r) => r.rating < 3).length,
      }) as Record<FilterKey, number>,
    [reviews],
  );

  const visible = useMemo(
    () => reviews.filter((r) => matches(r, filter)),
    [reviews, filter],
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
            No reviews
          </p>
          <p className="text-sm text-gray-500">
            {filter === 'all'
              ? 'Campers reviews will appear here once they start leaving feedback.'
              : 'Try a different rating filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Reviewer
                </th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Campsite
                </th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">
                  Rating
                </th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 hidden xl:table-cell">
                  Comment
                </th>
                <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gearup-50 text-gearup-700 flex items-center justify-center text-sm font-bold shrink-0">
                        {(r.user?.name ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {r.user?.name ?? 'Anonymous'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {r.campsite?.image_url ? (
                          <Image
                            src={r.campsite.image_url}
                            alt={r.campsite.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {r.campsite?.name ?? '-'}
                        </p>
                        {r.campsite?.owner?.name ? (
                          <p className="text-xs text-gray-500 truncate">
                            Owner: {r.campsite.owner.name}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <StarRow rating={r.rating} />
                  </td>
                  <td className="px-5 py-4 hidden xl:table-cell max-w-md">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {r.comment ?? '-'}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right hidden md:table-cell">
                    <p className="text-xs text-gray-500">
                      {formatDate(r.created_at)}
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