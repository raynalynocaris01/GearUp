import Link from 'next/link';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

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

export default async function OwnerDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  const stats = await getStats(token);

  if (!stats) {
    return <p className="text-gray-500">Could not load dashboard.</p>;
  }

  const cards = [
    {
      label: 'My Campsites',
      value: stats.total_campsites,
      icon: '⛺',
      href: '/owner/campsites',
      color: 'bg-green-50 text-green-700',
    },
    {
      label: 'Total Bookings',
      value: stats.total_bookings,
      icon: '📅',
      href: '/owner/bookings',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Pending',
      value: stats.pending_bookings,
      icon: '⏳',
      href: '/owner/bookings',
      color: 'bg-yellow-50 text-yellow-700',
    },
    {
      label: 'Revenue',
      value: `₱${Number(stats.total_revenue).toFixed(2)}`,
      icon: '💰',
      href: '/owner/bookings',
      color: 'bg-purple-50 text-purple-700',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2 text-sm">
          A quick overview of your campsites and bookings.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-5"
          >
            <div
              className={`w-12 h-12 rounded-xl ${c.color} flex items-center justify-center text-2xl mb-4`}
            >
              {c.icon}
            </div>
            <p className="text-xs text-gray-500 font-medium">{c.label}</p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {c.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Quick start
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Get your campsite listed in a few steps.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/owner/campsites/new"
            className="bg-gearup-600 hover:bg-gearup-700 text-white font-semibold text-sm px-5 py-3 rounded-lg transition"
          >
            + Post a Campsite
          </Link>
          <Link
            href="/owner/campsites"
            className="border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold text-sm px-5 py-3 rounded-lg transition"
          >
            Manage Campsites
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