import Link from 'next/link';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface Booking {
  id: number;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  user?: { id: number; name?: string; email: string };
  campsite?: {
    id: number;
    name: string;
    location: string;
    image_url: string;
    owner?: { id: number; name: string; email: string } | null;
  };
}

async function getBookings(token: string, status?: string): Promise<Booking[]> {
  try {
    const url = status
      ? `${API_URL}/admin/bookings?status=${status}`
      : `${API_URL}/admin/bookings`;
    const res = await fetch(url, {
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')!.value;
  const bookings = await getBookings(token, status);

  const FILTERS = [
    { label: 'All', href: '/admin/bookings', active: !status },
    {
      label: 'Pending',
      href: '/admin/bookings?status=pending',
      active: status === 'pending',
    },
    {
      label: 'Confirmed',
      href: '/admin/bookings?status=confirmed',
      active: status === 'confirmed',
    },
    {
      label: 'Cancelled',
      href: '/admin/bookings?status=cancelled',
      active: status === 'cancelled',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900">Bookings</h1>
        <p className="text-gray-500 mt-2 text-sm">
          {bookings.length}{' '}
          {bookings.length === 1 ? 'booking' : 'bookings'} shown
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              f.active
                ? 'bg-gearup-600 text-white border-gearup-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500">No bookings match this filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Customer
                </th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Campsite
                </th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">
                  Dates
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
              {bookings.map((b) => {
                const pill =
                  b.status === 'cancelled'
                    ? 'bg-red-100 text-red-700'
                    : b.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-700';
                return (
                  <tr key={b.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 text-sm">
                        {b.user?.name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {b.user?.email}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/campsites/${b.campsite?.id}`}
                        className="font-semibold text-gray-900 text-sm hover:text-gearup-600"
                      >
                        {b.campsite?.name ?? '—'}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {b.campsite?.owner
                          ? `Owner: ${b.campsite.owner.name}`
                          : 'Platform-owned'}
                      </p>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <p className="text-xs text-gray-700">
                        {formatDate(b.check_in)} → {formatDate(b.check_out)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {b.guests} {b.guests === 1 ? 'guest' : 'guests'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block text-[10px] font-extrabold tracking-wider px-2 py-1 rounded ${pill}`}
                      >
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="text-sm font-black text-gearup-600">
                        ₱{b.total_price}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}