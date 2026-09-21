'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReviewFormProps {
  campsiteId: number;
  bookingId: number;
}

export function ReviewForm({ campsiteId, bookingId }: ReviewFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await fetch(`/api/campsites/${campsiteId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: bookingId,
        rating,
        comment: comment.trim() || null,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(
        data?.errors?.booking_id?.[0] ??
          data?.message ??
          'Could not submit review.',
      );
      return;
    }

    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-gearup-600 hover:bg-gearup-700 text-white font-semibold py-3 rounded-lg transition"
      >
        Leave a review
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gearup-200 shadow-sm p-6 space-y-4"
    >
      <h3 className="text-lg font-bold text-gray-900">
        Share your experience
      </h3>

      {/* Star picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your rating
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              className={`text-4xl transition ${
                i <= rating ? 'text-yellow-500' : 'text-gray-300'
              } hover:scale-110`}
              aria-label={`${i} stars`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your review (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What was your stay like? What did you enjoy?"
          rows={4}
          maxLength={1000}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {comment.length} / 1000
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError('');
          }}
          disabled={submitting}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-gearup-600 hover:bg-gearup-700 disabled:opacity-60 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition"
        >
          {submitting ? 'Posting...' : 'Post review'}
        </button>
      </div>
    </form>
  );
}