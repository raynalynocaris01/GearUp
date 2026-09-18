import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

// Placeholder data — will be replaced with API calls later
const FEATURES = [
  { icon: 'bed-outline', label: 'Book Campsites', desc: 'Find the place to stay' },
  { icon: 'bag-handle-outline', label: 'Rent Gear', desc: 'Quality gear for your adventure' },
  { icon: 'person-outline', label: 'Hire Tour Guide', desc: 'Local guides, better experiences' },
  { icon: 'calendar-outline', label: 'Join Events', desc: 'Meet up and join adventures' },
  { icon: 'cart-outline', label: 'Buy Essentials', desc: 'Shop camping must-haves' },
  { icon: 'map-outline', label: 'Plan Trips', desc: 'Organize your adventure' },
] as const;

const DESTINATIONS = [
  {
    id: 1,
    name: 'Grandi Vista Campsite',
    location: 'Apolong, Valencia',
    rating: 4.5,
    reviews: 128,
    price: '₱120 / night',
    image: 'https://picsum.photos/seed/camp1/400/300',
  },
  {
    id: 2,
    name: 'Mt. Talinis',
    location: 'Valencia, Negros Oriental',
    rating: 4.8,
    reviews: 250,
    price: '₱200 / night',
    image: 'https://picsum.photos/seed/camp2/400/300',
  },
  {
    id: 3,
    name: 'Pulangbato Falls',
    location: 'Valencia, Negros Oriental',
    rating: 4.6,
    reviews: 194,
    price: '₱200 / entrance',
    image: 'https://picsum.photos/seed/camp3/400/300',
  },
];

export default function HomeScreen() {
  const [search, setSearch] = useState('');

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
        <View style={styles.appBarActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="menu-outline" size={26} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
              <Ionicons name="location-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Where do you want to go?"
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              <TouchableOpacity style={styles.searchButton}>
                <Text style={styles.searchButtonText}>Explore Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* FEATURE GRID */}
        <View style={styles.section}>
          <View style={styles.featureGrid}>
            {FEATURES.map((f) => (
              <TouchableOpacity key={f.label} style={styles.featureCard}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={f.icon as any} size={26} color={colors.gearupGreen} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* POPULAR DESTINATIONS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Destination</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.destinationsRow}
          >
            {DESTINATIONS.map((d) => (
              <TouchableOpacity key={d.id} style={styles.destinationCard}>
                <Image source={{ uri: d.image }} style={styles.destinationImage} />
                <View style={styles.destinationBody}>
                  <Text style={styles.destinationName} numberOfLines={1}>
                    {d.name}
                  </Text>
                  <View style={styles.destinationMeta}>
                    <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.destinationLocation} numberOfLines={1}>
                      {d.location}
                    </Text>
                  </View>
                  <View style={styles.destinationMeta}>
                    <Ionicons name="star" size={12} color="#f59e0b" />
                    <Text style={styles.destinationRating}>
                      {d.rating} ({d.reviews})
                    </Text>
                  </View>
                  <Text style={styles.destinationPrice}>{d.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
            <TouchableOpacity style={styles.ctaButton}>
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
  appBarActions: { flexDirection: 'row', gap: 4 },
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

  // Feature grid
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gearup50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 12,
  },

  // Destinations
  destinationsRow: { gap: 12, paddingRight: 16 },
  destinationCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  destinationImage: { width: '100%', height: 110 },
  destinationBody: { padding: 10, gap: 3 },
  destinationName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  destinationMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  destinationLocation: { fontSize: 10, color: colors.textMuted, flex: 1 },
  destinationRating: { fontSize: 10, color: '#111827', fontWeight: '600' },
  destinationPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.gearupGreen,
    marginTop: 4,
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