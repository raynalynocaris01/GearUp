import Link from 'next/link';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { GearRentalGrid } from '@/components/GearRentalGrid';
import type { GearItem, Campsite } from '@gearup/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

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

async function getAllGear(): Promise<GearItem[]> {
  try {
    const res = await fetch(`${API_URL}/gear`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
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

export default async function GearRentalPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const [user, gear, campsites] = await Promise.all([
    getCurrentUser(),
    getAllGear(),
    getAllCampsites(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900">Gear Rental</h1>
          <p className="text-gray-500 mt-2">
            Rent camping gear from trusted owners across the Philippines.
          </p>
        </div>

        {search && (
  <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-gearup-200 bg-gearup-50 px-5 py-4">
    <p className="text-sm text-gearup-900">
      Looking for <strong>&quot;{search}&quot;</strong> in campsites?
    </p>
    <Link
      href={`/campsites?search=${encodeURIComponent(search)}`}
      className="shrink-0 rounded-lg bg-gearup-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gearup-700 transition"
    >
      Search Campsites
    </Link>
  </div>
)}
<GearRentalGrid gear={gear} campsites={campsites} />
      </div>
    </div>
  );
}