'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { Booking } from '@gearup/shared';

type FilterKey = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function statusPill(status: string) {
  if (status === 'cancelled') return 'bg-red-100 text-red-700';
  if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
  if (status === 'completed') return 'bg-blue-100 text-blue-700';
  return 'bg-green-100 text-green-700';
}

function fmtDate(iso: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

export function MyGearBookingsClient({ bookings }: { bookings: Booking[] }) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const counts = useMemo(
    () =>
      ({
        all: bookings.length,
        pending: bookings.filter((b) => b.status === 'pending').length,
        confirmed: bookings.filter((b) => b.status === 'confirmed').length,
        completed: bookings.filter((b) => b.status === 'completed').length,
        cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      }) as Record<FilterKey, number>,
    [bookings],
  );

  const visible = useMemo(
    () =>
      filter === 'all'
        ? bookings
        : bookings.filter((b) => b.status === filter),
    [bookings, filter],
  );

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                active
                  ? 'bg-gearup-600 text-white border-gearup-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
              <span
                className={`ml-2 text-xs font-bold ${
                  active ? 'text-white/80' : 'text-gray-400'
                }`}
              >
                {counts[f.key]}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-base font-bold text-gray-900 mb-1">
            No rentals yet
          </p>
          <p className="text-sm text-gray-500">
            {filter === 'all'
              ? 'When someone rents your gear, it will appear here.'
              : 'Try a different status filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Item
                </th>
                <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                  Customer
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
              {visible.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {b.gear_item?.image_url ? (
                          <Image
                            src={b.gear_item.image_url}
                            alt={b.gear_item.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {b.gear_item?.name ?? 'Gear item'}
                        </p>
                        {b.gear_quantity ? (
                          <p className="text-xs text-gray-500">
                            Qty {b.gear_quantity}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="font-semibold text-gray-900 text-sm">
                      {b.user?.name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">{b.user?.email}</p>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <p className="text-xs text-gray-700">
                      {fmtDate(b.gear_start_date ?? b.check_in)} &rarr;{' '}
                      {fmtDate(b.gear_end_date ?? b.check_out)}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block text-[10px] font-extrabold tracking-wider px-2 py-1 rounded ${statusPill(
                        b.status,
                      )}`}
                    >
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className="text-sm font-black text-gearup-600">
                      PHP {b.total_price}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}