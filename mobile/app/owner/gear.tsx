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
import { owner } from '../../lib/api';
import { OwnerHeader } from '../../components/owner/OwnerHeader';
import type { GearItem } from '@gearup/shared';
import { DeleteGearButton } from '../../components/owner/DeleteGearButton';
import { colors } from '../../theme';

export default function OwnerGearScreen() {
  const router = useRouter();
  const [gear, setGear] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await owner.listGear();
      setGear(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(gear.length === 0);
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <View style={styles.container}>
      <OwnerHeader
        title="My Gear"
        rightAction={{
          icon: 'add',
          onPress: () => router.push('/owner/gear/new'),
        }}
      />

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      ) : (
        <FlatList
          data={gear}
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
              <Text style={styles.emptyTitle}>No gear listed yet</Text>
              <Text style={styles.emptySubtitle}>
                Add gear items that customers can rent from you.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/owner/gear/new')}
              >
                <Text style={styles.primaryButtonText}>
                  Add your first gear item
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
                  <View style={[styles.cardImage, styles.cardImageFallback]} />
                )}
                <View style={styles.cardBody}>
                  <View style={styles.nameRow}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {!item.is_available && (
                      <View style={styles.unavailablePill}>
                        <Text style={styles.unavailableText}>
                          UNAVAILABLE
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardCategory} numberOfLines={1}>
                    {item.category}
                  </Text>
                  {item.description && (
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  <Text style={styles.cardPrice}>
                    PHP {item.price_per_day} / day - Stock: {item.stock}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.cardActionSecondary}
                  onPress={() => router.push(`/gear-rental/${item.id}`)}
                >
                  <Text style={styles.cardActionSecondaryText}>
                    View public
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cardActionPrimary}
                  onPress={() => router.push(`/owner/gear/${item.id}/edit`)}
                >
                  <Text style={styles.cardActionPrimaryText}>Edit</Text>
                </TouchableOpacity>
                <DeleteGearButton
                  gearId={item.id}
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
  cardImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gearup50,
  },
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
  unavailablePill: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unavailableText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 0.3,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gearupGreen,
  },
  cardDescription: { fontSize: 11, color: colors.textMuted, lineHeight: 15 },
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