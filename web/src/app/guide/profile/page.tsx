import { cookies } from 'next/headers';
import { GuideProfileForm } from '@/components/guide/GuideProfileForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface GuideProfile {
  id: number;
  name: string;
  price_per_trip: string;
  location: string | null;
  description: string | null;
  contact_number: string;
  is_independent: boolean;
  campsite_id: number | null;
}

async function getProfile(token: string): Promise<GuideProfile | null> {
  const res = await fetch(`${API_URL}/guide/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return await res.json();
}

export default async function GuideProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;

  const profile = await getProfile(token);

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-100 p-8">
        <p className="text-gray-600 text-sm">
          Could not load your guide profile. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Your Guide Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update your pricing, availability, and the description customers see
          when they book your guide service.
        </p>
      </div>

      <GuideProfileForm profile={profile} />
    </div>
  );
}