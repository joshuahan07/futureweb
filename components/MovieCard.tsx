'use client';

import StarRating from './StarRating';

export interface Movie {
  id: string;
  title: string;
  type: 'movie' | 'show';
  date_watched: string | null;
  rating: number;
  notes: string;
  poster_url: string | null;
  added_by: 'joshua' | 'sophie';
  watched: boolean;
  created_at: string;
}

interface MovieCardProps {
  movie: Movie;
  onEdit: (movie: Movie) => void;
  onDelete: (id: string) => void;
  onToggleWatched: (id: string, watched: boolean) => void;
}

const gradients = [
  'from-rose-500 to-amber-500',
  'from-violet-500 to-pink-500',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-purple-500',
];

function getGradient(title: string) {
  const index = title.charCodeAt(0) % gradients.length;
  return gradients[index];
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function MovieCard({
  movie,
  onEdit,
  onDelete,
  onToggleWatched,
}: MovieCardProps) {
  return (
    <div
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
        movie.watched ? 'opacity-80' : ''
      }`}
      style={{
        backgroundColor: '#1C1C1E',
        animation: 'slideIn 0.4s ease-out',
      }}
    >
      {/* Poster / Gradient placeholder */}
      <div className="relative h-44 overflow-hidden">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${getGradient(movie.title)} flex items-center justify-center`}
          >
            <span className="text-6xl font-bold text-white/80">
              {movie.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Type badge */}
        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
          {movie.type === 'movie' ? '🎬 Movie' : '📺 Show'}
        </span>

        {/* Hover actions */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onEdit(movie)}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(movie.id)}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`font-semibold text-base leading-tight ${
              movie.watched
                ? 'line-through decoration-rose-400/60 text-[#B76E79]'
                : 'text-white'
            }`}
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            {movie.title}
          </h3>
          <span
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{
              backgroundColor:
                movie.added_by === 'joshua' ? '#7BA5D4' : '#F4A5B0',
            }}
          >
            {movie.added_by === 'joshua' ? 'J' : 'S'}
          </span>
        </div>

        {movie.date_watched && (
          <p className="text-xs text-muted">
            {formatDate(movie.date_watched)}
          </p>
        )}

        <StarRating rating={movie.rating} readonly size="sm" />

        {movie.notes && (
          <p className="text-xs text-muted line-clamp-2 italic">
            {movie.notes}
          </p>
        )}

        <button
          onClick={() => onToggleWatched(movie.id, !movie.watched)}
          className={`mt-1 text-xs px-3 py-1 rounded-full transition-colors ${
            movie.watched
              ? 'bg-[#B76E79]/20 text-[#B76E79] hover:bg-[#B76E79]/30'
              : 'bg-neutral-700 text-muted/60 hover:bg-neutral-600'
          }`}
        >
          {movie.watched ? '✓ Watched' : 'Mark watched'}
        </button>
      </div>
    </div>
  );
}
