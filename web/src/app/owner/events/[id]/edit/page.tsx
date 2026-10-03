import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { EventForm } from '@/components/owner/EventForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface Event {
  id?: number;
  name: string;
  description: string;
  location: string;
  region: string;
  starts_at: string;
  ends_at: string;
  price_per_person: string;
  capacity: number;
  image_url: string;
  is_published: boolean;
}

async function getEvent(
  token: string,
  id: string,
): Promise<Event | null> {
  try {
    const res = await fetch(`${API_URL}/owner/events/${id}`, {
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

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  const event = await getEvent(token, id);

  if (!event) notFound();

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/owner/events"
          className="text-sm text-gray-500 hover:text-gearup-600"
        >
          ← Back to my events
        </Link>
        <h1 className="text-3xl font-black text-gray-900 mt-4">
          Edit event
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Update the details below.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-3xl">
                <EventForm
          mode="edit"
          initial={{ ...event, region: event.region ?? '' }}
        />
      </div>
    </div>
  );
}