import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TourGuide } from '@gearup/shared';
import { colors } from '../theme';

interface Props {
  guide: TourGuide;
  onPress: () => void;
}

export function GuideCard({ guide, onPress }: Props) {
  const price = parseFloat(guide.price_per_trip);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Image / placeholder */}
      <View style={styles.imageWrap}>
        {guide.campsite?.image_url ? (
          <Image
            source={{ uri: guide.campsite.image_url }}
            style={styles.image}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageEmoji}>🧭</Text>
          </View>
        )}

        {guide.is_independent && (
          <View style={styles.independentBadge}>
            <Text style={styles.independentText}>INDEPENDENT</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {guide.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={1}>
              {guide.name}
            </Text>
            <Text style={styles.location} numberOfLines={1}>
              {guide.campsite
                ? `at ${guide.campsite.name}`
                : guide.location ?? 'Independent guide'}
            </Text>
          </View>
        </View>

        {guide.description && (
          <Text style={styles.description} numberOfLines={2}>
            {guide.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View>
            <Text style={styles.rateLabel}>RATE</Text>
            <Text style={styles.rateValue}>
              {price > 0 ? `₱${price.toFixed(0)}` : 'Contact'}
            </Text>
            <Text style={styles.rateUnit}>per trip</Text>
          </View>
          <View style={styles.viewRow}>
            <Text style={styles.viewText}>View</Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={colors.gearupGreen}
            />
          </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  imageWrap: { height: 140, position: 'relative' },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gearup50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageEmoji: { fontSize: 56 },
  independentBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  independentText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  body: { padding: 14, gap: 10 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gearupGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  headerText: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800', color: '#111827' },
  location: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  description: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 17,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  rateLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: 0.5,
  },
  rateValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.gearupGreen,
    marginTop: 2,
  },
  rateUnit: { fontSize: 10, color: colors.textMuted },

  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gearupGreen,
  },
});