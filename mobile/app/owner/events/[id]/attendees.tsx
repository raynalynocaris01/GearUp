import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { owner } from '../../../../lib/api';
import type { EventItem, EventRegistration } from '@gearup/shared';
import { OwnerHeader } from '../../../../components/owner/OwnerHeader';
import { colors } from '../../../../theme';

function fmtDate(iso: string): string {
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

function statusPill(status: string) {
  if (status === 'cancelled') return { bg: '#fee2e2', fg: '#b91c1c' };
  if (status === 'pending') return { bg: '#fef3c7', fg: '#92400e' };
  return { bg: '#dcfce7', fg: '#15803d' };
}

export default function EventAttendeesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [attendees, setAttendees] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = false) => {
    if (!id) return;
    if (showSpinner) setLoading(true);
    try {
      const [evRes, regsRes] = await Promise.all([
        owner.getEvent(id),
        owner.listEventRegistrations(id),
      ]);
      setEvent(evRes.data);
      setAttendees(regsRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [id]),
  );

  const confirmed = attendees.filter((a) => a.status === 'confirmed');
  const totalGuests = confirmed.reduce((sum, a) => sum + a.guests, 0);
  const totalRevenue = confirmed.reduce(
    (sum, a) => sum + Number(a.total_price),
    0,
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <OwnerHeader title="Attendees" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OwnerHeader title="Attendees" />

      <FlatList
        data={attendees}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.gearupGreen}
          />
        }
        ListHeaderComponent={
          <>
            {event ? (
              <View style={styles.titleBlock}>
                <Text style={styles.title}>{event.name}</Text>
                <Text style={styles.subtitle}>
                  {fmtDate(event.starts_at)} - {fmtDate(event.ends_at)} -
                  Capacity {event.capacity}
                </Text>
              </View>
            ) : null}

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Registrations</Text>
                <Text style={styles.statValue}>{confirmed.length}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Guests</Text>
                <Text style={styles.statValue}>{totalGuests}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Revenue</Text>
                <Text style={styles.statValueGreen}>
                  PHP {totalRevenue.toFixed(0)}
                </Text>
              </View>
            </View>

            {attendees.length > 0 ? (
              <Text style={styles.sectionTitle}>Attendees</Text>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="people-outline"
              size={48}
              color={colors.textMuted}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.emptyTitle}>No registrations yet</Text>
            <Text style={styles.emptySubtitle}>
              When campers register for this event, they will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const pill = statusPill(item.status);
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.user?.name ?? '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.user?.name ?? 'Anonymous'}
                  </Text>
                  <Text style={styles.cardEmail} numberOfLines={1}>
                    {item.user?.email ?? ''}
                  </Text>
                </View>
                <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                  <Text style={[styles.pillText, { color: pill.fg }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Guests</Text>
                  <Text style={styles.metaValue}>{item.guests}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Registered</Text>
                  <Text style={styles.metaValue}>
                    {fmtDate(item.created_at)}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Total</Text>
                  <Text style={styles.metaValue}>PHP {item.total_price}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  listContent: { padding: 16, gap: 12 },

  titleBlock: { marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.4,
  },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 12,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    marginTop: 4,
  },
  statValueGreen: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.gearupGreen,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  cardName: { fontSize: 14, fontWeight: '800', color: '#111827' },
  cardEmail: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  pillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },

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
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
    marginTop: 3,
  },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});