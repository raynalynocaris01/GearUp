import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { campsites } from '../../lib/api';
import type { Campsite } from '@gearup/shared';
import { colors } from '../../theme';

export default function ExploreScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [list, setList] = useState<Campsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadCampsites = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const res = await campsites.list();
      setList(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          err.message ??
          'Could not load campsites.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCampsites(list.length === 0);
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadCampsites();
  };

  return (
    <View style={styles.container}>
      {/* App bar */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Explore</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search campsites, destinations…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
          <Text style={styles.centerText}>Loading campsites…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Ionicons name="warning-outline" size={40} color={colors.textMuted} />
          <Text style={styles.centerText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadCampsites(true)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={list}
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
            <View style={styles.centerBox}>
              <Ionicons name="leaf-outline" size={40} color={colors.textMuted} />
              <Text style={styles.centerText}>No campsites yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.campsiteCard}
              onPress={() => router.push(`/campsite/${item.id}`)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: item.image_url }}
                style={styles.campsiteImage}
              />
              <View style={styles.campsiteBody}>
                <Text style={styles.campsiteName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.campsiteMeta}>
                  <Ionicons
                    name="location-outline"
                    size={12}
                    color={colors.textMuted}
                  />
                  <Text style={styles.campsiteLocation} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>
                <View style={styles.campsiteMeta}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.campsiteRating}>
                    {item.rating} ({item.reviews_count})
                  </Text>
                </View>
                <Text style={styles.campsitePrice}>
                  ₱{item.price_per_night} / {item.price_unit}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },

  appBar: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  appBarTitle: { fontSize: 28, fontWeight: '900', color: '#111827' },

  searchWrap: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 10,
  },

  listContent: { padding: 16, gap: 12 },
  campsiteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  campsiteImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  campsiteBody: { flex: 1, gap: 3 },
  campsiteName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  campsiteMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  campsiteLocation: { fontSize: 11, color: colors.textMuted, flex: 1 },
  campsiteRating: { fontSize: 11, color: '#111827', fontWeight: '600' },
  campsitePrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gearupGreen,
    marginTop: 3,
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  centerText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.gearupGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: colors.gearupGreen,
    fontSize: 13,
    fontWeight: '700',
  },
});