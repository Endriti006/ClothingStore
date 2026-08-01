import { Star } from 'lucide-react';

export function RatingStars({
  rating,
  size = 14,
  className = '',
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(rating);
        return (
          <Star
            key={n}
            size={size}
            className={filled ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}
          />
        );
      })}
    </div>
  );
}
