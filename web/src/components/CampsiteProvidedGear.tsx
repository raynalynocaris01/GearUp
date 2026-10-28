'use client';

import { useState } from 'react';
import Image from 'next/image';
import { appImageSrc } from '@/components/AppImage';

interface GearItem {
  id: number;
  name: string;
  category: string;
  price_per_day: string;
  image_url: string | null;
}

interface Props {
  gear: GearItem[];
}

export function CampsiteProvidedGear({ gear }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (gear.length === 0) return null;

  const visible = expanded ? gear : gear.slice(0, 3);
  const hasMore = gear.length > 3;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-3">
        Gear Provided by this Campsite
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {visible.map((item) => {
          const isFree = parseFloat(item.price_per_day) === 0;
          return (
            <div
              key={item.id}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col"
            >
              <div className="relative w-full h-32 bg-gray-100 shrink-0">
                {item.image_url ? (
                  <Image
                    src={appImageSrc(item.image_url)}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <p className="text-xs font-semibold text-gearup-600 mb-1 uppercase tracking-wider">
                  {item.category}
                </p>
                <p className="font-bold text-gray-900 text-sm truncate mb-1">
                  {item.name}
                </p>
                <p className="text-sm font-black text-gray-900 mt-auto">
                  {isFree ? 'Free' : `₱${item.price_per_day}/day`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="px-5 py-2 rounded-full border border-gearup-600 text-gearup-600 font-semibold text-sm hover:bg-gearup-50 transition flex items-center gap-2"
          >
            {expanded ? 'Show Less' : `Show More (${gear.length - 3} remaining)`}
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="m19 9-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}