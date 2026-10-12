import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { GearRentalGrid } from '@/components/GearRentalGrid';
import type { GearItem } from '@gearup/shared';

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

export default async function GearRentalPage() {
  const [user, gear] = await Promise.all([getCurrentUser(), getAllGear()]);

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

        <GearRentalGrid gear={gear} />
      </div>
    </div>
  );
}
