import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

type Category = 'Campsite' | 'Gear Rental' | 'Tour Guide' | 'Event';

interface Props {
  category: Category;
  title: string;
  subtitle: string;
  imageUrl: string;
  priceLabel: string;
  rating?: number;
  reviewsCount?: number;
  onPress: () => void;
}

const CATEGORY_STYLES: Record<
  Category,
  { bg: string; text: string }
> = {
  Campsite: { bg: '#16a34a', text: '#fff' },
  'Gear Rental': { bg: '#2563eb', text: '#fff' },
  'Tour Guide': { bg: '#ea580c', text: '#fff' },
  Event: { bg: '#9333ea', text: '#fff' },
};

export function FeaturedCard({
  category,
  title,
  subtitle,
  imageUrl,
  priceLabel,
  rating,
  reviewsCount,
  onPress,
}: Props) {
  const catStyle = CATEGORY_STYLES[category];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Image */}
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons name="image-outline" size={28} color="#9ca3af" />
          </View>
        )}

        {/* Category badge */}
        <View
          style={[styles.categoryBadge, { backgroundColor: catStyle.bg }]}
        >
          <Text style={styles.categoryText}>{category}</Text>
        </View>

        {/* Heart */}
        <View style={styles.heartButton}>
          <Ionicons name="heart-outline" size={16} color="#111827" />
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>

        {/* Rating (optional) */}
        {rating !== undefined && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color="#f59e0b" />
            <Text style={styles.ratingValue}>
              {Number(rating).toFixed(1)}
            </Text>
            {reviewsCount !== undefined && (
              <Text style={styles.reviewsCount}>({reviewsCount})</Text>
            )}
          </View>
        )}

        <Text style={styles.price} numberOfLines={1}>
          {priceLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  imageWrap: {
    position: 'relative',
    height: 120,
    backgroundColor: '#e5e7eb',
  },
    image: { width: '100%', height: 160, backgroundColor: '#e5e7eb' },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 10, gap: 2 },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  ratingValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  reviewsCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  price: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gearupGreen,
    marginTop: 6,
  },
});