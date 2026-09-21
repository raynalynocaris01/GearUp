import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { HomeSearch } from '@/components/HomeSearch';

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

async function getFeaturedCampsites(): Promise<Campsite[]> {
  try {
    const res = await fetch(`${API_URL}/campsites?featured=1`, {
      headers: { Accept: 'application/json' },
      // Revalidate every 60 seconds — cheap freshness without a full cache bust
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

const FEATURES = [
  {
    label: 'Book Campsites',
    desc: 'Find the place to stay',
    emoji: '⛺',
    bg: 'bg-green-50',
    href: '/campsites',
  },
  {
    label: 'Rent Gear',
    desc: 'Quality gear for your adventure',
    emoji: '🎒',
    bg: 'bg-blue-50',
    href: '/coming-soon?feature=gear-rental',
  },
  {
    label: 'Hire Tour Guide',
    desc: 'Local guides, better experiences',
    emoji: '🧭',
    bg: 'bg-orange-50',
    href: '/campsites',
  },
  {
    label: 'Join Events',
    desc: 'Meet up and join adventures',
    emoji: '📅',
    bg: 'bg-gray-100',
    href: '/coming-soon?feature=events',
  },
];

export default async function HomePage() {
  const [user, campsites] = await Promise.all([
    getCurrentUser(),
    getFeaturedCampsites(),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />

      {/* HERO */}
      <section className="relative h-[520px] text-white overflow-hidden">
        <Image
          src="/camping-bg.jpg"
          alt="Camping"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-center">
          <h1 className="text-5xl md:text-7xl font-black leading-[1.02] tracking-tight uppercase max-w-2xl">
            Explore.
            <br />
            Camp.
            <br />
            <span className="text-gearup-500">Adventure.</span>
          </h1>

          <HomeSearch />
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="max-w-7xl mx-auto px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <Link
              key={f.label}
              href={f.href}
              className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-5 flex items-center gap-4 border border-gray-100"
            >
              <div
                className={`w-14 h-14 rounded-xl ${f.bg} flex items-center justify-center text-2xl shrink-0`}
              >
                {f.emoji}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{f.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* POPULAR CAMPSITES */}
      <section className="max-w-7xl mx-auto px-6 mt-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900">
              Popular Campsites
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              Top-rated outdoor destinations
            </p>
          </div>
          <Link
            href="/login"
            className="text-gearup-600 font-semibold text-sm hover:underline"
          >
            View All →
          </Link>
        </div>

        {campsites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-500">
            No campsites available right now. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {campsites.map((c) => (
              <Link
                key={c.id}
                href={`/campsites/${c.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={c.image_url}
                    alt={c.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover group-hover:scale-105 transition duration-500"
                    unoptimized
                  />
                  <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-gray-700 hover:text-red-500 transition">
                    ♡
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900">{c.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <span>📍</span> {c.location}
                  </p>
                  <p className="text-xs text-gray-700 mt-1 flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    {c.rating} ({c.reviews_count})
                  </p>
                  <p className="text-sm font-bold text-gearup-600 mt-3">
                    ₱{c.price_per_night} / {c.price_unit}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA BANNER */}
      <section className="max-w-7xl mx-auto px-6 mt-20 mb-16">
        <div className="rounded-3xl bg-gearup-900 text-white p-10 md:p-14 relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <h2 className="text-3xl md:text-4xl font-black leading-tight">
              Plan your next adventure today!
            </h2>
            <p className="mt-3 text-white/85">
              Everything you need for unforgettable trips is here.
            </p>
            <Link
              href="/signup"
              className="inline-block mt-6 bg-gearup-600 hover:bg-gearup-700 px-7 py-3 rounded-lg font-semibold transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}