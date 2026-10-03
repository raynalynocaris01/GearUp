import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { MyGearDeleteButton } from '@/components/MyGearDeleteButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface GearItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price_per_day: string;
  image_url: string;
  stock: number;
  is_available: boolean;
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/user`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getMyGear(token: string): Promise<GearItem[]> {
  try {
    const res = await fetch(`${API_URL}/my/gear`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function MyGearPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const [user, items] = await Promise.all([
    getCurrentUser(),
    token ? getMyGear(token) : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">My Gear</h1>
            <p className="text-gray-500 mt-2 text-sm">
              List your own gear and earn from campers.
            </p>
          </div>
          <Link
            href="/my-gear/new"
            className="inline-flex items-center gap-2 bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-sm px-5 py-3 rounded-lg transition"
          >
            + Add gear
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-lg font-semibold text-gray-700 mb-2">
              No gear listed yet
            </p>
            <p className="text-sm text-gray-500 mb-6">
              List your first item and start renting to campers.
            </p>
            <Link
              href="/my-gear/new"
              className="inline-block bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-sm px-5 py-3 rounded-lg transition"
            >
              Add gear
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex"
              >
                <div className="relative w-40 shrink-0 bg-gray-100">
                  {g.image_url ? (
                    <Image
                      src={g.image_url}
                      alt={g.name}
                      fill
                      sizes="160px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-extrabold tracking-wider px-2 py-1 rounded bg-gray-100 text-gray-700">
                        {g.category.toUpperCase()}
                      </span>
                      {!g.is_available && (
                        <span className="text-[10px] font-extrabold tracking-wider px-2 py-1 rounded bg-red-100 text-red-700">
                          UNAVAILABLE
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {g.name}
                    </h3>
                    {g.description ? (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {g.description}
                      </p>
                    ) : null}
                    <p className="text-sm font-bold text-gearup-600 mt-2">
                      PHP {g.price_per_day} / day
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Stock: {g.stock}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4">
                    <Link
                      href={`/my-gear/${g.id}/edit`}
                      className="text-xs font-semibold text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"
                    >
                      Edit
                    </Link>
                    <MyGearDeleteButton itemId={g.id} itemName={g.name} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}