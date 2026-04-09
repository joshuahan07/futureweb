'use client';

interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({
  rating,
  onRate,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'text-sm gap-0.5',
    md: 'text-lg gap-1',
    lg: 'text-2xl gap-1',
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRate?.(star)}
          className={`transition-all duration-200 ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-125'
          } ${star <= rating ? 'text-rose-400' : 'text-muted/60'}`}
        >
          {star <= rating ? '♥' : '♡'}
        </button>
      ))}
    </div>
  );
}
