'use client';

export type SortOption = 'rating' | 'price-asc' | 'price-desc' | 'newest';

interface CampsiteSortProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
];

export function CampsiteSort({ value, onChange }: CampsiteSortProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="sort"
        className="text-sm text-gray-600 whitespace-nowrap"
      >
        Sort by:
      </label>
      <select
        id="sort"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent cursor-pointer"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}