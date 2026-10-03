import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { admin } from '../../lib/api';
import type { Booking } from '@gearup/shared';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { colors } from '../../theme';

type Filter = 'all' | 'pending' | 'confirmed' | 'cancelled';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminBookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const load = async (showSpinner = false, f: Filter = filter) => {
    if (showSpinner) setLoading(true);
    try {
      const params = f !== 'all' ? { status: f } : {};
      const res = await admin.listBookings(params);
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
      load(bookings.length === 0, filter);
    }, [filter]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load(false, filter);
  };

  const changeFilter = (f: Filter) => {
    setFilter(f);
    setLoading(true);
    load(false, f);
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Bookings" />

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
                onPress={() => changeFilter(item.key)}
                style={[
                  styles.filterChip,
                  active && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {item.label}
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
          data={bookings}
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
                name="calendar-outline"
                size={48}
                color={colors.textMuted}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.emptyTitle}>No bookings</Text>
              <Text style={styles.emptySubtitle}>
                No bookings match this filter.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const pill =
              item.status === 'cancelled'
                ? { bg: '#fee2e2', color: '#b91c1c' }
                : item.status === 'pending'
                  ? { bg: '#fef3c7', color: '#92400e' }
                  : { bg: '#dcfce7', color: '#15803d' };

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <View
                      style={[styles.pill, { backgroundColor: pill.bg }]}
                    >
                      <Text style={[styles.pillText, { color: pill.color }]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.campsite?.name ?? 'Campsite'}
                    </Text>
                    <Text style={styles.cardLocation} numberOfLines={1}>
                      {item.campsite?.location ?? ''}
                    </Text>
                  </View>
                  <Text style={styles.cardTotal}>
                    PHP {item.total_price}
                  </Text>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Customer</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {item.user?.name ?? 'Unknown'}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Dates</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {item.check_in ? formatDate(item.check_in) : '-'}{' '}
                      {item.check_out ? formatDate(item.check_out) : '-'}
                    </Text>
                  </View>
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

  filterRow: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterChipActive: { backgroundColor: colors.gearupGreen },
  filterText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  filterTextActive: { color: '#fff' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginBottom: 6,
  },
  pillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  cardName: { fontSize: 14, fontWeight: '800', color: '#111827' },
  cardLocation: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  cardTotal: { fontSize: 18, fontWeight: '900', color: colors.gearupGreen },

  infoGrid: { flexDirection: 'row', gap: 8, marginTop: 12 },
  infoItem: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 10,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: { fontSize: 12, fontWeight: '700', color: '#111827' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});