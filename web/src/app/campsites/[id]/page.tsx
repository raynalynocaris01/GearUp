import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { ReviewsSection } from '@/components/ReviewsSection';
import { ReviewForm } from '@/components/ReviewForm';
import { appImageSrc } from '@/components/AppImage';

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
  is_available: boolean;
  parent_campsite_id: number | null;
  parent?: {
    id: number;
    name: string;
  } | null;
  reviews?: {
    id: number;
    rating: number;
    comment: string | null;
    created_at: string;
    user?: { id: number; name: string };
  }[];
  children?: {
    id: number;
    name: string;
    description: string | null;
    location: string;
    region: string;
    price_per_night: string;
    price_unit: string;
    image_url: string;
    capacity: number;
  }[];
  photos?: {
    id: number;
    campsite_id: number;
    image_url: string;
    sort_order: number;
  }[];
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

async function getMyBookings(token: string) {
  try {
    const res = await fetch(`${API_URL}/bookings`, {
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

export default async function CampsiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  const [user, campsite, myBookings] = await Promise.all([
    getCurrentUser(),
    getCampsite(id),
    token ? getMyBookings(token) : Promise.resolve([]),
  ]);

  if (!campsite) notFound();

  // Find a completed booking for this campsite that hasn't been reviewed yet
  const eligibleBooking = myBookings.find(
    (b: any) =>
      b.campsite_id === campsite.id &&
      b.status === 'completed' &&
      !b.review,
  );

  const photos = (campsite.photos ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  const isGuest = !user;
  const isRoom = !!campsite.parent_campsite_id && !!campsite.parent;
  const bookingTargetId = isRoom ? campsite.parent!.id : campsite.id;
  const bookHref = isGuest
    ? '/login'
    : `/campsites/${bookingTargetId}/book`;

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
          <Link href="/campsites" className="hover:text-gearup-600">
            Campsites
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{campsite.name}</span>
        </div>

        {/* Photo gallery */}
        {photos.length > 0 ? (
          <div className="relative mb-8">
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden">
              <div className="relative col-span-2 row-span-2">
                <Image
                  src={appImageSrc(photos[0].image_url)}
                  alt={campsite.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              {photos.slice(1, 5).map((p, i) => (
                <div key={p.id} className="relative">
                  <Image
                    src={appImageSrc(p.image_url)}
                    alt={`${campsite.name} photo ${i + 2}`}
                    fill
                    sizes="25vw"
                    className="object-cover"
                    unoptimized
                  />
                  {i === 3 && photos.length > 5 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-semibold">
                      +{photos.length - 5} more
                    </div>
                  )}
                </div>
              ))}
            </div>
            {campsite.is_featured && (
              <div className="absolute top-4 left-4 bg-gearup-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                ★ Featured
              </div>
            )}
          </div>
        ) : (
          <div className="relative h-[420px] rounded-2xl overflow-hidden mb-8">
            <Image
              src={appImageSrc(campsite.image_url)}
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
        )}

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: details */}
          <div className="lg:col-span-2">
            {!campsite.is_available && (
              <div className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
                TEMPORARILY CLOSED
              </div>
            )}
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

            {/* Also available at this location (sibling listings) */}
            {campsite.is_available &&
              campsite.children &&
              campsite.children.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Also available at this location
                </h2>
                <div className="space-y-3">
                  {campsite.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/campsites/${child.id}`}
                      className="flex items-center gap-4 bg-white border border-gray-100 hover:border-gearup-600 rounded-xl p-4 transition group"
                    >
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {child.image_url && (
                          <Image
                            src={appImageSrc(child.image_url)}
                            alt={child.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {child.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {child.location}
                        </p>
                        <p className="text-sm font-black text-gearup-600 mt-1">
                          PHP {child.price_per_night} / {child.price_unit}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-gearup-600 group-hover:underline shrink-0">
                        View &rarr;
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Region
              </h2>
              <p className="text-gray-700">{campsite.region}</p>
            </div>

            {/* Reviews */}
            <ReviewsSection
              reviews={campsite.reviews ?? []}
              rating={campsite.rating}
              reviewsCount={campsite.reviews_count}
            />

            {eligibleBooking && (
              <div className="mt-8">
                <ReviewForm
                  campsiteId={campsite.id}
                  bookingId={eligibleBooking.id}
                />
              </div>
            )}
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

              {/* Book Now / Sign in to Book */}
              {isRoom && (
                <div className="bg-gearup-50 border border-gearup-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gearup-700 font-semibold">
                    This room is part of{' '}
                    <Link
                      href={`/campsites/${campsite.parent!.id}`}
                      className="underline hover:text-gearup-800"
                    >
                      {campsite.parent!.name}
                    </Link>
                    .
                  </p>
                </div>
              )}

              {!campsite.is_available ? (
                <div className="text-center">
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm font-semibold px-4 py-3 rounded-lg">
                    This campsite is currently unavailable for booking.
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Check back soon, or browse other campsites.
                  </p>
                </div>
              ) : (
                <>
                  <Link
                    href={bookHref}
                    className="block w-full bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-center py-3 rounded-lg transition"
                  >
                    {isGuest
                      ? 'Sign in to Book'
                      : isRoom
                        ? `Book via ${campsite.parent!.name}`
                        : 'Book Now'}
                  </Link>

                  {isGuest && (
                    <p className="text-xs text-gray-500 text-center mt-3">
                      You need an account to make a reservation.
                    </p>
                  )}
                </>
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
