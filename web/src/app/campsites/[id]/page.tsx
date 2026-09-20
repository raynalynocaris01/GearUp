import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface Campsite {
  id: number;
  name: string;
  description: string;
  location: string;
  region: string;
  price_per_night: string;
  price_unit: string;
  image_url: string;
  rating: string;
  reviews_count: number;
  capacity: number;
  is_featured: boolean;
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

async function getCampsite(id: string): Promise<Campsite | null> {
  try {
    const res = await fetch(`${API_URL}/campsites/${id}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function CampsiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, campsite] = await Promise.all([
    getCurrentUser(),
    getCampsite(id),
  ]);

  if (!campsite) notFound();

  const isGuest = !user;
const bookHref = isGuest ? '/login' : `/campsites/${campsite.id}/book`;

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
          <span className="text-gray-900">{campsite.name}</span>
        </div>

        {/* Hero image */}
        <div className="relative h-[420px] rounded-2xl overflow-hidden mb-8">
          <Image
            src={campsite.image_url}
            alt={campsite.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1200px"
            className="object-cover"
            unoptimized
          />
          {campsite.is_featured && (
            <div className="absolute top-4 left-4 bg-gearup-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              ★ Featured
            </div>
          )}
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: details */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-black text-gray-900">
              {campsite.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1 text-gray-600">
                📍 {campsite.location}
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                <span className="text-yellow-500">★</span>
                <span className="font-semibold text-gray-900">
                  {campsite.rating}
                </span>
                <span className="text-gray-500">
                  ({campsite.reviews_count} reviews)
                </span>
              </span>
              <span className="flex items-center gap-1 text-gray-600">
                👥 Up to {campsite.capacity} people
              </span>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                About this campsite
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {campsite.description}
              </p>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Region
              </h2>
              <p className="text-gray-700">{campsite.region}</p>
            </div>
          </div>

          {/* Right: booking card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl shadow-lg p-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-3xl font-black text-gearup-600">
                    ₱{campsite.price_per_night}
                  </p>
                  <p className="text-sm text-gray-500">
                    per {campsite.price_unit}
                  </p>
                </div>
              </div>

              <hr className="my-6 border-gray-100" />

              <Link
                href={bookHref}
                className="block w-full bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-center py-3 rounded-lg transition"
              >
                {isGuest ? 'Sign in to Book' : 'Book Now'}
              </Link>

              {isGuest && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  You need an account to make a reservation.
                </p>
              )}

              <p className="text-xs text-gray-500 text-center mt-3">
                Free cancellation up to 48 hours before check-in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}