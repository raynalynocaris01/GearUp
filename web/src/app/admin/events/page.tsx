import { cookies } from 'next/headers';
import { AdminEventsClient } from '@/components/admin/AdminEventsClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function getEvents(token: string) {
  try {
    const res = await fetch(`${API_URL}/admin/events?limit=500`, {
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

export default async function AdminEventsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  const events = await getEvents(token);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900">Events</h1>
        <p className="text-gray-500 mt-2 text-sm">
          {events.length} {events.length === 1 ? 'event' : 'events'}{' '}
          platform-wide
        </p>
      </div>

      <AdminEventsClient events={events} />
    </div>
  );
}