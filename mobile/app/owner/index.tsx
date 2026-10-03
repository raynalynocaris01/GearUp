import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { owner } from '../../lib/api';
import type { OwnerDashboardStats, Booking, Campsite } from '@gearup/shared';
import { OwnerHeader } from '../../components/owner/OwnerHeader';
import { UpcomingBookings } from '../../components/owner/UpcomingBookings';
import { BookingChart } from '../../components/owner/BookingChart';
import type { OwnerDashboardChart } from '@gearup/shared';
import { colors } from '../../theme';
import { CampsiteOverview } from '../../components/owner/CampsiteOverview';


export default function OwnerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<OwnerDashboardStats | null>(null);
  const [userName, setUserName] = useState<string>('');
   const [bookings, setBookings] = useState<Booking[]>([]);
  const [chart, setChart] = useState<OwnerDashboardChart | null>(null);
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
        try {
         const [dashRes, userRes, bookingsRes, chartRes, campsitesRes] = await Promise.all([
  owner.dashboard(),
  (await import('../../lib/api')).auth.user(),
  owner.listBookings(),
  owner.dashboardChart(30),
  owner.listCampsites(),
]);
setStats(dashRes.data);
setUserName(userRes.data.name ?? '');
setBookings(bookingsRes.data);
setChart(chartRes.data);
setCampsites(campsitesRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(!stats);
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const firstName = userName.split(' ')[0] || 'there';

  const cards = stats
    ? [
        {
          label: 'Total Bookings',
          value: String(stats.total_bookings),
          icon: 'calendar-outline' as const,
          bg: '#dbeafe',
          fg: '#2563eb',
          href: '/owner/bookings',
        },
        {
          label: 'Confirmed',
          value: String(stats.confirmed_bookings),
          icon: 'checkmark-circle-outline' as const,
          bg: '#dcfce7',
          fg: '#16a34a',
          href: '/owner/bookings',
        },
        {
          label: 'Total Earnings',
          value: `PHP ${Number(
            stats.total_earnings ?? stats.total_revenue ?? 0,
          ).toFixed(0)}`,
          icon: 'cash-outline' as const,
          bg: '#fef3c7',
          fg: '#d97706',
          href: '/owner/bookings',
        },
        {
          label: 'Average Rating',
          value: Number(stats.average_rating ?? 0).toFixed(1),
          icon: 'star-outline' as const,
          bg: '#f3e8ff',
          fg: '#9333ea',
          href: '/owner/reviews',
        },
      ]
    : [];

  return (
    <View style={styles.container}>
      <OwnerHeader title="Dashboard" />

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
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.gearupGreen} />
          </View>
        ) : (
          <>
            {/* Welcome header */}
            <View style={styles.welcomeBlock}>
              <Text style={styles.welcomeTitle}>
                Welcome back, {firstName}!
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Here's what's happening with your listings today.
              </Text>
            </View>

            {/* Add Campsite CTA */}
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/owner/campsites/new')}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.ctaButtonText}>Add Campsite</Text>
            </TouchableOpacity>

            {/* Stat cards 2x2 */}
            <View style={styles.cardsGrid}>
              {cards.map((c) => (
                <TouchableOpacity
                  key={c.label}
                  style={styles.card}
                  onPress={() => router.push(c.href as any)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.cardIconWrap,
                      { backgroundColor: c.bg },
                    ]}
                  >
                    <Ionicons name={c.icon} size={22} color={c.fg} />
                  </View>
                  <Text style={styles.cardLabel}>{c.label}</Text>
                  <Text style={styles.cardValue} numberOfLines={1}>
                    {c.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

              {/* Booking Overview chart */}
            <BookingChart data={chart} days={30} />

            {/* Campsite Overview */}
            <CampsiteOverview campsites={campsites} limit={3} />

            {/* Upcoming bookings */}
            <UpcomingBookings bookings={bookings} limit={3} />

            {/* Quick start */}
            <Text style={styles.sectionTitle}>Quick start</Text>
            <View style={styles.actionsBlock}>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push('/owner/campsites')}
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons
                    name="list-outline"
                    size={22}
                    color={colors.gearupGreen}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionLabel}>Manage campsites</Text>
                  <Text style={styles.actionHint}>
                    Edit, remove, or add tour guides
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push('/owner/gear')}
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons
                    name="bag-handle-outline"
                    size={22}
                    color={colors.gearupGreen}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionLabel}>Manage gear</Text>
                  <Text style={styles.actionHint}>
                    Add, edit, or remove rental items
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push('/owner/bookings')}
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons
                    name="calendar-outline"
                    size={22}
                    color={colors.gearupGreen}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionLabel}>View bookings</Text>
                  <Text style={styles.actionHint}>
                    Confirm or cancel incoming reservations
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  centerBox: { paddingVertical: 40, alignItems: 'center' },

  welcomeBlock: { marginBottom: 16 },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },

  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.gearupGreen,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
    marginBottom: 10,
  },
  actionsBlock: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.gearup50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  actionHint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 66 },
});