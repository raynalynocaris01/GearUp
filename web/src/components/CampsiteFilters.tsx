'use client';

export type PriceRange =
  | 'under-150'
  | '150-250'
  | '250-400'
  | 'over-400'
  | null;

export interface FilterState {
  search: string;
  region: string | null;
  priceRange: PriceRange;
  minRating: number | null;
}

export const EMPTY_FILTERS: FilterState = {
  search: '',
  region: null,
  priceRange: null,
  minRating: null,
};

const PRICE_OPTIONS: { value: PriceRange; label: string }[] = [
  { value: null, label: 'Any price' },
  { value: 'under-150', label: 'Under ₱150' },
  { value: '150-250', label: '₱150 – ₱250' },
  { value: '250-400', label: '₱250 – ₱400' },
  { value: 'over-400', label: '₱400+' },
];

const RATING_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Any rating' },
  { value: 4.0, label: '4.0+' },
  { value: 4.5, label: '4.5+' },
  { value: 4.8, label: '4.8+' },
];

interface CampsiteFiltersProps {
  filters: FilterState;
  regions: string[];
  onChange: (filters: FilterState) => void;
  resultCount: number;
}

export function CampsiteFilters({
  filters,
  regions,
  onChange,
  resultCount,
}: CampsiteFiltersProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.region !== null ||
    filters.priceRange !== null ||
    filters.minRating !== null;

  const update = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
      {/* Search row */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-4">
        <span className="text-gray-400">🔍</span>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          placeholder="Search by name or location…"
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-500 focus:outline-none py-1.5"
        />
        {filters.search && (
          <button
            onClick={() => update('search', '')}
            className="text-gray-400 hover:text-gray-700 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Region */}
        <select
          value={filters.region ?? ''}
          onChange={(e) => update('region', e.target.value || null)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent cursor-pointer"
        >
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Price */}
        <select
          value={filters.priceRange ?? ''}
          onChange={(e) =>
            update('priceRange', (e.target.value || null) as PriceRange)
          }
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent cursor-pointer"
        >
          {PRICE_OPTIONS.map((o) => (
            <option key={String(o.value)} value={o.value ?? ''}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Rating */}
        <select
          value={filters.minRating ?? ''}
          onChange={(e) =>
            update(
              'minRating',
              e.target.value ? Number(e.target.value) : null,
            )
          }
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent cursor-pointer"
        >
          {RATING_OPTIONS.map((o) => (
            <option key={String(o.value)} value={o.value ?? ''}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-sm text-gearup-600 hover:text-gearup-700 font-medium ml-auto flex items-center gap-1"
          >
            ✕ Clear filters
          </button>
        )}

        {/* Result count */}
        <span
          className={`text-sm text-gray-500 ${hasActiveFilters ? '' : 'ml-auto'}`}
        >
          <span className="font-semibold text-gray-900">{resultCount}</span>{' '}
          {resultCount === 1 ? 'result' : 'results'}
        </span>
      </div>
    </div>
  );
}