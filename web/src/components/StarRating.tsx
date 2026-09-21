interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export function StarRating({
  rating,
  size = 'md',
  showValue = false,
}: StarRatingProps) {
  const sizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  };
  const starSize = sizeMap[size];

  // Round to nearest half for display
  const rounded = Math.round(rating * 2) / 2;

  return (
    <span className={`inline-flex items-center gap-0.5 ${starSize}`}>
      {[1, 2, 3, 4, 5].map((i) => {
        if (i <= rounded) {
          return (
            <span key={i} className="text-yellow-500">
              ★
            </span>
          );
        }
        if (i - 0.5 === rounded) {
          return (
            <span key={i} className="text-yellow-500">
              ⯨
            </span>
          );
        }
        return (
          <span key={i} className="text-gray-300">
            ★
          </span>
        );
      })}
      {showValue && (
        <span className="ml-1.5 font-semibold text-gray-900">
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}