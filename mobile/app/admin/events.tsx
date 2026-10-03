import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { admin } from '../../lib/api';
import type { EventItem } from '@gearup/shared';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { colors } from '../../theme';

function formatDate(iso: string): string {
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

export default function AdminEventsScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await admin.listEvents({ limit: 500 });
      setEvents(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(events.length === 0);
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Events" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      ) : (
        <FlatList
          data={events}
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
                name="sparkles-outline"
                size={48}
                color={colors.textMuted}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.emptyTitle}>No events yet</Text>
              <Text style={styles.emptySubtitle}>
                Owner events will appear here once they are created.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image
                source={{ uri: item.image_url }}
                style={styles.cardImage}
              />
              <View style={styles.cardBody}>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      item.is_published
                        ? styles.statusPublished
                        : styles.statusDraft,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.is_published
                          ? styles.statusTextPublished
                          : styles.statusTextDraft,
                      ]}
                    >
                      {item.is_published ? 'PUBLISHED' : 'DRAFT'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cardLocation} numberOfLines={1}>
                  {item.location}
                </Text>
                <Text style={styles.cardDates} numberOfLines={1}>
                  {formatDate(item.starts_at)} to {formatDate(item.ends_at)} -
                  Cap {item.capacity}
                </Text>
                <Text style={styles.cardOwner} numberOfLines={1}>
                  Owner: {item.owner?.name ?? 'Platform'}
                </Text>
                <Text style={styles.cardPrice}>
                  PHP {item.price_per_person} / person
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 140, backgroundColor: '#e5e7eb' },
  cardBody: { padding: 14, gap: 3 },
  badgeRow: { flexDirection: 'row', marginBottom: 6 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  statusPublished: { backgroundColor: '#dcfce7' },
  statusDraft: { backgroundColor: '#f3f4f6' },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextPublished: { color: '#15803d' },
  statusTextDraft: { color: '#374151' },
  cardName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  cardLocation: { fontSize: 11, color: colors.textMuted },
  cardDates: { fontSize: 11, color: '#111827', marginTop: 2 },
  cardOwner: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  cardPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.gearupGreen,
    marginTop: 4,
  },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});