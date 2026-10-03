import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { myGear } from '../../lib/api';
import type { Booking } from '@gearup/shared';
import { colors } from '../../theme';

type Filter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function statusPill(status: string) {
  if (status === 'cancelled') return { bg: '#fee2e2', fg: '#b91c1c' };
  if (status === 'pending') return { bg: '#fef3c7', fg: '#92400e' };
  if (status === 'completed') return { bg: '#dbeafe', fg: '#1d4ed8' };
  return { bg: '#dcfce7', fg: '#15803d' };
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

export default function MyGearBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await myGear.bookings();
      setBookings(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(bookings.length === 0);
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const counts: Record<Filter, number> = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };

  const visible =
    filter === 'all'
      ? bookings
      : bookings.filter((b) => b.status === filter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gear Rentals</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.filterRow}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => {
            const active = filter === item.key;
            return (
              <TouchableOpacity
                onPress={() => setFilter(item.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.filterCount,
                    active && styles.filterCountActive,
                  ]}
                >
                  {counts[item.key]}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      ) : (
        <FlatList
          data={visible}
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
            <View style={styles.empty}>
              <Ionicons
                name="cube-outline"
                size={48}
                color={colors.textMuted}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.emptyTitle}>No rentals yet</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all'
                  ? 'When someone rents your gear, it will appear here.'
                  : 'Try a different status filter.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const pill = statusPill(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.thumb}>
                    {item.gear_item?.image_url ? (
                      <Image
                        source={{ uri: item.gear_item.image_url }}
                        style={styles.thumbImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons
                        name="image-outline"
                        size={20}
                        color={colors.textMuted}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                      <Text style={[styles.pillText, { color: pill.fg }]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.gear_item?.name ?? 'Gear item'}
                    </Text>
                    <Text style={styles.cardSub} numberOfLines={1}>
                      {item.user?.name ?? 'Unknown'} ·{' '}
                      {fmtDate(item.gear_start_date ?? item.check_in)} →{' '}
                      {fmtDate(item.gear_end_date ?? item.check_out)}
                    </Text>
                  </View>
                  <Text style={styles.cardTotal}>PHP {item.total_price}</Text>
                </View>
              </View>
            );
          }}
        />
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
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },

  filterRow: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterChipActive: { backgroundColor: colors.gearupGreen },
  filterText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  filterTextActive: { color: '#fff' },
  filterCount: { fontSize: 10, fontWeight: '800', color: '#9ca3af' },
  filterCountActive: { color: 'rgba(255,255,255,0.85)' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
  },
  cardTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginBottom: 4,
  },
  pillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  cardSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  cardTotal: { fontSize: 13, fontWeight: '900', color: colors.gearupGreen },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});