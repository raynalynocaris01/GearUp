import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { CampsitesGrid } from '@/components/CampsitesGrid';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface Campsite {
  id: number;
  name: string;
  location: string;
  region: string;
  price_per_night: string;
  price_unit: string;
  image_url: string;
  rating: string;
  reviews_count: number;
  is_featured: boolean;
  created_at: string;
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getAllCampsites(): Promise<Campsite[]> {
  try {
    const res = await fetch(`${API_URL}/campsites`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function CampsitesPage() {
  const [user, campsites] = await Promise.all([
    getCurrentUser(),
    getAllCampsites(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900">
            All Campsites
          </h1>
          <p className="text-gray-500 mt-2">
            Browse every camping destination available on GearUp.
          </p>
        </div>

        <CampsitesGrid campsites={campsites} />
      </div>
    </div>
  );
}