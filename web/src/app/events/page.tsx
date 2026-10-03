import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Navbar } from '@/components/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface Event {
  id: number;
  name: string;
  description: string;
  location: string;
  region: string | null;
  starts_at: string;
  ends_at: string;
  price_per_person: string;
  capacity: number;
  image_url: string;
  owner?: { id: number; name: string };
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

async function getEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${API_URL}/events?upcoming=1`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function formatRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  // Same day → show only once
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  const startStr = start.toLocaleDateString('en-US', opts);
  const endStr = end.toLocaleDateString('en-US', {
    ...opts,
    year: 'numeric',
  });
  return `${startStr} – ${endStr}`;
}

export default async function EventsPage() {
  const [user, events] = await Promise.all([
    getCurrentUser(),
    getEvents(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900">
            Upcoming Events
          </h1>
          <p className="text-gray-500 mt-2">
            Join guided treks, campouts, and community gatherings.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-lg font-semibold text-gray-700 mb-2">
              No upcoming events
            </p>
            <p className="text-sm text-gray-500">
              Check back soon — new events are added regularly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={e.image_url}
                    alt={e.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition duration-500"
                    unoptimized
                  />
                  <span className="absolute top-3 left-3 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-md">
                    Event
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                    {e.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <span>📍</span> {e.location}
                  </p>
                  <p className="text-xs text-gray-700 mt-1 font-semibold">
                    {formatRange(e.starts_at, e.ends_at)}
                  </p>
                  <p className="text-sm font-bold text-gearup-600 mt-3">
                    PHP {e.price_per_person} / person
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}