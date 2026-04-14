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
  // Poster crop state
  const [posterNatural, setPosterNatural] = useState({ w: 0, h: 0 });
  const [posterZoom, setPosterZoom] = useState(1);
  const [posterOffset, setPosterOffset] = useState({ x: 0, y: 0 });
  const [posterDragging, setPosterDragging] = useState(false);
  const posterZoomRef = useRef(1);
  const PW = 180; // preview width
  const PH = 270; // preview height (2:3)

  useEffect(() => {
    if (editMovie) {
      setTitle(editMovie.title);
      setType(editMovie.type);
      setDateWatched(editMovie.date_watched || '');
      setRating(editMovie.rating);
      setNotes(editMovie.notes);
      setPosterUrl(editMovie.poster_url || '');
      setWatched(editMovie.watched);
      setPosterZoom(1); posterZoomRef.current = 1; setPosterOffset({ x: 0, y: 0 });
    } else {
      setTitle(''); setType('movie'); setDateWatched(''); setRating(0);
      setNotes(''); setPosterUrl(''); setWatched(false);
      setPosterZoom(1); posterZoomRef.current = 1; setPosterOffset({ x: 0, y: 0 });
    }
  }, [editMovie, isOpen]);

  // Load poster natural dimensions
  useEffect(() => {
    if (!posterUrl) { setPosterNatural({ w: 0, h: 0 }); return; }
    const img = new Image();
    img.onload = () => { setPosterNatural({ w: img.naturalWidth, h: img.naturalHeight }); setPosterZoom(1); posterZoomRef.current = 1; setPosterOffset({ x: 0, y: 0 }); };
    img.src = posterUrl;
  }, [posterUrl]);

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
      poster_position: posterNatural.w ? (() => {
        // Save as ratios so the card can recreate the exact same view at any size
        const imgAspect = posterNatural.w / posterNatural.h;
        const previewAspect = PW / PH;
        let sw: number, sh: number;
        if (imgAspect > previewAspect) { sh = PH * posterZoom; sw = sh * imgAspect; }
        else { sw = PW * posterZoom; sh = sw / imgAspect; }
        const maxX = Math.max(0, (sw - PW) / 2);
        const maxY = Math.max(0, (sh - PH) / 2);
        const ox = Math.min(maxX, Math.max(-maxX, posterOffset.x));
        const oy = Math.min(maxY, Math.max(-maxY, posterOffset.y));
        // Store as percentage of frame: how big the image is relative to frame, and offset as percentage
        return JSON.stringify({ wPct: (sw / PW) * 100, hPct: (sh / PH) * 100, oxPct: (ox / PW) * 100, oyPct: (oy / PH) * 100 });
      })() : undefined,
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

          {/* Image upload + crop */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Poster Image</label>
            {posterUrl && posterNatural.w > 0 ? (() => {
              // Calculate scaled image to cover the 2:3 preview
              const imgAspect = posterNatural.w / posterNatural.h;
              const previewAspect = PW / PH;
              const z = posterZoom;
              let sw: number, sh: number;
              if (imgAspect > previewAspect) {
                // Image is wider than preview — fit height, overflow width
                sh = PH * z;
                sw = sh * imgAspect;
              } else {
                // Image is taller — fit width, overflow height
                sw = PW * z;
                sh = sw / imgAspect;
              }
              const maxX = Math.max(0, (sw - PW) / 2);
              const maxY = Math.max(0, (sh - PH) / 2);
              const ox = Math.min(maxX, Math.max(-maxX, posterOffset.x));
              const oy = Math.min(maxY, Math.max(-maxY, posterOffset.y));

              return (
                <div className="flex flex-col items-center gap-2">
                  {/* Crop preview — exact card aspect ratio */}
                  <div className="relative rounded-xl overflow-hidden select-none"
                    style={{ width: PW, height: PH, cursor: posterDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setPosterDragging(true);
                      const sx = e.clientX, sy = e.clientY, so = { x: ox, y: oy };
                      e.currentTarget.setPointerCapture(e.pointerId);
                      const onMove = (ev: PointerEvent) => {
                        const a = posterNatural.w / posterNatural.h;
                        const pa = PW / PH;
                        const zz = posterZoomRef.current;
                        let ssw: number, ssh: number;
                        if (a > pa) { ssh = PH * zz; ssw = ssh * a; } else { ssw = PW * zz; ssh = ssw / a; }
                        const mmx = Math.max(0, (ssw - PW) / 2);
                        const mmy = Math.max(0, (ssh - PH) / 2);
                        setPosterOffset({
                          x: Math.min(mmx, Math.max(-mmx, so.x + (ev.clientX - sx))),
                          y: Math.min(mmy, Math.max(-mmy, so.y + (ev.clientY - sy))),
                        });
                      };
                      const onUp = () => { setPosterDragging(false); document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); };
                      document.addEventListener('pointermove', onMove);
                      document.addEventListener('pointerup', onUp);
                    }}
                    onWheel={(e) => { e.preventDefault(); const nz = Math.min(3, Math.max(1, posterZoom - e.deltaY * 0.002)); setPosterZoom(nz); posterZoomRef.current = nz; }}
                  >
                    <img src={posterUrl} alt="" draggable={false}
                      className="absolute pointer-events-none"
                      style={{
                        left: `calc(50% - ${sw/2}px + ${ox}px)`, top: `calc(50% - ${sh/2}px + ${oy}px)`,
                        width: sw, height: sh, objectFit: 'cover',
                        transition: posterDragging ? 'none' : 'all 0.15s',
                      }} />
                    {!posterDragging && (
                      <div className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-[10px] bg-black/50 px-2 py-1 rounded-full">Drag to move · Scroll to zoom</span>
                      </div>
                    )}
                    {posterDragging && (
                      <svg width={PW} height={PH} className="absolute inset-0 pointer-events-none opacity-25">
                        <line x1={PW/3} y1={0} x2={PW/3} y2={PH} stroke="white" strokeWidth="0.5" />
                        <line x1={PW*2/3} y1={0} x2={PW*2/3} y2={PH} stroke="white" strokeWidth="0.5" />
                        <line y1={PH/3} x1={0} y2={PH/3} x2={PW} stroke="white" strokeWidth="0.5" />
                        <line y1={PH*2/3} x1={0} y2={PH*2/3} x2={PW} stroke="white" strokeWidth="0.5" />
                      </svg>
                    )}
                    <button type="button" onClick={(e) => { e.stopPropagation(); setPosterUrl(''); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/80 z-10">✕</button>
                  </div>
                  {/* Zoom slider */}
                  <div className="flex items-center gap-2" style={{ width: PW }}>
                    <span className="text-[10px] text-muted">−</span>
                    <div className="flex-1 relative h-5 flex items-center">
                      <div className="absolute left-0 right-0 h-[2px] rounded-full bg-foreground/10" />
                      <div className="absolute left-0 h-[2px] rounded-full bg-mauve" style={{ width: `${((posterZoom - 1) / 2) * 100}%` }} />
                      <input type="range" min="1" max="3" step="0.01" value={posterZoom}
                        onChange={(e) => { const nz = parseFloat(e.target.value); setPosterZoom(nz); posterZoomRef.current = nz; }}
                        className="relative w-full h-5 appearance-none bg-transparent cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer" />
                    </div>
                    <span className="text-[10px] text-muted">+</span>
                  </div>
                </div>
              );
            })() : (
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
