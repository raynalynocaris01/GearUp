'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CampsiteSort, type SortOption } from './CampsiteSort';
import {
  CampsiteFilters,
  EMPTY_FILTERS,
  type FilterState,
} from './CampsiteFilters';

export interface Campsite {
  id: number;
  name: string;
  location: string;
  region: string;
  price_per_night: string;
  price_unit: string;
  image_url: string;
  rating: string;
  reviews_count: number;
  is_featured: boolean;
  created_at: string;
}

interface CampsitesGridProps {
  campsites: Campsite[];
}

function matchesPriceFilter(
  price: number,
  range: FilterState['priceRange'],
): boolean {
  if (!range) return true;
  switch (range) {
    case 'under-150':
      return price < 150;
    case '150-250':
      return price >= 150 && price < 250;
    case '250-400':
      return price >= 250 && price < 400;
    case 'over-400':
      return price >= 400;
  }
}

export function CampsitesGrid({ campsites }: CampsitesGridProps) {
  const [sort, setSort] = useState<SortOption>('rating');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  // Extract unique regions from the full list (once)
  const regions = useMemo(() => {
    const set = new Set(campsites.map((c) => c.region));
    return Array.from(set).sort();
  }, [campsites]);

  // Filter
  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return campsites.filter((c) => {
      // Search
      if (q) {
        const haystack = `${c.name} ${c.location} ${c.region}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Region
      if (filters.region && c.region !== filters.region) return false;

      // Price
      if (!matchesPriceFilter(parseFloat(c.price_per_night), filters.priceRange))
        return false;

      // Rating
      if (
        filters.minRating !== null &&
        parseFloat(c.rating) < filters.minRating
      )
        return false;

      return true;
    });
  }, [campsites, filters]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...filtered];
    switch (sort) {
      case 'rating':
        return copy.sort(
          (a, b) => parseFloat(b.rating) - parseFloat(a.rating),
        );
      case 'price-asc':
        return copy.sort(
          (a, b) =>
            parseFloat(a.price_per_night) - parseFloat(b.price_per_night),
        );
      case 'price-desc':
        return copy.sort(
          (a, b) =>
            parseFloat(b.price_per_night) - parseFloat(a.price_per_night),
        );
      case 'newest':
        return copy.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      default:
        return copy;
    }
  }, [filtered, sort]);

  return (
    <>
      {/* Filters */}
      <CampsiteFilters
        filters={filters}
        regions={regions}
        onChange={setFilters}
        resultCount={sorted.length}
      />

      {/* Sort row */}
      <div className="flex items-center justify-end mb-6">
        <CampsiteSort value={sort} onChange={setSort} />
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-500">
          <p className="text-lg font-semibold text-gray-700 mb-2">
            No campsites match your filters
          </p>
          <p className="text-sm">
            Try clearing some filters to see more results.
          </p>
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="mt-6 text-sm text-gearup-600 hover:text-gearup-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sorted.map((c) => (
            <Link
              key={c.id}
              href={`/campsites/${c.id}`}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition"
            >
              <div className="relative h-44 overflow-hidden">
                <Image
                  src={c.image_url}
                  alt={c.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition duration-500"
                  unoptimized
                />
                {c.is_featured && (
                  <div className="absolute top-3 left-3 bg-gearup-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    ★ Featured
                  </div>
                )}
                <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-gray-700 hover:text-red-500 transition">
                  ♡
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900">{c.name}</h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <span>📍</span> {c.location}
                </p>
                <p className="text-xs text-gray-700 mt-1 flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  {c.rating} ({c.reviews_count})
                </p>
                <p className="text-sm font-bold text-gearup-600 mt-3">
                  ₱{c.price_per_night} / {c.price_unit}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}