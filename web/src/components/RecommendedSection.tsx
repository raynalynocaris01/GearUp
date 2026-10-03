import Link from 'next/link';
import { FeaturedCard } from './FeaturedCard';

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
  const startStr = start.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
  const endStr = end.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startStr}–${endStr}`;
}

export function RecommendedSection({ data }: Props) {
  const campsite = data.campsites[0];
  const gear = data.gear[0];
  const guide = data.guides[0];
  const event = data.events[0];

  // If nothing to show, hide the section entirely
  if (!campsite && !gear && !guide && !event) {
    return null;
  }

  return (
        <section className="max-w-7xl mx-auto px-6 mt-10">
      {/* Section header */}
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-black text-gray-900">
          Recommended for You
        </h2>
      </div>

      {/* Horizontal scroller */}
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-6 px-6 snap-x snap-mandatory scrollbar-hide">
        {campsite && (
          <FeaturedCard
            category="Campsite"
            title={campsite.name}
            subtitle={campsite.location}
            imageUrl={campsite.image_url}
            priceLabel={`PHP ${campsite.price_per_night} / ${campsite.price_unit}`}
            rating={parseFloat(campsite.rating)}
            reviewsCount={campsite.reviews_count}
            href={`/campsites/${campsite.id}`}
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
            href={`/gear-rental/${gear.id}`}
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
            href={`/tour-guides/${guide.id}`}
          />
        )}

        {event && (
          <FeaturedCard
            category="Event"
            title={event.name}
            subtitle={formatEventDates(event.starts_at, event.ends_at)}
            imageUrl={event.image_url}
            priceLabel={`PHP ${Number(event.price_per_person).toFixed(0)} / person`}
            href={`/events/${event.id}`}
          />
        )}

                {/* View All card */}
        <Link
          href="/campsites"
          className="shrink-0 w-56 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 hover:border-gearup-600 hover:bg-gearup-50 transition group"
        >
          <div className="text-center">
            <p className="text-lg font-bold text-gearup-600">
              View All
            </p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gearup-600 mt-2 mx-auto group-hover:translate-x-1 transition"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </Link>
      </div>
    </section>
  );
}