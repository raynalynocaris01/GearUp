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
import { admin } from '../../lib/api';
import type { Campsite } from '@gearup/shared';
import { CampsiteActions } from '../../components/admin/CampsiteActions';
import { colors } from '../../theme';

export default function AdminCampsitesScreen() {
  const router = useRouter();
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await admin.listCampsites();
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campsites</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
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
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>⛺</Text>
              <Text style={styles.emptyTitle}>No campsites yet</Text>
              <Text style={styles.emptySubtitle}>
                Once owners post campsites, they'll appear here.
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
                {item.is_featured && (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredText}>★ FEATURED</Text>
                  </View>
                )}
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cardLocation} numberOfLines={1}>
                  📍 {item.location}
                </Text>
                <Text style={styles.cardMeta}>
                  <Text style={{ color: '#f59e0b' }}>★</Text>{' '}
                  {item.rating} ({item.reviews_count}) · Up to {item.capacity}
                </Text>
                <Text style={styles.cardPrice}>
                  ₱{item.price_per_night} / {item.price_unit}
                </Text>

                <View style={styles.actionsRow}>
                  <CampsiteActions
                    campsiteId={item.id}
                    name={item.name}
                    isFeatured={item.is_featured}
                    onSuccess={() => load()}
                  />
                </View>
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
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginBottom: 6,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#92400e',
  },
  cardName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  cardLocation: { fontSize: 11, color: colors.textMuted },
  cardMeta: { fontSize: 11, color: '#111827' },
  cardPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.gearupGreen,
    marginTop: 4,
  },
  actionsRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'flex-end',
  },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});