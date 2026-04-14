'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Movie } from './MovieCard';
import ModalOverlay from './ModalOverlay';

interface AddMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (movie: Omit<Movie, 'id' | 'created_at'>) => void;
  editMovie?: Movie | null;
  currentUser: 'joshua' | 'sophie';
  forceWatched?: boolean; // true when adding from "Our Movies" tab
}

export default function AddMovieModal({
  isOpen, onClose, onSave, editMovie, currentUser, forceWatched,
}: AddMovieModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'movie' | 'show'>('movie');
  const [dateWatched, setDateWatched] = useState('');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [watched, setWatched] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      setTitle(''); setType('movie'); setDateWatched(''); setRating(0);
      setNotes(''); setPosterUrl(''); setWatched(false);
    }
  }, [editMovie, isOpen]);

  if (!isOpen) return null;

  const uploadFile = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `movies/${fileName}`;
    const { error } = await supabase.storage.from('media').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('media').getPublicUrl(path);
      setPosterUrl(data.publicUrl);
    }
    setUploading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(), type,
      date_watched: dateWatched ? (dateWatched.length <= 7 ? dateWatched + '-01' : dateWatched) : null,
      date_has_day: dateWatched ? dateWatched.length > 7 : undefined,
      rating: rating || 0,
      notes: notes.trim(), poster_url: posterUrl.trim() || null,
      added_by: editMovie?.added_by || currentUser,
      watched: forceWatched ?? watched,
    });
    onClose();
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-strong rounded-2xl p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-heading text-foreground">
            {editMovie ? 'Edit' : 'Add'} Movie or Show
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-hover transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="What did you watch?" autoFocus
              className="w-full px-3 py-2.5 rounded-xl bg-background text-foreground placeholder-muted border border-border focus:border-mauve/40 focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Type</label>
            <div className="flex rounded-xl overflow-hidden border border-border">
              <button type="button" onClick={() => setType('movie')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${type === 'movie' ? 'bg-mauve/15 text-mauve' : 'bg-surface-hover text-muted'}`}>
                🎬 Movie
              </button>
              <button type="button" onClick={() => setType('show')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${type === 'show' ? 'bg-mauve/15 text-mauve' : 'bg-surface-hover text-muted'}`}>
                📺 Show
              </button>
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Poster Image</label>
            {posterUrl ? (
              <div className="relative rounded-xl overflow-hidden aspect-[2/3] max-w-[180px] mx-auto">
                <img src={posterUrl} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setPosterUrl('')}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/80">✕</button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) uploadFile(f); }}
                onClick={() => fileRef.current?.click()}
                className={`h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  dragOver ? 'border-mauve/40 bg-blue-50/30' : 'border-border hover:border-mauve/30'
                }`}
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-mauve/40 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><span className="text-muted text-lg mb-1">📷</span><span className="text-xs text-muted">Drop image or click to upload</span></>
                )}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
            {!posterUrl && (
              <input type="url" value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="Or paste image URL..." className="w-full mt-2 px-3 py-2 rounded-lg bg-background text-foreground placeholder-muted border border-border focus:border-mauve/40 focus:outline-none text-sm transition-colors" />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Date Watched</label>
            <div className="flex gap-2">
              <input type="month" value={dateWatched.slice(0, 7)} onChange={(e) => setDateWatched(e.target.value)}
                placeholder="Month"
                className="flex-1 px-3 py-2.5 rounded-xl bg-background text-foreground border border-border focus:border-mauve/40 focus:outline-none transition-colors" />
              <input type="number" min={1} max={31} placeholder="Day"
                value={dateWatched.length > 7 ? parseInt(dateWatched.slice(8)) || '' : ''}
                onChange={(e) => {
                  const month = dateWatched.slice(0, 7);
                  if (!month) return;
                  const day = e.target.value;
                  setDateWatched(day ? `${month}-${day.padStart(2, '0')}` : month);
                }}
                className="w-20 px-3 py-2.5 rounded-xl bg-background text-foreground border border-border focus:border-mauve/40 focus:outline-none transition-colors text-center" />
            </div>
            <p className="text-[10px] text-muted mt-1">Day is optional — leave blank if you only remember the month</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Thoughts, favorite scenes, would rewatch..." rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-background text-foreground placeholder-muted border border-border focus:border-mauve/40 focus:outline-none transition-colors resize-none" />
          </div>

          {/* Only show toggle when NOT forced (i.e. editing or generic context) */}
          {forceWatched == null && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-11 h-6 rounded-full relative transition-colors ${watched ? 'bg-blue-500' : 'bg-surface-hover border border-border'}`}
                onClick={() => setWatched(!watched)}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface shadow transition-transform ${watched ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-muted">Already watched together</span>
            </label>
          )}

          <button type="submit" disabled={!title.trim()}
            className={`w-full py-3 rounded-xl font-medium transition-colors ${
              title.trim() ? 'bg-mauve text-white hover:bg-mauve/90' : 'bg-surface-hover text-muted'
            }`}>
            {editMovie ? 'Save Changes' : 'Add to Collection'}
          </button>
        </form>
      </div>
    </ModalOverlay>
  );
}
