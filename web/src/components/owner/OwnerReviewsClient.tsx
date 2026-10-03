'use client';

import { useMemo, useState } from 'react';
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

export function OwnerReviewsClient({ reviews }: { reviews: Review[] }) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const counts = useMemo(() => {
    return {
      all: reviews.length,
      '5': reviews.filter((r) => r.rating === 5).length,
      '4': reviews.filter((r) => r.rating === 4).length,
      '3': reviews.filter((r) => r.rating === 3).length,
      low: reviews.filter((r) => r.rating < 3).length,
    } as Record<FilterKey, number>;
  }, [reviews]);

  const visible = useMemo(
    () => reviews.filter((r) => matches(r, filter)),
    [reviews, filter],
  );

  return (
    <>
      {/* Filter chips */}
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
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <p className="text-base font-bold text-gray-900 mb-1">
            {filter === 'all' ? 'No reviews yet' : 'No reviews in this filter'}
          </p>
          <p className="text-sm text-gray-500">
            {filter === 'all'
              ? 'Campers reviews will appear here once they start leaving feedback.'
              : 'Try a different rating filter to see more reviews.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <ul className="divide-y divide-gray-100">
            {visible.map((r) => (
              <li key={r.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-gearup-50 text-gearup-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {(r.user?.name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-bold text-gray-900">
                        {r.user?.name ?? 'Anonymous'}
                      </span>
                      <StarRow rating={r.rating} />
                      <span className="text-xs text-gray-400">
                        {formatDate(r.created_at)}
                      </span>
                    </div>
                    {r.campsite?.name ? (
                      <p className="text-xs text-gray-500 mt-1">
                        on{' '}
                        <span className="font-semibold">
                          {r.campsite.name}
                        </span>
                      </p>
                    ) : null}
                    {r.comment ? (
                      <p className="text-sm text-gray-700 mt-3 leading-relaxed whitespace-pre-line">
                        {r.comment}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}