'use client';

export interface Movie {
  id: string;
  title: string;
  type: 'movie' | 'show';
  date_watched: string | null;
  rating: number;
  rating_joshua?: number | null;
  rating_sophie?: number | null;
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
  onRate?: (id: string, person: 'joshua' | 'sophie', rating: number) => void;
  currentUser?: string | null;
}

const gradients = [
  'from-rose-400 to-amber-400', 'from-violet-400 to-pink-400',
  'from-cyan-400 to-blue-400', 'from-emerald-400 to-teal-400',
  'from-orange-400 to-red-400', 'from-indigo-400 to-purple-400',
];

function getGradient(title: string) {
  return gradients[title.charCodeAt(0) % gradients.length];
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function RatingBar({ value, label, color, onRate }: { value: number | null; label: string; color: string; onRate?: (r: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${color}`}>{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button key={n} onClick={() => onRate?.(n)} disabled={!onRate}
            className={`w-5 h-5 rounded text-[9px] font-bold transition-colors ${
              value && n <= value
                ? label === 'J' ? 'bg-blue-500 text-white' : 'bg-rose-400 text-white'
                : 'bg-border text-foreground/30'
            } ${onRate ? 'hover:bg-blue-400 hover:text-white cursor-pointer' : 'cursor-default'}`}>
            {n}
          </button>
        ))}
      </div>
      {value ? <span className="text-xs font-bold text-foreground">{value}<span className="text-muted font-normal">/10</span></span> : <span className="text-[10px] text-muted italic">—</span>}
    </div>
  );
}

export default function MovieCard({ movie, onEdit, onDelete, onRate, currentUser }: MovieCardProps) {
  return (
    <div className="group relative rounded-2xl overflow-hidden bg-surface border border-border transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
      {/* Poster / Gradient placeholder */}
      <div className="relative overflow-hidden">
        {movie.poster_url ? (
          <img src={movie.poster_url} alt={movie.title} className="w-full max-h-80 object-contain bg-black/5" />
        ) : (
          <div className={`w-full aspect-[16/9] bg-gradient-to-br ${getGradient(movie.title)} flex items-center justify-center`}>
            <span className="text-6xl font-bold text-white/80">{movie.title.charAt(0).toUpperCase()}</span>
          </div>
        )}

        {/* Type badge */}
        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/50 text-white backdrop-blur-sm">
          {movie.type === 'movie' ? '🎬 Movie' : '📺 Show'}
        </span>

        {/* Hover actions */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button onClick={() => onEdit(movie)}
            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors">✎</button>
          <button onClick={() => onDelete(movie.id)}
            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500/70 transition-colors">✕</button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight text-foreground">{movie.title}</h3>
          {movie.added_by && (
            <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: movie.added_by === 'joshua' ? '#7BA5D4' : '#F4A5B0' }}>
              {movie.added_by === 'joshua' ? 'J' : 'S'}
            </span>
          )}
        </div>

        {movie.date_watched && <p className="text-xs text-muted">{formatDate(movie.date_watched)}</p>}

        {/* Per-person ratings (1-10) */}
        <div className="space-y-1.5 mt-1">
          <RatingBar value={movie.rating_joshua ?? null} label="J" color="bg-blue-400"
            onRate={currentUser === 'joshua' && onRate ? (r) => onRate(movie.id, 'joshua', r) : undefined} />
          <RatingBar value={movie.rating_sophie ?? null} label="S" color="bg-rose-400"
            onRate={currentUser === 'sophie' && onRate ? (r) => onRate(movie.id, 'sophie', r) : undefined} />
        </div>

        {movie.notes && <p className="text-xs text-muted line-clamp-2 italic mt-1">{movie.notes}</p>}
      </div>
    </div>
  );
}
