'use client';

import { useState } from 'react';
import { Star, Pencil, ArrowRightLeft } from 'lucide-react';

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
  'Dark Romance': 'bg-purple-500/15 text-purple-400',
  'Mafia Romance': 'bg-red-500/15 text-red-400',
  'Romance': 'bg-pink-500/15 text-pink-400',
  'Fantasy': 'bg-indigo-500/15 text-indigo-400',
  'Thriller': 'bg-amber-500/15 text-amber-400',
};

const coverGradients = [
  'from-rose-400 to-purple-500', 'from-indigo-400 to-pink-400',
  'from-amber-400 to-rose-500', 'from-teal-400 to-blue-500',
  'from-violet-400 to-fuchsia-500', 'from-emerald-400 to-teal-500',
];

function getGradient(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return coverGradients[Math.abs(hash) % coverGradients.length];
}

// Half-star rating (same style as movies)
function HalfStarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(null)}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => {
          const full = display >= star;
          const half = !full && display >= star - 0.5;
          return (
            <div key={star} className={`relative w-4 h-4 ${onChange ? 'cursor-pointer' : ''}`}
              onClick={() => onChange?.(hover ?? star)}
              onMouseMove={(e) => {
                if (!onChange) return;
                const rect = e.currentTarget.getBoundingClientRect();
                setHover(e.clientX - rect.left < rect.width / 2 ? star - 0.5 : star);
              }}>
              <Star className="w-4 h-4 text-foreground/10 absolute inset-0" />
              {(full || half) && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: full ? '100%' : '50%' }}>
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {value > 0 && <span className="text-[11px] font-semibold text-foreground ml-0.5">{value}</span>}
    </div>
  );
}

export default function BookCard({ book, onUpdate }: BookCardProps) {
  const [editing, setEditing] = useState(false);
  const [editNotes, setEditNotes] = useState(book.notes || '');
  const gradient = getGradient(book.title);
  const genreClass = book.genre ? genreColors[book.genre] || 'bg-foreground/5 text-foreground/50' : '';

  const toggleStatus = () => {
    const newStatus = book.status === 'tbr' ? 'read' : 'tbr';
    onUpdate(book.id, {
      status: newStatus,
      read_date: newStatus === 'read' ? new Date().toISOString().split('T')[0] : null,
    });
  };

  return (
    <div className="group glass-card p-3 hover:shadow-md transition-all duration-200">
      <div className="flex gap-3">
        {/* Cover placeholder */}
        <div className={`shrink-0 w-12 h-16 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
          <span className="text-white text-lg font-bold drop-shadow-sm">{book.title.charAt(0)}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate leading-tight">{book.title}</h4>
              <p className="text-xs text-muted mt-0.5">{book.author}</p>
            </div>
            {/* Edit + Move buttons */}
            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={toggleStatus} title={book.status === 'tbr' ? 'Mark as Read' : 'Move to TBR'}
                className="w-6 h-6 rounded-md flex items-center justify-center text-foreground/30 hover:text-mauve hover:bg-mauve/10 transition-all">
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setEditing(!editing)} title="Edit"
                className="w-6 h-6 rounded-md flex items-center justify-center text-foreground/30 hover:text-mauve hover:bg-mauve/10 transition-all">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {book.series && <p className="text-[10px] text-muted mt-0.5 italic truncate">{book.series}</p>}

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {book.genre && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${genreClass}`}>{book.genre}</span>
            )}

            {/* Status badge */}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              book.status === 'read' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'
            }`}>
              {book.status === 'read' ? '✓ Read' : 'TBR'}
            </span>

            {book.read_date && (
              <span className="text-[10px] text-muted">
                {new Date(book.read_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>

          {/* Half-star rating — always visible, clickable */}
          <div className="mt-2">
            <HalfStarRating
              value={book.rating ? Math.round(book.rating * 2) / 2 : 0}
              onChange={(r) => onUpdate(book.id, { rating: r })}
            />
          </div>
        </div>
      </div>

      {/* Expanded edit section */}
      {editing && (
        <div className="mt-3 pt-3 border-t border-foreground/5 space-y-2 animate-fade-in">
          <div className="flex gap-2">
            <button onClick={toggleStatus}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                book.status === 'tbr' ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25' : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
              }`}>
              {book.status === 'tbr' ? 'Mark as Read ✓' : 'Move to TBR →'}
            </button>
          </div>
          <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
            onBlur={() => { if (editNotes !== (book.notes || '')) onUpdate(book.id, { notes: editNotes }); }}
            placeholder="Add notes..."
            className="w-full px-3 py-2 rounded-lg text-xs bg-foreground/5 border border-foreground/10 text-foreground placeholder:text-foreground/30 resize-none focus:outline-none focus:border-mauve/30" rows={2} />
          <button onClick={() => setEditing(false)} className="text-[10px] text-muted hover:text-foreground">Close</button>
        </div>
      )}
    </div>
  );
}
