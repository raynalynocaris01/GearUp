import { View, Text, StyleSheet } from 'react-native';
import type { Review } from '@gearup/shared';
import { StarRating } from './StarRating';
import { colors } from '../theme';

interface Props {
  reviews: Review[];
  rating: string;
  reviewsCount: number;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ReviewsSection({ reviews, rating, reviewsCount }: Props) {
  const numericRating = parseFloat(rating) || 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reviews</Text>

      {reviewsCount > 0 ? (
        <View style={styles.summaryRow}>
          <StarRating rating={numericRating} size={18} showValue />
          <Text style={styles.summaryText}>
            Based on {reviewsCount}{' '}
            {reviewsCount === 1 ? 'review' : 'reviews'}
          </Text>
        </View>
      ) : (
        <Text style={styles.emptyText}>No reviews yet.</Text>
      )}

      {reviews.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyText}>
            Be the first to review this campsite after your stay.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {reviews.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {r.user?.name.charAt(0).toUpperCase() ?? '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <View>
                      <Text style={styles.name}>
                        {r.user?.name ?? 'Anonymous'}
                      </Text>
                      <Text style={styles.date}>
                        {formatDate(r.created_at)}
                      </Text>
                    </View>
                    <StarRating rating={r.rating} size={12} />
                  </View>
                  {r.comment && (
                    <Text style={styles.comment}>{r.comment}</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  summaryText: { fontSize: 13, color: colors.textMuted },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderStyle: 'dashed',
    padding: 28,
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  emptyEmoji: { fontSize: 32 },
  list: { gap: 12, marginTop: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
  },
  row: { flexDirection: 'row', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gearupGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: { fontSize: 14, fontWeight: '800', color: '#111827' },
  date: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  comment: {
    fontSize: 13,
    color: '#374151',
    marginTop: 8,
    lineHeight: 19,
  },
});