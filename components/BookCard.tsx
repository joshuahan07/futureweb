'use client';

interface Book {
  id: string;
  title: string;
  author: string;
  series?: string | null;
  genre?: string | null;
  status: 'tbr' | 'read';
  rating?: number | null;
  read_date?: string | null;
  notes?: string | null;
}

interface BookCardProps {
  book: Book;
  onUpdate: (id: string, updates: Partial<Book>) => void;
}

const genreColors: Record<string, string> = {
  'Dark Romance': 'bg-purple-100 text-purple-700',
  'Mafia Romance': 'bg-red-100 text-red-700',
  'Romance': 'bg-pink-100 text-pink-700',
  'Fantasy': 'bg-indigo-100 text-indigo-700',
  'Thriller': 'bg-amber-100 text-amber-700',
};

const coverGradients = [
  'from-rose-400 to-purple-500',
  'from-indigo-400 to-pink-400',
  'from-amber-400 to-rose-500',
  'from-teal-400 to-blue-500',
  'from-violet-400 to-fuchsia-500',
  'from-emerald-400 to-teal-500',
];

function getGradient(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return coverGradients[Math.abs(hash) % coverGradients.length];
}

function StarRating({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (r: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className="text-sm transition-transform hover:scale-125 focus:outline-none"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <span className={star <= rating ? 'text-amber-400' : 'text-neutral-200'}>
            &#9733;
          </span>
        </button>
      ))}
    </div>
  );
}

export default function BookCard({ book, onUpdate }: BookCardProps) {
  const gradient = getGradient(book.title);
  const genreClass = book.genre ? genreColors[book.genre] || 'bg-surface-hover text-foreground/70' : '';

  return (
    <div className="group flex gap-3 p-3 rounded-xl glass-card hover:border-border hover:shadow-sm transition-all duration-200">
      {/* Cover placeholder */}
      <div
        className={`shrink-0 w-12 h-16 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}
      >
        <span className="text-white text-lg font-bold drop-shadow-sm">
          {book.title.charAt(0)}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-foreground truncate leading-tight">
          {book.title}
        </h4>
        <p className="text-xs text-muted mt-0.5">{book.author}</p>

        {book.series && (
          <p className="text-[10px] text-muted mt-0.5 italic truncate">
            {book.series}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {book.genre && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${genreClass}`}>
              {book.genre}
            </span>
          )}

          {book.status === 'read' && (
            <>
              <StarRating
                rating={book.rating || 0}
                onChange={(r) => onUpdate(book.id, { rating: r })}
              />
              {book.read_date && (
                <span className="text-[10px] text-muted/60">
                  {new Date(book.read_date).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
