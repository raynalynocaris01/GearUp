import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { HomeSearch } from '@/components/HomeSearch';
import { RecommendedSection } from '@/components/RecommendedSection';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface RecommendedData {
  campsites: any[];
  gear: any[];
  guides: any[];
  events: any[];
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

async function getRecommended(): Promise<RecommendedData> {
  try {
    const res = await fetch(`${API_URL}/home/recommended`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return { campsites: [], gear: [], guides: [], events: [] };
    }
    return await res.json();
  } catch {
    return { campsites: [], gear: [], guides: [], events: [] };
  }
}

const FEATURES = [
  {
    label: 'Book Campsites',
    desc: 'Find the place to stay',
    href: '/campsites',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3.5 21 14 3" />
        <path d="M20.5 21 10 3" />
        <path d="M15.5 21 12 15l-3.5 6" />
        <path d="M2 21h20" />
      </svg>
    ),
    accent: 'text-green-600',
  },
  {
    label: 'Rent Gear',
    desc: 'Quality gear for your adventure',
    href: '/gear-rental',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    accent: 'text-blue-600',
  },
  {
    label: 'Hire Tour Guide',
    desc: 'Local guides, better experiences',
    href: '/tour-guides',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    accent: 'text-orange-600',
  },
  {
    label: 'Join Events',
    desc: 'Meet up and join adventures',
    href: '/events',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    accent: 'text-purple-600',
  },
  {
    label: 'List Your Gear',
    desc: 'Earn by renting out your equipment',
    href: '/my-gear',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    accent: 'text-rose-600',
  },
];

export default async function HomePage() {
  const [user, recommended] = await Promise.all([
    getCurrentUser(),
    getRecommended(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      {/* HERO */}
            <section className="relative h-[440px] text-white overflow-hidden">
        <Image
          src="/camping-bg.jpg"
          alt="Camping"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />

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

      {/* FEATURE CARDS — floating over hero */}
            <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {FEATURES.map((f) => (
            <Link
              key={f.label}
              href={f.href}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-4 flex items-center gap-3 border border-gray-100"
            >
              <div
                className={`w-11 h-11 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 ${f.accent}`}
              >
                {f.icon}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">
                  {f.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {f.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* RECOMMENDED */}
      <RecommendedSection data={recommended} />

            {/* FOOTER SPACER */}
      <div className="h-10" />
    </div>
  );
}