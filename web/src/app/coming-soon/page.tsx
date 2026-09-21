import Link from 'next/link';
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

const FEATURE_INFO: Record<string, { title: string; emoji: string; blurb: string }> = {
  'gear-rental': {
    title: 'Gear Rental',
    emoji: '🎒',
    blurb:
      'Rent camping gear from local shops — tents, sleeping bags, cooking kits, and more. We are onboarding rental partners now.',
  },
  events: {
    title: 'Camping Events',
    emoji: '📅',
    blurb:
      'Discover group campouts, guided hikes, and community meetups. Events from verified organizers will be listed here soon.',
  },
  'tour-guides': {
    title: 'Tour Guides',
    emoji: '🧭',
    blurb:
      'Hire accredited local guides for your trip. Browse campsites to see which ones offer guided experiences.',
  },
};

export default async function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string }>;
}) {
  const { feature } = await searchParams;
  const info = feature ? FEATURE_INFO[feature] : null;

  const title = info?.title ?? 'Coming Soon';
  const emoji = info?.emoji ?? '🚧';
  const blurb =
    info?.blurb ??
    'This feature is being built. Check back soon — we are adding new capabilities every week.';

  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />

      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="text-7xl mb-6">{emoji}</div>

        <span className="inline-block text-[10px] font-extrabold tracking-widest text-gearup-700 bg-gearup-50 px-3 py-1.5 rounded-full mb-4">
          COMING SOON
        </span>

        <h1 className="text-4xl md:text-5xl font-black text-gray-900">
          {title}
        </h1>

        <p className="text-gray-600 text-lg leading-relaxed mt-6 max-w-lg mx-auto">
          {blurb}
        </p>

        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <Link
            href="/campsites"
            className="inline-block bg-gearup-600 hover:bg-gearup-700 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Browse Campsites
          </Link>
          <Link
            href="/"
            className="inline-block border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold px-6 py-3 rounded-lg transition"
          >
            Back to Home
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-12">
          Interested in becoming a partner? Get in touch once you're on the
          platform.
        </p>
      </div>
    </div>
  );
}