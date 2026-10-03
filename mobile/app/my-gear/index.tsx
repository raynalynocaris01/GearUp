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
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { myGear, hasToken } from '../../lib/api';
import type { GearItem } from '@gearup/shared';
import { colors } from '../../theme';

export default function MyGearScreen() {
  const router = useRouter();
  const [items, setItems] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggedIn, setLoggedIn] = useState(true);

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const isAuth = await hasToken();
      setLoggedIn(isAuth);
      if (!isAuth) {
        setItems([]);
        return;
      }
      const res = await myGear.list();
      setItems(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(items.length === 0);
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleDelete = (item: GearItem) => {
    Alert.alert(
      'Delete gear?',
      `Are you sure you want to remove "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await myGear.remove(item.id);
              await load();
            } catch (err: any) {
              Alert.alert(
                'Delete failed',
                err?.response?.data?.message ?? 'Something went wrong.',
              );
            }
          },
        },
      ],
    );
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
        <Text style={styles.emptyTitle}>Log in to manage gear</Text>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Gear</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => router.push('/my-gear/bookings' as any)}
            style={styles.rentalsBtn}
          >
            <Ionicons name="cube-outline" size={20} color={colors.gearupGreen} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/my-gear/new' as any)}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={items}
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
              name="bag-handle-outline"
              size={48}
              color={colors.textMuted}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.emptyTitle}>No gear listed yet</Text>
            <Text style={styles.emptySubtitle}>
              List your first item and start renting to campers.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/my-gear/new' as any)}
            >
              <Text style={styles.primaryBtnText}>Add gear</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.thumb}>
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.thumbImg}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons
                    name="image-outline"
                    size={24}
                    color={colors.textMuted}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {item.category.toUpperCase()}
                    </Text>
                  </View>
                  {!item.is_available && (
                    <View style={styles.unavailableBadge}>
                      <Text style={styles.unavailableText}>UNAVAILABLE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.description ? (
                  <Text style={styles.cardDesc} numberOfLines={1}>
                    {item.description}
                  </Text>
                ) : null}
                <Text style={styles.price}>
                  PHP {item.price_per_day} / day
                </Text>
                <Text style={styles.stock}>Stock: {item.stock}</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() =>
                  router.push(`/my-gear/${item.id}/edit` as any)
                }
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
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
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gearupGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: '#f3f4f6',
  },
  categoryText: { fontSize: 9, fontWeight: '800', color: '#374151', letterSpacing: 0.4 },
  unavailableBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: '#fee2e2',
  },
  unavailableText: { fontSize: 9, fontWeight: '800', color: '#b91c1c', letterSpacing: 0.4 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  cardDesc: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: 14, fontWeight: '800', color: colors.gearupGreen, marginTop: 4 },
  stock: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    justifyContent: 'flex-end',
  },
  editBtn: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editBtnText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  deleteBtn: {
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteBtnText: { fontSize: 12, fontWeight: '700', color: '#b91c1c' },
  primaryBtn: {
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    rentalsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});