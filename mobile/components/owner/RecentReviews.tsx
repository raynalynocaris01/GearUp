import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Review } from '@gearup/shared';
import { colors } from '../../theme';

interface Props {
  reviews: Review[];
  limit?: number;
}

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

export function RecentReviews({ reviews, limit }: Props) {
  const router = useRouter();
  const visible =
    typeof limit === 'number' ? reviews.slice(0, limit) : reviews;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
        <TouchableOpacity
          onPress={() => router.push('/owner/reviews')}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      {visible.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={26}
            color={colors.textMuted}
          />
          <Text style={styles.emptyText}>No reviews yet</Text>
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
                <Text style={styles.comment} numberOfLines={2}>
                  {r.comment}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gearupGreen,
  },

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
  starRow: {
    flexDirection: 'row',
    gap: 1,
  },
  meta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  comment: {
    fontSize: 13,
    color: '#374151',
    marginTop: 10,
    lineHeight: 18,
  },

  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyText: { fontSize: 12, color: colors.textMuted },
});