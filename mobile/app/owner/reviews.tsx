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
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { owner } from '../../lib/api';
import type { Review } from '@gearup/shared';
import { OwnerHeader } from '../../components/owner/OwnerHeader';
import { colors } from '../../theme';

type FilterKey = 'all' | '5' | '4' | '3' | 'low';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: '5', label: '5' },
  { key: '4', label: '4' },
  { key: '3', label: '3' },
  { key: 'low', label: 'Below 3' },
];

function StarRow({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= rounded ? 'star' : 'star-outline'}
          size={12}
          color="#f59e0b"
        />
      ))}
    </View>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function matches(review: Review, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'low') return review.rating < 3;
  return review.rating === Number(filter);
}

export default function OwnerReviewsScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await owner.listReviews(200);
      setReviews(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(!reviews.length);
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const counts: Record<FilterKey, number> = {
    all: reviews.length,
    '5': reviews.filter((r) => r.rating === 5).length,
    '4': reviews.filter((r) => r.rating === 4).length,
    '3': reviews.filter((r) => r.rating === 3).length,
    low: reviews.filter((r) => r.rating < 3).length,
  };

  const visible = reviews.filter((r) => matches(r, filter));

  return (
    <View style={styles.container}>
      <OwnerHeader title="Reviews" />

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
        <Text style={styles.subtitle}>
          See what campers are saying about your campsites.
        </Text>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.85}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {f.label}
                </Text>
                <Text
                  style={[styles.chipCount, active && styles.chipCountActive]}
                >
                  {counts[f.key]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.gearupGreen} />
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="star-outline" size={28} color="#f59e0b" />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'all'
                ? 'No reviews yet'
                : 'No reviews in this filter'}
            </Text>
            <Text style={styles.emptyBody}>
              {filter === 'all'
                ? 'Campers reviews will appear here once they start leaving feedback.'
                : 'Try a different rating filter to see more reviews.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visible.map((r) => (
              <View key={r.id} style={styles.card}>
                <View style={styles.topRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(r.user?.name ?? '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameLine}>
                      <Text style={styles.name} numberOfLines={1}>
                        {r.user?.name ?? 'Anonymous'}
                      </Text>
                      <StarRow rating={r.rating} />
                    </View>
                    <Text style={styles.meta} numberOfLines={1}>
                      {r.campsite?.name ? `on ${r.campsite.name} · ` : ''}
                      {formatDate(r.created_at)}
                    </Text>
                  </View>
                </View>

                {r.comment ? (
                  <Text style={styles.comment}>{r.comment}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
  },

  chipsRow: { gap: 8, paddingBottom: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: colors.gearupGreen,
    borderColor: colors.gearupGreen,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  chipTextActive: { color: '#fff' },
  chipCount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9ca3af',
  },
  chipCountActive: { color: 'rgba(255,255,255,0.85)' },

  centerBox: { paddingVertical: 60, alignItems: 'center' },

  list: { gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
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
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    flexShrink: 1,
  },
  starRow: { flexDirection: 'row', gap: 1 },
  meta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  comment: {
    fontSize: 13,
    color: '#374151',
    marginTop: 12,
    lineHeight: 19,
  },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#e5e7eb',
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});