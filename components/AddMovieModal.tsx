'use client';

import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import type { Movie } from './MovieCard';

interface AddMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (movie: Omit<Movie, 'id' | 'created_at'>) => void;
  editMovie?: Movie | null;
  currentUser: 'joshua' | 'sophie';
}

export default function AddMovieModal({
  isOpen,
  onClose,
  onSave,
  editMovie,
  currentUser,
}: AddMovieModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'movie' | 'show'>('movie');
  const [dateWatched, setDateWatched] = useState('');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    if (editMovie) {
      setTitle(editMovie.title);
      setType(editMovie.type);
      setDateWatched(editMovie.date_watched || '');
      setRating(editMovie.rating);
      setNotes(editMovie.notes);
      setPosterUrl(editMovie.poster_url || '');
      setWatched(editMovie.watched);
    } else {
      setTitle('');
      setType('movie');
      setDateWatched('');
      setRating(0);
      setNotes('');
      setPosterUrl('');
      setWatched(false);
    }
  }, [editMovie, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      type,
      date_watched: dateWatched || null,
      rating,
      notes: notes.trim(),
      poster_url: posterUrl.trim() || null,
      added_by: editMovie?.added_by || currentUser,
      watched,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl font-bold text-white"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            {editMovie ? 'Edit' : 'Add'} Movie or Show
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-muted hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What did you watch?"
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 text-white placeholder-neutral-500 border border-neutral-700 focus:border-rose-400 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Type toggle */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Type
            </label>
            <div className="flex rounded-xl overflow-hidden border border-neutral-700">
              <button
                type="button"
                onClick={() => setType('movie')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors border-r border-neutral-700 ${
                  type === 'movie'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-neutral-800 text-muted hover:bg-neutral-700'
                }`}
              >
                🎬 Movie
              </button>
              <button
                type="button"
                onClick={() => setType('show')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  type === 'show'
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'bg-neutral-800 text-muted hover:bg-neutral-700'
                }`}
              >
                📺 Show
              </button>
            </div>
          </div>

          {/* Date watched */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Date Watched
            </label>
            <input
              type="date"
              value={dateWatched}
              onChange={(e) => setDateWatched(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 text-white border border-neutral-700 focus:border-rose-400 focus:outline-none transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Rating
            </label>
            <StarRating rating={rating} onRate={setRating} size="lg" />
          </div>

          {/* Poster URL */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Poster URL (optional)
            </label>
            <input
              type="url"
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 text-white placeholder-neutral-500 border border-neutral-700 focus:border-rose-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thoughts, favorite scenes, would rewatch..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 text-white placeholder-neutral-500 border border-neutral-700 focus:border-rose-400 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Watched toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-12 h-7 rounded-full relative transition-colors ${
                watched ? 'bg-rose-500' : 'bg-neutral-700'
              }`}
              onClick={() => setWatched(!watched)}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-surface shadow transition-transform ${
                  watched ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-sm text-muted/60">
              Already watched together
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold hover:from-rose-600 hover:to-pink-600 transition-all active:scale-[0.98]"
          >
            {editMovie ? 'Save Changes' : 'Add to Collection'}
          </button>
        </form>
      </div>
    </div>
  );
}
