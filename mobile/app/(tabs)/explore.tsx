import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { campsites } from '../../lib/api';
import type { Campsite } from '@gearup/shared';
import { colors } from '../../theme';
import {
  FilterChips,
  EMPTY_FILTERS,
  type FilterState,
} from '../../components/FilterChips';

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

export default function ExploreScreen() {
  const router = useRouter();
  const [list, setList] = useState<Campsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const loadCampsites = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const res = await campsites.list();
      setList(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          err.message ??
          'Could not load campsites.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCampsites(list.length === 0);
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadCampsites();
  };

  // Unique regions
  const regions = useMemo(() => {
    const set = new Set(list.map((c) => c.region));
    return Array.from(set).sort();
  }, [list]);

  // Filter
  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return list.filter((c) => {
      if (q) {
        const haystack = `${c.name} ${c.location} ${c.region}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.region && c.region !== filters.region) return false;
      if (
        !matchesPriceFilter(
          parseFloat(c.price_per_night),
          filters.priceRange,
        )
      )
        return false;
      if (
        filters.minRating !== null &&
        parseFloat(c.rating) < filters.minRating
      )
        return false;
      return true;
    });
  }, [list, filters]);

  return (
    <View style={styles.container}>
      {/* App bar */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Explore</Text>
        <Text style={styles.resultCount}>
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search campsites, destinations…"
            placeholderTextColor={colors.textMuted}
            value={filters.search}
            onChangeText={(v) => setFilters((f) => ({ ...f, search: v }))}
          />
          {filters.search.length > 0 && (
            <TouchableOpacity
              onPress={() => setFilters((f) => ({ ...f, search: '' }))}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <FilterChips filters={filters} regions={regions} onChange={setFilters} />

      {/* Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
          <Text style={styles.centerText}>Loading campsites…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Ionicons name="warning-outline" size={40} color={colors.textMuted} />
          <Text style={styles.centerText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadCampsites(true)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.gearupGreen}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Ionicons name="leaf-outline" size={40} color={colors.textMuted} />
              <Text style={styles.centerText}>
                No campsites match your filters.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setFilters(EMPTY_FILTERS)}
              >
                <Text style={styles.retryButtonText}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.campsiteCard}
              onPress={() => router.push(`/campsite/${item.id}`)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: item.image_url }}
                style={styles.campsiteImage}
              />
              <View style={styles.campsiteBody}>
                <Text style={styles.campsiteName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.campsiteMeta}>
                  <Ionicons
                    name="location-outline"
                    size={12}
                    color={colors.textMuted}
                  />
                  <Text style={styles.campsiteLocation} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>
                <View style={styles.campsiteMeta}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.campsiteRating}>
                    {item.rating} ({item.reviews_count})
                  </Text>
                </View>
                <Text style={styles.campsitePrice}>
                  ₱{item.price_per_night} / {item.price_unit}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },

  appBar: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  appBarTitle: { fontSize: 28, fontWeight: '900', color: '#111827' },
  resultCount: { fontSize: 13, color: colors.textMuted },

  searchWrap: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 10,
  },

  listContent: { padding: 16, gap: 12 },
  campsiteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  campsiteImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  campsiteBody: { flex: 1, gap: 3 },
  campsiteName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  campsiteMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  campsiteLocation: { fontSize: 11, color: colors.textMuted, flex: 1 },
  campsiteRating: { fontSize: 11, color: '#111827', fontWeight: '600' },
  campsitePrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gearupGreen,
    marginTop: 3,
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  centerText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.gearupGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: colors.gearupGreen,
    fontSize: 13,
    fontWeight: '700',
  },
});