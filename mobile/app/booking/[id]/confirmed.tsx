import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { bookings } from '../../../lib/api';
import type { Booking } from '@gearup/shared';
import { colors } from '../../../theme';
import { BookingStatusTracker } from '../../../components/BookingStatusTracker';

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

const REDIRECT_SECONDS = 5;

export default function BookingConfirmedScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(REDIRECT_SECONDS);

  const load = useCallback(async () => {
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
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Countdown + auto-redirect
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    const timeout = setTimeout(() => {
      router.replace(`/booking/${id}` as any);
    }, REDIRECT_SECONDS * 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [loading, id, router]);

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
        <Text style={styles.errorText}>{error || 'Booking not found.'}</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/(tabs)/bookings' as any)}
        >
          <Text style={styles.backBtnText}>Back to Bookings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isGearOnly = !booking.campsite && booking.gear_item;
  const startDate =
    isGearOnly && booking.gear_start_date
      ? booking.gear_start_date
      : booking.check_in;
  const endDate =
    isGearOnly && booking.gear_end_date
      ? booking.gear_end_date
      : booking.check_out;
  const title =
    booking.campsite?.name ?? booking.gear_item?.name ?? 'your booking';
  const pill = statusPill(booking.status);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration */}
        <View style={styles.celebration}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={40} color="#15803d" />
          </View>
          <Text style={styles.heading}>Booking confirmed!</Text>
          <Text style={styles.subheading}>
            Your reservation at{' '}
            <Text style={styles.subheadingBold}>{title}</Text> has been
            placed.
          </Text>
        </View>

        {/* Tracker */}
        <BookingStatusTracker
          status={booking.status}
          createdAt={booking.created_at ?? null}
          confirmedAt={booking.confirmed_at ?? null}
          completedAt={booking.completed_at ?? null}
          cancelledAt={booking.cancelled_at ?? null}
        />

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryId}>Booking #{booking.id}</Text>
            <View style={[styles.pill, { backgroundColor: pill.bg }]}>
              <Text style={[styles.pillText, { color: pill.fg }]}>
                {pill.label}
              </Text>
            </View>
          </View>

          {startDate && endDate && (
            <Text style={styles.summaryDates}>
              {fmtDate(startDate)} - {fmtDate(endDate)}
            </Text>
          )}
          {booking.campsite?.location && (
            <Text style={styles.summaryLocation}>
              {booking.campsite.location}
            </Text>
          )}
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace(`/booking/${id}` as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>View booking details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.replace('/(tabs)' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>Back to home</Text>
        </TouchableOpacity>

        {/* Countdown */}
        <Text style={styles.countdown}>
          Redirecting to your booking details in {remaining}s...
        </Text>

        <View style={{ height: 40 }} />
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
    backgroundColor: '#f9fafb',
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

  scrollContent: {
    padding: 24,
    paddingTop: 70,
    gap: 20,
  },

  celebration: {
    alignItems: 'center',
    marginBottom: 8,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gearup50,
    borderWidth: 2,
    borderColor: colors.gearupGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  subheadingBold: {
    fontWeight: '800',
    color: '#111827',
  },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryId: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  summaryDates: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  summaryLocation: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },

  primaryBtn: {
    backgroundColor: colors.gearupGreen,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
  },

  countdown: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
});