import Link from 'next/link';
import { cookies } from 'next/headers';
import { UpcomingBookings } from '@/components/owner/UpcomingBookings';
 import { BookingChart } from '@/components/charts/BookingChart';
import { CampsiteOverview } from '@/components/owner/CampsiteOverview';
import { RecentReviews } from '@/components/owner/RecentReviews';

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

async function getStats(token: string) {
  try {
    const res = await fetch(`${API_URL}/owner/dashboard`, {
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

async function getBookings(token: string) {
  try {
    const res = await fetch(`${API_URL}/owner/bookings`, {
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

async function getChart(token: string, days = 30) {
  try {
    const res = await fetch(
      `${API_URL}/owner/dashboard/chart?days=${days}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getMyCampsites(token: string) {
  try {
    const res = await fetch(`${API_URL}/owner/campsites`, {
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
async function getReviews(token: string, limit = 3) {
  try {
    const res = await fetch(
      `${API_URL}/owner/reviews?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      },
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function OwnerDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;

      const [user, stats, bookings, chart, campsites, reviews] = await Promise.all([
    getCurrentUser(),
    getStats(token),
    getBookings(token),
    getChart(token, 30),
    getMyCampsites(token),
    getReviews(token, 3),
  ]);

  if (!stats) {
    return <p className="text-gray-500">Could not load dashboard.</p>;
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const cards = [
    {
      label: 'Total Bookings',
      value: stats.total_bookings,
      href: '/owner/bookings',
      accent: 'bg-blue-50 text-blue-600',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      label: 'Confirmed',
      value: stats.confirmed_bookings,
      href: '/owner/bookings',
      accent: 'bg-green-50 text-green-600',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ),
    },
    {
      label: 'Total Earnings',
      value: `PHP ${Number(stats.total_earnings ?? stats.total_revenue ?? 0).toFixed(0)}`,
      href: '/owner/bookings',
      accent: 'bg-amber-50 text-amber-600',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: 'Average Rating',
      value: Number(stats.average_rating ?? 0).toFixed(1),
      href: '/owner/reviews',
      accent: 'bg-purple-50 text-purple-600',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            Welcome back, {firstName}!
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Here&apos;s what&apos;s happening with your listings today.
          </p>
        </div>
        <Link
          href="/owner/campsites/new"
          className="inline-flex items-center justify-center gap-2 bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-sm px-5 py-3 rounded-lg transition self-start md:self-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Campsite
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-5"
          >
            <div
              className={`w-11 h-11 rounded-xl ${c.accent} flex items-center justify-center mb-4`}
            >
              {c.icon}
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {c.label}
            </p>
            <p className="text-3xl font-black text-gray-900 mt-2">
              {c.value}
            </p>
          </Link>
        ))}
      </div>

            {/* Booking Overview chart */}
      <BookingChart data={chart} days={30} />

      {/* Campsite Overview table */}
      <CampsiteOverview campsites={campsites} />

      {/* Recent Reviews */}
      <RecentReviews reviews={reviews} limit={3} />

      {/* Upcoming bookings */}
      <UpcomingBookings bookings={bookings} limit={3} />

      {/* Quick start */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Quick start
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Manage your listings and reservations.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/owner/campsites"
            className="bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-sm px-5 py-3 rounded-lg transition"
          >
            Manage Campsites
          </Link>
          <Link
            href="/owner/gear"
            className="border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold text-sm px-5 py-3 rounded-lg transition"
          >
            Manage Gear
          </Link>
          <Link
            href="/owner/bookings"
            className="border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold text-sm px-5 py-3 rounded-lg transition"
          >
            View Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}