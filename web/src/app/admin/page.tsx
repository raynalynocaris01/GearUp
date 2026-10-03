import Link from 'next/link';
import { cookies } from 'next/headers';
import { AdminKpiGrid } from '@/components/admin/AdminKpiGrid';
import { AdminRecentBookings } from '@/components/admin/AdminRecentBookings';
import { AdminRecentUsers } from '@/components/admin/AdminRecentUsers';
import { AdminSystemOverview } from '@/components/admin/AdminSystemOverview';
import { BookingChart } from '@/components/charts/BookingChart';
import type { AdminDashboardStats } from '@gearup/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function fetchJson<T>(url: string, token: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;

  const [stats, chart, bookings, users] = await Promise.all([
    fetchJson<AdminDashboardStats | null>(
      `${API_URL}/admin/dashboard`,
      token,
      null,
    ),
    fetchJson<any>(`${API_URL}/admin/dashboard/chart?days=30`, token, null),
    fetchJson<any[]>(`${API_URL}/admin/bookings`, token, []),
    fetchJson<any[]>(`${API_URL}/admin/users`, token, []),
  ]);

  if (!stats) {
    return <p className="text-gray-500">Could not load dashboard.</p>;
  }

  const kpis = [
    {
      label: 'Total Users',
      value: stats.total_users,
      icon: 'users' as const,
      href: '/admin/users',
      accent: 'bg-blue-50 text-blue-600',
      delta: `${stats.total_owners} owners`,
    },
    {
      label: 'Campsites',
      value: stats.total_campsites,
      icon: 'campsites' as const,
      href: '/admin/campsites',
      accent: 'bg-green-50 text-green-600',
      delta: `${stats.featured_campsites} featured`,
    },
    {
      label: 'Bookings',
      value: stats.total_bookings,
      icon: 'bookings' as const,
      href: '/admin/bookings',
      accent: 'bg-purple-50 text-purple-600',
      delta: `${stats.pending_bookings} pending`,
    },
    {
      label: 'Revenue',
      value: `PHP ${Number(stats.total_revenue).toFixed(0)}`,
      icon: 'revenue' as const,
      href: '/admin/bookings',
      accent: 'bg-yellow-50 text-yellow-600',
      delta: 'Confirmed + completed',
    },
  ];

  const pendingOwners = users.filter(
    (u: any) => u.role === 'owner' && !u.is_approved,
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Platform-wide overview of GearUp.
        </p>
      </div>

      {/* Primary KPIs */}
      <AdminKpiGrid kpis={kpis} />

      {/* Chart + Recent Bookings */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2">
          <BookingChart data={chart} days={30} />
        </div>
        <div>
          <AdminRecentBookings bookings={bookings} />
        </div>
      </div>

      {/* Recent Users + System Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2">
          <AdminRecentUsers users={users} />
        </div>
        <div>
          <AdminSystemOverview stats={stats} />
        </div>
      </div>

      {/* Pending Approvals */}
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
            View all &rarr;
          </Link>
        </div>

        {pendingOwners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">
              No pending approvals - you are all caught up.
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