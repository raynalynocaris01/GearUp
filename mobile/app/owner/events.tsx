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
import { owner } from '../../lib/api';
import type { EventItem } from '@gearup/shared';
import { OwnerHeader } from '../../components/owner/OwnerHeader';
import { DeleteEventButton } from '../../components/owner/DeleteEventButton';
import { colors } from '../../theme';

function formatRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return `${start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
   })} - ${end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

export default function OwnerEventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await owner.listEvents();
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
      <OwnerHeader
        title="My Events"
        rightAction={{
          icon: 'add',
          onPress: () => router.push('/owner/events/new'),
        }}
      />

      {loading ? (
        <View style={styles.centerBox}>
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
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyTitle}>No events yet</Text>
              <Text style={styles.emptySubtitle}>
                Create your first event to bring campers together.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/owner/events/new')}
              >
                <Text style={styles.primaryButtonText}>
                  Create your first event
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.cardImage}
                  />
                ) : (
                  <View
                    style={[styles.cardImage, styles.cardImageFallback]}
                  />
                )}
                <View style={styles.cardBody}>
                  <View style={styles.nameRow}>
                    <Text
                      style={styles.cardName}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {!item.is_published && (
                      <View style={styles.draftPill}>
                        <Text style={styles.draftText}>DRAFT</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={styles.cardLocation}
                    numberOfLines={1}
                  >
                    {item.location}
                  </Text>
                  <Text style={styles.cardDates}>
                    {formatRange(item.starts_at, item.ends_at)}
                  </Text>
                  {item.description && (
                    <Text
                      style={styles.cardDescription}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  )}
                  <Text style={styles.cardPrice}>
              PHP {item.price_per_person} / person - Capacity{' '}
                    {item.capacity}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.cardActionSecondary}
                  onPress={() => router.push(`/events/${item.id}`)}
                >
                  <Text style={styles.cardActionSecondaryText}>
                    View public
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cardActionPrimary}
                  onPress={() =>
                    router.push(`/owner/events/${item.id}/edit`)
                  }
                >
                  <Text style={styles.cardActionPrimaryText}>Edit</Text>
                </TouchableOpacity>
                 <TouchableOpacity
                  style={[styles.cardActionSecondary, { flex: 0.9 }]}
                  onPress={() =>
                    router.push(`/owner/events/${item.id}/attendees` as any)
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.cardActionSecondaryText}>Attendees</Text>
                </TouchableOpacity>
                <DeleteEventButton
                  eventId={item.id}
                  name={item.name}
                  onSuccess={() => load()}
                />
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
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', padding: 12, gap: 12 },
  cardImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  cardImageFallback: { backgroundColor: colors.gearup50 },
  cardBody: { flex: 1, gap: 3 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    flexShrink: 1,
  },
  draftPill: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  draftText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: 0.3,
  },
  cardLocation: { fontSize: 11, color: colors.textMuted },
  cardDates: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gearupGreen,
    marginTop: 4,
  },

  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cardActionSecondary: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
  },
  cardActionSecondaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  cardActionPrimary: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.gearupGreen,
  },
  cardActionPrimaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  emptyBlock: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
 
});