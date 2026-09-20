import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { BookingForm } from '@/components/BookingForm';

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

export default async function BookCampsitePage({
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
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6">
          <Link href="/campsites" className="hover:text-gearup-600">
            Campsites
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/campsites/${campsite.id}`}
            className="hover:text-gearup-600"
          >
            {campsite.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Book</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: form */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              Complete your booking
            </h1>
            <p className="text-gray-500 text-sm mb-8">
              Enter your trip details below. You can review everything before
              confirming.
            </p>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <BookingForm campsite={campsite} />
            </div>
          </div>

          {/* Right: campsite summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="relative h-44">
                <Image
                  src={campsite.image_url}
                  alt={campsite.name}
                  fill
                  sizes="400px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-900">{campsite.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  📍 {campsite.location}
                </p>
                <p className="text-xs text-gray-700 mt-1">
                  <span className="text-yellow-500">★</span> {campsite.rating}{' '}
                  ({campsite.reviews_count} reviews)
                </p>
                <div className="border-t border-gray-100 my-4" />
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-500">Price</span>
                  <span className="text-xl font-black text-gearup-600">
                    ₱{campsite.price_per_night}
                  </span>
                </div>
                <p className="text-xs text-gray-500 text-right">
                  per {campsite.price_unit}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}