import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

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

const FEATURES = [
  {
    label: 'Book Campsites',
    desc: 'Find the place to stay',
    emoji: '⛺',
    color: 'text-green-700',
    bg: 'bg-green-50',
  },
  {
    label: 'Rent Gear',
    desc: 'Quality gear for your adventure',
    emoji: '🎒',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
  },
  {
    label: 'Hire Tour Guide',
    desc: 'Local guides, better experiences',
    emoji: '🧭',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
  },
  {
    label: 'Join Events',
    desc: 'Meet up and join adventures',
    emoji: '📅',
    color: 'text-gray-700',
    bg: 'bg-gray-100',
  },
];

const CAMPSITES = [
  {
    id: 1,
    name: 'Grandi Vista Campsite',
    location: 'Apolong, Valencia',
    rating: 4.5,
    reviews: 128,
    price: '₱120 / night',
    image: 'https://picsum.photos/seed/camp1/400/300',
  },
  {
    id: 2,
    name: 'Pulangbato Falls',
    location: 'Valencia, Negros Oriental',
    rating: 4.6,
    reviews: 194,
    price: '₱200 / entrance',
    image: 'https://picsum.photos/seed/camp2/400/300',
  },
  {
    id: 3,
    name: 'Mt. Talinis Base Camp',
    location: 'Valencia, Negros Oriental',
    rating: 4.8,
    reviews: 250,
    price: '₱200 / night',
    image: 'https://picsum.photos/seed/camp3/400/300',
  },
  {
    id: 4,
    name: 'Twin Lakes Retreat',
    location: 'Sibulan, Negros Oriental',
    rating: 4.7,
    reviews: 162,
    price: '₱180 / night',
    image: 'https://picsum.photos/seed/camp4/400/300',
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();

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

          <div className="mt-10 max-w-xl">
            <div className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-lg">
              <span className="pl-3 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Where do you want to go?"
                className="flex-1 px-2 py-2 text-gray-900 placeholder-gray-500 focus:outline-none"
              />
              <button className="bg-gearup-600 hover:bg-gearup-700 text-white font-semibold px-5 py-2.5 rounded-lg transition">
                Explore Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="max-w-7xl mx-auto px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <Link
              key={f.label}
              href="/login"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CAMPSITES.map((c) => (
            <Link
              key={c.id}
              href="/login"
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition"
            >
              <div className="relative h-44 overflow-hidden">
                <Image
                  src={c.image}
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
                  {c.rating} ({c.reviews})
                </p>
                <p className="text-sm font-bold text-gearup-600 mt-3">
                  {c.price}
                </p>
              </div>
            </Link>
          ))}
        </div>
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