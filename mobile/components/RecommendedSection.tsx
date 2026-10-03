import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FeaturedCard } from './FeaturedCard';
import { colors } from '../theme';

interface Campsite {
  id: number;
  name: string;
  location: string;
  image_url: string;
  price_per_night: string;
  price_unit: string;
  rating: string;
  reviews_count: number;
}

interface GearItem {
  id: number;
  name: string;
  category: string;
  image_url: string | null;
  price_per_day: string;
  stock: number;
}

interface TourGuide {
  id: number;
  name: string;
  price_per_trip: string;
  is_independent: boolean;
  campsite?: { id: number; name: string } | null;
  location: string | null;
}

interface Event {
  id: number;
  name: string;
  location: string;
  image_url: string;
  starts_at: string;
  ends_at: string;
  price_per_person: string;
  capacity: number;
}

interface RecommendedData {
  campsites: Campsite[];
  gear: GearItem[];
  guides: TourGuide[];
  events: Event[];
}

interface Props {
  data: RecommendedData;
}

function formatEventDates(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return `${start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

export function RecommendedSection({ data }: Props) {
  const router = useRouter();

  const campsite = data.campsites[0];
  const gear = data.gear[0];
  const guide = data.guides[0];
  const event = data.events[0];

  if (!campsite && !gear && !guide && !event) return null;

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recommended for You</Text>
      </View>

      {/* Horizontal scroller */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {campsite && (
          <FeaturedCard
            category="Campsite"
            title={campsite.name}
            subtitle={campsite.location}
            imageUrl={campsite.image_url}
            priceLabel={`PHP ${campsite.price_per_night} / ${campsite.price_unit}`}
            rating={parseFloat(campsite.rating)}
            reviewsCount={campsite.reviews_count}
            onPress={() => router.push(`/campsite/${campsite.id}`)}
          />
        )}

        {gear && (
          <FeaturedCard
            category="Gear Rental"
            title={gear.name}
            subtitle={`Good for your next trip · ${gear.stock} in stock`}
            imageUrl={
              gear.image_url ??
              'https://picsum.photos/seed/gear-placeholder/600/400'
            }
            priceLabel={`PHP ${gear.price_per_day} / day`}
            onPress={() => router.push(`/gear-rental/${gear.id}`)}
          />
        )}

        {guide && (
          <FeaturedCard
            category="Tour Guide"
            title={guide.name}
            subtitle={
              guide.is_independent
                ? guide.location ?? 'Independent guide'
                : guide.campsite?.name ?? 'Guide at a campsite'
            }
            imageUrl="https://picsum.photos/seed/guide-placeholder/600/400"
            priceLabel={
              Number(guide.price_per_trip) > 0
                ? `PHP ${Number(guide.price_per_trip).toFixed(0)} / trip`
                : 'Contact for pricing'
            }
            onPress={() => router.push(`/tour-guides/${guide.id}`)}
          />
        )}

        {event && (
          <FeaturedCard
            category="Event"
            title={event.name}
            subtitle={formatEventDates(event.starts_at, event.ends_at)}
            imageUrl={event.image_url}
            priceLabel={`PHP ${Number(event.price_per_person).toFixed(0)} / person`}
            onPress={() => router.push(`/events/${event.id}`)}
          />
        )}

        {/* View All card */}
        <TouchableOpacity
          style={styles.viewAllCard}
          onPress={() => router.push('/(tabs)/explore')}
          activeOpacity={0.85}
        >
          <Text style={styles.viewAllLabel}>View All</Text>
          <Ionicons
            name="arrow-forward"
            size={32}
            color={colors.gearupGreen}
            style={styles.viewAllIcon}
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  viewAllCard: {
    width: 180,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  viewAllLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.gearupGreen,
  },
  viewAllIcon: {
    marginTop: 8,
  },
});