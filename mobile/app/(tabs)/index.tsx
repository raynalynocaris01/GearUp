import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { campsites } from '../../lib/api';
import type { Campsite } from '@gearup/shared';
import { colors } from '../../theme';
import { FilterModal } from '../../components/FilterModal';
import {
  EMPTY_FILTERS,
  type FilterState,
} from '../../components/FilterChips';
import { RecommendedSection } from '../../components/RecommendedSection';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

const FEATURES = [
  {
    icon: 'bed-outline',
    label: 'Book Campsites',
    desc: 'Find the place to stay',
    color: '#1e6b3a',
    action: 'explore',
  },
  {
    icon: 'bag-handle-outline',
    label: 'Rent Gear',
    desc: 'Quality gear for your adventure',
    color: '#2563eb',
    action: 'gear-rental',
  },

  {
    icon: 'person-outline',
    label: 'Hire Tour Guide',
    desc: 'Local guides, better experiences',
    color: '#ea580c',
    action: 'tour-guides',
  },
  
  {
    icon: 'calendar-outline',
    label: 'Join Events',
    desc: 'Meet up and join adventures',
    color: '#9333ea',
    action: 'events',
  },
  {
    icon: 'cloud-upload-outline',
    label: 'List Your Gear',
    desc: 'Earn by renting out your gear',
    color: '#e11d48',
    action: 'my-gear',
  },
] as const;

interface RecommendedData {
  campsites: any[];
  gear: any[];
  guides: any[];
  events: any[];
}

export default function HomeScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [campsiteList, setCampsiteList] = useState<Campsite[]>([]);
  const [recommended, setRecommended] = useState<RecommendedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    ...EMPTY_FILTERS,
    search: '',
  });

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const [campsitesRes, recRes] = await Promise.all([
        campsites.list({ featured: true }),
        fetch(`${API_URL}/home/recommended`).then((r) => r.json()),
      ]);
      setCampsiteList(campsitesRes.data);
      setRecommended(recRes);
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          err.message ??
          'Could not load data.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(campsiteList.length === 0);
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const regions = Array.from(
    new Set(campsiteList.map((c) => c.region).filter(Boolean)),
  ).sort();

  const handleApplyFilters = (next: FilterState) => {
    const params = new URLSearchParams();
    const q = search.trim();
    if (q) params.set('search', q);
    if (next.region) params.set('region', next.region);
    if (next.priceRange) params.set('price', next.priceRange);
    if (next.minRating !== null)
      params.set('rating', String(next.minRating));

    const qs = params.toString();
    router.push(qs ? `/(tabs)/explore?${qs}` : '/(tabs)/explore');
  };

  const handleComingSoon = () => {
    Alert.alert('Coming soon', 'This feature is being built.');
  };

  const handleFeaturePress = (
    action:
      | 'explore'
      | 'coming-soon'
      | 'tour-guides'
      | 'gear-rental'
      | 'events'
      | 'my-gear',
    label: string,
  ) => {
    if (action === 'explore') {
      router.push('/(tabs)/explore');
      return;
    }
    if (action === 'tour-guides') {
      router.push('/tour-guides');
      return;
    }
    if (action === 'gear-rental') {
      router.push('/gear-rental');
      return;
    }
    if (action === 'events') {
      router.push('/events');
      return;
    }
    if (action === 'my-gear') {
      router.push('/my-gear');
      return;
    }
    Alert.alert(
      `${label} — Coming Soon`,
      'This feature is being built. Check back soon!',
    );
  };

  const handleSearch = () => {
    const q = search.trim();
    if (q) {
      router.push(`/(tabs)/explore?search=${encodeURIComponent(q)}`);
    } else {
      router.push('/(tabs)/explore');
    }
  };

  return (
    <View style={styles.container}>
      {/* TOP APP BAR */}
      <View style={styles.appBar}>
        <View style={styles.brand}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.brandIcon}
            resizeMode="contain"
          />
          <Text style={styles.brandText}>
            <Text style={styles.brandDark}>Gear</Text>
            <Text style={styles.brandGreen}>Up</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleComingSoon}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color="#111827"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.gearupGreen}
          />
        }
      >
        {/* HERO BANNER */}
        <View style={styles.hero}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              EXPLORE.{'\n'}CAMP.{'\n'}
              <Text style={styles.heroAccent}>ADVENTURE.</Text>
            </Text>

            <View style={styles.searchBox}>
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.textMuted}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search destinations, campsites"
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setFilterOpen(true)}
                activeOpacity={0.7}
                accessibilityLabel="Open filters"
              >
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={colors.gearupGreen}
                />
                {filters.region !== null ||
                filters.priceRange !== null ||
                filters.minRating !== null ? (
                  <View style={styles.filterDot} />
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearch}
              >
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* FEATURE GRID */}
        <View style={styles.section}>
          <View style={styles.featureGrid}>
            {FEATURES.map((f) => (
              <TouchableOpacity
                key={f.label}
                style={styles.featureCard}
                onPress={() => handleFeaturePress(f.action, f.label)}
                activeOpacity={0.85}
              >
                <View style={styles.featureIconWrap}>
                  <Ionicons
                    name={f.icon as any}
                    size={30}
                    color={f.color}
                  />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* RECOMMENDED */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator
              size="large"
              color={colors.gearupGreen}
            />
          </View>
        ) : error ? (
          <View style={styles.section}>
            <View style={styles.centerBox}>
              <Ionicons
                name="warning-outline"
                size={40}
                color={colors.textMuted}
              />
              <Text style={styles.centerText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => load(true)}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : recommended ? (
          <RecommendedSection data={recommended} />
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>

      <FilterModal
        visible={filterOpen}
        initial={filters}
        regions={regions}
        onApply={handleApplyFilters}
        onClose={() => setFilterOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandIcon: { width: 32, height: 32 },
  brandText: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  brandDark: { color: '#111827' },
  brandGreen: { color: colors.gearupGreen },
  iconButton: { padding: 8 },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  hero: {
    height: 300,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0f3d20',
    justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroContent: { padding: 20, gap: 16 },
  heroTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  heroAccent: { color: colors.gearupGreenLight },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    paddingVertical: 8,
  },
  searchButton: {
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  filterButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
  },

  section: { marginTop: 20, paddingHorizontal: 16 },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },

  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  centerText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
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