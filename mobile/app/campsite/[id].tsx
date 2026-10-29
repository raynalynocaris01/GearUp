import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,      
  Platform, 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { campsites, bookings, hasToken, gear } from '../../lib/api';
import type { Campsite, GearItem } from '@gearup/shared';
import { colors } from '../../theme';
import { ReviewsSection } from '../../components/ReviewsSection';
import { imgSrc } from '../../lib/images';

export default function CampsiteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [campsite, setCampsite] = useState<Campsite | null>(null);
  const [providedGear, setProvidedGear] = useState<GearItem[]>([]);
  const [eligibleBookingId, setEligibleBookingId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const { width: windowWidth } = useWindowDimensions();
  const [error, setError] = useState('');
  const [isGuest, setIsGuest] = useState(true);
  const openDirections = () => {
  if (!campsite) return;

  const { name, location, region, latitude, longitude } = campsite;

  // Prefer searching by name + address so Google Maps shows the real
  // place card. Fall back to coordinates if name/address are missing.
  const query =
    name && location
      ? encodeURIComponent(`${name}, ${location}, ${region}`)
      : latitude != null && longitude != null
        ? `${latitude},${longitude}`
        : encodeURIComponent(`${location}, ${region}`);

  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  Linking.openURL(url).catch(() => {});
};

  useEffect(() => {
    (async () => {
      const loggedIn = await hasToken();
      setIsGuest(!loggedIn);

      try {
        const res = await campsites.get(id);
        setCampsite(res.data);
        
        // Fetch provided gear for this campsite's owner
        if (res.data.owner_id) {
          try {
            const gearRes = await gear.list({ owner_id: res.data.owner_id });
            setProvidedGear(gearRes.data);
          } catch (gearErr) {
            console.warn('Failed to load gear', gearErr);
          }
        }
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

  // After the campsite loads, check for an eligible booking
  useEffect(() => {
    (async () => {
      const loggedIn = await hasToken();
      if (!loggedIn || !campsite) return;

      try {
        const res = await bookings.list();
        const eligible = res.data.find(
          (b: any) =>
            b.campsite_id === campsite.id &&
            b.status === 'completed' &&
            !b.review,
        );
        if (eligible) setEligibleBookingId(eligible.id);
      } catch {
        // silent
      }
    })();
  }, [campsite]);

  const handleBook = () => {
    if (isGuest) {
      router.push('/login');
      return;
    }
    if (!campsite) return;
    router.push(`/booking/new?campsiteId=${campsite.id}`);
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
  const galleryImages: string[] = (campsite.photos && campsite.photos.length > 0
    ? [...campsite.photos].sort((a, b) => a.sort_order - b.sort_order).map((p) => p.image_url)
    : [campsite.image_url]
  )
    .map((u) => imgSrc(u))
    .filter((u): u is string => !!u);


  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Photo gallery */}
        <View style={styles.heroWrap}>
          {galleryImages.length > 1 ? (
            <>
              <FlatList
                data={galleryImages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => String(i)}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
                  setActivePhoto(idx);
                }}
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={[styles.hero, { width: windowWidth }]} />
                )}
              />
              <View style={styles.dotsRow} pointerEvents="none">
                {galleryImages.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === activePhoto && styles.dotActive]}
                  />
                ))}
              </View>
            </>
          ) : (
            <Image source={{ uri: galleryImages[0] }} style={styles.hero} />
          )}

          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          {campsite.is_featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>{"\u2605"} Featured</Text>
            </View>
          )}
        </View>


        {/* Content */}
        <View style={styles.body}>
          {!campsite.is_available && (
            <View style={styles.closedBadge}>
              <Text style={styles.closedBadgeText}>TEMPORARILY CLOSED</Text>
            </View>
          )}
          <Text style={styles.name}>{campsite.name}</Text>

          <View style={styles.metaRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color={colors.textMuted}
            />
              <Text style={styles.metaText}>{campsite.location}</Text>
              </View>

              <TouchableOpacity
                style={styles.directionsButton}
                onPress={openDirections}
                activeOpacity={0.8}
              >
                <Ionicons name="navigate-outline" size={16} color="#15803d" />
                <Text style={styles.directionsButtonText}>Directions</Text>
              </TouchableOpacity>

          <View style={styles.metaRow}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={styles.metaTextBold}>{campsite.rating}</Text>
            <Text style={styles.metaText}>
              ({campsite.reviews_count} reviews)
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons
              name="people-outline"
              size={16}
              color={colors.textMuted}
            />
            <Text style={styles.metaText}>
              Up to {campsite.capacity} people
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About this campsite</Text>
          <Text style={styles.description}>{campsite.description}</Text>

          {/* Sibling listings (rooms, sub-campsites) */}
          {campsite.is_available &&
            campsite.children &&
            campsite.children.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>
                Also available at this location
              </Text>
              <View style={{ gap: 10, marginTop: 8 }}>
                {campsite.children.map((child) => (
                  <TouchableOpacity
                    key={child.id}
                    style={styles.siblingCard}
                    onPress={() =>
                      router.push(`/campsite/${child.id}` as any)
                    }
                    activeOpacity={0.85}
                  >
                    {child.image_url ? (
                      <Image
                        source={{ uri: imgSrc(child.image_url) }}
                        style={styles.siblingImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.siblingImage,
                          styles.siblingImageFallback,
                        ]}
                      />
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.siblingName} numberOfLines={1}>
                        {child.name}
                      </Text>
                      <Text style={styles.siblingLocation} numberOfLines={1}>
                        {child.location}
                      </Text>
                      <Text style={styles.siblingPrice}>
                        PHP {child.price_per_night} / {child.price_unit}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {(campsite.free_items ?? []).length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>What we provide for free</Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 8,
                }}
              >
                {(campsite.free_items ?? []).map((item, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: colors.gearup50,
                      borderWidth: 1,
                      borderColor: colors.gearupGreen,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                    }}
                  >
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.gearupGreen}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: colors.gearupGreen,
                      }}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Region</Text>
          <Text style={styles.description}>{campsite.region}</Text>

          {/* Provided Gear */}
          {providedGear.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Gear Provided by this Campsite</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {(providedGear.length > 3 ? providedGear.slice(0, 3) : providedGear).map((item) => {
                  const isFree = parseFloat(item.price_per_day) === 0;
                  return (
                    <View key={item.id} style={styles.gearCard}>
                      <View style={styles.gearImageWrap}>
                        {item.image_url ? (
                          <Image source={{ uri: imgSrc(item.image_url) }} style={styles.gearImage} />
                        ) : (
                          <View style={styles.gearImageFallback}>
                            <Ionicons name="image-outline" size={24} color="#9ca3af" />
                          </View>
                        )}
                      </View>
                      <View style={styles.gearInfo}>
                        <Text style={styles.gearCategory} numberOfLines={1}>{item.category}</Text>
                        <Text style={styles.gearName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.gearPrice}>
                          {isFree ? 'Free' : `₱${item.price_per_day}/day`}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              {providedGear.length > 3 && (
                <TouchableOpacity
                  onPress={() => router.push(`/gear-rental`)}
                  style={{
                    alignSelf: 'center',
                    marginTop: 12,
                    paddingVertical: 8,
                    paddingHorizontal: 20,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: colors.gearupGreen,
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: colors.gearupGreen,
                      fontWeight: '700',
                      fontSize: 13,
                    }}
                  >
                    See all {providedGear.length} gear items →
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Reviews */}
          <ReviewsSection
            reviews={campsite.reviews ?? []}
            rating={campsite.rating}
            reviewsCount={campsite.reviews_count}
          />

          {eligibleBookingId && (
            <TouchableOpacity
              style={styles.reviewCta}
              onPress={() =>
                router.push(
                  `/campsite/${campsite.id}/review?bookingId=${eligibleBookingId}`,
                )
              }
              activeOpacity={0.85}
            >
              <Ionicons name="star-outline" size={20} color="#fff" />
              <Text style={styles.reviewCtaText}>Leave a review</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Sticky booking footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.price}>₱{campsite.price_per_night}</Text>
          <Text style={styles.priceUnit}>per {campsite.price_unit}</Text>
        </View>

        {!campsite.is_available ? (
          <View style={styles.unavailableButton}>
            <Text style={styles.unavailableButtonText}>Unavailable</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBook}
            activeOpacity={0.85}
          >
            <Text style={styles.bookButtonText}>
              {isGuest ? 'Sign in to Book' : 'Book Now'}
            </Text>
          </TouchableOpacity>
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
  hero: {
    width: '100%',
    height: 300,
    backgroundColor: '#e5e7eb',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#fff',
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

  body: { padding: 20, gap: 10 },
  name: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  closedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  closedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#92400e',
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

  siblingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
  },
  siblingImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  siblingImageFallback: {
    backgroundColor: colors.gearup50,
  },
  siblingName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  siblingLocation: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  siblingPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gearupGreen,
    marginTop: 4,
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

  gearCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gearImageWrap: {
    width: '100%',
    height: 100,
    backgroundColor: '#f3f4f6',
  },
  gearImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gearImageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearInfo: {
    padding: 10,
  },
  gearCategory: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.gearupGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  gearName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  gearPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },

  reviewCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.gearupGreen,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  reviewCtaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

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
  unavailableButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  unavailableButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '800',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  directionsButton: {
  flexDirection: 'row',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: 6,
  backgroundColor: '#f0fdf4',
  borderWidth: 1,
  borderColor: '#86efac',
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 8,
  marginTop: 8,
},
directionsButtonText: {
  color: '#15803d',
  fontWeight: '700',
  fontSize: 13,
},
});