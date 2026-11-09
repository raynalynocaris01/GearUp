import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { appImageSrc } from '@/components/AppImage';
import { Compass } from 'lucide-react';
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

async function getGuides(): Promise<TourGuide[]> {
  try {
    const res = await fetch(`${API_URL}/tour-guides`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function TourGuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const [user, allGuides] = await Promise.all([
    getCurrentUser(),
    getGuides(),
  ]);

  // Client-side filter by name / location / description
  const q = (search ?? '').trim().toLowerCase();
  const guides = q
    ? allGuides.filter((g) => {
        const haystack = [
          g.name,
          g.location ?? '',
          g.description ?? '',
          g.campsite?.name ?? '',
          g.campsite?.location ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      })
    : allGuides;

  // Split: attached vs independent
  const attached = guides.filter((g) => !g.is_independent);
  const independent = guides.filter((g) => g.is_independent);

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />

      {/* HERO */}
      <section className="bg-gearup-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <span className="inline-block text-[10px] font-extrabold tracking-widest text-gearup-100 bg-gearup-700/50 px-3 py-1.5 rounded-full mb-4">
            LOCAL GUIDES
          </span>
          <h1 className="text-4xl md:text-5xl font-black leading-tight max-w-2xl">
            Hire a guide for your next adventure.
          </h1>
          <p className="text-white/85 mt-4 text-lg max-w-xl">
            Browse accredited local guides. Book one when you reserve a
            campsite, or hire them on their own.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {q && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-gearup-200 bg-gearup-50 px-5 py-3">
            <p className="text-sm text-gearup-900">
              Showing guides matching <strong>&quot;{search}&quot;</strong>
            </p>
            <Link
              href="/tour-guides"
              className="shrink-0 text-xs font-semibold text-gearup-700 hover:underline"
            >
              Clear search
            </Link>
          </div>
        )}
        {guides.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-500">
            {q
              ? `No guides match "${search}". Try a different name or location.`
              : 'No tour guides available yet. Check back soon.'}
          </div>
        ) : (
          <>
            {/* INDEPENDENT GUIDES */}
            {independent.length > 0 && (
              <section className="mb-14">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900">
                      Independent Guides
                    </h2>
                    <p className="text-gray-500 mt-1 text-sm">
                      Hire them for a day trip, trek, or custom outing.
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {independent.length}{' '}
                    {independent.length === 1 ? 'guide' : 'guides'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {independent.map((g) => (
                    <GuideCard key={g.id} guide={g} />
                  ))}
                </div>
              </section>
            )}

            {/* CAMPSITE GUIDES */}
            {attached.length > 0 && (
              <section>
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900">
                      Guides at Campsites
                    </h2>
                    <p className="text-gray-500 mt-1 text-sm">
                      Available when you book one of these campsites.
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {attached.length}{' '}
                    {attached.length === 1 ? 'guide' : 'guides'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {attached.map((g) => (
                    <GuideCard key={g.id} guide={g} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GuideCard({ guide }: { guide: TourGuide }) {
  const price = parseFloat(guide.price_per_trip);
  const href = `/tour-guides/${guide.id}`;

  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition flex flex-col"
    >
      {/* Image (campsite photo if attached) */}
      <div className="relative h-44 overflow-hidden bg-gearup-50">
        {guide.campsite?.image_url ? (
          <Image
            src={appImageSrc(guide.campsite.image_url)}
            alt={guide.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gearup-50 to-green-100">
            <Compass size={64} className="text-gearup-600" />
          </div>
        )}

        {guide.is_independent && (
          <div className="absolute top-3 left-3 bg-gearup-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            INDEPENDENT
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-gearup-600 text-white flex items-center justify-center font-bold shrink-0">
            {guide.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate">
              {guide.name}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {guide.campsite
                ? `at ${guide.campsite.name}`
                : guide.location ?? 'Independent guide'}
            </p>
          </div>
        </div>

        {guide.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {guide.description}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Rate
            </p>
            <p className="text-lg font-black text-gearup-600">
              {price > 0 ? `₱${price.toFixed(0)}` : 'Contact'}
            </p>
            <p className="text-xs text-gray-500">per trip</p>
          </div>
          <span className="text-xs font-semibold text-gearup-600 group-hover:underline">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}