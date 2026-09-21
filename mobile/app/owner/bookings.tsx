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
import { owner } from '../../lib/api';
import type { Booking } from '@gearup/shared';
import { BookingActions } from '../../components/owner/BookingActions';
import { colors } from '../../theme';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function nightsBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

export default function OwnerBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await owner.listBookings();
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

  const pending = bookings.filter((b) => b.status === 'pending').length;
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookings</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      ) : (
        <>
          <View style={styles.summaryBar}>
            <Text style={styles.summaryText}>
              {bookings.length} total · {pending} pending · {confirmed}{' '}
              confirmed
            </Text>
          </View>

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
                <Text style={styles.emptyEmoji}>📅</Text>
                <Text style={styles.emptyTitle}>No bookings yet</Text>
                <Text style={styles.emptySubtitle}>
                  Once customers book your campsites, they'll appear here.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const cancelled = item.status === 'cancelled';
              const nights = nightsBetween(item.check_in, item.check_out);

              return (
                <View
                  style={[
                    styles.card,
                    cancelled && styles.cardCancelled,
                  ]}
                >
                  <Image
                    source={{ uri: item.campsite?.image_url }}
                    style={styles.cardImage}
                  />

                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardName} numberOfLines={1}>
                        {item.campsite?.name ??
                          (item.tour_guide
                            ? 'Tour Guide Booking'
                            : 'Campsite')}
                      </Text>
                      <Text style={styles.cardTotal}>
                        ₱{item.total_price}
                      </Text>
                    </View>

                    {item.campsite?.location && (
                      <Text
                        style={styles.cardLocation}
                        numberOfLines={1}
                      >
                        📍 {item.campsite.location}
                      </Text>
                    )}

                    <View style={styles.infoGrid}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Customer</Text>
                        <Text
                          style={styles.infoValue}
                          numberOfLines={1}
                        >
                          {item.user?.name ?? 'Unknown'}
                        </Text>
                        <Text
                          style={styles.infoHint}
                          numberOfLines={1}
                        >
                          {item.user?.email}
                        </Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>
                          {item.check_in && item.check_out
                            ? 'Dates'
                            : 'Details'}
                        </Text>
                        {item.check_in && item.check_out ? (
                          <>
                            <Text style={styles.infoValue}>
                              {formatDate(item.check_in)} →{' '}
                              {formatDate(item.check_out)}
                            </Text>
                            <Text style={styles.infoHint}>
                              {nights}{' '}
                              {nights === 1 ? 'night' : 'nights'} ·{' '}
                              {item.guests}{' '}
                              {item.guests === 1 ? 'guest' : 'guests'}
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.infoHint}>
                            {item.guests}{' '}
                            {item.guests === 1 ? 'guest' : 'guests'}
                          </Text>
                        )}
                      </View>
                    </View>

                    {item.tour_guide && (
                      <TouchableOpacity
                        style={styles.guideRow}
                        onPress={() =>
                          router.push(
                            `/tour-guides/${item.tour_guide!.id}`,
                          )
                        }
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="compass-outline"
                          size={14}
                          color={colors.gearupGreen}
                        />
                        <Text
                          style={styles.guideRowText}
                          numberOfLines={1}
                        >
                          Tour guide: {item.tour_guide.name}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={colors.gearupGreen}
                        />
                      </TouchableOpacity>
                    )}

                    <View style={styles.actionsRow}>
                      <BookingActions
                        bookingId={item.id}
                        status={item.status}
                        onSuccess={() => load()}
                      />
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </>
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

  summaryBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  summaryText: { fontSize: 13, color: '#166534', fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  listContent: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  cardCancelled: { opacity: 0.6 },
  cardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#e5e7eb',
  },
  cardBody: { padding: 14, gap: 4 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardName: { fontSize: 15, fontWeight: '800', color: '#111827', flex: 1 },
  cardTotal: { fontSize: 17, fontWeight: '900', color: colors.gearupGreen },
  cardLocation: { fontSize: 12, color: colors.textMuted },

  infoGrid: { flexDirection: 'row', gap: 8, marginTop: 10 },
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
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: { fontSize: 12, fontWeight: '700', color: '#111827' },
  infoHint: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: colors.gearup50,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  guideRowText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.gearupGreen,
  },

  actionsRow: { marginTop: 12 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});