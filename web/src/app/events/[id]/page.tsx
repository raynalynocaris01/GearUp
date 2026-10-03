import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { EventRegisterButton } from '@/components/EventRegisterButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface EventDetail {
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
  is_published: boolean;
  owner?: { id: number; name: string };
}

interface Registration {
  id: number;
  guests: number;
  total_price: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

async function getEvent(id: string): Promise<EventDetail | null> {
  try {
    const res = await fetch(`${API_URL}/events/${id}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
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

async function getMyRegistration(eventId: string): Promise<Registration | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/events/${eventId}/registration-status`, {
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

function formatRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return start.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const endStr = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startStr} – ${endStr}`;
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, user, myReg] = await Promise.all([
    getEvent(id),
    getCurrentUser(),
    getMyRegistration(id),
  ]);

  if (!event) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="relative h-[400px] w-full">
        <Image
          src={event.image_url}
          alt={event.name}
          fill
          sizes="100vw"
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-5xl mx-auto px-6 pb-10 text-white">
          <span className="inline-block bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-md mb-3">
            Event
          </span>
          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            {event.name}
          </h1>
          <p className="text-sm md:text-base text-white/90 mt-2">
            {event.location}
            {event.region ? ` - ${event.region}` : ''}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              About this event
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Details
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500 text-xs font-bold uppercase tracking-wide">
                  When
                </dt>
                <dd className="text-gray-900 font-semibold mt-1">
                  {formatRange(event.starts_at, event.ends_at)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs font-bold uppercase tracking-wide">
                  Where
                </dt>
                <dd className="text-gray-900 font-semibold mt-1">
                  {event.location}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs font-bold uppercase tracking-wide">
                  Capacity
                </dt>
                <dd className="text-gray-900 font-semibold mt-1">
                  {event.capacity} people
                </dd>
              </div>
              {event.owner ? (
                <div>
                  <dt className="text-gray-500 text-xs font-bold uppercase tracking-wide">
                    Organizer
                  </dt>
                  <dd className="text-gray-900 font-semibold mt-1">
                    {event.owner.name}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">
              Price per person
            </p>
            <p className="text-3xl font-black text-gearup-600 mt-1">
              PHP {event.price_per_person}
            </p>

            <div className="mt-6">
              <EventRegisterButton
                eventId={event.id}
                isLoggedIn={!!user}
                existingRegistration={myReg}
                capacity={event.capacity}
              />
            </div>

            <Link
              href="/events"
              className="block mt-4 text-center text-xs font-semibold text-gray-500 hover:text-gearup-600"
            >
              &larr; Back to all events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}