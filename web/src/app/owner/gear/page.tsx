import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { DeleteGearButton } from '@/components/owner/DeleteGearButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface GearItem {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price_per_day: string;
  image_url: string | null;
  stock: number;
  is_available: boolean;
  created_at: string;
}

async function getMyGear(token: string): Promise<GearItem[]> {
  try {
    const res = await fetch(`${API_URL}/owner/gear`, {
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

export default async function OwnerGearPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  const gear = await getMyGear(token);

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">My Gear</h1>
          <p className="text-gray-500 mt-2 text-sm">
            {gear.length} {gear.length === 1 ? 'item' : 'items'} listed
          </p>
        </div>
        <Link
          href="/owner/gear/new"
          className="bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-sm px-5 py-3 rounded-lg transition"
        >
          + Add Gear Item
        </Link>
      </div>

      {gear.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">🎒</div>
          <p className="text-lg font-semibold text-gray-700 mb-2">
            No gear listed yet
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Add gear items that customers can rent from you.
          </p>
          <Link
            href="/owner/gear/new"
            className="inline-block bg-gearup-600 hover:bg-gearup-700 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Add your first gear item
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {gear.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex"
            >
              <div className="relative w-48 shrink-0 bg-gray-100">
                {g.image_url ? (
                  <Image
                    src={g.image_url}
                    alt={g.name}
                    fill
                    sizes="192px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🎒
                  </div>
                )}
              </div>

              <div className="flex-1 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {g.name}
                  </h3>
                  {!g.is_available && (
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      Unavailable
                    </span>
                  )}
                </div>
                <p className="text-xs text-gearup-600 font-semibold">
                  {g.category}
                </p>
                {g.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                    {g.description}
                  </p>
                )}
                <p className="text-sm font-bold text-gearup-600 mt-3">
                  ₱{g.price_per_day} / day · Stock: {g.stock}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Link
                    href={`/gear-rental/${g.id}`}
                    className="text-xs font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition"
                  >
                    View Public
                  </Link>
                  <Link
                    href={`/owner/gear/${g.id}/edit`}
                    className="text-xs font-semibold text-white bg-gearup-600 hover:bg-gearup-700 px-3 py-2 rounded-lg transition"
                  >
                    Edit
                  </Link>
                  <DeleteGearButton gearId={g.id} name={g.name} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}