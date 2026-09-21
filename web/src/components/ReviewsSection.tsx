import Image from 'next/image';
import { StarRating } from './StarRating';

export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: { id: number; name: string };
}

interface ReviewsSectionProps {
  reviews: Review[];
  rating: string;
  reviewsCount: number;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ReviewsSection({
  reviews,
  rating,
  reviewsCount,
}: ReviewsSectionProps) {
  const numericRating = parseFloat(rating) || 0;

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">
            Reviews
          </h2>
          {reviewsCount > 0 ? (
            <div className="flex items-center gap-3 mt-2">
              <StarRating rating={numericRating} size="lg" showValue />
              <span className="text-sm text-gray-500">
                Based on {reviewsCount}{' '}
                {reviewsCount === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-2">
              No reviews yet.
            </p>
          )}
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-3xl mb-3">💬</p>
          <p className="text-sm text-gray-500">
            Be the first to review this campsite after your stay.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gearup-600 text-white flex items-center justify-center font-bold shrink-0">
                  {r.user?.name.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {r.user?.name ?? 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(r.created_at)}
                      </p>
                    </div>
                    <StarRating rating={r.rating} size="sm" />
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                      {r.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}