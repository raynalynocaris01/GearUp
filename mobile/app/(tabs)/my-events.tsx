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
import { events as eventApi, hasToken } from '../../lib/api';
import type { EventRegistration } from '@gearup/shared';
import { colors } from '../../theme';
import { imgSrc } from '../../lib/images';

function formatRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString(
    'en-US',
    opts,
  )}`;
}

function statusPill(status: EventRegistration['status']) {
  switch (status) {
    case 'cancelled':
      return { bg: '#fee2e2', fg: '#b91c1c', label: 'CANCELLED' };
    case 'pending':
      return { bg: '#fef3c7', fg: '#92400e', label: 'PENDING' };
    default:
      return { bg: '#dcfce7', fg: '#15803d', label: 'CONFIRMED' };
  }
}

export default function MyEventsScreen() {
  const router = useRouter();
  const [regs, setRegs] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggedIn, setLoggedIn] = useState(true);

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const isAuth = await hasToken();
      setLoggedIn(isAuth);
      if (!isAuth) {
        setRegs([]);
        return;
      }
      const res = await eventApi.myRegistrations();
      setRegs(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(regs.length === 0);
    }, []),
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

  if (!loggedIn) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Log in to view your events</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.primaryBtnText}>Log in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
      </View>

      <FlatList
        data={regs}
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
            <Ionicons
              name="calendar-outline"
              size={48}
              color={colors.textMuted}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.emptyTitle}>No event registrations</Text>
            <Text style={styles.emptySubtitle}>
              Browse upcoming events to join one.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/events' as any)}
            >
              <Text style={styles.primaryBtnText}>Browse events</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const pill = statusPill(item.status);
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() =>
                router.push(`/events/${item.event_id}` as any)
              }
            >
              <View style={styles.cardTop}>
                <View style={styles.thumb}>
                  {item.event?.image_url ? (
                    <Image
                      source={{ uri: imgSrc(item.event.image_url) }}
                      style={styles.thumbImg}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                    <Text style={[styles.pillText, { color: pill.fg }]}>
                      {pill.label}
                    </Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.event?.name ?? 'Event'}
                  </Text>
                  {item.event ? (
                    <Text style={styles.cardSub} numberOfLines={1}>
                      {formatRange(item.event.starts_at, item.event.ends_at)}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Guests</Text>
                  <Text style={styles.metaValue}>{item.guests}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Total</Text>
                  <Text style={styles.metaValue}>PHP {item.total_price}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    gap: 12,
    padding: 24,
  },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },

  listContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
  },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginBottom: 4,
  },
  pillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  cardSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metaItem: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 10,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginTop: 3,
  },

  primaryBtn: {
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});