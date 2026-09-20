import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { AdminCampsiteActions } from '@/components/admin/AdminCampsiteActions';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface Campsite {
  id: number;
  owner_id: number | null;
  name: string;
  location: string;
  region: string;
  price_per_night: string;
  price_unit: string;
  image_url: string;
  rating: string;
  reviews_count: number;
  capacity: number;
  is_featured: boolean;
  owner?: { id: number; name: string; email: string } | null;
}

async function getCampsites(token: string): Promise<Campsite[]> {
  try {
    const res = await fetch(`${API_URL}/admin/campsites`, {
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

export default async function AdminCampsitesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  const campsites = await getCampsites(token);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Campsites</h1>
        <p className="text-gray-500 mt-2 text-sm">
          {campsites.length}{' '}
          {campsites.length === 1 ? 'campsite' : 'campsites'} on GearUp
        </p>
      </div>

      {campsites.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500">No campsites yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campsites.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex"
            >
              <div className="relative w-40 shrink-0">
                <Image
                  src={c.image_url}
                  alt={c.name}
                  fill
                  sizes="160px"
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="flex-1 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {c.is_featured && (
                        <span className="text-[10px] font-extrabold tracking-wider px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                          ★ FEATURED
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {c.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      📍 {c.location}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      <span className="text-yellow-500">★</span> {c.rating} (
                      {c.reviews_count}) · Up to {c.capacity} guests
                    </p>
                    <p className="text-sm font-bold text-gearup-600 mt-2">
                      ₱{c.price_per_night} / {c.price_unit}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Owner
                    </p>
                    {c.owner ? (
                      <>
                        <p className="text-sm font-semibold text-gray-900">
                          {c.owner.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {c.owner.email}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        Platform-owned
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mt-4">
                  <Link
                    href={`/campsites/${c.id}`}
                    className="text-xs font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition"
                  >
                    View Public
                  </Link>
                  <AdminCampsiteActions
                    campsiteId={c.id}
                    name={c.name}
                    isFeatured={c.is_featured}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}