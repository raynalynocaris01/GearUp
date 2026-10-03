import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface Registration {
  id: number;
  user_id: number;
  event_id: number;
  guests: number;
  total_price: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  user?: { id: number; name: string; email: string };
}

interface EventDetail {
  id: number;
  name: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  price_per_person: string;
}

async function getEvent(token: string, id: string): Promise<EventDetail | null> {
  try {
    const res = await fetch(`${API_URL}/owner/events/${id}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getAttendees(token: string, id: string): Promise<Registration[]> {
  try {
    const res = await fetch(`${API_URL}/owner/events/${id}/registrations`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

function statusPill(status: string) {
  if (status === 'cancelled') return 'bg-red-100 text-red-700';
  if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-700';
}

export default async function EventAttendeesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;

  const [event, attendees] = await Promise.all([
    getEvent(token, id),
    getAttendees(token, id),
  ]);

  if (!event) notFound();

  const confirmed = attendees.filter((a) => a.status === 'confirmed');
  const totalGuests = confirmed.reduce((sum, a) => sum + a.guests, 0);
  const totalRevenue = confirmed.reduce(
    (sum, a) => sum + Number(a.total_price),
    0,
  );

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/owner/events"
          className="text-xs font-semibold text-gray-500 hover:text-gearup-600"
        >
          &larr; Back to events
        </Link>
        <h1 className="text-3xl font-black text-gray-900 mt-2">
          {event.name}
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          {fmtDate(event.starts_at)} - {fmtDate(event.ends_at)} - Capacity{' '}
          {event.capacity}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">
            Registrations
          </p>
          <p className="text-2xl font-black text-gray-900 mt-1">
            {confirmed.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">
            Total Guests
          </p>
          <p className="text-2xl font-black text-gray-900 mt-1">
            {totalGuests}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">
            Revenue
          </p>
          <p className="text-2xl font-black text-gearup-600 mt-1">
            PHP {totalRevenue.toFixed(0)}
          </p>
        </div>
      </div>

      {attendees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-base font-bold text-gray-900 mb-1">
            No registrations yet
          </p>
          <p className="text-sm text-gray-500">
            When campers register for this event, they will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Attendee
                </th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Guests
                </th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                  Registered
                </th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendees.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gearup-50 text-gearup-700 flex items-center justify-center text-sm font-bold shrink-0">
                        {(a.user?.name ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {a.user?.name ?? 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {a.user?.email ?? ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-gray-900">
                      {a.guests}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-xs text-gray-700">
                      {fmtDate(a.created_at)}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block text-[10px] font-extrabold tracking-wider px-2 py-1 rounded ${statusPill(
                        a.status,
                      )}`}
                    >
                      {a.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className="text-sm font-black text-gearup-600">
                      PHP {a.total_price}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}