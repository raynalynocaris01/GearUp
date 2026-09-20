import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

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

const PRICE_LABELS: Record<Exclude<PriceRange, null>, string> = {
  'under-150': 'Under ₱150',
  '150-250': '₱150–250',
  '250-400': '₱250–400',
  'over-400': '₱400+',
};

interface FilterChipsProps {
  filters: FilterState;
  regions: string[];
  onChange: (filters: FilterState) => void;
}

export function FilterChips({
  filters,
  regions,
  onChange,
}: FilterChipsProps) {
  const hasActiveFilters =
    filters.region !== null ||
    filters.priceRange !== null ||
    filters.minRating !== null;

  return (
        <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {/* Clear all */}
      {hasActiveFilters && (
        <TouchableOpacity
          style={styles.clearChip}
          onPress={() =>
            onChange({ ...EMPTY_FILTERS, search: filters.search })
          }
        >
          <Ionicons name="close-circle" size={14} color="#dc2626" />
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      )}

      {/* Regions */}
      {regions.map((r) => {
        const active = filters.region === r;
        return (
          <TouchableOpacity
            key={r}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange({ ...filters, region: active ? null : r })}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {r}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Divider */}
      {regions.length > 0 && <View style={styles.divider} />}

      {/* Price ranges */}
      {(Object.keys(PRICE_LABELS) as Array<keyof typeof PRICE_LABELS>).map(
        (key) => {
          const active = filters.priceRange === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() =>
                onChange({ ...filters, priceRange: active ? null : key })
              }
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {PRICE_LABELS[key]}
              </Text>
            </TouchableOpacity>
          );
        },
      )}

      <View style={styles.divider} />

      {/* Ratings */}
      {[4.0, 4.5, 4.8].map((r) => {
        const active = filters.minRating === r;
        return (
          <TouchableOpacity
            key={r}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() =>
              onChange({ ...filters, minRating: active ? null : r })
            }
          >
            <Ionicons
              name="star"
              size={11}
              color={active ? '#fff' : '#f59e0b'}
            />
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {r}+
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
     },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: colors.gearupGreen,
    borderColor: colors.gearupGreen,
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  clearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
});