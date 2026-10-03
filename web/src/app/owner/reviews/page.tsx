import { cookies } from 'next/headers';
import { OwnerReviewsClient } from '@/components/owner/OwnerReviewsClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function getReviews(token: string, limit = 200) {
  try {
    const res = await fetch(`${API_URL}/owner/reviews?limit=${limit}`, {
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

export default async function OwnerReviewsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  const reviews = await getReviews(token, 200);

  return (
    <div>
      <h1 className="text-3xl font-black text-gray-900 mb-2">Reviews</h1>
      <p className="text-gray-500 text-sm mb-8">
        See what campers are saying about your campsites.
      </p>

      <OwnerReviewsClient reviews={reviews} />
    </div>
  );
}