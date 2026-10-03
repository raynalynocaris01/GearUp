import Link from 'next/link';
import type { Review } from '@gearup/shared';

interface Props {
  reviews: Review[];
  limit?: number;
}

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

export function RecentReviews({ reviews, limit }: Props) {
  const visible =
    typeof limit === 'number' ? reviews.slice(0, limit) : reviews;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
          Recent Reviews
        </h2>
        <Link
          href="/owner/reviews"
          className="text-xs font-bold text-gearup-600 hover:text-gearup-700"
        >
          View all
        </Link>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          No reviews yet
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {visible.map((r) => (
            <li key={r.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gearup-50 text-gearup-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {(r.user?.name ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-bold text-gray-900 text-sm">
                      {r.user?.name ?? 'Anonymous'}
                    </span>
                    <StarRow rating={r.rating} />
                    <span className="text-xs text-gray-400">
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  {r.campsite?.name ? (
                    <p className="text-xs text-gray-500 mt-1">
                      on <span className="font-semibold">{r.campsite.name}</span>
                    </p>
                  ) : null}
                  {r.comment ? (
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                      {r.comment}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}