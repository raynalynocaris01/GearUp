import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { myGear } from '../../../../lib/api';
import type { Booking } from '@gearup/shared';
import { MyGearBookingActions } from '../../../../components/my/MyGearBookingActions';
import { colors } from '../../../../theme';

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

function daysBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

export default function OwnerGearBookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setLoading(true);
      setError('');
      try {
        const res = await myGear.getBooking(id);
        setBooking(res.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ??
            err.message ??
            'Could not load rental.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useFocusEffect(
    useCallback(() => {
      load(booking === null);
    }, [load, booking]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
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
        <Ionicons
          name="warning-outline"
          size={56}
          color={colors.textMuted}
        />
        <Text style={styles.errorText}>
          {error || 'Rental not found.'}
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

  const isLegacy =
    !booking.gear_items || booking.gear_items.length === 0;

  const nights = daysBetween(
    booking.gear_start_date ?? booking.check_in,
    booking.gear_end_date ?? booking.check_out,
  );

  const shareTotal = isLegacy
    ? parseFloat(booking.total_price)
    : booking.gear_items!.reduce(
        (sum, l) => sum + parseFloat(l.pivot.subtotal),
        0,
      );

  const title = isLegacy
    ? booking.gear_item?.name ?? 'Gear rental'
    : booking.gear_items!.length === 1
      ? booking.gear_items![0].name
      : `${booking.gear_items!.length} gear items`;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Rental Details</Text>
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
        <View style={styles.body}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.pill,
                {
                  backgroundColor:
                    booking.status === 'cancelled'
                      ? '#fee2e2'
                      : booking.status === 'pending'
                        ? '#fef3c7'
                        : booking.status === 'completed'
                          ? '#dbeafe'
                          : '#dcfce7',
                },
              ]}
            >
              <Text style={styles.pillText}>
                {booking.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.bookingId}>Rental #{booking.id}</Text>
          </View>

          <Text style={styles.title}>{title}</Text>

          {booking.user && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>{booking.user.name}</Text>
              <Text style={styles.infoSub}>{booking.user.email}</Text>
            </View>
          )}

          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Dates</Text>
            <Text style={styles.infoValue}>
              {fmtDate(booking.gear_start_date ?? booking.check_in)} to{' '}
              {fmtDate(booking.gear_end_date ?? booking.check_out)}
            </Text>
            <Text style={styles.infoSub}>
              {nights} {nights === 1 ? 'day' : 'days'}
            </Text>
            {booking.notes && (
              <Text style={styles.notes}>&quot;{booking.notes}&quot;</Text>
            )}
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Your gear</Text>

            {isLegacy ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {booking.gear_item?.name ?? 'Gear'}: PHP{' '}
                  {parseFloat(
                    booking.gear_item?.price_per_day ?? '0',
                  ).toFixed(2)}{' '}
                  x {nights} {nights === 1 ? 'day' : 'days'} x{' '}
                  {booking.gear_quantity ?? 1}
                </Text>
                <Text style={styles.summaryValue}>
                  PHP {parseFloat(booking.total_price).toFixed(2)}
                </Text>
              </View>
            ) : (
              booking.gear_items!.map((line) => (
                <View key={line.id} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {line.name}: PHP{' '}
                    {parseFloat(line.price_per_day).toFixed(2)} x {nights}{' '}
                    {nights === 1 ? 'day' : 'days'} x {line.pivot.quantity}
                  </Text>
                  <Text style={styles.summaryValue}>
                    PHP {parseFloat(line.pivot.subtotal).toFixed(2)}
                  </Text>
                </View>
              ))
            )}

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Your share</Text>
              <Text style={styles.totalValue}>
                PHP {shareTotal.toFixed(2)}
              </Text>
            </View>
          </View>

          <MyGearBookingActions
            bookingId={booking.id}
            status={booking.status}
            onChanged={() => load()}
          />
        </View>
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
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.3,
  },

  infoBlock: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  infoSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  notes: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 6,
  },

  summaryCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 16,
    marginTop: 4,
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
});