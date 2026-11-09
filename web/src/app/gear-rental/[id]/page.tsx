import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { appImageSrc } from '@/components/AppImage';

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
  pickup_method?: 'meetup' | 'pickup' | 'deliver' | 'all';
  pickup_address?: string | null;
  pickup_landmark?: string | null;
  pickup_hours?: string | null;
  pickup_instructions?: string | null;
  contact_number?: string | null;
  pickup_city?: string | null;
  owner_pickup?: {
    method: string | null;
    address: string | null;
    landmark: string | null;
    hours: string | null;
    instructions: string | null;
    contact_number: string | null;
    facebook_url?: string | null;
  } | null;
  owner?: {
    id: number;
    name: string;
    email: string;
    role?: string;
    facebook_url?: string | null;
  };
  campsite_id?: number | null;
  campsite_name?: string | null;
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
  const isOwnGear = !isGuest && user?.id === gear.owner_id;
  
  // Determine where the button should go
  let bookHref = isGuest ? '/login' : `/gear-rental/${gear.id}/book`;
  let isCampsiteGear = false;

  // If the owner is a campsite owner, we need the campsite ID. 
  // Assuming the backend passes `campsite_id` on the gear object or owner object.
  const ownerCampsiteId = gear.campsite_id ?? (gear as any).owner?.campsite_id;

  if (gear.owner?.role === 'owner' && ownerCampsiteId) {
    // Redirect directly to the campsite booking page and auto-select this gear
    bookHref = `/campsites/${ownerCampsiteId}/book?gear_id=${gear.id}`;
    isCampsiteGear = true;
  }

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
              src={appImageSrc(gear.image_url)}
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

            {/* Campsite gear notice */}
            {isCampsiteGear && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-600 shrink-0 mt-0.5"
                >
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">
                    Campsite-only gear
                  </p>
                  <p className="text-xs text-amber-800 mt-1">
                    This item is only available to guests who have booked a
                    stay at {gear.campsite_name ?? 'the campsite'}. You&apos;ll
                    be able to add it to your booking when you reserve a
                    campsite.
                  </p>
                </div>
              </div>
            )}

            {gear.owner && (
  <div className="bg-white rounded-2xl border border-gray-100 p-6">
    <p className="text-xs font-extrabold tracking-wider text-gray-500 mb-2">
      PROVIDED BY
    </p>
    <p className="font-semibold text-gray-900">{gear.owner.name}</p>
    <p className="text-sm text-gray-500">{gear.owner.email}</p>
  </div>
)}
{/* Pickup & delivery (only for individual rentals, not campsite gear) */}
{gear.owner?.role !== 'owner' && (
  <div className="bg-white rounded-2xl border border-gray-100 p-6">
    <p className="text-xs font-extrabold tracking-wider text-gray-500 mb-2">
      PICKUP & DELIVERY
    </p>
    {gear.owner_pickup ? (
      <div className="space-y-3 text-sm text-gray-700">
        <p className="font-semibold text-gray-900">
          {gear.owner_pickup.method === 'pickup'
            ? "Pick up at the owner's place"
            : gear.owner_pickup.method === 'deliver'
              ? 'Delivered to you'
              : gear.owner_pickup.method === 'all'
                ? 'Meet-up, pickup, or delivery available'
                : 'Meet-up at an agreed place'}
        </p>
        
        {gear.owner_pickup.address && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Address</p>
            <p>{gear.owner_pickup.address}</p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(gear.owner_pickup.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 text-xs font-semibold text-gearup-600 hover:underline"
            >
              Open in Google Maps →
            </a>
          </div>
        )}

        {gear.owner_pickup.landmark && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Landmark</p>
            <p>{gear.owner_pickup.landmark}</p>
          </div>
        )}

        {gear.owner_pickup.hours && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Hours</p>
            <p>{gear.owner_pickup.hours}</p>
          </div>
        )}

        {gear.owner_pickup.instructions && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Instructions</p>
            <p className="whitespace-pre-line">{gear.owner_pickup.instructions}</p>
          </div>
        )}

        {gear.owner_pickup.contact_number && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Contact</p>
            <a
              href={`tel:${gear.owner_pickup.contact_number.replace(/\s+/g, '')}`}
              className="font-semibold text-gearup-600 hover:underline"
            >
              {gear.owner_pickup.contact_number}
            </a>
          </div>
        )}

        {gear.owner?.facebook_url && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Facebook</p>
            <a
              href={gear.owner.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gearup-600 hover:underline break-all"
            >
              {gear.owner.facebook_url}
            </a>
          </div>
        )}
      </div>
    ) : (
      <p className="text-sm text-gray-500 italic">
        Pickup details not yet provided by the seller.
      </p>
    )}
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
                  {isOwnGear ? (
                    <div className="block w-full bg-gray-200 text-gray-500 font-semibold text-center py-3 rounded-lg cursor-not-allowed select-none">
                      You can't book your own gear
                    </div>
                  ) : (
                    <Link
                      href={bookHref}
                      className="block w-full bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-center py-3 rounded-lg transition"
                    >
                      {isGuest 
                        ? 'Sign in to Rent' 
                        : isCampsiteGear 
                          ? `Book Campsite & Add ${gear.name}`
                          : 'Rent this Gear'}
                    </Link>
                  )}
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
                {gear.owner?.role === 'owner'
                  ? 'Available at the campsite during your stay. Free cancellation up to 48 hours before the rental date.'
                  : (() => {
                      const method = gear.pickup_method ?? 'meetup';
                      const label =
                        method === 'pickup' ? "Pick up at the owner's place"
                        : method === 'deliver' ? 'Delivered to you'
                        : method === 'all' ? 'Meet-up, pickup, or delivery available'
                        : 'Meet-up at an agreed place';
                      const city = (gear as any).pickup_city
                        ?? (gear.pickup_address
                          ? (() => {
                              const parts = gear.pickup_address.split(',').map((s: string) => s.trim()).filter(Boolean);
                              return parts.length >= 2 ? parts[parts.length - 2] : null;
                            })()
                          : null);
                      return city
                        ? `${label} in ${city}. Full details shown after booking. Free cancellation up to 48 hours before the rental date.`
                        : `${label}. Full details shown after booking. Free cancellation up to 48 hours before the rental date.`;
                    })()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
