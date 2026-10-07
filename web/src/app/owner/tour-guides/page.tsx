import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { TourGuide } from '@gearup/shared';
import { MyTourGuidesClient } from '@/components/owner/MyTourGuidesClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function getMyGuides(token: string): Promise<TourGuide[]> {
  try {
    const res = await fetch(`${API_URL}/owner/tour-guides`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function OwnerTourGuidesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) redirect('/login');

  const guides = await getMyGuides(token);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Tour Guides</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Manage all your guides — attached to campsites or independent.
        </p>
      </div>

      <MyTourGuidesClient guides={guides} />
    </div>
  );
}