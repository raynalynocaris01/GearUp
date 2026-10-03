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
type IconName = 'users' | 'campsites' | 'bookings' | 'revenue';

function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  const common = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (name === 'users') {
    return (
      <svg {...common}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (name === 'campsites') {
    return (
      <svg {...common}>
        <path d="M3 20l9-16 9 16" />
        <path d="M12 4v4" />
        <path d="M12 12v8" />
        <path d="M9 20l3-4 3 4" />
      </svg>
    );
  }
  if (name === 'bookings') {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
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
      icon: 'users' as const,
      href: '/admin/users',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Campsites',
      value: stats.total_campsites,
      icon: 'campsites' as const,
      href: '/admin/campsites',
      color: 'bg-green-50 text-green-700',
    },
    {
      label: 'Bookings',
      value: stats.total_bookings,
      icon: 'bookings' as const,
      href: '/admin/bookings',
      color: 'bg-purple-50 text-purple-700',
    },
    {
      label: 'Revenue',
      value: `PHP ${Number(stats.total_revenue).toFixed(0)}`,
      icon: 'revenue' as const,
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
              className={`w-12 h-12 rounded-xl ${c.color} flex items-center justify-center mb-4`}
            >
              <Icon name={c.icon} size={22} />
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
                       View all &rarr;
          </Link>
        </div>

        {pendingOwners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">
                            No pending approvals - you&apos;re all caught up.
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