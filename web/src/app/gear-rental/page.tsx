import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface GearItem {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  category: string;
  price_per_day: string;
  image_url: string | null;
  stock: number;
  is_available: boolean;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
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

        {gear.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">🎒</div>
            <p className="text-lg font-semibold text-gray-700 mb-2">
              No gear available yet
            </p>
            <p className="text-sm text-gray-500">
              Check back soon — owners are adding gear items.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {gear.map((g) => (
              <Link
                key={g.id}
                href={`/gear-rental/${g.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition"
              >
                <div className="relative h-48 bg-gray-100">
                  {g.image_url ? (
                    <Image
                      src={g.image_url}
                      alt={g.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      🎒
                    </div>
                  )}
                  {!g.is_available && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                      Unavailable
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gearup-600 bg-gearup-50 px-2 py-1 rounded">
                      {g.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      Stock: {g.stock}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 line-clamp-1">
                    {g.name}
                  </h3>

                  {g.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {g.description}
                    </p>
                  )}

                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <p className="text-lg font-black text-gearup-600">
                        ₱{g.price_per_day}
                      </p>
                      <p className="text-xs text-gray-500">per day</p>
                    </div>
                    {g.owner && (
                      <p className="text-xs text-gray-500 truncate max-w-[100px]">
                        by {g.owner.name}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
