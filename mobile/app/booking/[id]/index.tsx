import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { bookings } from '../../../lib/api';
import type { Booking } from '@gearup/shared';
import { colors } from '../../../theme';
import { imgSrc } from '../../../lib/images';
import { BookingStatusTracker } from '../../../components/BookingStatusTracker';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
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

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const res = await bookings.get(id);
      setBooking(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          err.message ??
          'Could not load booking.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load(booking === null);
    }, [load, booking]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleCancel = () => {
    if (!booking) return;
    Alert.alert(
      'Cancel booking?',
      `Cancel your booking at ${
        booking.campsite?.name ?? booking.gear_item?.name ?? 'this listing'
      }?`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookings.cancel(booking.id);
              load();
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

  if (error || !booking) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning-outline" size={56} color={colors.textMuted} />
        <Text style={styles.errorText}>
          {error || 'Booking not found.'}
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cancelled = booking.status === 'cancelled';
  const isGearOnly = !booking.campsite && booking.gear_item;

  const startDate =
    isGearOnly && booking.gear_start_date
      ? booking.gear_start_date
      : booking.check_in;
  const endDate =
    isGearOnly && booking.gear_end_date
      ? booking.gear_end_date
      : booking.check_out;
  const nights = nightsBetween(startDate, endDate);

  const title =
    booking.campsite?.name ?? booking.gear_item?.name ?? 'Booking';

  const rawImage =
    booking.campsite?.image_url ?? booking.gear_item?.image_url ?? null;
  const imageUrl = rawImage ? imgSrc(rawImage) : null;

  const hasMultiGear =
    booking.gear_items !== undefined && booking.gear_items.length > 0;
  const pill = statusPill(booking.status);

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Booking Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.gearupGreen}
          />
        }
      >
        {/* Hero image */}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.hero} />
        ) : (
          <View style={[styles.hero, styles.heroFallback]}>
            <Text style={{ fontSize: 56 }}>
              {isGearOnly ? 'Gear' : 'Campsite'}
            </Text>
          </View>
        )}

        <View style={styles.body}>
          {/* Status + ID */}
          <View style={styles.statusRow}>
            <View style={[styles.pill, { backgroundColor: pill.bg }]}>
              <Text style={[styles.pillText, { color: pill.fg }]}>
                {pill.label}
              </Text>
            </View>
            <Text style={styles.bookingId}>Booking #{booking.id}</Text>
          </View>

          {/* Title + location */}
          <Text style={styles.title}>{title}</Text>
          {booking.room_campsite && (
            <Text style={styles.roomLabel}>
              Room: {booking.room_campsite.name}
            </Text>
          )}
          {booking.campsite?.location && (
            <Text style={styles.location}>
              {booking.campsite.location}
            </Text>
          )}
          {isGearOnly && booking.gear_item?.category && (
            <Text style={styles.rentalLabel}>
              {booking.gear_item.category} - Rental only
            </Text>
          )}

          {/* Status tracker */}
          <View style={{ marginTop: 12 }}>
            <BookingStatusTracker
              status={booking.status}
              createdAt={booking.created_at ?? null}
              confirmedAt={booking.confirmed_at ?? null}
              completedAt={booking.completed_at ?? null}
              cancelledAt={booking.cancelled_at ?? null}
            />
          </View>

          {/* Trip info */}
          <View style={styles.infoBlock}>
            {startDate && endDate && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.textMuted}
                />
                <Text style={styles.infoText}>
                  {formatDate(startDate)} to {formatDate(endDate)} ({nights}{' '}
                  {nights === 1 ? 'day' : 'days'})
                </Text>
              </View>
            )}
            {!isGearOnly && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={colors.textMuted}
                />
                <Text style={styles.infoText}>
                  {booking.pricing_lines && booking.pricing_lines.length > 0
                    ? [
                        booking.adults && booking.adults > 0
                          ? `${booking.adults} ${booking.adults === 1 ? 'adult' : 'adults'}`
                          : null,
                        booking.children && booking.children > 0
                          ? `${booking.children} ${booking.children === 1 ? 'child' : 'children'}`
                          : null,
                        booking.seniors && booking.seniors > 0
                          ? `${booking.seniors} ${booking.seniors === 1 ? 'senior' : 'seniors'}`
                          : null,
                        booking.pwd && booking.pwd > 0
                          ? `${booking.pwd} PWD`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(', ')
                    : `${booking.guests} ${booking.guests === 1 ? 'guest' : 'guests'}`}
                </Text>
              </View>

            )}

            {/* Check-in / Check-out Policy */}
            <View style={{ marginTop: 16, backgroundColor: "#fffbeb", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#fde68a" }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Ionicons name="time-outline" size={18} color="#d97706" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#92400e" }}>Check-in / Check-out Policy</Text>
              </View>
              <View style={{ paddingLeft: 24 }}>
                {booking.preferred_arrival === "Morning" ? (
                  <Text style={{ fontSize: 13, color: "#92400e", marginBottom: 4 }}>Check-in: <Text style={{ fontWeight: "700" }}>8:00 AM - 12:00 PM</Text> (Requested)</Text>
                ) : booking.preferred_arrival === "Evening" ? (
                  <Text style={{ fontSize: 13, color: "#92400e", marginBottom: 4 }}>Check-in: <Text style={{ fontWeight: "700" }}>5:00 PM - 9:00 PM</Text> (Requested)</Text>
                ) : (
                  <Text style={{ fontSize: 13, color: "#92400e", marginBottom: 4 }}>Check-in: <Text style={{ fontWeight: "700" }}>after 2:00 PM</Text></Text>
                )}
                <Text style={{ fontSize: 13, color: "#92400e" }}>Check-out: <Text style={{ fontWeight: "700" }}>before 12:00 PM</Text></Text>
                <Text style={{ fontSize: 11, fontStyle: "italic", color: "#b45309", marginTop: 6 }}>Need an early check-in? Contact the host.</Text>
              </View>
              </View>

            {/* Pay on Arrival notice for cash bookings */}
            {booking.payment_status !== 'paid' && booking.payment_method === 'cash' && (
              <View style={{ marginTop: 16, backgroundColor: "#fffbeb", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#fde68a" }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <Ionicons name="cash-outline" size={18} color="#d97706" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#92400e" }}>Pay on Arrival</Text>
                </View>
                <View style={{ paddingLeft: 24 }}>
                  <Text style={{ fontSize: 13, color: "#92400e" }}>
                    Please pay ₱{Number(booking.total_price).toFixed(2)} to the host when you arrive.
                  </Text>
                </View>
              </View>
            )}

            {booking.tour_guide && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="compass-outline"
                  size={14}
                  color={colors.gearupGreen}
                />
                <Text style={styles.infoTextGreen}>
                  Guide: {booking.tour_guide.name}
                </Text>
              </View>
            )}
            {booking.notes && (
              <Text style={styles.notes}>&quot;{booking.notes}&quot;</Text>
            )}
          </View>

          {/* Price breakdown */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Price breakdown</Text>

            {booking.room_campsite ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {booking.room_campsite.name}: PHP{' '}
                  {parseFloat(
                    booking.room_campsite.price_per_night ?? '0',
                  ).toFixed(2)}{' '}
                  x {nights} {nights === 1 ? 'night' : 'nights'}
                </Text>
                <Text style={styles.summaryValue}>
                  PHP{' '}
                  {(parseFloat(
                    booking.room_campsite.price_per_night ?? '0',
                  ) * nights).toFixed(2)}
                </Text>
              </View>
            ) : booking.campsite && booking.pricing_lines && booking.pricing_lines.length > 0 ? (
              <>
                {booking.pricing_lines.map((line) => (
                  <View key={line.id} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      {line.pricing_line?.label ??
                        `Line #${line.pricing_line_id}`}
                      {line.quantity !== 1 ? ` x ${line.quantity}` : ''}
                      {` x PHP ${parseFloat(line.amount).toFixed(2)}`}
                    </Text>
                    <Text style={styles.summaryValue}>
                      PHP {parseFloat(line.subtotal).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </>
            ) : booking.campsite ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Campsite: PHP{' '}
                  {parseFloat(
                    booking.campsite.price_per_night ?? '0',
                  ).toFixed(2)}{' '}
                  x {nights} {nights === 1 ? 'night' : 'nights'} x{' '}
                  {booking.guests}
                </Text>
                <Text style={styles.summaryValue}>
                  PHP{' '}
                  {(parseFloat(
                    booking.campsite.price_per_night ?? '0',
                  ) *
                    nights *
                    booking.guests
                  ).toFixed(2)}
                </Text>
              </View>
            ) : null}

            {booking.tour_guide && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {booking.tour_guide.name}
                </Text>
                <Text style={styles.summaryValue}>
                  PHP{' '}
                  {parseFloat(
                    booking.tour_guide.price_per_trip ?? '0',
                  ).toFixed(2)}
                </Text>
              </View>
            )}

            {hasMultiGear && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.gearGroupLabel}>Gear</Text>
                <View style={styles.gearGroup}>
                  {booking.gear_items!.map((line) => (
                    <View
                      key={line.id}
                      style={styles.summaryRow}
                    >
                      <Text style={styles.summaryLabel}>
                        {line.name}: PHP{' '}
                        {parseFloat(line.price_per_day).toFixed(2)} x{' '}
                        {nights} {nights === 1 ? 'day' : 'days'} x{' '}
                        {line.pivot.quantity}
                      </Text>
                      <Text style={styles.summaryValue}>
                        PHP {parseFloat(line.pivot.subtotal).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {!hasMultiGear && booking.gear_item && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {booking.gear_item.name}: PHP{' '}
                  {parseFloat(booking.gear_item.price_per_day).toFixed(2)} x{' '}
                  {nights} {nights === 1 ? 'day' : 'days'} x{' '}
                  {booking.gear_quantity ?? 1}
                </Text>
                <Text style={styles.summaryValue}>
                  PHP{' '}
                  {(parseFloat(booking.gear_item.price_per_day) *
                    nights *
                    (booking.gear_quantity ?? 1)
                  ).toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                PHP {parseFloat(booking.total_price).toFixed(2)}
              </Text>
            </View>

            {Number(booking.amount_paid ?? 0) > 0 && (
              <>
                <View
                  style={[
                    styles.summaryRow,
                    {
                      marginTop: 8,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: '#bbf7d0',
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.gearupGreen,
                      fontWeight: '700',
                    }}
                  >
                    {Number(booking.balance_due ?? 0) > 0
                      ? 'Down payment'
                      : 'Paid in full'}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.gearupGreen,
                      fontWeight: '700',
                    }}
                  >
                    PHP {Number(booking.amount_paid).toFixed(2)}
                  </Text>
                </View>
                {Number(booking.balance_due ?? 0) > 0 && (
                  <View style={styles.summaryRow}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#b45309',
                        fontWeight: '700',
                      }}
                    >
                      Balance on arrival
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#b45309',
                        fontWeight: '700',
                      }}
                    >
                      PHP {Number(booking.balance_due ?? 0).toFixed(2)}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Cancel button */}
          {!cancelled &&
            (booking.status === 'pending' ||
              booking.status === 'confirmed') && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
                activeOpacity={0.85}
              >
                <Text style={styles.cancelBtnText}>Cancel booking</Text>
              </TouchableOpacity>
            )}
        </View>
        {booking && booking.status === 'pending' && booking.payment_status !== 'paid' && (booking.campsite as any)?.payment_mode !== 'pay_at_campsite' && (
          <TouchableOpacity
            onPress={() => router.push('/booking/' + booking.id + '/confirmed' as any)}
            style={{ backgroundColor: colors.gearupGreen, padding: 16, borderRadius: 12, marginTop: 20, marginBottom: 40, marginHorizontal: 20, alignItems: 'center' }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Complete Payment</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  errorText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.gearupGreen,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: colors.gearupGreen,
    fontSize: 14,
    fontWeight: '700',
  },

  topBar: {
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
  topBarTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },

  hero: {
    width: '100%',
    height: 220,
    backgroundColor: '#e5e7eb',
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gearup50,
  },

  body: { padding: 20, gap: 12 },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  bookingId: { fontSize: 11, color: colors.textMuted },

  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.4,
  },
  location: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  roomLabel: {
    fontSize: 13,
    color: colors.gearupGreen,
    fontWeight: '700',
    marginTop: 4,
  },
  rentalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gearupGreen,
    marginTop: 4,
  },

  infoBlock: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
    gap: 8,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: { fontSize: 13, color: '#374151', flex: 1 },
  infoTextGreen: {
    fontSize: 13,
    color: colors.gearupGreen,
    fontWeight: '700',
    flex: 1,
  },
  notes: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },

  summaryCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 16,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
  },
  summaryValue: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#86efac',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14532d',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#14532d',
  },
  gearGroupLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  gearGroup: {
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#86efac',
  },

  cancelBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#dc2626',
  },
});
