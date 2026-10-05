import Link from 'next/link';
import { appImageSrc } from '@/components/AppImage';
export type CampsiteOverviewItem = {
  id: number;
  name: string;
  location: string;
  region: string;
  price_per_night: string;
  price_unit: string;
  image_url: string;
  is_featured: boolean;
  bookings_count: number;
  revenue: number;
};

type Props = {
  campsites: CampsiteOverviewItem[];
};

export function CampsiteOverview({ campsites }: Props) {
  if (!campsites || campsites.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Campsite Overview
        </h2>
        <p className="text-sm text-gray-500">
          You have no campsites yet. Add one to start tracking performance.
        </p>
      </div>
    );
  }

  const formatPHP = (n: number) =>
    `PHP ${Number(n ?? 0).toLocaleString('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-10 overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Campsite Overview
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Performance for each of your listings
          </p>
        </div>
        <Link
          href="/owner/campsites"
          className="text-xs font-semibold text-gearup-600 hover:text-gearup-700"
        >
          Manage all
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-gray-100 bg-gray-50/50">
              <th className="text-left font-semibold text-gray-500 text-xs uppercase tracking-wide px-6 py-3">
                Campsite
              </th>
              <th className="text-left font-semibold text-gray-500 text-xs uppercase tracking-wide px-4 py-3">
                Status
              </th>
              <th className="text-right font-semibold text-gray-500 text-xs uppercase tracking-wide px-4 py-3">
                Price
              </th>
              <th className="text-right font-semibold text-gray-500 text-xs uppercase tracking-wide px-4 py-3">
                Bookings
              </th>
              <th className="text-right font-semibold text-gray-500 text-xs uppercase tracking-wide px-4 py-3">
                Revenue
              </th>
              <th className="text-right font-semibold text-gray-500 text-xs uppercase tracking-wide px-6 py-3">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {campsites.map((c) => (
              <tr
                key={c.id}
                className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 bg-cover bg-center"
                      style={{
                        backgroundImage: c.image_url
                          ? `url(${appImageSrc(c.image_url)})`
                          : undefined,
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate max-w-[200px]">
                        {c.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {c.location}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  {c.is_featured ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                      Featured
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                      Listed
                    </span>
                  )}
                </td>

                <td className="px-4 py-4 text-right text-gray-700 font-medium">
                  {formatPHP(Number(c.price_per_night))}
                  <span className="text-xs text-gray-400 font-normal">
                    {' '}
                    / {c.price_unit}
                  </span>
                </td>

                <td className="px-4 py-4 text-right text-gray-700 font-medium">
                  {c.bookings_count}
                </td>

                <td className="px-4 py-4 text-right font-bold text-gearup-600">
                  {formatPHP(c.revenue)}
                </td>

                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/owner/campsites/${c.id}/edit`}
                    className="text-xs font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition inline-block"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}