import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface Booking {
  id: number;
  check_in: string | null;
  check_out: string | null;
  guests: number;
  total_price: string;
  status: string;
  guide_status: 'pending' | 'accepted' | 'declined' | null;
  campsite?: { id: number; name: string; location: string } | null;
  user?: { id: number; name: string; email: string } | null;
}

interface GuideProfile {
  id: number;
  name: string;
  price_per_trip: string;
  location: string | null;
  description: string | null;
  is_independent: boolean;
  campsite_id: number | null;
}

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value;
}

async function getBookings(token: string): Promise<Booking[]> {
  const res = await fetch(`${API_URL}/guide/bookings`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return await res.json();
}

async function getProfile(token: string): Promise<GuideProfile | null> {
  const res = await fetch(`${API_URL}/guide/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return await res.json();
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function GuideDashboardPage() {
  const token = await getToken();
  if (!token) return null;

  const [bookings, profile] = await Promise.all([
    getBookings(token),
    getProfile(token),
  ]);

  const pendingCount = bookings.filter((b) => b.guide_status === 'pending').length;
  const acceptedCount = bookings.filter((b) => b.guide_status === 'accepted').length;
  const declinedCount = bookings.filter((b) => b.guide_status === 'declined').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">
          Tour Guide Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your bookings and profile.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Pending
          </p>
          <p className="text-3xl font-black text-amber-600 mt-2">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Accepted
          </p>
          <p className="text-3xl font-black text-green-600 mt-2">{acceptedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Declined
          </p>
          <p className="text-3xl font-black text-red-600 mt-2">{declinedCount}</p>
        </div>
      </div>

      {/* Profile summary */}
      {profile && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Your Profile</h2>
            <a
              href="/guide/profile"
              className="text-sm font-semibold text-gearup-600 hover:underline"
            >
              Edit →
            </a>
          </div>
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-semibold">Rate:</span> PHP{' '}
            {parseFloat(profile.price_per_trip).toFixed(2)} per trip
          </p>
          {profile.location && (
            <p className="text-sm text-gray-700 mb-1">
              <span className="font-semibold">Location:</span> {profile.location}
            </p>
          )}
          {profile.description && (
            <p className="text-sm text-gray-600 mt-2">{profile.description}</p>
          )}
        </div>
      )}

      {/* Bookings */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Your Bookings</h2>
        </div>

        {bookings.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-sm">
              No bookings yet. Customers will be able to hire you when they book a
              campsite and select your guide service.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bookings.map((booking) => (
              <div key={booking.id} className="p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {booking.campsite?.name ?? 'Tour guide booking'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(booking.check_in)} —{' '}
                      {formatDate(booking.check_out)} · {booking.guests}{' '}
                      {booking.guests === 1 ? 'guest' : 'guests'}
                    </p>
                    {booking.user && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Customer: {booking.user.name}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gearup-600">
                      PHP {parseFloat(booking.total_price).toFixed(2)}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded mt-1 ${
                        booking.guide_status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : booking.guide_status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {(booking.guide_status ?? 'PENDING').toUpperCase()}
                    </span>
                  </div>
                </div>
                {/* Accept/decline buttons will be added in BK9.5c */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}