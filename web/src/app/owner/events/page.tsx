import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { DeleteEventButton } from '@/components/owner/DeleteEventButton';
import { appImageSrc } from '@/components/AppImage';
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
  is_published: boolean;
}

async function getMyEvents(token: string): Promise<Event[]> {
  try {
    const res = await fetch(`${API_URL}/owner/events`, {
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

function formatRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

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

    return `${start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} - ${end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

export default async function OwnerEventsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  const events = await getMyEvents(token);

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            My Events
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {events.length}{' '}
            {events.length === 1 ? 'event' : 'events'} created
          </p>
        </div>
        <Link
          href="/owner/events/new"
          className="bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-sm px-5 py-3 rounded-lg transition"
        >
          + Create Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gearup-50 text-gearup-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-700 mb-2">
            No events yet
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Create your first event to bring campers together.
          </p>
          <Link
            href="/owner/events/new"
            className="inline-block bg-gearup-600 hover:bg-gearup-700 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex"
            >
              <div className="relative w-48 shrink-0 bg-gray-100">
                {e.image_url ? (
                  <Image
                    src={appImageSrc(e.image_url)}
                    alt={e.name}
                    fill
                    sizes="192px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {e.name}
                  </h3>
                  {!e.is_published && (
                    <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      DRAFT
                    </span>
                  )}
                </div>
                                <p className="text-xs text-gray-500">
                  {e.location}
                </p>
                <p className="text-xs text-gray-700 mt-2 font-semibold">
                  {formatRange(e.starts_at, e.ends_at)}
                </p>
                {e.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                    {e.description}
                  </p>
                )}
               <p className="text-sm font-bold text-gearup-600 mt-3">
                  PHP {e.price_per_person} / person - Capacity {e.capacity}
                </p>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Link
                    href={`/events/${e.id}`}
                    className="text-xs font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition"
                  >
                    View Public
                  </Link>
                  <Link
                    href={`/owner/events/${e.id}/edit`}
                    className="text-xs font-semibold text-white bg-gearup-600 hover:bg-gearup-700 px-3 py-2 rounded-lg transition"
                  >
                    Edit
                  </Link>
                                    <Link
                    href={`/owner/events/${e.id}/attendees`}
                    className="text-xs font-semibold text-white bg-gearup-600 hover:bg-gearup-700 px-3 py-2 rounded-lg transition"
                  >
                    Attendees
                  </Link>
                  <DeleteEventButton eventId={e.id} name={e.name} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}