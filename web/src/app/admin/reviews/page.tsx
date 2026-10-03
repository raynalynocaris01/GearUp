import { cookies } from 'next/headers';
import { AdminReviewsClient } from '@/components/admin/AdminReviewsClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function getReviews(token: string) {
  try {
    const res = await fetch(`${API_URL}/admin/reviews?limit=500`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function AdminReviewsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  const reviews = await getReviews(token);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900">Reviews</h1>
        <p className="text-gray-500 mt-2 text-sm">
          {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}{' '}
          platform-wide
        </p>
      </div>

      <AdminReviewsClient reviews={reviews} />
    </div>
  );
}