import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tourGuides } from '../../lib/api';
import type { TourGuide } from '@gearup/shared';
import { colors } from '../../theme';

export default function TourGuideDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [guide, setGuide] = useState<TourGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await tourGuides.get(id);
        setGuide(res.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ??
            err.message ??
            'Could not load this guide.',
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleCall = () => {
    if (guide?.contact_number) {
      Linking.openURL(`tel:${guide.contact_number}`);
    }
  };

  const handleEmail = () => {
    if (guide?.email) {
      Linking.openURL(`mailto:${guide.email}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  if (error || !guide) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning-outline" size={56} color={colors.textMuted} />
        <Text style={styles.errorText}>{error || 'Guide not found.'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const price = parseFloat(guide.price_per_trip);
  const heroImage = guide.campsite?.image_url;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero */}
        <View style={styles.heroWrap}>
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={styles.hero} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroEmoji}>🧭</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          {guide.is_independent && (
            <View style={styles.independentBadge}>
              <Text style={styles.independentText}>INDEPENDENT GUIDE</Text>
            </View>
          )}
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Name + avatar */}
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {guide.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{guide.name}</Text>
              <Text style={styles.subtitle}>
                {guide.campsite
                  ? `Guide at ${guide.campsite.name}`
                  : guide.location ?? 'Independent guide'}
              </Text>
            </View>
          </View>

          {/* About */}
          {guide.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.paragraph}>{guide.description}</Text>
            </View>
          )}

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>

            <TouchableOpacity
              style={styles.contactRow}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <Text style={styles.contactEmoji}>📞</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>
                  {guide.contact_number}
                </Text>
              </View>
              <Text style={styles.contactAction}>Call →</Text>
            </TouchableOpacity>

            {guide.email && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={handleEmail}
                activeOpacity={0.7}
              >
                <Text style={styles.contactEmoji}>✉️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text
                    style={styles.contactValue}
                    numberOfLines={1}
                  >
                    {guide.email}
                  </Text>
                </View>
                <Text style={styles.contactAction}>Email →</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Linked campsite */}
          {guide.campsite && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Works at</Text>
              <TouchableOpacity
                style={styles.campsiteRow}
                onPress={() =>
                  router.push(`/campsite/${guide.campsite!.id}`)
                }
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: guide.campsite.image_url }}
                  style={styles.campsiteImage}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.campsiteLabel}>CAMPSITE</Text>
                  <Text style={styles.campsiteName} numberOfLines={1}>
                    {guide.campsite.name}
                  </Text>
                  <Text style={styles.campsiteLocation} numberOfLines={1}>
                    📍 {guide.campsite.location}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.gearupGreen}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Rate */}
          <View style={styles.rateCard}>
            <Text style={styles.rateLabel}>RATE</Text>
            <Text style={styles.rateValue}>
              {price > 0 ? `₱${price.toFixed(0)}` : 'Contact for pricing'}
            </Text>
            {price > 0 && (
              <Text style={styles.rateUnit}>per trip</Text>
            )}
          </View>
        </View>
      </ScrollView>
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
  hero: { width: '100%', height: 280, backgroundColor: '#e5e7eb' },
  heroPlaceholder: {
    width: '100%',
    height: 280,
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
  independentBadge: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  independentText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  body: { padding: 20, gap: 8 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.gearupGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.4,
  },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  paragraph: { fontSize: 14, color: '#374151', lineHeight: 21 },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  contactEmoji: { fontSize: 22 },
  contactLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  contactAction: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gearupGreen,
  },

  campsiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 10,
  },
  campsiteImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  campsiteLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: 0.5,
  },
  campsiteName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  campsiteLocation: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },

  rateCard: {
    marginTop: 24,
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
  rateUnit: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
  },
});