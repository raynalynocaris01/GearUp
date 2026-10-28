import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { gear, campsites } from '../../lib/api';
import type { GearItem, Campsite } from '@gearup/shared';
import { colors } from '../../theme';
import { imgSrc } from '../../lib/images';

export default function GearRentalScreen() {
  const router = useRouter();
  const [items, setItems] = useState<GearItem[]>([]);
  const [allCampsites, setAllCampsites] = useState<Campsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'owner' | 'individual'>('all');
  const [search, setSearch] = useState('');
  
  // Track expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const [gearRes, campsiteRes] = await Promise.all([
        gear.list(),
        campsites.list(),
      ]);
      setItems(gearRes.data);
      setAllCampsites(campsiteRes.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          err.message ??
          'Could not load gear.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(items.length === 0);
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const searchMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((g) => {
      const haystack = [g.name, g.description ?? '', g.category]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, search]);

  const counts = useMemo(
    () => ({
      all: searchMatches.length,
      owner: searchMatches.filter((g) => g.owner?.role === 'owner').length,
      individual: searchMatches.filter((g) => g.owner?.role !== 'owner')
        .length,
    }),
    [searchMatches],
  );

  const visible = useMemo(() => {
    if (filter === 'owner')
      return searchMatches.filter((g) => g.owner?.role === 'owner');
    if (filter === 'individual')
      return searchMatches.filter((g) => g.owner?.role !== 'owner');
    return searchMatches;
  }, [searchMatches, filter]);

  // Group by Campsite Name
  const groupedGear = useMemo(() => {
    // Build "From Individuals" first so it's always at the top
    const individualGear = visible.filter((g) => g.owner?.role !== 'owner');
    const ownerGear = visible.filter((g) => g.owner?.role === 'owner');

    const groups: Record<string, GearItem[]> = {};
    if (individualGear.length > 0) {
      groups['From Individuals'] = individualGear;
    }

    // Then owner-provided gear grouped by campsite name
    ownerGear.forEach((g) => {
      const ownerCampsites = allCampsites.filter(
        (c) => c.owner_id === g.owner_id && !c.parent_campsite_id,
      );

      if (ownerCampsites.length > 0) {
        ownerCampsites.forEach((c) => {
          const groupName = `Gear from ${c.name}`;
          if (!groups[groupName]) groups[groupName] = [];
          groups[groupName].push(g);
        });
      } else {
        const groupName = `Gear from ${g.owner?.name ?? 'Owner'}`;
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(g);
      }
    });

    return groups;
  }, [visible, allCampsites]);

  const hasSearch = search.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gear Rental</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero (Slightly condensed) */}
      <View style={styles.hero}>
        <Text style={styles.heroPill}>CAMPING GEAR</Text>
        <Text style={styles.heroTitle}>
          Rent gear for your next adventure.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      ) : error ? (
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
      ) : (
        <ScrollView
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
          {/* Search */}
          <View style={styles.searchWrap}>
            <Ionicons
              name="search"
              size={18}
              color="#9ca3af"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search gear..."
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch('')}
                style={styles.searchClear}
                accessibilityLabel="Clear search"
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter chips */}
          <View style={styles.filterRow}>
            {(
              [
                { key: 'all' as const, label: 'All' },
                { key: 'owner' as const, label: 'Owner-provided' },
                { key: 'individual' as const, label: 'Individual' },
              ]
            ).map((f) => {
              const active = filter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {f.label}
                  </Text>
                  <Text
                    style={[styles.chipCount, active && styles.chipCountActive]}
                  >
                    {counts[f.key]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {visible.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.centerText}>
                {hasSearch
                  ? `No gear matches "${search.trim()}". Try a different search or clear it.`
                  : filter === 'all'
                    ? 'No gear available yet. Check back soon.'
                    : 'No gear in this filter. Try a different one.'}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 24 }}>
              {Object.entries(groupedGear).map(([groupName, items]) => {
                const isExpanded = expandedGroups.has(groupName);
                const displayItems = isExpanded ? items : items.slice(0, 4);
                const hasMore = items.length > 4;

                return (
                  <View key={groupName}>
                    <Text style={styles.groupTitle}>{groupName}</Text>
                    <View style={styles.grid}>
                      {displayItems.map((g) => (
                        <TouchableOpacity
                          key={g.id}
                          style={styles.card}
                          onPress={() => router.push(`/gear-rental/${g.id}`)}
                          activeOpacity={0.85}
                        >
                          <View style={styles.cardImageWrap}>
                            {g.image_url ? (
                              <Image
                                source={{ uri: imgSrc(g.image_url) }}
                                style={styles.cardImage}
                              />
                            ) : (
                              <View style={styles.cardImageFallback}>
                                <Ionicons name="image-outline" size={24} color="#9ca3af" />
                              </View>
                            )}
                          </View>
                          <View style={styles.cardInfo}>
                            <Text style={styles.cardCategory} numberOfLines={1}>{g.category}</Text>
                            <Text style={styles.cardName} numberOfLines={1}>{g.name}</Text>
                            <Text style={styles.cardPrice}>₱{g.price_per_day}/day</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {hasMore && (
                      <TouchableOpacity
                        style={styles.showMoreBtn}
                        onPress={() => toggleGroup(groupName)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.showMoreText}>
                          {isExpanded ? 'Show Less' : `Show More (${items.length - 4} remaining)`}
                        </Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={colors.gearupGreen}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },

  hero: {
    backgroundColor: '#0f3d20',
    padding: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  heroPill: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#a7f3d0',
    marginBottom: 6,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    letterSpacing: -0.5,
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

  scrollContent: { padding: 16, paddingBottom: 40 },

  searchWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 13,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingLeft: 42,
    paddingRight: 42,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
  },
  searchClear: {
    position: 'absolute',
    right: 12,
    top: 11,
  },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: colors.gearupGreen,
    borderColor: colors.gearupGreen,
  },
  chipText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  chipTextActive: { color: '#fff' },
  chipCount: { fontSize: 11, fontWeight: '800', color: '#9ca3af' },
  chipCountActive: { color: 'rgba(255,255,255,0.8)' },

  groupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%', // Fits 2 columns
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  cardImageWrap: {
    width: '100%',
    height: 120,
    backgroundColor: '#f3f4f6',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardImageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    padding: 10,
  },
  cardCategory: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.gearupGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  showMoreBtn: {
    marginTop: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gearupGreen,
    backgroundColor: '#fff',
  },
  showMoreText: {
    color: colors.gearupGreen,
    fontWeight: '700',
    fontSize: 13,
  },
});