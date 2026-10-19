import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { guide as guideApi } from '../../lib/api';
import { colors } from '../../theme';

interface Booking {
  id: number;
  check_in: string | null;
  check_out: string | null;
  guests: number;
  total_price: string;
  guide_status: 'pending' | 'accepted' | 'declined' | null;
  campsite?: { id: number; name: string; location: string } | null;
  user?: { id: number; name: string; email: string } | null;
}

type Filter = 'all' | 'pending' | 'accepted' | 'declined';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function GuideBookingsList({
  bookings,
  onRefresh,
}: {
  bookings: Booking[];
  onRefresh: () => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<number | null>(null);

  const filtered =
    filter === 'all'
      ? bookings
      : bookings.filter((b) => b.guide_status === filter);

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.guide_status === 'pending').length,
    accepted: bookings.filter((b) => b.guide_status === 'accepted').length,
    declined: bookings.filter((b) => b.guide_status === 'declined').length,
  };

  const handleAction = async (
    bookingId: number,
    action: 'accept' | 'decline',
  ) => {
    setBusyId(bookingId);
    try {
      if (action === 'accept') {
        await guideApi.bookings.accept(bookingId);
      } else {
        await guideApi.bookings.decline(bookingId);
      }
      onRefresh();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        `Could not ${action} booking.`;
      Alert.alert('Error', msg);
    } finally {
      setBusyId(null);
    }
  };

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'declined', label: 'Declined' },
  ];

  return (
    <View>
      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {tabs.map((t) => {
          const active = filter === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setFilter(t.key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t.label}{' '}
                <Text style={active ? styles.tabCountActive : styles.tabCount}>
                  ({counts[t.key]})
                </Text>
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            {filter === 'all'
              ? 'No bookings yet.'
              : `No ${filter} bookings.`}
          </Text>
        </View>
      ) : (
        filtered.map((booking) => {
          const isBusy = busyId === booking.id;
          return (
            <View key={booking.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.campsiteName}>
                    {booking.campsite?.name ?? 'Tour guide booking'}
                  </Text>
                  <Text style={styles.meta}>
                    {formatDate(booking.check_in)} —{' '}
                    {formatDate(booking.check_out)} · {booking.guests}{' '}
                    {booking.guests === 1 ? 'guest' : 'guests'}
                  </Text>
                  {booking.user && (
                    <Text style={styles.meta}>
                      Customer: {booking.user.name}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.price}>
                    PHP {parseFloat(booking.total_price).toFixed(2)}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      booking.guide_status === 'pending'
                        ? styles.badgePending
                        : booking.guide_status === 'accepted'
                          ? styles.badgeAccepted
                          : styles.badgeDeclined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        booking.guide_status === 'pending'
                          ? styles.badgeTextPending
                          : booking.guide_status === 'accepted'
                            ? styles.badgeTextAccepted
                            : styles.badgeTextDeclined,
                      ]}
                    >
                      {(booking.guide_status ?? 'PENDING').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {booking.guide_status === 'pending' && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={() => handleAction(booking.id, 'decline')}
                    disabled={isBusy}
                    style={[styles.actionBtn, styles.declineBtn]}
                  >
                    <Text style={styles.declineText}>
                      {isBusy ? 'Working...' : 'Decline'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAction(booking.id, 'accept')}
                    disabled={isBusy}
                    style={[styles.actionBtn, styles.acceptBtn]}
                  >
                    <Text style={styles.acceptText}>
                      {isBusy ? 'Working...' : 'Accept'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    paddingRight: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  tabActive: { backgroundColor: colors.gearup50 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: colors.gearupGreen },
  tabCount: { fontSize: 11, color: '#9ca3af' },
  tabCountActive: { fontSize: 11, color: colors.gearupGreenLight },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 32,
    alignItems: 'center',
  },
  emptyText: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 14,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  campsiteName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 11, color: '#6b7280', marginTop: 3 },
  price: { fontSize: 15, fontWeight: '800', color: colors.gearupGreen },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  badgePending: { backgroundColor: '#fef3c7' },
  badgeAccepted: { backgroundColor: '#dcfce7' },
  badgeDeclined: { backgroundColor: '#fee2e2' },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeTextPending: { color: '#92400e' },
  badgeTextAccepted: { color: '#15803d' },
  badgeTextDeclined: { color: '#b91c1c' },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  declineBtn: { borderWidth: 1, borderColor: '#fecaca' },
  declineText: { fontSize: 13, fontWeight: '700', color: '#b91c1c' },
  acceptBtn: { backgroundColor: colors.gearupGreen },
  acceptText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});