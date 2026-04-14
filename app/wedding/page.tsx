'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/lib/realtime';
import { useUser } from '@/components/UserContext';
import { seedIfEmpty } from '@/lib/seed';

async function uploadWeddingImage(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `wedding/elements/${fileName}`;
  const { error } = await supabase.storage.from('media').upload(path, file);
  if (error) return null;
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}

// ── Types ────────────────────────────────────────────────────

interface WeddingNote { id: string; user_name: string; content: string; updated_at: string; }
interface WeddingElement {
  id: string; title: string; category: string; description: string | null;
  status: 'dream' | 'in_progress' | 'done'; priority: boolean; order_index?: number | null;
  created_by: string | null; created_at: string;
}
interface ElementImage { id: string; element_id: string; url: string; caption: string | null; }
interface BudgetItem {
  id: string; category: string; label: string; estimated: number; actual: number; paid: boolean; notes: string;
}

// ── Constants ────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  'Vision', 'Invites', 'On the Day',
  'Preparation (Bride)', 'Preparation (Groom)', 'Preparation (Together)',
  'Photographer', 'Dress', 'Venue', 'Flowers & Decor', 'Colors & Mood', 'Other',
];
const CAT_COLORS: Record<string, string> = {
  'Vision': 'bg-amber-50 text-amber-700 border-amber-200',
  'Invites': 'bg-mauve/10 text-mauve border-mauve/20',
  'On the Day': 'bg-rose-50 text-rose-600 border-rose-200',
  'Preparation (Bride)': 'bg-pink-50 text-pink-600 border-pink-200',
  'Preparation (Groom)': 'bg-sky-50 text-sky-600 border-sky-200',
  'Preparation (Together)': 'bg-violet-50 text-violet-600 border-violet-200',
  'Photographer': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  'Dress': 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200',
  'Venue': 'bg-teal-50 text-teal-600 border-teal-200',
  'Flowers & Decor': 'bg-lime-50 text-lime-600 border-lime-200',
  'Colors & Mood': 'bg-indigo-50 text-indigo-600 border-indigo-200',
  'Other': 'bg-surface-hover/50 text-muted border-border',
};
const STATUS_COLORS: Record<string, string> = {
  dream: 'bg-surface-hover text-mauve/80',
  in_progress: 'bg-mauve/10 text-mauve',
  done: 'bg-green-50 text-sage',
};
const BUDGET_CATS = ['Venue', 'Catering', 'Photography', 'Dress', 'Decor', 'Music', 'Invites', 'Rings', 'Honeymoon', 'Other'];

const SEED_ELEMENTS: Omit<WeddingElement, 'id' | 'created_at' | 'created_by'>[] = [
  { title: 'Suit with pictures/writings inside', category: 'Vision', description: 'Hidden meaningful photos and notes sewn into the suit lining', status: 'dream', priority: false },
  { title: 'Bring wife to wedding events', category: 'Vision', description: null, status: 'dream', priority: false },
  { title: 'Hire videographer', category: 'Vision', description: 'Movie where we are the main characters', status: 'dream', priority: false },
  { title: 'Learn to dance together', category: 'Vision', description: null, status: 'dream', priority: false },
  { title: 'Write each other letters to open before walking down the aisle', category: 'Vision', description: null, status: 'dream', priority: false },
  { title: 'Frame our vows', category: 'Vision', description: null, status: 'dream', priority: false },
  { title: 'Princess lift during ceremony', category: 'Vision', description: null, status: 'dream', priority: false },
  { title: 'Get wedding dress in Asia', category: 'Vision', description: null, status: 'dream', priority: true },
  { title: 'Kahoot game for guests', category: 'Vision', description: null, status: 'dream', priority: false },
  { title: 'Create wedding photo album', category: 'Vision', description: null, status: 'dream', priority: false },
  { title: 'Red envelope tosses', category: 'Vision', description: null, status: 'dream', priority: false },
  { title: 'Wedding color analysis', category: 'Vision', description: null, status: 'dream', priority: false },
  { title: 'Write start time 30 min before actual start', category: 'Invites', description: null, status: 'dream', priority: false },
  { title: 'Make directions clear', category: 'Invites', description: 'Parking, entrances, where to go if running late', status: 'dream', priority: false },
  { title: 'Start seating early and intentionally', category: 'On the Day', description: null, status: 'dream', priority: false },
  { title: 'Over-communicate everything', category: 'On the Day', description: 'Wedding website, reminder texts, signage', status: 'dream', priority: false },
  { title: 'Have someone in charge of coordination', category: 'On the Day', description: 'Planner, coordinator, or one assertive friend', status: 'dream', priority: false },
  { title: 'Trial hair and makeup', category: 'Preparation (Bride)', description: null, status: 'dream', priority: false },
  { title: 'Make list for photos', category: 'Preparation (Bride)', description: null, status: 'dream', priority: false },
  { title: 'Save the small things', category: 'Preparation (Bride)', description: null, status: 'dream', priority: false },
  { title: 'Get haircut 2 weeks prior', category: 'Preparation (Groom)', description: null, status: 'dream', priority: false },
  { title: 'Be emotional and show feelings', category: 'Preparation (Groom)', description: null, status: 'dream', priority: false },
  { title: 'Take time together before reception', category: 'Preparation (Together)', description: null, status: 'dream', priority: false },
  { title: 'Practice the dance', category: 'Preparation (Together)', description: null, status: 'dream', priority: false },
  { title: 'Eat before the ceremony', category: 'Preparation (Together)', description: null, status: 'dream', priority: false },
  { title: 'Written agreement', category: 'Photographer', description: null, status: 'dream', priority: false },
  { title: 'Backup plan if gear fails', category: 'Photographer', description: 'Multiple cameras', status: 'dream', priority: false },
  { title: 'Timeline and lighting help', category: 'Photographer', description: 'Thinking about the full picture #goldenhour', status: 'dream', priority: false },
  { title: 'Review previous work', category: 'Photographer', description: null, status: 'dream', priority: false },
  { title: 'Meet them before booking', category: 'Photographer', description: '#vibes', status: 'dream', priority: false },
  { title: 'Communication style check', category: 'Photographer', description: null, status: 'dream', priority: false },
  { title: 'Reviews and tagged clients', category: 'Photographer', description: null, status: 'dream', priority: false },
];

const BUDGET_SEED: Omit<BudgetItem, 'id'>[] = [
  { category: 'Photography', label: 'Beginner Package', estimated: 2000, actual: 0, paid: false, notes: '$0–$2,000 range' },
  { category: 'Photography', label: 'Intermediate Package', estimated: 4000, actual: 0, paid: false, notes: '$2,000–$4,000 range' },
  { category: 'Photography', label: 'Pro Package', estimated: 5000, actual: 0, paid: false, notes: '$4,000+ range' },
  { category: 'Venue', label: 'Venue', estimated: 0, actual: 0, paid: false, notes: 'TBD' },
  { category: 'Catering', label: 'Catering', estimated: 0, actual: 0, paid: false, notes: 'TBD' },
  { category: 'Decor', label: 'Flowers & Decor', estimated: 0, actual: 0, paid: false, notes: 'TBD' },
  { category: 'Music', label: 'Music/DJ', estimated: 0, actual: 0, paid: false, notes: 'TBD' },
  { category: 'Dress', label: 'Dress & Suit', estimated: 0, actual: 0, paid: false, notes: '' },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ── Quick Ideas Jot Pad ─────────────────────────────────────

function JotPad({ user, label, color }: { user: string; label: string; color: string }) {
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.from('wedding_notes').select('*').eq('user_name', user).single().then(({ data }) => {
      if (data) { setContent(data.content || ''); setLastSaved(new Date(data.updated_at)); }
    });
  }, [user]);

  const save = useCallback((text: string) => {
    supabase.from('wedding_notes').upsert({ user_name: user, content: text }, { onConflict: 'user_name' }).then(() => setLastSaved(new Date()));
  }, [user]);

  const handleChange = (text: string) => {
    setContent(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(text), 500);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white`} style={{ backgroundColor: color }}>
          {label[0]}
        </div>
        <span className="text-xs font-medium text-foreground/70">{label}&apos;s notes</span>
      </div>
      <textarea value={content} onChange={(e) => handleChange(e.target.value)}
        className="w-full h-28 p-3 rounded-xl glass-card text-sm text-foreground resize-none focus:outline-none focus:border-mauve/40/50 placeholder-muted"
        placeholder="Jot down ideas..." />
      {lastSaved && (
        <p className="text-[10px] text-muted mt-1">Last saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      )}
    </div>
  );
}

// ── Add/Edit Element Modal ──────────────────────────────────

function ElementModal({ element, onClose, onSave, categories }: {
  element: WeddingElement | null;
  onClose: () => void;
  onSave: (data: Omit<WeddingElement, 'id' | 'created_at' | 'created_by'>, newImages: string[]) => void;
  categories: string[];
}) {
  const [title, setTitle] = useState(element?.title || '');
  const [category, setCategory] = useState(element?.category || 'Vision');
  const [description, setDescription] = useState(element?.description || '');
  const [status, setStatus] = useState<WeddingElement['status']>(element?.status || 'dream');
  const [priority, setPriority] = useState(element?.priority || false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const url = await uploadWeddingImage(file);
      if (url) urls.push(url);
    }
    setPendingImages((prev) => [...prev, ...urls]);
    setUploading(false);
  };

  const removePending = (idx: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xl p-4">
      <div className="glass-strong rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fade-in border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading italic text-xl text-foreground/70">{element ? 'Edit Element' : 'Add Element'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-hover transition-colors">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground/70 mb-1 block">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground focus:outline-none focus:border-mauve/40" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/70 mb-1 block">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground focus:outline-none focus:border-mauve/40">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/70 mb-1 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground resize-none focus:outline-none focus:border-mauve/40"
              placeholder="Notes, ideas, details..." />
          </div>

          {/* Image upload */}
          <div>
            <label className="text-xs font-medium text-foreground/70 mb-1 block">Images (optional)</label>
            {pendingImages.length > 0 && (
              <div className="flex gap-2 mb-2 overflow-x-auto">
                {pendingImages.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePending(i)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs opacity-0 hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ))}
              </div>
            )}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
              className={`h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                dragOver ? 'border-mauve/40 bg-surface-hover' : 'border-border hover:border-mauve/40/50 hover:bg-surface'
              }`}
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-mauve/40 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 text-muted mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <span className="text-[10px] text-muted">Drop images or click to upload</span>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ''; }} />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-foreground/70">Status:</label>
            {(['dream', 'in_progress', 'done'] as const).map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${status === s ? STATUS_COLORS[s] : 'bg-surface-hover/50 text-muted'}`}>
                {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPriority(!priority)}
              className={`text-lg transition-transform ${priority ? 'text-mauve/80 scale-110' : 'text-muted/60'}`}>✦</button>
            <span className="text-xs text-foreground/70">High priority</span>
          </div>
          <button type="button" onClick={() => { if (!title.trim()) return; onSave({ title: title.trim(), category, description: description.trim() || null, status, priority }, pendingImages); }}
            disabled={!title.trim()}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${title.trim() ? 'bg-mauve text-white hover:bg-mauve/90' : 'bg-surface-hover text-muted'}`}>
            {element ? 'Save Changes' : 'Add Element'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Element Card ────────────────────────────────────────────

function ElementCard({ el, images, allCategories, onEdit, onDelete, onStatusChange, onAddImages, onDeleteImage, onMoveCategory, onMoveUp, onMoveDown }: {
  el: WeddingElement; images: ElementImage[]; allCategories: string[];
  onEdit: () => void; onDelete: () => void;
  onStatusChange: (status: WeddingElement['status']) => void;
  onAddImages: (files: FileList) => void;
  onDeleteImage: (imageId: string) => void;
  onMoveCategory: (id: string, category: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const addFileRef = useRef<HTMLInputElement>(null);
  const catColor = CAT_COLORS[el.category] || CAT_COLORS['Other'];
  const hasImages = images.length > 0;

  return (
    <div className="group relative glass-card rounded-2xl/60 p-4 hover:shadow-md transition-all">
      {/* Priority star */}
      {el.priority && <span className="absolute top-3 right-10 text-mauve/80 text-sm">✦</span>}

      {/* Hover actions */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={onMoveUp} title="Move up" className="w-6 h-6 rounded-full bg-surface-hover flex items-center justify-center text-foreground/70 hover:bg-mauve/100/20 text-[10px]">↑</button>
        <button onClick={onMoveDown} title="Move down" className="w-6 h-6 rounded-full bg-surface-hover flex items-center justify-center text-foreground/70 hover:bg-mauve/100/20 text-[10px]">↓</button>
        <button onClick={onEdit} className="w-6 h-6 rounded-full bg-surface-hover flex items-center justify-center text-foreground/70 hover:bg-mauve/100/20 text-xs">✎</button>
        <button onClick={onDelete} className="w-6 h-6 rounded-full bg-surface-hover flex items-center justify-center text-red-400 hover:bg-red-50 text-xs">✕</button>
      </div>

      {/* Top image — if first image exists, show it large */}
      {hasImages && (
        <div className="relative -mx-4 -mt-4 mb-3 rounded-t-2xl overflow-hidden cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <img src={images[0].url} alt="" className="w-full h-40 object-cover" />
          {images.length > 1 && (
            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-medium">+{images.length - 1}</span>
          )}
        </div>
      )}

      {/* Category badge — clickable to move */}
      <div className="relative inline-block mb-2">
        <button onClick={() => setShowMoveMenu(!showMoveMenu)}
          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${catColor} hover:opacity-80 transition-opacity`}
          title="Click to move category">
          {el.category}
        </button>
        {showMoveMenu && (
          <div className="absolute top-full left-0 mt-1 bg-surface rounded-xl shadow-lg border border-border p-1.5 z-20 min-w-[160px] animate-fade-in max-h-60 overflow-y-auto">
            {allCategories.filter((c) => c !== el.category).map((c) => (
              <button key={c} onClick={() => { onMoveCategory(el.id, c); setShowMoveMenu(false); }}
                className="block w-full text-left px-3 py-1.5 rounded-lg text-xs text-foreground/70 hover:bg-surface-hover transition-colors">
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Title */}
      <button onClick={() => setExpanded(!expanded)} className="block text-left w-full">
        <h3 className={`font-heading text-base text-foreground ${el.priority ? 'italic' : ''}`}>{el.title}</h3>
        {el.description && !expanded && (
          <p className="text-xs text-muted mt-1 line-clamp-2">{el.description}</p>
        )}
      </button>

      {/* Status pill */}
      <button onClick={() => {
        const next: Record<string, WeddingElement['status']> = { dream: 'in_progress', in_progress: 'done', done: 'dream' };
        onStatusChange(next[el.status]);
      }} className={`mt-2 px-2.5 py-1 rounded-full text-[10px] font-medium ${STATUS_COLORS[el.status]}`}>
        {el.status === 'dream' ? 'Dream' : el.status === 'in_progress' ? 'In Progress' : '✓ Done'}
      </button>

      {/* Secondary image thumbnails (if >1 image, show rest as strip) */}
      {images.length > 1 && !expanded && (
        <div className="flex gap-1.5 mt-3 overflow-x-auto items-center">
          {images.slice(1).map((img) => (
            <img key={img.id} src={img.url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 cursor-pointer" onClick={() => setExpanded(true)} />
          ))}
        </div>
      )}

      {/* Add photo button */}
      <div className="flex items-center gap-2 mt-2">
        <button onClick={() => addFileRef.current?.click()}
          className="text-[10px] text-muted hover:text-mauve/80 transition-colors opacity-0 group-hover:opacity-100">
          + Add photo
        </button>
      </div>

      <input ref={addFileRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => { if (e.target.files?.length) onAddImages(e.target.files); e.target.value = ''; }} />

      {/* Expanded view */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/50 animate-fade-in">
          {el.description && <p className="text-xs text-foreground/70 leading-relaxed mb-3 whitespace-pre-wrap">{el.description}</p>}
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative group/img rounded-xl overflow-hidden">
                  <img src={img.url} alt="" className="w-full rounded-xl object-cover" />
                  {img.caption && <p className="text-[10px] text-muted mt-1 px-1">{img.caption}</p>}
                  <button onClick={() => onDeleteImage(img.id)}
                    className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white text-[10px] opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Donut Chart ─────────────────────────────────────────────

function DonutChart({ items }: { items: BudgetItem[] }) {
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => { map[i.category] = (map[i.category] || 0) + i.estimated; });
    return Object.entries(map).filter(([, v]) => v > 0);
  }, [items]);

  const total = byCategory.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return null;

  const colors = ['#7BA5D4', '#F4A5B0', '#93C5FD', '#A8C5A0', '#C9A0B4', '#FDA4AF', '#8BB8B0', '#BFDBFE', '#B8A0C9', '#A0B8C5'];
  let cumulative = 0;
  const segments = byCategory.map(([cat, val], i) => {
    const start = cumulative;
    cumulative += (val / total) * 360;
    return { cat, val, start, end: cumulative, color: colors[i % colors.length] };
  });

  const gradient = segments.map((s) => `${s.color} ${s.start}deg ${s.end}deg`).join(', ');

  return (
    <div className="flex items-center gap-6 mb-6">
      <div className="w-24 h-24 rounded-full shrink-0" style={{
        background: `conic-gradient(${gradient})`,
        mask: 'radial-gradient(circle at center, transparent 40%, black 41%)',
        WebkitMask: 'radial-gradient(circle at center, transparent 40%, black 41%)',
      }} />
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <div key={s.cat} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] text-foreground/70">{s.cat}</span>
            <span className="text-[10px] text-muted">${s.val.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function WeddingPage() {
  const { currentUser } = useUser();
  const [elements, setElements] = useState<WeddingElement[]>([]);
  const [elementImages, setElementImages] = useState<ElementImage[]>([]);
  const [budget, setBudget] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showAddElement, setShowAddElement] = useState(false);
  const [editingElement, setEditingElement] = useState<WeddingElement | null>(null);
  const [filterCat, setFilterCat] = useState('All');
  const [jotDrawerOpen, setJotDrawerOpen] = useState(false);

  // ── Fetchers ──────────────────────────────────────────────

  const fetchElements = useCallback(async () => {
    const { data } = await supabase.from('wedding_elements').select('*').order('order_index', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true });
    if (data) setElements(data);
  }, []);

  const fetchElementImages = useCallback(async () => {
    const { data } = await supabase.from('wedding_element_images').select('*');
    if (data) setElementImages(data);
  }, []);

  const fetchBudget = useCallback(async () => {
    const { data } = await supabase.from('wedding_budget').select('*').order('created_at', { ascending: true });
    if (data) setBudget(data.map((r) => ({ ...r, estimated: Number(r.estimated), actual: Number(r.actual) })));
  }, []);

  // ── Init + seed ───────────────────────────────────────────

  useEffect(() => {
    (async () => {
      await seedIfEmpty('wedding_elements', SEED_ELEMENTS as any);
      await seedIfEmpty('wedding_budget', BUDGET_SEED as any);
      await Promise.all([fetchElements(), fetchElementImages(), fetchBudget()]);
      setLoading(false);
    })();
  }, [fetchElements, fetchElementImages, fetchBudget]);

  // ── Realtime ──────────────────────────────────────────────

  useRealtimeSync('wedding_elements', fetchElements);
  useRealtimeSync('wedding_element_images', fetchElementImages);
  useRealtimeSync('wedding_budget', fetchBudget);
  useRealtimeSync('wedding_notes', () => {});

  // ── Element handlers ──────────────────────────────────────

  const handleSaveElement = async (data: Omit<WeddingElement, 'id' | 'created_at' | 'created_by'>, newImageUrls: string[]) => {
    let elementId: string | null = null;
    if (editingElement) {
      const { error } = await supabase.from('wedding_elements').update({
        title: data.title, category: data.category, description: data.description,
        status: data.status, priority: data.priority,
      }).eq('id', editingElement.id);
      if (error) console.error('Update element error:', error.message);
      elementId = editingElement.id;
    } else {
      const { data: inserted, error } = await supabase.from('wedding_elements').insert({ ...data, created_by: currentUser }).select('id').single();
      if (error) {
        // Retry without order_index in case column doesn't exist yet
        const { data: inserted2 } = await supabase.from('wedding_elements')
          .insert({ title: data.title, category: data.category, description: data.description, status: data.status, priority: data.priority, created_by: currentUser })
          .select('id').single();
        elementId = inserted2?.id ?? null;
      } else {
        elementId = inserted?.id ?? null;
      }
    }
    // Save images
    if (elementId && newImageUrls.length > 0) {
      await supabase.from('wedding_element_images').insert(
        newImageUrls.map((url) => ({ element_id: elementId!, url, caption: null }))
      );
      fetchElementImages();
    }
    setShowAddElement(false);
    setEditingElement(null);
    fetchElements();
  };

  const handleAddImagesToElement = async (elementId: string, files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const url = await uploadWeddingImage(file);
      if (url) {
        await supabase.from('wedding_element_images').insert({ element_id: elementId, url, caption: null });
      }
    }
    fetchElementImages();
  };

  const handleDeleteElementImage = async (imageId: string) => {
    await supabase.from('wedding_element_images').delete().eq('id', imageId);
    fetchElementImages();
  };

  const handleDeleteElement = async (id: string) => {
    await supabase.from('wedding_elements').delete().eq('id', id);
    fetchElements();
  };

  const handleElementStatus = async (id: string, status: WeddingElement['status']) => {
    await supabase.from('wedding_elements').update({ status }).eq('id', id);
    fetchElements();
  };

  const handleMoveCategory = async (id: string, category: string) => {
    await supabase.from('wedding_elements').update({ category }).eq('id', id);
    fetchElements();
  };

  const handleReorder = async (id: string, direction: 'up' | 'down', categoryItems: WeddingElement[]) => {
    const idx = categoryItems.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categoryItems.length) return;

    // Optimistically swap in local state immediately
    const newElements = [...elements];
    const globalIdxA = newElements.findIndex((e) => e.id === categoryItems[idx].id);
    const globalIdxB = newElements.findIndex((e) => e.id === categoryItems[swapIdx].id);
    if (globalIdxA >= 0 && globalIdxB >= 0) {
      [newElements[globalIdxA], newElements[globalIdxB]] = [newElements[globalIdxB], newElements[globalIdxA]];
      setElements(newElements);
    }

    // Persist: assign sequential order_index to all items in this category
    const cat = categoryItems[idx].category;
    const reordered = [...categoryItems];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];

    // Try to update order_index for each item
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from('wedding_elements').update({ order_index: i }).eq('id', reordered[i].id).then(({ error }) => {
        if (error) {
          // order_index column doesn't exist — update created_at as workaround
          // Skip silently, the optimistic update already handles the visual
        }
      });
    }
  };

  // ── Budget handlers ───────────────────────────────────────

  const budgetTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleUpdateBudget = (item: BudgetItem) => {
    setBudget((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    // Debounce DB write per item
    if (budgetTimerRef.current[item.id]) clearTimeout(budgetTimerRef.current[item.id]);
    budgetTimerRef.current[item.id] = setTimeout(async () => {
      await supabase.from('wedding_budget').update({
        category: item.category, label: item.label, estimated: item.estimated,
        actual: item.actual, paid: item.paid, notes: item.notes,
      }).eq('id', item.id);
    }, 400);
  };

  const handleAddBudget = async () => {
    const newRow = { category: 'Other', label: 'New Item', estimated: 0, actual: 0, paid: false, notes: '' };
    const { data, error } = await supabase.from('wedding_budget').insert(newRow).select().single();
    if (error) {
      // Fallback: try without label/paid in case old schema
      const { data: d2 } = await supabase.from('wedding_budget').insert({ category: 'Other', estimated: 0, actual: 0, notes: '' }).select().single();
      if (d2) setBudget((prev) => [...prev, { id: d2.id, category: d2.category, label: d2.label ?? d2.category, estimated: Number(d2.estimated), actual: Number(d2.actual), paid: d2.paid ?? false, notes: d2.notes ?? '' }]);
      return;
    }
    if (data) setBudget((prev) => [...prev, { id: data.id, category: data.category, label: data.label ?? data.category, estimated: Number(data.estimated), actual: Number(data.actual), paid: data.paid ?? false, notes: data.notes ?? '' }]);
  };

  const handleDeleteBudget = async (id: string) => {
    setBudget((prev) => prev.filter((i) => i.id !== id));
    await supabase.from('wedding_budget').delete().eq('id', id);
  };

  // ── Category management (Vision Board) ─────────────────────

  const [showVisionCatMgr, setShowVisionCatMgr] = useState(false);
  const [newVisionCat, setNewVisionCat] = useState('');
  const [renamingVisionCat, setRenamingVisionCat] = useState<string | null>(null);
  const [renameVisionVal, setRenameVisionVal] = useState('');

  const liveCats = [...new Set(elements.map((e) => e.category))];
  const allVisionCats = [...new Set([...DEFAULT_CATEGORIES, ...liveCats])];

  const handleAddVisionCat = () => {
    const name = newVisionCat.trim();
    if (!name || allVisionCats.includes(name)) return;
    const custom: string[] = JSON.parse(localStorage.getItem('js-wedding-cats') || '[]');
    custom.push(name);
    localStorage.setItem('js-wedding-cats', JSON.stringify(custom));
    setNewVisionCat('');
    setShowVisionCatMgr(false);
    setElements([...elements]); // force re-render
  };

  const handleRenameVisionCat = async (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) return;
    await supabase.from('wedding_elements').update({ category: newName.trim() }).eq('category', oldName);
    const custom: string[] = JSON.parse(localStorage.getItem('js-wedding-cats') || '[]');
    const idx = custom.indexOf(oldName);
    if (idx !== -1) custom[idx] = newName.trim();
    localStorage.setItem('js-wedding-cats', JSON.stringify(custom));
    setRenamingVisionCat(null);
    fetchElements();
  };

  const handleDeleteVisionCat = async (catName: string) => {
    await supabase.from('wedding_elements').delete().eq('category', catName);
    const custom: string[] = JSON.parse(localStorage.getItem('js-wedding-cats') || '[]');
    localStorage.setItem('js-wedding-cats', JSON.stringify(custom.filter((c) => c !== catName)));
    fetchElements();
  };

  const customVisionCats: string[] = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('js-wedding-cats') || '[]') : [];
  const displayVisionCats = [...new Set([...allVisionCats, ...customVisionCats])];

  // ── Filtered elements ─────────────────────────────────────

  const filteredElements = filterCat === 'All' ? elements : elements.filter((e) => e.category === filterCat);
  const groupedElements = useMemo(() => {
    const groups: Record<string, WeddingElement[]> = {};
    filteredElements.forEach((e) => {
      if (!groups[e.category]) groups[e.category] = [];
      groups[e.category].push(e);
    });
    return groups;
  }, [filteredElements]);

  const totals = useMemo(() => {
    const estimated = budget.reduce((s, i) => s + i.estimated, 0);
    const actual = budget.reduce((s, i) => s + i.actual, 0);
    return { estimated, actual, diff: estimated - actual };
  }, [budget]);

  if (loading) {
    return <Layout><div className="flex items-center justify-center py-32"><div className="w-8 h-8 rounded-full border-2 border-mauve/40 border-t-transparent animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="pb-12">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#F8FAFF] via-[#EEF2FF] to-[#DBEAFE]/30 px-6 py-10 sm:py-14 text-center mb-10">
          <div className="absolute top-4 right-8 opacity-10 text-5xl select-none pointer-events-none">💍</div>
          <div className="absolute bottom-4 left-8 opacity-10 text-3xl select-none pointer-events-none">🌸</div>
          <h1 className="font-heading italic text-4xl sm:text-5xl text-mauve/80 tracking-tight">J + S</h1>
          <p className="font-heading italic text-lg text-mauve/80/60 mt-1">Our Wedding</p>
        </div>

        {/* ── Main layout: sidebar + content ──────────────── */}
        <div className="flex gap-8">
          {/* Left Sidebar — Jot Pad (desktop only) */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-36">
              <h3 className="font-heading italic text-sm text-mauve/80 mb-4">Quick Ideas ✦</h3>
              <JotPad user="joshua" label="Joshua" color="#7BA5D4" />
              <JotPad user="sophie" label="Sophie" color="#F4A5B0" />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-12">

            {/* ═══ VISION BOARD ═══ */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading italic text-2xl text-foreground/70">Wedding Board ✦</h2>
                <button onClick={() => { setEditingElement(null); setShowAddElement(true); }}
                  className="px-4 py-2 rounded-xl bg-mauve text-white text-sm font-medium hover:bg-mauve/90 active:scale-95 transition-all shadow-lg shadow-mauve/25">
                  + Add Element
                </button>
              </div>

              {/* Filter pills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {['All', ...displayVisionCats].map((c) => (
                  <button key={c} onClick={() => setFilterCat(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      filterCat === c ? 'bg-mauve text-white' : 'bg-surface-hover text-foreground/70 hover:bg-mauve/100/20'
                    }`}>{c}</button>
                ))}
                <button onClick={() => setShowVisionCatMgr(!showVisionCatMgr)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface-hover text-mauve/80 hover:bg-mauve/100/20 transition-all">
                  ⚙ Categories
                </button>
              </div>

              {/* Category manager */}
              {showVisionCatMgr && (
                <div className="mb-6 p-4 rounded-2xl border border-dashed border-border bg-surface space-y-3 animate-fade-in">
                  <div className="flex gap-2">
                    <input type="text" value={newVisionCat} onChange={(e) => setNewVisionCat(e.target.value)}
                      placeholder="New category name..." onKeyDown={(e) => e.key === 'Enter' && handleAddVisionCat()}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground focus:outline-none focus:border-mauve/40" />
                    <button onClick={handleAddVisionCat}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${newVisionCat.trim() ? 'bg-mauve text-white hover:bg-mauve/90' : 'bg-surface-hover text-muted'}`}>Add</button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {displayVisionCats.map((cat) => (
                      <div key={cat} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface/60">
                        {renamingVisionCat === cat ? (
                          <input type="text" value={renameVisionVal} onChange={(e) => setRenameVisionVal(e.target.value)} autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameVisionCat(cat, renameVisionVal); if (e.key === 'Escape') setRenamingVisionCat(null); }}
                            className="flex-1 px-2 py-1 rounded border border-border bg-surface text-sm text-foreground focus:outline-none" />
                        ) : (
                          <span className="flex-1 text-sm text-foreground">{cat}</span>
                        )}
                        <span className="text-[10px] text-muted">{elements.filter((e) => e.category === cat).length}</span>
                        {renamingVisionCat === cat ? (
                          <button onClick={() => handleRenameVisionCat(cat, renameVisionVal)} className="text-xs text-mauve/80 hover:text-blue-300 font-medium">Save</button>
                        ) : (
                          <button onClick={() => { setRenamingVisionCat(cat); setRenameVisionVal(cat); }} className="text-xs text-muted hover:text-mauve/80">Rename</button>
                        )}
                        <button onClick={() => { if (confirm(`Delete "${cat}" and all its elements?`)) handleDeleteVisionCat(cat); }}
                          className="text-xs text-muted hover:text-red-400">Delete</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setShowVisionCatMgr(false)} className="text-xs text-muted hover:text-foreground/70">Close</button>
                </div>
              )}

              {/* Cards by category */}
              {Object.entries(groupedElements).map(([cat, items]) => {
                const done = items.filter((i) => i.status === 'done').length;
                return (
                  <div key={cat} className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-heading italic text-lg text-foreground/70">{cat}</h3>
                      <span className="text-[10px] text-muted font-medium">{done}/{items.length} done</span>
                      <div className="flex-1 h-1 rounded-full bg-surface-hover overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500/50 transition-all" style={{ width: `${items.length > 0 ? (done / items.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {items.map((el) => (
                        <ElementCard key={el.id} el={el}
                          images={elementImages.filter((img) => img.element_id === el.id)}
                          allCategories={displayVisionCats}
                          onEdit={() => { setEditingElement(el); setShowAddElement(true); }}
                          onDelete={() => handleDeleteElement(el.id)}
                          onStatusChange={(s) => handleElementStatus(el.id, s)}
                          onAddImages={(files) => handleAddImagesToElement(el.id, files)}
                          onDeleteImage={handleDeleteElementImage}
                          onMoveCategory={handleMoveCategory}
                          onMoveUp={() => handleReorder(el.id, 'up', items)}
                          onMoveDown={() => handleReorder(el.id, 'down', items)} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {Object.keys(groupedElements).length === 0 && (
                <p className="text-sm text-muted text-center py-12">No elements yet — start dreaming!</p>
              )}
            </section>

            {/* ═══ BUDGET ═══ */}
            <section>
              <h2 className="font-heading italic text-2xl text-foreground/70 mb-6">Budget ✦</h2>

              <DonutChart items={budget} />

              <div className="overflow-x-auto rounded-2xl border border-border/60 bg-surface/80">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface">
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground/70">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground/70">Label</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-foreground/70">Estimated</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-foreground/70">Actual</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-foreground/70">Diff</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-foreground/70">Paid</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-foreground/70">Notes</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {budget.map((item, idx) => {
                      const diff = item.estimated - item.actual;
                      return (
                        <tr key={item.id} className={`border-t border-border/30 transition-colors ${item.paid ? 'bg-sage/10' : idx % 2 === 0 ? 'bg-surface/50' : ''} hover:bg-surface-hover/50 group`}>
                          <td className="px-4 py-2.5">
                            <select value={item.category} onChange={(e) => handleUpdateBudget({ ...item, category: e.target.value })}
                              className="bg-transparent text-xs text-foreground outline-none cursor-pointer">
                              {BUDGET_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2.5">
                            <input type="text" value={item.label} onChange={(e) => handleUpdateBudget({ ...item, label: e.target.value })}
                              className="bg-transparent text-sm text-foreground outline-none w-full border-b border-transparent focus:border-mauve/40/50" />
                          </td>
                          <td className="text-right px-4 py-2.5">
                            <input type="number" value={item.estimated} onChange={(e) => handleUpdateBudget({ ...item, estimated: parseFloat(e.target.value) || 0 })}
                              className="bg-transparent text-sm text-foreground outline-none w-20 text-right border-b border-transparent focus:border-mauve/40/50" />
                          </td>
                          <td className="text-right px-4 py-2.5">
                            <input type="number" value={item.actual} onChange={(e) => handleUpdateBudget({ ...item, actual: parseFloat(e.target.value) || 0 })}
                              className="bg-transparent text-sm text-foreground outline-none w-20 text-right border-b border-transparent focus:border-mauve/40/50" />
                          </td>
                          <td className={`text-right px-4 py-2.5 text-xs font-medium ${diff > 0 ? 'text-sage' : diff < 0 ? 'text-red-500' : 'text-muted'}`}>
                            {diff !== 0 && (diff > 0 ? '+' : '')}${Math.abs(diff).toLocaleString()}
                          </td>
                          <td className="text-center px-3 py-2.5">
                            <input type="checkbox" checked={item.paid} onChange={(e) => handleUpdateBudget({ ...item, paid: e.target.checked })}
                              className="w-4 h-4 rounded border-border text-sage focus:ring-green-200 cursor-pointer" />
                          </td>
                          <td className="px-4 py-2.5">
                            <input type="text" value={item.notes} onChange={(e) => handleUpdateBudget({ ...item, notes: e.target.value })}
                              className="bg-transparent text-xs text-muted outline-none w-full border-b border-transparent focus:border-mauve/40/50" placeholder="Notes..." />
                          </td>
                          <td className="px-2 py-2.5">
                            <button onClick={() => handleDeleteBudget(item.id)}
                              className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-full text-muted/60 hover:text-red-400 transition-all text-xs">✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border/80 bg-surface">
                      <td className="px-4 py-3 font-medium text-foreground" colSpan={2}>Total</td>
                      <td className="text-right px-4 py-3 font-semibold text-foreground">${totals.estimated.toLocaleString()}</td>
                      <td className="text-right px-4 py-3 font-semibold text-foreground">${totals.actual.toLocaleString()}</td>
                      <td className={`text-right px-4 py-3 font-semibold ${totals.diff >= 0 ? 'text-sage' : 'text-red-500'}`}>
                        {totals.diff >= 0 ? '+' : ''}${totals.diff.toLocaleString()}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
                <div className="px-4 py-3 border-t border-border/40">
                  <button onClick={handleAddBudget}
                    className="flex items-center gap-1.5 text-sm text-mauve/80 hover:text-blue-300 transition-colors">
                    + Add expense
                  </button>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* ── Mobile jot pad drawer ────────────────────────── */}
      <button onClick={() => setJotDrawerOpen(!jotDrawerOpen)}
        className="lg:hidden fixed bottom-6 right-6 w-12 h-12 rounded-full bg-mauve text-white shadow-lg flex items-center justify-center z-50 hover:bg-mauve/90 transition-colors">
        ✎
      </button>
      {jotDrawerOpen && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-surface border-t border-border rounded-t-3xl p-6 shadow-2xl animate-fade-in max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading italic text-sm text-mauve/80">Quick Ideas ✦</h3>
            <button onClick={() => setJotDrawerOpen(false)} className="text-muted text-lg">✕</button>
          </div>
          <JotPad user="joshua" label="Joshua" color="#7BA5D4" />
          <JotPad user="sophie" label="Sophie" color="#F4A5B0" />
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────── */}
      {showAddElement && (
        <ElementModal
          element={editingElement}
          onClose={() => { setShowAddElement(false); setEditingElement(null); }}
          onSave={handleSaveElement}
          categories={displayVisionCats}
        />
      )}
    </Layout>
  );
}
