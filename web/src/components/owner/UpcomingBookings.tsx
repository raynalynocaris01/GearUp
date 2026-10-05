import Link from 'next/link';
import Image from 'next/image';
import { appImageSrc } from '@/components/AppImage';
interface Booking {
  id: number;
  check_in: string | null;
  check_out: string | null;
  guests: number;
  total_price: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  campsite?: {
    id: number;
    name: string;
    image_url: string;
  } | null;
  gear_item?: {
    id: number;
    name: string;
    image_url: string | null;
  } | null;
  user?: {
    id: number;
    name: string;
  };
}

interface Props {
  bookings: Booking[];
  limit?: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function UpcomingBookings({ bookings, limit = 3 }: Props) {
  // Only pending or confirmed, soonest first, take `limit`
  const upcoming = bookings
    .filter(
      (b) => b.status === 'pending' || b.status === 'confirmed',
    )
    .filter((b) => b.check_in)
    .sort(
      (a, b) =>
        new Date(a.check_in!).getTime() - new Date(b.check_in!).getTime(),
    )
    .slice(0, limit);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-10">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">
          Upcoming Bookings
        </h2>
        <Link
          href="/owner/bookings"
          className="text-sm font-semibold text-gearup-600 hover:text-gearup-700"
        >
          View all
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-sm text-gray-500">
            No upcoming bookings yet.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {upcoming.map((b) => {
            const title =
              b.campsite?.name ?? b.gear_item?.name ?? 'Booking';
    const rawImageUrl =
          b.campsite?.image_url ?? b.gear_item?.image_url ?? null;
        const imageUrl = rawImageUrl
          ? appImageSrc(rawImageUrl)
          : null;

            return (
              <Link
                key={b.id}
                href="/owner/bookings"
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition"
              >
                {/* Thumbnail */}
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      sizes="56px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      {b.gear_item ? '🎒' : '⛺'}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {b.check_in ? formatDate(b.check_in) : ''}
                    {b.check_out
                      ? ` → ${formatDate(b.check_out)}`
                      : ''}
                    {b.user?.name ? ` · ${b.user.name}` : ''}
                  </p>
                </div>

                {/* Price + status */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-gearup-600">
                    PHP {Number(b.total_price).toFixed(0)}
                  </p>
                  <p
                    className={`text-[10px] font-bold mt-0.5 uppercase tracking-wide ${
                      b.status === 'confirmed'
                        ? 'text-green-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {b.status}
                  </p>
                </div>

                {/* Chevron */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400 shrink-0"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}