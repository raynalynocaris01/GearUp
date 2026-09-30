import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { GearItem } from '@gearup/shared';
import { colors } from '../theme';

interface Props {
  gear: GearItem;
  onPress: () => void;
}

export function GearCard({ gear, onPress }: Props) {
  const price = parseFloat(gear.price_per_day);
  const available = gear.is_available && gear.stock > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Image */}
      <View style={styles.imageWrap}>
        {gear.image_url ? (
          <Image source={{ uri: gear.image_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageEmoji}>🎒</Text>
          </View>
        )}
        {!available && (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableText}>UNAVAILABLE</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.pillRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{gear.category}</Text>
          </View>
          <Text style={styles.stockText}>{gear.stock} in stock</Text>
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {gear.name}
        </Text>

        {gear.description && (
          <Text style={styles.description} numberOfLines={2}>
            {gear.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>
              {price > 0 ? `₱${price.toFixed(0)}` : 'Free'}
            </Text>
            <Text style={styles.priceUnit}>per day</Text>
          </View>
          {gear.owner && (
            <Text style={styles.ownerText} numberOfLines={1}>
              by {gear.owner.name}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 160, backgroundColor: '#e5e7eb' },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.gearup50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageEmoji: { fontSize: 60 },
  unavailableBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unavailableText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  body: { padding: 12, gap: 6 },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryPill: {
    backgroundColor: colors.gearup50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.gearupGreen,
    letterSpacing: 0.3,
  },
  stockText: { fontSize: 11, color: colors.textMuted },

  name: { fontSize: 15, fontWeight: '800', color: '#111827' },
  description: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },

  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  price: { fontSize: 18, fontWeight: '900', color: colors.gearupGreen },
  priceUnit: { fontSize: 10, color: colors.textMuted },
  ownerText: {
    fontSize: 11,
    color: colors.textMuted,
    maxWidth: 120,
    textAlign: 'right',
  },
});
