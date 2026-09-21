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
import type { OwnerDashboardStats } from '@gearup/shared';
import { colors } from '../../theme';

export default function OwnerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<OwnerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await owner.dashboard();
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

  const cards = stats
    ? [
        {
          label: 'Campsites',
          value: stats.total_campsites,
          icon: '⛺',
          color: '#dcfce7',
          href: '/owner/campsites',
        },
        {
          label: 'Bookings',
          value: stats.total_bookings,
          icon: '📅',
          color: '#dbeafe',
          href: '/owner/bookings',
        },
        {
          label: 'Pending',
          value: stats.pending_bookings,
          icon: '⏳',
          color: '#fef3c7',
          href: '/owner/bookings',
        },
        {
          label: 'Revenue',
          value: `₱${Number(stats.total_revenue).toFixed(0)}`,
          icon: '💰',
          color: '#f3e8ff',
          href: '/owner/bookings',
        },
      ]
    : [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/profile')}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage</Text>
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
          <Text style={styles.pageSubtitle}>
            Overview of your campsites and bookings
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.gearupGreen} />
          </View>
        ) : (
          <>
            {/* Stat cards */}
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
                      { backgroundColor: c.color },
                    ]}
                  >
                    <Text style={styles.cardIcon}>{c.icon}</Text>
                  </View>
                  <Text style={styles.cardLabel}>{c.label}</Text>
                  <Text style={styles.cardValue}>{c.value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick actions */}
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <View style={styles.actionsBlock}>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push('/owner/campsites/new')}
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons name="add-circle-outline" size={22} color={colors.gearupGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionLabel}>Post a new campsite</Text>
                  <Text style={styles.actionHint}>
                    Add your listing to start receiving bookings
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push('/owner/campsites')}
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons name="list-outline" size={22} color={colors.gearupGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionLabel}>Manage campsites</Text>
                  <Text style={styles.actionHint}>
                    Edit, remove, or add tour guides
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push('/owner/bookings')}
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons name="calendar-outline" size={22} color={colors.gearupGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionLabel}>View bookings</Text>
                  <Text style={styles.actionHint}>
                    Confirm or cancel incoming reservations
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