import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { campsites } from '../../lib/api';
import type { Campsite } from '@gearup/shared';
import { colors } from '../../theme';

const FEATURES = [
  {
    icon: 'bed-outline',
    label: 'Book Campsites',
    desc: 'Find the place to stay',
    color: '#1e6b3a',
  },
  {
    icon: 'bag-handle-outline',
    label: 'Rent Gear',
    desc: 'Quality gear for your adventure',
    color: '#2563eb',
  },
  {
    icon: 'person-outline',
    label: 'Hire Tour Guide',
    desc: 'Local guides, better experiences',
    color: '#ea580c',
  },
  {
    icon: 'calendar-outline',
    label: 'Join Events',
    desc: 'Meet up and join adventures',
    color: '#4b5563',
  },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [campsiteList, setCampsiteList] = useState<Campsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadCampsites = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const res = await campsites.list({ featured: true });
      setCampsiteList(res.data);
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

  // Fetch once on mount
  useEffect(() => {
    loadCampsites(true);
  }, []);

  // Refresh each time the Home tab gains focus (e.g., after login)
  useFocusEffect(
    useCallback(() => {
      loadCampsites();
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadCampsites();
  };

  const handleComingSoon = () => {
    Alert.alert('Coming soon', 'This feature is being built.');
  };

  const openCampsite = (id: number) => {
    router.push(`/campsite/${id}`);
  };

  return (
    <View style={styles.container}>
      {/* TOP APP BAR */}
      <View style={styles.appBar}>
        <View style={styles.brand}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.brandIcon}
            resizeMode="contain"
          />
          <Text style={styles.brandText}>
            <Text style={styles.brandDark}>Gear</Text>
            <Text style={styles.brandGreen}>Up</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={handleComingSoon}>
          <Ionicons name="notifications-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

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
        {/* HERO BANNER */}
        <View style={styles.hero}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              EXPLORE.{'\n'}CAMP.{'\n'}
              <Text style={styles.heroAccent}>ADVENTURE.</Text>
            </Text>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search destinations, campsites, rent gears"
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleComingSoon}
              >
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* FEATURE GRID */}
        <View style={styles.section}>
          <View style={styles.featureGrid}>
            {FEATURES.map((f) => (
              <TouchableOpacity
                key={f.label}
                style={styles.featureCard}
                onPress={handleComingSoon}
                activeOpacity={0.85}
              >
                <View style={styles.featureIconWrap}>
                  <Ionicons name={f.icon as any} size={30} color={f.color} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* POPULAR CAMPSITES — live from API */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Campsites</Text>
            <TouchableOpacity onPress={handleComingSoon}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

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
          ) : campsiteList.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons name="leaf-outline" size={40} color={colors.textMuted} />
              <Text style={styles.centerText}>No campsites available yet.</Text>
            </View>
          ) : (
            <View style={styles.campsiteList}>
              {campsiteList.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.campsiteCard}
                  onPress={() => openCampsite(c.id)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: c.image_url }}
                    style={styles.campsiteImage}
                  />
                  <View style={styles.campsiteBody}>
                    <Text style={styles.campsiteName} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <View style={styles.campsiteMeta}>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color={colors.textMuted}
                      />
                      <Text style={styles.campsiteLocation} numberOfLines={1}>
                        {c.location}
                      </Text>
                    </View>
                    <View style={styles.campsiteMeta}>
                      <Ionicons name="star" size={12} color="#f59e0b" />
                      <Text style={styles.campsiteRating}>
                        {c.rating} ({c.reviews_count})
                      </Text>
                    </View>
                    <Text style={styles.campsitePrice}>
                      ₱{c.price_per_night} / {c.price_unit}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.heartButton}
                    onPress={handleComingSoon}
                  >
                    <Ionicons name="heart-outline" size={20} color="#111827" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* BOTTOM CTA */}
        <View style={styles.section}>
          <View style={styles.cta}>
            <Text style={styles.ctaTitle}>
              Plan your next{'\n'}adventure today!
            </Text>
            <Text style={styles.ctaSubtitle}>
              Everything you need for unforgettable trips is here!
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleComingSoon}
            >
              <Text style={styles.ctaButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Top app bar
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandIcon: { width: 32, height: 32 },
  brandText: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  brandDark: { color: '#111827' },
  brandGreen: { color: colors.gearupGreen },
  iconButton: { padding: 8 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  // Hero
  hero: {
    height: 260,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0f3d20',
    justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroContent: { padding: 20, gap: 16 },
  heroTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  heroAccent: { color: colors.gearupGreenLight },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#111827', paddingVertical: 8 },
  searchButton: {
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Sections
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  sectionLink: { fontSize: 13, color: colors.gearupGreen, fontWeight: '700' },

  // Feature grid — 2 columns
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },

  // Campsites list
  campsiteList: { gap: 12 },
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
  heartButton: {
    padding: 6,
    alignSelf: 'flex-start',
  },

  // Loading / empty states
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  centerText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
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

  // CTA
  cta: {
    backgroundColor: '#0f3d20',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  ctaTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  ctaSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  ctaButton: {
    backgroundColor: colors.gearupGreen,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});