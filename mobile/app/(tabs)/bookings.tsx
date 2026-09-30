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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { bookings, hasToken } from '../../lib/api';
import type { Booking } from '@gearup/shared';
import { colors } from '../../theme';

type BookingWithReview = Booking & {
  review?: unknown;
};

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

function statusPill(status: Booking['status']) {
  switch (status) {
    case 'cancelled':
      return { bg: '#fee2e2', fg: '#b91c1c', label: 'CANCELLED' };
    case 'completed':
      return { bg: '#dbeafe', fg: '#1e40af', label: 'COMPLETED' };
    case 'pending':
      return { bg: '#fef3c7', fg: '#92400e', label: 'PENDING' };
    default:
      return { bg: '#dcfce7', fg: '#15803d', label: 'CONFIRMED' };
  }
}

export default function BookingsScreen() {
  const router = useRouter();
  const [list, setList] = useState<BookingWithReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isGuest, setIsGuest] = useState(false);

  const loadBookings = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError('');

    const loggedIn = await hasToken();
    if (!loggedIn) {
      setIsGuest(true);
      setList([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setIsGuest(false);

    try {
      const res = await bookings.list();
      setList(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          err.message ??
          'Could not load bookings.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBookings(list.length === 0);
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleCancel = (booking: Booking) => {
  const label = booking.campsite?.name ?? booking.gear_item?.name ?? 'this booking';
  const type = booking.campsite ? 'reservation at' : 'rental of';

  Alert.alert(
    'Cancel booking?',
    `Cancel your ${type} ${label}?`,
    [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookings.cancel(booking.id);
              loadBookings();
            } catch (err: any) {
              Alert.alert(
                'Could not cancel',
                err.response?.data?.message ?? err.message,
              );
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  if (isGuest) {
    return (
      <View style={styles.center}>
        <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Sign in to see your bookings</Text>
        <Text style={styles.emptySubtitle}>
          Book campsites and track your upcoming trips here.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Bookings</Text>
        <Text style={styles.resultCount}>
          {list.length} {list.length === 1 ? 'booking' : 'bookings'}
        </Text>
      </View>

      {error ? (
        <View style={styles.center}>
          <Ionicons
            name="warning-outline"
            size={48}
            color={colors.textMuted}
          />
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadBookings(true)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={list}
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
            <View style={styles.center}>
              <Ionicons
                name="leaf-outline"
                size={64}
                color={colors.textMuted}
              />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySubtitle}>
                Explore campsites and book your first adventure.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/(tabs)/explore')}
              >
                <Text style={styles.primaryButtonText}>
                  Explore Campsites
                </Text>
              </TouchableOpacity>
            </View>
          }
                    renderItem={({ item }) => {
            const cancelled = item.status === 'cancelled';
            const isGearOnly = !item.campsite && item.gear_item;
            const isCampsiteGear = item.campsite && item.gear_item;

            // Pick the right dates: gear bookings use gear_start/end_date
            const startDate = isGearOnly
              ? item.gear_start_date
              : item.check_in;
            const endDate = isGearOnly
              ? item.gear_end_date
              : item.check_out;

            const nights = nightsBetween(startDate, endDate);
            const pill = statusPill(item.status);

            // Title + image precedence: campsite first, then gear, then fallback
            const title =
              item.campsite?.name ??
              item.gear_item?.name ??
              (item.tour_guide ? 'Tour Guide Booking' : 'Booking');

            const imageUrl =
              item.campsite?.image_url ?? item.gear_item?.image_url ?? null;

            // Tint for date units
            const dateUnit = isGearOnly ? 'day' : 'night';
            const dateUnitPlural = isGearOnly ? 'days' : 'nights';

            return (
              <View
                style={[styles.card, cancelled && styles.cardCancelled]}
              >
                                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                  />
                ) : (
                  <View style={[styles.image, styles.imageFallback]}>
                    <Text style={{ fontSize: 40 }}>
                      {isGearOnly ? '🎒' : '⛺'}
                    </Text>
                  </View>
                )}
                <View style={styles.body}>
                  {/* Status pill */}
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: pill.bg },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: pill.fg }]}
                    >
                      {pill.label}
                    </Text>
                  </View>

                                    <Text style={styles.name} numberOfLines={1}>
                    {title}
                  </Text>

                  {isGearOnly && (
                    <Text style={styles.rentalOnlyLabel}>
                      {item.gear_item?.category} · Rental only
                    </Text>
                  )}

                  {startDate && endDate && (
                    <View style={styles.metaRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color={colors.textMuted}
                      />
                      <Text style={styles.meta}>
                        {formatDate(startDate)} → {formatDate(endDate)} (
                        {nights}{' '}
                        {nights === 1 ? dateUnit : dateUnitPlural})
                      </Text>
                    </View>
                  )}

                                    {!isGearOnly && (
                    <View style={styles.metaRow}>
                      <Ionicons
                        name="people-outline"
                        size={12}
                        color={colors.textMuted}
                      />
                      <Text style={styles.meta}>
                        {item.guests}{' '}
                        {item.guests === 1 ? 'guest' : 'guests'}
                      </Text>
                    </View>
                  )}

                  {/* Gear line for campsite+gear bookings */}
                  {isCampsiteGear && item.gear_item && (
                    <View style={styles.metaRow}>
                      <Ionicons
                        name="bag-handle-outline"
                        size={12}
                        color={colors.textMuted}
                      />
                      <Text style={styles.meta}>
                        {item.gear_item.name}
                        {item.gear_quantity && ` × ${item.gear_quantity}`}
                      </Text>
                    </View>
                  )}

                  {/* Guide link — separate row, NOT inside Text */}
                  {item.tour_guide && (
                    <TouchableOpacity
                      onPress={() =>
                        router.push(
                          `/tour-guides/${item.tour_guide!.id}`,
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.metaRow}>
                        <Ionicons
                          name="compass-outline"
                          size={12}
                          color={colors.gearupGreen}
                        />
                        <Text
                          style={styles.guideLink}
                          numberOfLines={1}
                        >
                          Guide: {item.tour_guide.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  <View style={styles.footerRow}>
                    <Text style={styles.total}>₱{item.total_price}</Text>

                    {(item.status === 'pending' ||
                      item.status === 'confirmed') && (
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancel(item)}
                      >
                        <Text style={styles.cancelButtonText}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {item.status === 'completed' && (
                    <View style={styles.reviewRow}>
                      {item.review ? (
                        <View style={styles.reviewedBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color={colors.gearupGreen}
                          />
                          <Text style={styles.reviewedText}>
                            Reviewed
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.reviewButton}
                          onPress={() =>
                            router.push(
                              `/campsite/${item.campsite?.id}/review?bookingId=${item.id}`,
                            )
                          }
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name="star-outline"
                            size={16}
                            color="#fff"
                          />
                          <Text style={styles.reviewButtonText}>
                            Leave a review
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },

  appBar: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  appBarTitle: { fontSize: 28, fontWeight: '900', color: '#111827' },
  resultCount: { fontSize: 13, color: colors.textMuted },

  listContent: { padding: 16, gap: 12 },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardCancelled: { opacity: 0.65 },
  image: {
    width: 100,
    height: '100%',
    minHeight: 150,
    backgroundColor: '#e5e7eb',
  },
    imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gearup50,
  },
  rentalOnlyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gearupGreen,
  },
  body: { flex: 1, padding: 12, gap: 6 },

  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  name: { fontSize: 14, fontWeight: '800', color: '#111827' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 11, color: colors.textMuted, flex: 1 },

  guideLink: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gearupGreen,
    textDecorationLine: 'underline',
    flex: 1,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  total: { fontSize: 15, fontWeight: '900', color: colors.gearupGreen },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '700',
  },

  reviewRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gearup50,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  reviewedText: {
    color: colors.gearupGreen,
    fontSize: 12,
    fontWeight: '700',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  retryButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.gearupGreen,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: colors.gearupGreen,
    fontSize: 13,
    fontWeight: '700',
  },
});