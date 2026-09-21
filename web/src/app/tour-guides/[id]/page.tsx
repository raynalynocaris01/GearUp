import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface TourGuide {
  id: number;
  campsite_id: number | null;
  name: string;
  contact_number: string;
  email: string | null;
  description: string | null;
  price_per_trip: string;
  is_independent: boolean;
  location: string | null;
  created_at: string;
  campsite?: {
    id: number;
    name: string;
    location: string;
    image_url: string;
  } | null;
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

async function getGuide(id: string): Promise<TourGuide | null> {
  try {
    const res = await fetch(`${API_URL}/tour-guides/${id}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function TourGuideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, guide] = await Promise.all([
    getCurrentUser(),
    getGuide(id),
  ]);

  if (!guide) notFound();

  const price = parseFloat(guide.price_per_trip);
  const heroImage = guide.campsite?.image_url;

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gearup-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/tour-guides" className="hover:text-gearup-600">
            Tour Guides
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{guide.name}</span>
        </div>

        {/* Hero */}
        <div className="relative h-[320px] rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-gearup-50 to-green-100">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={guide.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1200px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl">🧭</span>
            </div>
          )}

          {guide.is_independent && (
            <div className="absolute top-4 left-4 bg-gearup-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              INDEPENDENT GUIDE
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: info */}
          <div className="lg:col-span-2">
            {/* Name + avatar */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gearup-600 text-white flex items-center justify-center text-2xl font-black shrink-0">
                {guide.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 leading-tight">
                  {guide.name}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {guide.campsite
                    ? `Guide at ${guide.campsite.name}`
                    : guide.location ?? 'Independent guide'}
                </p>
              </div>
            </div>

            {guide.description && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  About
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {guide.description}
                </p>
              </div>
            )}

            {/* Contact details */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Contact
              </h2>
              <div className="space-y-3">
                <a
                  href={`tel:${guide.contact_number}`}
                  className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 transition rounded-lg px-4 py-3"
                >
                  <span className="text-xl">📞</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Phone
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {guide.contact_number}
                    </p>
                  </div>
                  <span className="text-xs text-gearup-600 font-semibold">
                    Call →
                  </span>
                </a>

                {guide.email && (
                  <a
                    href={`mailto:${guide.email}`}
                    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 transition rounded-lg px-4 py-3"
                  >
                    <span className="text-xl">✉️</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Email
                      </p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {guide.email}
                      </p>
                    </div>
                    <span className="text-xs text-gearup-600 font-semibold">
                      Email →
                    </span>
                  </a>
                )}
              </div>
            </div>

            {/* Linked campsite */}
            {guide.campsite && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Works at
                </h2>
                <Link
                  href={`/campsites/${guide.campsite.id}`}
                  className="group flex items-center gap-4 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition p-3"
                >
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <Image
                      src={guide.campsite.image_url}
                      alt={guide.campsite.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Campsite
                    </p>
                    <p className="font-bold text-gray-900 truncate">
                      {guide.campsite.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      📍 {guide.campsite.location}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-gearup-600 group-hover:underline shrink-0">
                    View campsite →
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Right: booking card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border border-gray-100 rounded-2xl shadow-lg p-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-3xl font-black text-gearup-600">
                    {price > 0 ? `₱${price.toFixed(0)}` : 'Contact'}
                  </p>
                  <p className="text-sm text-gray-500">per trip</p>
                </div>
              </div>

              <hr className="my-6 border-gray-100" />

              <Link
                href="/tour-guides"
                className="block w-full bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-center py-3 rounded-lg transition"
              >
                Browse more guides
              </Link>

              <p className="text-xs text-gray-500 text-center mt-3">
                {guide.campsite
                  ? 'Book this guide when you reserve the campsite.'
                  : 'Contact the guide directly to arrange a booking.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}