import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { DeleteCampsiteButton } from '@/components/owner/DeleteCampsiteButton';

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
  capacity: number;
  tour_guides?: { id: number }[];
}

async function getMyCampsites(token: string): Promise<Campsite[]> {
  try {
    const res = await fetch(`${API_URL}/owner/campsites`, {
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

export default async function OwnerCampsitesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  const campsites = await getMyCampsites(token);

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            My Campsites
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {campsites.length}{' '}
            {campsites.length === 1 ? 'campsite' : 'campsites'} posted
          </p>
        </div>
        <Link
          href="/owner/campsites/new"
          className="bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-sm px-5 py-3 rounded-lg transition"
        >
          + Post a Campsite
        </Link>
      </div>

      {campsites.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">⛺</div>
          <p className="text-lg font-semibold text-gray-700 mb-2">
            No campsites yet
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Post your first campsite to start receiving bookings.
          </p>
          <Link
            href="/owner/campsites/new"
            className="inline-block bg-gearup-600 hover:bg-gearup-700 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Post your first campsite
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {campsites.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex"
            >
              <div className="relative w-48 shrink-0">
                <Image
                  src={c.image_url}
                  alt={c.name}
                  fill
                  sizes="192px"
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="flex-1 p-5">
                <h3 className="text-lg font-bold text-gray-900">{c.name}</h3>
                <p className="text-xs text-gray-500 mt-1">📍 {c.location}</p>
                <p className="text-xs text-gray-600 mt-2">
                  <span className="text-yellow-500">★</span> {c.rating} (
                  {c.reviews_count}) · Up to {c.capacity} guests
                </p>
                <p className="text-sm font-bold text-gearup-600 mt-3">
                  ₱{c.price_per_night} / {c.price_unit}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Link
                    href={`/campsites/${c.id}`}
                    className="text-xs font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition"
                  >
                    View Public
                  </Link>
                  <Link
                    href={`/owner/campsites/${c.id}/edit`}
                    className="text-xs font-semibold text-white bg-gearup-600 hover:bg-gearup-700 px-3 py-2 rounded-lg transition"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/owner/campsites/${c.id}/tour-guides`}
                    className="text-xs font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition"
                  >
                    Tour Guides ({c.tour_guides?.length ?? 0})
                  </Link>
                  <DeleteCampsiteButton campsiteId={c.id} name={c.name} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}