'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

export interface Movie {
  id: string;
  title: string;
  type: 'movie' | 'show';
  date_watched: string | null;
  date_has_day?: boolean;
  rating: number;
  rating_joshua?: number | null;
  rating_sophie?: number | null;
  notes: string;
  poster_url: string | null;
  poster_position?: string | null;
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

function formatDate(dateStr: string | null, hasDay?: boolean | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const showDay = hasDay === true ? true : hasDay === false ? false : d.getDate() !== 1;
  if (!showDay) return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Convert 1-10 rating to 0-5 star value (e.g. 7 → 3.5)
function toStars(rating10: number | null | undefined): number {
  if (!rating10) return 0;
  return Math.round(rating10 / 2 * 2) / 2; // round to nearest 0.5
}

// Convert 0-5 star value back to 1-10
function toRating10(stars: number): number {
  return Math.round(stars * 2);
}

function StarRating({ value, color, onRate, label }: {
  value: number; color: string; label: string;
  onRate?: (stars: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0`}
        style={{ backgroundColor: color }}>{label}</span>
      <div className="flex" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const full = display >= star;
          const half = !full && display >= star - 0.5;
          return (
            <div key={star} className="relative w-5 h-5 cursor-pointer"
              onClick={() => onRate?.(star)}
              onMouseMove={(e) => {
                if (!onRate) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const isLeft = e.clientX - rect.left < rect.width / 2;
                setHover(isLeft ? star - 0.5 : star);
              }}>
              {/* Background star */}
              <Star className="w-5 h-5 text-foreground/10 absolute inset-0" />
              {/* Filled star — full or half via clip */}
              {(full || half) && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: full ? '100%' : '50%' }}>
                  <Star className="w-5 h-5" style={{ color, fill: color }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {value > 0 ? (
        <span className="text-[11px] font-semibold text-foreground">{value}</span>
      ) : onRate ? (
        <span className="text-[10px] text-muted">rate</span>
      ) : (
        <span className="text-[10px] text-muted">—</span>
      )}
    </div>
  );
}

export default function MovieCard({ movie, onEdit, onDelete, onRate, currentUser }: MovieCardProps) {
  const joshuaStars = toStars(movie.rating_joshua);
  const sophieStars = toStars(movie.rating_sophie);

  return (
    <div className="group relative rounded-2xl overflow-hidden glass-card transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-full">
      {/* Vertical poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        {movie.poster_url ? (() => {
          try {
            if (movie.poster_position) {
              const p = JSON.parse(movie.poster_position);
              if (p.wPct && p.hPct) {
                return (
                  <img src={movie.poster_url} alt={movie.title}
                    className="absolute pointer-events-none"
                    style={{
                      width: `${p.wPct}%`, height: `${p.hPct}%`,
                      left: `calc(50% + ${p.oxPct}% - ${p.wPct / 2}%)`,
                      top: `calc(50% + ${p.oyPct}% - ${p.hPct / 2}%)`,
                      objectFit: 'cover',
                    }} />
                );
              }
            }
          } catch { /* ignore */ }
          return <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" />;
        })() : (
          <div className={`w-full h-full bg-gradient-to-br ${getGradient(movie.title)} flex items-center justify-center`}>
            <span className="text-5xl font-bold text-white/80">{movie.title.charAt(0).toUpperCase()}</span>
          </div>
        )}

        {/* Type badge */}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/50 text-white backdrop-blur-sm">
          {movie.type === 'movie' ? '🎬' : '📺'} {movie.type === 'movie' ? 'Movie' : 'Show'}
        </span>

        {/* Hover actions */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button onClick={() => onEdit(movie)}
            className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-xs hover:bg-black/70 transition-colors">✎</button>
          <button onClick={() => onDelete(movie.id)}
            className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-xs hover:bg-red-500/70 transition-colors">✕</button>
        </div>

      </div>

      {/* Info + Rating section */}
      <div className="p-3 space-y-1.5">
        {/* Title left, date right */}
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-semibold text-sm leading-tight text-foreground line-clamp-2">{movie.title}</h3>
          {movie.date_watched && (
            <span className="text-[10px] text-muted whitespace-nowrap shrink-0 mt-0.5">{formatDate(movie.date_watched, movie.date_has_day)}</span>
          )}
        </div>
        <StarRating value={joshuaStars} label="J" color="#3B82F6"
          onRate={currentUser === 'joshua' && onRate ? (s) => onRate(movie.id, 'joshua', toRating10(s)) : undefined} />
        <StarRating value={sophieStars} label="S" color="#EC4899"
          onRate={currentUser === 'sophie' && onRate ? (s) => onRate(movie.id, 'sophie', toRating10(s)) : undefined} />

        {movie.notes && <p className="text-[10px] text-muted line-clamp-1 italic mt-1">{movie.notes}</p>}
      </div>
    </div>
  );
}
