import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { campsites, hasToken } from '../../lib/api';
import type { Campsite } from '@gearup/shared';
import { colors } from '../../theme';

export default function CampsiteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [campsite, setCampsite] = useState<Campsite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    (async () => {
      // Check auth state in parallel with the fetch
      const loggedIn = await hasToken();
      setIsGuest(!loggedIn);

      try {
        const res = await campsites.get(id);
        setCampsite(res.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ??
            err.message ??
            'Could not load this campsite.',
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleBook = () => {
    if (isGuest) {
      router.push('/login');
      return;
    }
    Alert.alert(
      'Booking',
      'Booking flow coming soon. This will create a reservation.',
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  if (error || !campsite) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning-outline" size={56} color={colors.textMuted} />
        <Text style={styles.errorText}>{error || 'Campsite not found.'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero image */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: campsite.image_url }} style={styles.hero} />

          {/* Back button (absolute) */}
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Featured badge */}
          {campsite.is_featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>★ Featured</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.body}>
          <Text style={styles.name}>{campsite.name}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={colors.textMuted} />
            <Text style={styles.metaText}>{campsite.location}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={styles.metaTextBold}>{campsite.rating}</Text>
            <Text style={styles.metaText}>({campsite.reviews_count} reviews)</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={16} color={colors.textMuted} />
            <Text style={styles.metaText}>
              Up to {campsite.capacity} people
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About this campsite</Text>
          <Text style={styles.description}>{campsite.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Region</Text>
          <Text style={styles.description}>{campsite.region}</Text>
        </View>
      </ScrollView>

      {/* Sticky booking footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.price}>₱{campsite.price_per_night}</Text>
          <Text style={styles.priceUnit}>per {campsite.price_unit}</Text>
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBook}
          activeOpacity={0.85}
        >
          <Text style={styles.bookButtonText}>
            {isGuest ? 'Sign in to Book' : 'Book Now'}
          </Text>
        </TouchableOpacity>
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

  // Hero
  heroWrap: { position: 'relative' },
  hero: {
    width: '100%',
    height: 300,
    backgroundColor: '#e5e7eb',
  },
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
  featuredBadge: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  featuredText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Body
  body: { padding: 20, gap: 10 },
  name: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: { fontSize: 13, color: colors.textMuted },
  metaTextBold: { fontSize: 13, color: '#111827', fontWeight: '700' },

  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 14,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },

  // Footer
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.gearupGreen,
  },
  priceUnit: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});