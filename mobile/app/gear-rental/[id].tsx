import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { gear } from '../../lib/api';
import type { GearItem } from '@gearup/shared';
import { colors } from '../../theme';
import { imgSrc } from '../../lib/images';

export default function GearDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [item, setItem] = useState<GearItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await gear.get(id);
        setItem(res.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ??
            err.message ??
            'Could not load this gear item.',
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning-outline" size={56} color={colors.textMuted} />
        <Text style={styles.errorText}>{error || 'Gear item not found.'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const price = parseFloat(item.price_per_day);
  const available = item.is_available && item.stock > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Hero */}
        <View style={styles.heroWrap}>
          {item.image_url ? (
            <Image source={{ uri: imgSrc(item.image_url) }} style={styles.hero} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroEmoji}>🎒</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>

          {!available && (
            <View style={styles.unavailableBadge}>
              <Text style={styles.unavailableText}>UNAVAILABLE</Text>
            </View>
          )}
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.name}>{item.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons
                name="cube-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.metaText}>
                {item.stock} in stock
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons
                name="pricetag-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.metaText}>{item.category}</Text>
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this gear</Text>
            <Text style={styles.paragraph}>
              {item.description ?? 'No description provided.'}
            </Text>
          </View>

          {/* Owner */}
          {item.owner && (
            <View style={styles.ownerCard}>
              <Text style={styles.ownerLabel}>PROVIDED BY</Text>
              <Text style={styles.ownerName}>{item.owner.name}</Text>
              <Text style={styles.ownerEmail}>{item.owner.email}</Text>
            </View>
          )}

          {/* Rate */}
          <View style={styles.rateCard}>
            <Text style={styles.rateLabel}>RATE</Text>
            <Text style={styles.rateValue}>
              {price > 0 ? `₱${price.toFixed(0)}` : 'Free'}
            </Text>
            <Text style={styles.rateUnit}>per day</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View style={styles.ctaWrap}>
        <View style={styles.ctaInfo}>
          <Text style={styles.ctaPrice}>₱{price.toFixed(0)}</Text>
          <Text style={styles.ctaPriceUnit}>per day</Text>
        </View>
        {available ? (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push(`/gear-rental/${item.id}/book`)}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaButtonText}>Rent this Gear</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.ctaButton, styles.ctaDisabled]}>
            <Text style={styles.ctaDisabledText}>Unavailable</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.gearupGreen,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    color: colors.gearupGreen,
    fontSize: 14,
    fontWeight: '700',
  },

  heroWrap: { position: 'relative' },
  hero: { width: '100%', height: 300, backgroundColor: '#e5e7eb' },
  heroPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: colors.gearup50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 100 },
  backIcon: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 50,
    left: 68,
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  unavailableBadge: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  unavailableText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  body: { padding: 20, gap: 8 },
  name: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: colors.textMuted },

  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  paragraph: { fontSize: 14, color: '#374151', lineHeight: 21 },

  ownerCard: {
    marginTop: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  ownerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  ownerEmail: { fontSize: 12, color: colors.textMuted },

  rateCard: {
    marginTop: 20,
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 20,
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 1,
  },
  rateValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#14532d',
    marginTop: 4,
  },
  rateUnit: { fontSize: 12, color: '#166534', marginTop: 2 },

  ctaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 16,
  },
  ctaInfo: {},
  ctaPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.gearupGreen,
  },
  ctaPriceUnit: { fontSize: 11, color: colors.textMuted },
  ctaButton: {
    flex: 1,
    backgroundColor: colors.gearupGreen,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  ctaDisabled: { backgroundColor: '#e5e7eb' },
  ctaDisabledText: { color: '#9ca3af', fontSize: 14, fontWeight: '800' },
});