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
import type { Campsite } from '@gearup/shared';
import { colors } from '../../theme';

export default function OwnerCampsitesScreen() {
  const router = useRouter();
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await owner.listCampsites();
      setCampsites(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(campsites.length === 0);
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Campsites</Text>
        <TouchableOpacity
          onPress={() => router.push('/owner/campsites/new')}
          style={styles.headerAction}
        >
          <Ionicons name="add" size={26} color={colors.gearupGreen} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      ) : (
        <FlatList
          data={campsites}
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
              <Text style={styles.emptyEmoji}>⛺</Text>
              <Text style={styles.emptyTitle}>No campsites yet</Text>
              <Text style={styles.emptySubtitle}>
                Post your first campsite to start receiving bookings.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/owner/campsites/new')}
              >
                <Text style={styles.primaryButtonText}>
                  Post a campsite
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.cardImage}
                />
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardLocation} numberOfLines={1}>
                    📍 {item.location}
                  </Text>
                  <Text style={styles.cardMeta}>
                    <Text style={{ color: '#f59e0b' }}>★</Text>{' '}
                    {item.rating} ({item.reviews_count}) · Up to{' '}
                    {item.capacity}
                  </Text>
                  <Text style={styles.cardPrice}>
                    ₱{item.price_per_night} / {item.price_unit}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.cardActionSecondary}
                  onPress={() => router.push(`/campsites/${item.id}`)}
                >
                  <Text style={styles.cardActionSecondaryText}>
                    View public
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cardActionPrimary}
                  onPress={() =>
                    router.push(`/owner/campsites/${item.id}/edit`)
                  }
                >
                  <Text style={styles.cardActionPrimaryText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cardActionSecondary}
                  onPress={() =>
                    router.push(`/owner/campsites/${item.id}/tour-guides`)
                  }
                >
                  <Text style={styles.cardActionSecondaryText}>
                    Guides ({item.tour_guides?.length ?? 0})
                  </Text>
                </TouchableOpacity>
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
  headerAction: { padding: 4 },

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
  cardBody: { flex: 1, gap: 3 },
  cardName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  cardLocation: { fontSize: 11, color: colors.textMuted },
  cardMeta: { fontSize: 11, color: '#111827' },
  cardPrice: {
    fontSize: 14,
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

  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
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