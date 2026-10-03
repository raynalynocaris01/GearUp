'use client';
import Link from 'next/link';
import Image from 'next/image';

interface FeaturedCardProps {
  category: 'Campsite' | 'Gear Rental' | 'Tour Guide' | 'Event';
  title: string;
  subtitle: string;
  imageUrl: string;
  priceLabel: string;
  rating?: number;
  reviewsCount?: number;
  href: string;
}

// Category colors match the reference design
const CATEGORY_STYLES: Record<
  FeaturedCardProps['category'],
  { bg: string; text: string }
> = {
  Campsite: { bg: 'bg-green-600', text: 'text-white' },
  'Gear Rental': { bg: 'bg-blue-600', text: 'text-white' },
  'Tour Guide': { bg: 'bg-orange-600', text: 'text-white' },
  Event: { bg: 'bg-purple-600', text: 'text-white' },
};

export function FeaturedCard({
  category,
  title,
  subtitle,
  imageUrl,
  priceLabel,
  rating,
  reviewsCount,
  href,
}: FeaturedCardProps) {
  const catStyle = CATEGORY_STYLES[category];

  return (
        <Link
      href={href}
      className="group flex flex-col rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-lg transition shrink-0 w-56"
    >
      {/* Image + category badge + heart */}
      <div className="relative h-32 overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="256px"
          className="object-cover group-hover:scale-105 transition duration-500"
          unoptimized
        />

        {/* Category badge — top left */}
        <span
          className={`absolute top-3 left-3 px-3 py-1 rounded-md text-xs font-bold ${catStyle.bg} ${catStyle.text}`}
        >
          {category}
        </span>

        {/* Heart — top right */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            // TODO: wire up favorites
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-gray-700 hover:text-red-500 transition"
          aria-label="Add to favorites"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

            {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
          {title}
        </h3>
        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
          {subtitle}
        </p>

        {/* Rating (optional) */}
        {rating !== undefined && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="#f59e0b"
              stroke="#f59e0b"
              strokeWidth="1"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="font-semibold text-gray-900">
              {Number(rating).toFixed(1)}
            </span>
            {reviewsCount !== undefined && (
              <span className="text-gray-500">({reviewsCount})</span>
            )}
          </div>
        )}

                {/* Price at bottom */}
        <p className="text-[13px] font-bold text-gearup-600 mt-2 mt-auto">
          {priceLabel}
        </p>
      </div>
    </Link>
  );
}