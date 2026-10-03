import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { admin } from '../../lib/api';
import type {
  AdminDashboardStats,
  AdminDashboardChart,
  Booking,
  AdminUser,
} from '@gearup/shared';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { BookingChart } from '../../components/owner/BookingChart';
import { colors } from '../../theme';

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
}

function statusPillBg(status: string): string {
  if (status === 'cancelled') return '#fee2e2';
  if (status === 'pending') return '#fef3c7';
  if (status === 'completed') return '#dbeafe';
  return '#dcfce7';
}

function statusPillFg(status: string): string {
  if (status === 'cancelled') return '#b91c1c';
  if (status === 'pending') return '#92400e';
  if (status === 'completed') return '#1d4ed8';
  return '#15803d';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [chart, setChart] = useState<AdminDashboardChart | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const [dashRes, chartRes, bookingsRes, usersRes] = await Promise.all([
        admin.dashboard(),
        admin.dashboardChart(30),
        admin.listBookings(),
        admin.listUsers(),
      ]);
      setStats(dashRes.data);
      setChart(chartRes.data);
      setBookings(bookingsRes.data);
      setUsers(usersRes.data);
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

  const kpis = stats
    ? [
        {
          label: 'Total Users',
          value: String(stats.total_users),
          delta: `${stats.total_owners} owners`,
          icon: 'people-outline' as const,
          bg: '#dbeafe',
          fg: '#2563eb',
          href: '/admin/users',
        },
        {
          label: 'Campsites',
          value: String(stats.total_campsites),
          delta: `${stats.featured_campsites} featured`,
          icon: 'triangle-outline' as const,
          bg: '#dcfce7',
          fg: '#16a34a',
          href: '/admin/campsites',
        },
        {
          label: 'Bookings',
          value: String(stats.total_bookings),
          delta: `${stats.pending_bookings} pending`,
          icon: 'calendar-outline' as const,
          bg: '#f3e8ff',
          fg: '#9333ea',
          href: '/admin/bookings',
        },
        {
          label: 'Revenue',
          value: `PHP ${Number(stats.total_revenue).toFixed(0)}`,
          delta: 'Confirmed + completed',
          icon: 'cash-outline' as const,
          bg: '#fef3c7',
          fg: '#d97706',
          href: '/admin/bookings',
        },
      ]
    : [];

  const recentBookings = bookings.slice(0, 5);
  const recentUsers = users.slice(0, 5);
  const pendingOwners = users.filter(
    (u) => u.role === 'owner' && !u.is_approved,
  );

  return (
    <View style={styles.container}>
      <AdminHeader title="Dashboard" />

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
            <View style={styles.titleBlock}>
              <Text style={styles.pageTitle}>Overview</Text>
              <Text style={styles.pageSubtitle}>
                Platform-wide snapshot
              </Text>
            </View>

            {/* KPI grid (2 cols) */}
            <View style={styles.kpiGrid}>
              {kpis.map((k) => (
                <TouchableOpacity
                  key={k.label}
                  style={styles.kpiCard}
                  onPress={() => router.push(k.href as any)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.kpiIconWrap,
                      { backgroundColor: k.bg },
                    ]}
                  >
                    <Ionicons name={k.icon} size={20} color={k.fg} />
                  </View>
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                  <Text style={styles.kpiValue} numberOfLines={1}>
                    {k.value}
                  </Text>
                  <Text style={styles.kpiDelta}>{k.delta}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Booking chart */}
            <BookingChart data={chart} days={30} />

            {/* Recent Bookings */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Recent Bookings</Text>
                <TouchableOpacity
                  onPress={() => router.push('/admin/bookings' as any)}
                >
                  <Text style={styles.viewAll}>View all</Text>
                </TouchableOpacity>
              </View>

              {recentBookings.length === 0 ? (
                <Text style={styles.emptyText}>No bookings yet.</Text>
              ) : (
                recentBookings.map((b, i) => (
                  <View
                    key={b.id}
                    style={[
                      styles.row,
                      i === recentBookings.length - 1 && styles.rowLast,
                    ]}
                  >
                    <View style={styles.thumb}>
                      {b.campsite?.image_url ? (
                        <Image
                          source={{ uri: b.campsite.image_url }}
                          style={styles.thumbImg}
                          resizeMode="cover"
                        />
                      ) : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {b.campsite?.name ?? 'Platform booking'}
                      </Text>
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {b.user?.name ?? b.user?.email ?? 'Unknown'} -{' '}
                        {formatDate(b.check_in)} to {formatDate(b.check_out)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.rowPrice}>
                        PHP {b.total_price}
                      </Text>
                      <View
                        style={[
                          styles.pill,
                          { backgroundColor: statusPillBg(b.status) },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            { color: statusPillFg(b.status) },
                          ]}
                        >
                          {b.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Recent Users */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Recent Users</Text>
                <TouchableOpacity
                  onPress={() => router.push('/admin/users' as any)}
                >
                  <Text style={styles.viewAll}>View all</Text>
                </TouchableOpacity>
              </View>

              {recentUsers.length === 0 ? (
                <Text style={styles.emptyText}>No users yet.</Text>
              ) : (
                recentUsers.map((u, i) => (
                  <View
                    key={u.id}
                    style={[
                      styles.row,
                      i === recentUsers.length - 1 && styles.rowLast,
                    ]}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {u.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {u.name}
                      </Text>
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {u.email}
                      </Text>
                    </View>
                    <Text style={styles.rowRole}>
                      {u.role === 'owner'
                        ? u.is_approved
                          ? 'OWNER'
                          : 'PENDING'
                        : u.role.toUpperCase()}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* System Overview */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>System Overview</Text>
              <View style={styles.sysGrid}>
                <View style={styles.sysCell}>
                  <Text style={styles.sysLabel}>System Health</Text>
                  <Text style={[styles.sysValue, { color: '#15803d' }]}>
                    Good
                  </Text>
                </View>
                <View style={styles.sysCell}>
                  <Text style={styles.sysLabel}>Pending Verifications</Text>
                  <Text style={[styles.sysValue, { color: '#b45309' }]}>
                    {stats?.pending_owners ?? 0}
                  </Text>
                </View>
                <View style={styles.sysCell}>
                  <Text style={styles.sysLabel}>Total Transactions</Text>
                  <Text style={styles.sysValue}>
                    {stats?.total_bookings ?? 0}
                  </Text>
                </View>
                <View style={styles.sysCell}>
                  <Text style={styles.sysLabel}>Active Campsites</Text>
                  <Text style={styles.sysValue}>
                    {stats?.total_campsites ?? 0}
                  </Text>
                </View>
              </View>
            </View>

            {/* Pending Approvals */}
            {pendingOwners.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Pending Approvals</Text>
                  <TouchableOpacity
                    onPress={() =>
                      router.push('/admin/users?status=pending' as any)
                    }
                  >
                    <Text style={styles.viewAll}>View all</Text>
                  </TouchableOpacity>
                </View>

                {pendingOwners.slice(0, 5).map((u, i) => (
                  <View
                    key={u.id}
                    style={[
                      styles.row,
                      i === Math.min(pendingOwners.length, 5) - 1 &&
                        styles.rowLast,
                    ]}
                  >
                    <View
                      style={[styles.avatar, { backgroundColor: '#fef3c7' }]}
                    >
                      <Text
                        style={[styles.avatarText, { color: '#92400e' }]}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {u.name}
                      </Text>
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {u.email}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.reviewBtn}
                      onPress={() =>
                        router.push('/admin/users?status=pending' as any)
                      }
                    >
                      <Text style={styles.reviewBtnText}>Review</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  centerBox: { paddingVertical: 60, alignItems: 'center' },

  titleBlock: { marginBottom: 16 },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
  },
  kpiIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  kpiLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    marginTop: 4,
  },
  kpiDelta: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gearupGreen,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowLast: { borderBottomWidth: 0 },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  rowTitle: { fontSize: 13, fontWeight: '800', color: '#111827' },
  rowSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  rowPrice: { fontSize: 12, fontWeight: '900', color: colors.gearupGreen },
  rowRole: {
    fontSize: 9,
    fontWeight: '900',
    color: '#6b7280',
    letterSpacing: 0.6,
  },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 2,
  },
  pillText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gearup50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.gearupGreen,
  },

  sysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  sysCell: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
  },
  sysLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sysValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    marginTop: 4,
  },

  reviewBtn: {
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.3,
  },

  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
});