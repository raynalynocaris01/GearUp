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
import { admin } from '../../lib/api';
import type { AdminDashboardStats } from '@gearup/shared';
import { colors } from '../../theme';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await admin.dashboard();
      setStats(res.data);
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

  const primaryCards = stats
    ? [
        {
          label: 'Total Users',
          value: stats.total_users,
          icon: '👥',
          color: '#dbeafe',
          href: '/admin/users',
        },
        {
          label: 'Campsites',
          value: stats.total_campsites,
          icon: '⛺',
          color: '#dcfce7',
          href: '/admin/campsites',
        },
        {
          label: 'Bookings',
          value: stats.total_bookings,
          icon: '📅',
          color: '#f3e8ff',
          href: '/admin/bookings',
        },
        {
          label: 'Revenue',
          value: `₱${Number(stats.total_revenue).toFixed(0)}`,
          icon: '💰',
          color: '#fef3c7',
          href: '/admin/bookings',
        },
      ]
    : [];

  const secondaryStats = stats
    ? [
        { label: 'Owners', value: stats.total_owners, color: '#111827' },
        {
          label: 'Pending Owners',
          value: stats.pending_owners,
          color: '#b45309',
        },
        {
          label: 'Featured',
          value: stats.featured_campsites,
          color: '#111827',
        },
        {
          label: 'Suspended',
          value: stats.suspended_users,
          color: '#b91c1c',
        },
      ]
    : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/profile')}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={{ width: 40 }} />
      </View>

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
        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>Dashboard</Text>
          <Text style={styles.pageSubtitle}>Platform-wide overview</Text>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.gearupGreen} />
          </View>
        ) : (
          <>
            {/* Primary stats */}
            <View style={styles.cardsGrid}>
              {primaryCards.map((c) => (
                <TouchableOpacity
                  key={c.label}
                  style={styles.card}
                  onPress={() => router.push(c.href as any)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[styles.cardIconWrap, { backgroundColor: c.color }]}
                  >
                    <Text style={styles.cardIcon}>{c.icon}</Text>
                  </View>
                  <Text style={styles.cardLabel}>{c.label}</Text>
                  <Text style={styles.cardValue}>{c.value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Secondary stats */}
            <Text style={styles.sectionTitle}>More metrics</Text>
            <View style={styles.secondaryGrid}>
              {secondaryStats.map((s) => (
                <View key={s.label} style={styles.secondaryCard}>
                  <Text style={styles.secondaryLabel}>{s.label}</Text>
                  <Text
                    style={[styles.secondaryValue, { color: s.color }]}
                  >
                    {s.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Pending approvals shortcut */}
            {stats && stats.pending_owners > 0 && (
              <TouchableOpacity
                style={styles.pendingBlock}
                onPress={() =>
                  router.push('/admin/users?status=pending' as any)
                }
              >
                <View style={styles.pendingIconWrap}>
                  <Ionicons name="hourglass-outline" size={22} color="#b45309" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingTitle}>
                    {stats.pending_owners}{' '}
                    {stats.pending_owners === 1
                      ? 'pending approval'
                      : 'pending approvals'}
                  </Text>
                  <Text style={styles.pendingHint}>
                    Review business owner applications
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}

            {/* Quick actions */}
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <View style={styles.actionsBlock}>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push('/admin/users')}
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons name="people-outline" size={22} color={colors.gearupGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionLabel}>Manage users</Text>
                  <Text style={styles.actionHint}>
                    Approve owners, suspend accounts
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push('/admin/campsites')}
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons name="leaf-outline" size={22} color={colors.gearupGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionLabel}>Manage campsites</Text>
                  <Text style={styles.actionHint}>
                    Feature, unfeature, or remove listings
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push('/admin/bookings')}
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons name="calendar-outline" size={22} color={colors.gearupGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionLabel}>View bookings</Text>
                  <Text style={styles.actionHint}>
                    All reservations across the platform
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
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

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  titleBlock: { marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#111827' },
  pageSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },

  centerBox: { paddingVertical: 40, alignItems: 'center' },

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
  cardIcon: { fontSize: 22 },
  cardLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  cardValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
    marginBottom: 10,
    marginTop: 8,
  },

  secondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  secondaryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  secondaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  secondaryValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },

  pendingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  pendingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: { fontSize: 14, fontWeight: '800', color: '#92400e' },
  pendingHint: { fontSize: 11, color: '#b45309', marginTop: 2 },

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