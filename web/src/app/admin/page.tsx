import Link from 'next/link';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function getStats(token: string) {
  try {
    const res = await fetch(`${API_URL}/admin/dashboard`, {
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

async function getPendingOwners(token: string) {
  try {
    const res = await fetch(`${API_URL}/admin/users?status=pending`, {
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

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  const [stats, pendingOwners] = await Promise.all([
    getStats(token),
    getPendingOwners(token),
  ]);

  if (!stats) {
    return <p className="text-gray-500">Could not load dashboard.</p>;
  }

  const primaryCards = [
    {
      label: 'Total Users',
      value: stats.total_users,
      icon: '👥',
      href: '/admin/users',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Campsites',
      value: stats.total_campsites,
      icon: '⛺',
      href: '/admin/campsites',
      color: 'bg-green-50 text-green-700',
    },
    {
      label: 'Bookings',
      value: stats.total_bookings,
      icon: '📅',
      href: '/admin/bookings',
      color: 'bg-purple-50 text-purple-700',
    },
    {
      label: 'Revenue',
      value: `₱${Number(stats.total_revenue).toFixed(2)}`,
      icon: '💰',
      href: '/admin/bookings',
      color: 'bg-yellow-50 text-yellow-700',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Platform-wide overview of GearUp.
        </p>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {primaryCards.map((c) => (
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

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium">Owners</p>
          <p className="text-xl font-black text-gray-900 mt-1">
            {stats.total_owners}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium">
            Pending Owners
          </p>
          <p className="text-xl font-black text-yellow-700 mt-1">
            {stats.pending_owners}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium">
            Featured Campsites
          </p>
          <p className="text-xl font-black text-gray-900 mt-1">
            {stats.featured_campsites}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium">
            Suspended Users
          </p>
          <p className="text-xl font-black text-red-700 mt-1">
            {stats.suspended_users}
          </p>
        </div>
      </div>

      {/* Pending owner approvals */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Pending Approvals
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Business owners waiting for review
            </p>
          </div>
          <Link
            href="/admin/users?status=pending"
            className="text-sm font-semibold text-gearup-600 hover:underline"
          >
            View all →
          </Link>
        </div>

        {pendingOwners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">
              ✓ No pending approvals — you're all caught up.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingOwners.slice(0, 5).map((u: any) => (
              <div
                key={u.id}
                className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-200 text-yellow-800 flex items-center justify-center font-bold">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {u.name}
                    </p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
                <Link
                  href="/admin/users?status=pending"
                  className="text-xs font-semibold text-white bg-gearup-600 hover:bg-gearup-700 px-4 py-2 rounded-lg transition"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}