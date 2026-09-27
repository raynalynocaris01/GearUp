import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
  created_at: string;
  updated_at: string;
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

async function getGear(id: string): Promise<GearItem | null> {
  try {
    const res = await fetch(`${API_URL}/gear/${id}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function GearDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, gear] = await Promise.all([getCurrentUser(), getGear(id)]);

  if (!gear) notFound();

  const isGuest = !user;
  const bookHref = isGuest ? '/login' : `/gear-rental/${gear.id}/book`;

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gearup-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/gear-rental" className="hover:text-gearup-600">
            Gear Rental
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{gear.name}</span>
        </div>

        {/* Hero image */}
        <div className="relative h-[420px] rounded-2xl overflow-hidden mb-8 bg-gray-100">
          {gear.image_url ? (
            <Image
              src={gear.image_url}
              alt={gear.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1200px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">
              🎒
            </div>
          )}
          <div className="absolute top-4 left-4 bg-gearup-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {gear.category}
          </div>
          {!gear.is_available && (
            <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              Currently Unavailable
            </div>
          )}
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: details */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-black text-gray-900">{gear.name}</h1>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1 text-gray-600">
                📦 {gear.stock} in stock
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                🏷️ {gear.category}
              </span>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                About this gear
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {gear.description ?? 'No description provided.'}
              </p>
            </div>

            {gear.owner && (
              <div className="mt-8 bg-gray-50 rounded-2xl p-6">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Provided by
                </h2>
                <p className="text-lg font-bold text-gray-900">
                  {gear.owner.name}
                </p>
                <p className="text-sm text-gray-500">{gear.owner.email}</p>
              </div>
            )}
          </div>

          {/* Right: rental card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl shadow-lg p-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-3xl font-black text-gearup-600">
                    ₱{gear.price_per_day}
                  </p>
                  <p className="text-sm text-gray-500">per day</p>
                </div>
                <p className="text-xs text-gray-500">
                  {gear.stock} available
                </p>
              </div>

              <hr className="my-6 border-gray-100" />

              {gear.is_available && gear.stock > 0 ? (
                <>
                  <Link
                    href={bookHref}
                    className="block w-full bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-center py-3 rounded-lg transition"
                  >
                    {isGuest ? 'Sign in to Rent' : 'Rent this Gear'}
                  </Link>
                  {isGuest && (
                    <p className="text-xs text-gray-500 text-center mt-3">
                      You need an account to rent gear.
                    </p>
                  )}
                </>
              ) : (
                <button
                  disabled
                  className="block w-full bg-gray-200 text-gray-500 font-semibold text-center py-3 rounded-lg cursor-not-allowed"
                >
                  Currently Unavailable
                </button>
              )}

              <p className="text-xs text-gray-500 text-center mt-3">
                Pick up at the owner&apos;s campsite. Free cancellation up to 48
                hours before the rental date.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}