import Link from 'next/link';
import Image from 'next/image';

interface RecentBooking {
  id: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: string;
  check_in: string | null;
  check_out: string | null;
  user?: { id: number; name?: string; email: string } | null;
  campsite?: {
    id: number;
    name: string;
    image_url: string;
  } | null;
}

function statusPill(status: RecentBooking['status']): string {
  if (status === 'cancelled') return 'bg-red-100 text-red-700';
  if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
  if (status === 'completed') return 'bg-blue-100 text-blue-700';
  return 'bg-green-100 text-green-700';
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
}

export function AdminRecentBookings({
  bookings,
}: {
  bookings: RecentBooking[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
          Recent Bookings
        </h2>
        <Link
          href="/admin/bookings"
          className="text-xs font-bold text-gearup-600 hover:text-gearup-700"
        >
          View all
        </Link>
      </div>

      {bookings.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">
          No bookings yet.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {bookings.slice(0, 5).map((b) => (
            <li key={b.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {b.campsite?.image_url ? (
                    <Image
                      src={b.campsite.image_url}
                      alt={b.campsite.name}
                      fill
                      sizes="44px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {b.campsite?.name ?? 'Platform booking'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {b.user?.name ?? b.user?.email ?? 'Unknown'} -{' '}
                    {formatDate(b.check_in)} to {formatDate(b.check_out)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-gearup-600">
                    PHP {b.total_price}
                  </p>
                  <span
                    className={`inline-block text-[10px] font-extrabold tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${statusPill(
                      b.status,
                    )}`}
                  >
                    {b.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}