'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/lib/realtime';
import { useUser } from '@/components/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Star, Trash2, Pencil, Plus, ExternalLink, Check, Bookmark, Heart, X } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────

interface BabyName {
  id: string; name: string; meaning: string | null; origin: string | null;
  vibe_tags: string[]; gender: 'girl' | 'boy' | 'neutral'; notes: string | null;
  joshua_loves: boolean; sophie_loves: boolean; created_by: string | null; created_at: string;
}
interface ParentingTip {
  id: string; tip: string; subcategory: string | null; source: string | null;
  bookmarked: boolean; joshua_agrees: boolean; sophie_agrees: boolean;
  created_by: string | null; created_at: string;
}
interface ParentingTodo {
  id: string; item: string; type: 'buy' | 'do' | 'research' | 'ask_doctor';
  priority: number; price_estimate: number | null; link: string | null;
  status: 'todo' | 'in_progress' | 'done'; notes: string | null;
  created_by: string | null; created_at: string;
}
interface HomeRoom {
  id: string; name: string; vibe: string | null; color_palette: string[];
  notes_joshua: string | null; notes_sophie: string | null; order_index: number; created_at: string;
}
interface RoomItem {
  id: string; room_id: string; name: string; image_url: string | null;
  price_estimate: number | null; link: string | null;
  status: 'dream' | 'saving' | 'ordered' | 'have_it'; priority: number;
  notes: string | null; created_by: string | null; created_at: string;
}
interface RoomMedia {
  id: string; room_id: string; url: string; caption: string; order_index: number; created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────

async function uploadFamilyImage(file: File, path: string): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const fullPath = `${path}/${fileName}`;
  const { error } = await supabase.storage.from('media').upload(fullPath, file);
  if (error) { console.error(error); return null; }
  const { data } = supabase.storage.from('media').getPublicUrl(fullPath);
  return data.publicUrl;
}

const VIBE_TAGS = ['classic', 'cute', 'strong', 'unique', 'cottagecore', 'modern', 'vintage', 'biblical', 'nature', 'soft', 'elegant'];
const NAME_ORIGINS = ['Hebrew', 'Japanese', 'Irish', 'Greek', 'Latin', 'Korean', 'English', 'French', 'Arabic', 'Spanish', 'Italian', 'Celtic', 'Other'];
const TIP_SUBCATS = ['Pregnancy', 'Newborn', 'Sleep', 'Feeding', 'Development', 'Health', 'General'] as const;
const TIP_SOURCES = ['mom', 'friend', 'doctor', 'book', 'research', 'TikTok', 'Instagram', 'podcast', 'other'];

// ═══════════════════════════════════════════════════════════════
// BABY NAMES
// ═══════════════════════════════════════════════════════════════

function NameCard({ n, onLove, onEdit, onDelete, currentUser }: {
  n: BabyName; onLove: (who: 'joshua' | 'sophie', value: boolean) => void;
  onEdit: () => void; onDelete: () => void; currentUser: string | null;
}) {
  const both = n.joshua_loves && n.sophie_loves;
  const tint = n.gender === 'girl' ? 'from-rose-50/70 to-pink-50/30' :
               n.gender === 'boy' ? 'from-emerald-50/70 to-teal-50/30' :
               'from-amber-50/70 to-yellow-50/30';
  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl p-5 bg-gradient-to-br ${tint} border overflow-hidden group transition-all ${
        both ? 'border-amber-300 shadow-lg shadow-amber-200/40' : 'border-border/50 hover:shadow-md'
      }`}
      style={both ? { boxShadow: '0 0 0 1px rgba(251, 191, 36, 0.4), 0 10px 25px -5px rgba(251, 191, 36, 0.25)' } : undefined}>
      {both && (
        <>
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{ boxShadow: 'inset 0 0 30px rgba(251, 191, 36, 0.25)' }} />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute top-2 right-2 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm z-10">
            <motion.span animate={{ rotate: [0, 20, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>✦</motion.span>
            Both love this
          </motion.div>
        </>
      )}
      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="w-6 h-6 rounded-full bg-white/70 flex items-center justify-center text-muted hover:text-foreground"><Pencil className="w-3 h-3" /></button>
        <button onClick={onDelete} className="w-6 h-6 rounded-full bg-white/70 flex items-center justify-center text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
      </div>
      <h3 className="font-heading text-3xl sm:text-4xl text-foreground tracking-tight">{n.name}</h3>
      {n.meaning && <p className="text-xs italic text-muted mt-1">&ldquo;{n.meaning}&rdquo;</p>}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {n.origin && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/60 text-foreground/70 border border-border/40">{n.origin}</span>}
        {n.vibe_tags.map((v) => <span key={v} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/60 text-mauve border border-mauve/20">{v}</span>)}
      </div>
      {n.notes && (
        <p className="text-xs text-foreground/70 mt-3 italic">{n.notes}</p>
      )}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/30">
        <button onClick={() => onLove('joshua', !n.joshua_loves)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
            n.joshua_loves ? 'bg-blue-100 text-blue-600 scale-105' : 'bg-white/50 text-muted hover:text-blue-600'
          }`}>
          <Heart className={`w-3.5 h-3.5 ${n.joshua_loves ? 'fill-blue-500' : ''}`} /> J
        </button>
        <button onClick={() => onLove('sophie', !n.sophie_loves)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
            n.sophie_loves ? 'bg-pink-100 text-pink-600 scale-105' : 'bg-white/50 text-muted hover:text-pink-600'
          }`}>
          <Heart className={`w-3.5 h-3.5 ${n.sophie_loves ? 'fill-pink-500' : ''}`} /> S
        </button>
        {currentUser && <span className="ml-auto text-[10px] text-muted capitalize">added by {n.created_by}</span>}
      </div>
    </motion.div>
  );
}

function NameModal({ name, onClose, onSave }: {
  name: BabyName | null; onClose: () => void;
  onSave: (data: Omit<BabyName, 'id' | 'created_at' | 'created_by' | 'joshua_loves' | 'sophie_loves'>) => void;
}) {
  const [n, setN] = useState(name?.name || '');
  const [meaning, setMeaning] = useState(name?.meaning || '');
  const [origin, setOrigin] = useState(name?.origin || '');
  const [gender, setGender] = useState<BabyName['gender']>(name?.gender || 'girl');
  const [tags, setTags] = useState<string[]>(name?.vibe_tags || []);
  const [notes, setNotes] = useState(name?.notes || '');
  return (
    <div data-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xl p-4">
      <div className="glass-strong rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading italic text-xl text-foreground/80">{name ? 'Edit Name' : 'Add a Name'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-hover">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground/70 mb-1 block">Name *</label>
            <input autoFocus type="text" value={n} onChange={(e) => setN(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/70 mb-1 block">Meaning</label>
            <input type="text" value={meaning} onChange={(e) => setMeaning(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-foreground/70 mb-1 block">Origin</label>
              <select value={origin} onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-2 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40">
                <option value="">—</option>
                {NAME_ORIGINS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/70 mb-1 block">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value as BabyName['gender'])}
                className="w-full px-2 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40">
                <option value="girl">Girl</option>
                <option value="boy">Boy</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/70 mb-1 block">Vibe tags</label>
            <div className="flex flex-wrap gap-1.5">
              {VIBE_TAGS.map((v) => (
                <button key={v} type="button"
                  onClick={() => setTags((t) => t.includes(v) ? t.filter((x) => x !== v) : [...t, v])}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                    tags.includes(v) ? 'bg-mauve text-white' : 'bg-surface-hover text-muted hover:text-foreground'
                  }`}>{v}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/70 mb-1 block">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm resize-none focus:outline-none focus:border-mauve/40" />
          </div>
          <button type="button" disabled={!n.trim()}
            onClick={() => { if (n.trim()) onSave({ name: n.trim(), meaning: meaning.trim() || null, origin: origin || null, gender, vibe_tags: tags, notes: notes.trim() || null }); }}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${n.trim() ? 'bg-mauve text-white hover:bg-mauve/90' : 'bg-surface-hover text-muted'}`}>
            {name ? 'Save' : 'Add Name'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BabyNamesSection({ names, currentUser, onSave, onDelete, onLove }: {
  names: BabyName[]; currentUser: string | null;
  onSave: (data: Omit<BabyName, 'id' | 'created_at' | 'created_by' | 'joshua_loves' | 'sophie_loves'>, id?: string) => void;
  onDelete: (id: string) => void;
  onLove: (id: string, who: 'joshua' | 'sophie', value: boolean) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BabyName | null>(null);
  const [filter, setFilter] = useState<'all' | 'girl' | 'boy' | 'neutral' | 'both' | 'joshua' | 'sophie'>('all');
  const [sort, setSort] = useState<'alpha' | 'recent' | 'loved'>('alpha');

  const filtered = useMemo(() => {
    let res = [...names];
    if (filter === 'girl' || filter === 'boy' || filter === 'neutral') res = res.filter((n) => n.gender === filter);
    else if (filter === 'both') res = res.filter((n) => n.joshua_loves && n.sophie_loves);
    else if (filter === 'joshua') res = res.filter((n) => n.joshua_loves);
    else if (filter === 'sophie') res = res.filter((n) => n.sophie_loves);
    if (sort === 'alpha') res.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'recent') res.sort((a, b) => b.created_at.localeCompare(a.created_at));
    else res.sort((a, b) => (Number(b.joshua_loves) + Number(b.sophie_loves)) - (Number(a.joshua_loves) + Number(a.sophie_loves)));
    return res;
  }, [names, filter, sort]);

  const girls = filtered.filter((n) => n.gender === 'girl');
  const boys = filtered.filter((n) => n.gender === 'boy');
  const neutral = filtered.filter((n) => n.gender === 'neutral');
  const bothCount = names.filter((n) => n.joshua_loves && n.sophie_loves).length;

  return (
    <section id="baby-names" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-heading italic text-2xl text-rose-700">Baby Names ✦</h2>
        <button onClick={() => { setEditing(null); setShowModal(true); }}
          className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 shadow-md shadow-rose-200">
          + Add Name
        </button>
      </div>

      {/* Stats card */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { v: names.length, l: 'Total', c: '#C9A0B4' },
          { v: bothCount, l: 'Both love ✦', c: '#f59e0b' },
          { v: names.filter((n) => n.gender === 'girl').length, l: 'Girl', c: '#F4A5B0' },
          { v: names.filter((n) => n.gender === 'boy').length, l: 'Boy', c: '#10b981' },
        ].map((s) => (
          <div key={s.l} className="glass-card rounded-2xl p-3 relative overflow-hidden" style={{ borderLeft: `3px solid ${s.c}` }}>
            <div className="text-xl font-bold" style={{ color: s.c }}>{s.v}</div>
            <div className="text-[10px] text-muted">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {([
          ['all', 'All'], ['girl', 'Girl'], ['boy', 'Boy'], ['neutral', 'Neutral'],
          ['both', '✦ Both love'], ['joshua', 'Joshua\u2019s'], ['sophie', 'Sophie\u2019s'],
        ] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === k ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'glass text-muted hover:text-foreground'
            }`}>{l}</button>
        ))}
        <div className="w-px h-6 bg-border mx-1 self-center" />
        {([['alpha', 'A–Z'], ['recent', 'Recent'], ['loved', 'Most loved']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setSort(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              sort === k ? 'bg-mauve/10 text-mauve border border-mauve/20' : 'glass text-muted hover:text-foreground'
            }`}>{l}</button>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="font-heading italic text-sm text-rose-600 mb-2 px-1">Girl Names · {girls.length}</h3>
          <div className="space-y-3">
            <AnimatePresence>
              {girls.map((n) => (
                <NameCard key={n.id} n={n} currentUser={currentUser}
                  onLove={(who, v) => onLove(n.id, who, v)}
                  onEdit={() => { setEditing(n); setShowModal(true); }}
                  onDelete={() => { if (confirm(`Delete "${n.name}"?`)) onDelete(n.id); }} />
              ))}
            </AnimatePresence>
            {girls.length === 0 && <p className="text-xs text-muted italic py-4 text-center">No girl names yet</p>}
          </div>
        </div>
        <div>
          <h3 className="font-heading italic text-sm text-emerald-600 mb-2 px-1">Boy Names · {boys.length}</h3>
          <div className="space-y-3">
            <AnimatePresence>
              {boys.map((n) => (
                <NameCard key={n.id} n={n} currentUser={currentUser}
                  onLove={(who, v) => onLove(n.id, who, v)}
                  onEdit={() => { setEditing(n); setShowModal(true); }}
                  onDelete={() => { if (confirm(`Delete "${n.name}"?`)) onDelete(n.id); }} />
              ))}
            </AnimatePresence>
            {boys.length === 0 && <p className="text-xs text-muted italic py-4 text-center">No boy names yet</p>}
          </div>
        </div>
      </div>

      {/* Neutral */}
      {(neutral.length > 0 || filter === 'all' || filter === 'neutral') && (
        <div>
          <h3 className="font-heading italic text-sm text-amber-600 mb-2 px-1">Gender Neutral · {neutral.length}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence>
              {neutral.map((n) => (
                <NameCard key={n.id} n={n} currentUser={currentUser}
                  onLove={(who, v) => onLove(n.id, who, v)}
                  onEdit={() => { setEditing(n); setShowModal(true); }}
                  onDelete={() => { if (confirm(`Delete "${n.name}"?`)) onDelete(n.id); }} />
              ))}
            </AnimatePresence>
            {neutral.length === 0 && <p className="text-xs text-muted italic py-4 text-center col-span-2">No neutral names yet</p>}
          </div>
        </div>
      )}

      {showModal && (
        <NameModal name={editing} onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={(data) => { onSave(data, editing?.id); setShowModal(false); setEditing(null); }} />
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// PARENTING TIPS
// ═══════════════════════════════════════════════════════════════

function TipCard({ t, onUpdate, onDelete }: {
  t: ParentingTip; onUpdate: (u: Partial<ParentingTip>) => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const both = t.joshua_agrees && t.sophie_agrees;
  const long = t.tip.length > 140;
  return (
    <motion.div layout className={`group relative rounded-2xl p-4 bg-surface/60 border transition-all ${
      both ? 'border-amber-300 shadow-md shadow-amber-200/30' : 'border-border/50 hover:shadow-sm'
    }`}>
      <div className="flex items-start gap-2">
        <button onClick={() => onUpdate({ bookmarked: !t.bookmarked })} className="shrink-0 mt-0.5">
          <Bookmark className={`w-4 h-4 ${t.bookmarked ? 'fill-amber-400 text-amber-500' : 'text-muted'}`} />
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm text-foreground ${!expanded && long ? 'line-clamp-2' : ''}`}>{t.tip}</p>
          {long && (
            <button onClick={() => setExpanded(!expanded)} className="text-[11px] text-mauve/80 mt-1">
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {t.subcategory && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-600 border border-purple-100">{t.subcategory}</span>}
            {t.source && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-hover text-muted">from {t.source}</span>}
            {t.created_by && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize" style={{
              backgroundColor: t.created_by === 'joshua' ? '#dbeafe' : '#fce7f3', color: t.created_by === 'joshua' ? '#2563eb' : '#db2777',
            }}>{t.created_by[0].toUpperCase()}</span>}
            {both && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">✦ Both agree</span>}
            <span className="text-[10px] text-muted ml-auto">{new Date(t.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={() => onUpdate({ joshua_agrees: !t.joshua_agrees })}
              className={`text-[11px] px-2 py-0.5 rounded-full ${t.joshua_agrees ? 'bg-blue-100 text-blue-600' : 'bg-surface-hover text-muted'}`}>
              {t.joshua_agrees ? '✓ ' : ''}J agrees
            </button>
            <button onClick={() => onUpdate({ sophie_agrees: !t.sophie_agrees })}
              className={`text-[11px] px-2 py-0.5 rounded-full ${t.sophie_agrees ? 'bg-pink-100 text-pink-600' : 'bg-surface-hover text-muted'}`}>
              {t.sophie_agrees ? '✓ ' : ''}S agrees
            </button>
          </div>
        </div>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function TipModal({ onClose, onSave, initial }: {
  onClose: () => void; onSave: (data: { tip: string; subcategory: string; source: string }) => void;
  initial?: { subcategory?: string };
}) {
  const [tip, setTip] = useState('');
  const [subcategory, setSubcategory] = useState(initial?.subcategory || 'General');
  const [source, setSource] = useState('');
  return (
    <div data-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xl p-4">
      <div className="glass-strong rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading italic text-xl text-foreground/80">Add a Tip</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-hover">✕</button>
        </div>
        <div className="space-y-3">
          <textarea autoFocus value={tip} onChange={(e) => setTip(e.target.value)} rows={4}
            placeholder="The tip..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm resize-none focus:outline-none focus:border-mauve/40" />
          <div className="grid grid-cols-2 gap-2">
            <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}
              className="px-2 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40">
              {TIP_SUBCATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={source} onChange={(e) => setSource(e.target.value)}
              className="px-2 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40">
              <option value="">Source...</option>
              {TIP_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button disabled={!tip.trim()} onClick={() => tip.trim() && onSave({ tip: tip.trim(), subcategory, source })}
            className={`w-full py-2.5 rounded-xl text-sm font-medium ${tip.trim() ? 'bg-mauve text-white hover:bg-mauve/90' : 'bg-surface-hover text-muted'}`}>
            Add Tip
          </button>
        </div>
      </div>
    </div>
  );
}

function TodoItemCard({ item, onUpdate, onDelete }: {
  item: ParentingTodo; onUpdate: (u: Partial<ParentingTodo>) => void; onDelete: () => void;
}) {
  const typeCol: Record<ParentingTodo['type'], string> = {
    buy: 'bg-blue-50 text-blue-600 border-blue-100',
    do: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    research: 'bg-purple-50 text-purple-600 border-purple-100',
    ask_doctor: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  const typeLabel: Record<ParentingTodo['type'], string> = { buy: 'Buy', do: 'Do', research: 'Research', ask_doctor: 'Ask Doctor' };
  return (
    <div className={`group rounded-2xl p-3 bg-surface/60 border border-border/50 flex items-center gap-3 transition-all hover:shadow-sm ${
      item.status === 'done' ? 'opacity-60' : ''
    }`}>
      <button onClick={() => onUpdate({ status: item.status === 'done' ? 'todo' : item.status === 'todo' ? 'in_progress' : 'done' })}
        className={`w-5 h-5 rounded-md flex items-center justify-center border-2 shrink-0 transition-all ${
          item.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' :
          item.status === 'in_progress' ? 'bg-amber-100 border-amber-400' :
          'border-border bg-surface'
        }`}>
        {item.status === 'done' && <Check className="w-3 h-3" />}
        {item.status === 'in_progress' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm ${item.status === 'done' ? 'line-through text-muted' : 'text-foreground'}`}>{item.item}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${typeCol[item.type]}`}>{typeLabel[item.type]}</span>
          {[...Array(item.priority)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
          {item.price_estimate != null && item.price_estimate > 0 && <span className="text-[10px] text-muted">${item.price_estimate}</span>}
          {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] text-mauve/80 hover:underline flex items-center gap-0.5"><ExternalLink className="w-2.5 h-2.5" /> link</a>}
        </div>
        {item.notes && <p className="text-[11px] text-muted mt-0.5">{item.notes}</p>}
      </div>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function TodoModal({ onClose, onSave }: {
  onClose: () => void; onSave: (data: Omit<ParentingTodo, 'id' | 'created_at' | 'created_by'>) => void;
}) {
  const [item, setItem] = useState('');
  const [type, setType] = useState<ParentingTodo['type']>('buy');
  const [priority, setPriority] = useState(2);
  const [price, setPrice] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <div data-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xl p-4">
      <div className="glass-strong rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading italic text-xl text-foreground/80">Add To-Do</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-hover">✕</button>
        </div>
        <div className="space-y-3">
          <input autoFocus type="text" value={item} onChange={(e) => setItem(e.target.value)}
            placeholder="What needs doing?"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40" />
          <div className="grid grid-cols-2 gap-2">
            <select value={type} onChange={(e) => setType(e.target.value as ParentingTodo['type'])}
              className="px-2 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40">
              <option value="buy">Buy</option>
              <option value="do">Do</option>
              <option value="research">Research</option>
              <option value="ask_doctor">Ask Doctor</option>
            </select>
            <select value={priority} onChange={(e) => setPriority(Number(e.target.value))}
              className="px-2 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40">
              <option value={1}>★ Low</option>
              <option value={2}>★★ Med</option>
              <option value={3}>★★★ High</option>
            </select>
          </div>
          {type === 'buy' && (
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="Price estimate ($)"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40" />
          )}
          <input type="url" value={link} onChange={(e) => setLink(e.target.value)}
            placeholder="Link (optional)"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm resize-none focus:outline-none focus:border-mauve/40" />
          <button disabled={!item.trim()}
            onClick={() => item.trim() && onSave({ item: item.trim(), type, priority, price_estimate: price ? Number(price) : null, link: link || null, status: 'todo', notes: notes || null })}
            className={`w-full py-2.5 rounded-xl text-sm font-medium ${item.trim() ? 'bg-mauve text-white hover:bg-mauve/90' : 'bg-surface-hover text-muted'}`}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function ParentingSection({ tips, todos, currentUser, onSaveTip, onUpdateTip, onDeleteTip, onSaveTodo, onUpdateTodo, onDeleteTodo }: {
  tips: ParentingTip[]; todos: ParentingTodo[]; currentUser: string | null;
  onSaveTip: (data: { tip: string; subcategory: string; source: string }) => void;
  onUpdateTip: (id: string, u: Partial<ParentingTip>) => void;
  onDeleteTip: (id: string) => void;
  onSaveTodo: (data: Omit<ParentingTodo, 'id' | 'created_at' | 'created_by'>) => void;
  onUpdateTodo: (id: string, u: Partial<ParentingTodo>) => void;
  onDeleteTodo: (id: string) => void;
}) {
  type SubTab = typeof TIP_SUBCATS[number] | 'Todo';
  const [subtab, setSubtab] = useState<SubTab>('Pregnancy');
  const [tipModal, setTipModal] = useState(false);
  const [todoModal, setTodoModal] = useState(false);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const filteredTips = useMemo(() => {
    const source = tips.filter((t) => t.subcategory === subtab);
    const s = search.toLowerCase();
    return source.filter((t) => {
      if (sourceFilter !== 'all' && t.source !== sourceFilter) return false;
      if (s && !t.tip.toLowerCase().includes(s)) return false;
      return true;
    }).sort((a, b) => (Number(b.bookmarked) - Number(a.bookmarked)) || b.created_at.localeCompare(a.created_at));
  }, [tips, subtab, search, sourceFilter]);

  const todoSorted = useMemo(() => {
    return [...todos].sort((a, b) => {
      const statusOrder = { todo: 0, in_progress: 1, done: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
      return b.priority - a.priority;
    });
  }, [todos]);
  const doneCount = todos.filter((t) => t.status === 'done').length;

  return (
    <section id="parenting" className="scroll-mt-24">
      <h2 className="font-heading italic text-2xl text-purple-700 mb-4">Parenting Tips ✦</h2>

      {/* Subtabs */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {[...TIP_SUBCATS, 'Todo' as const].map((c) => (
          <button key={c} onClick={() => setSubtab(c as SubTab)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              subtab === c ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'glass text-muted hover:text-foreground'
            }`}>{c === 'Todo' ? 'To Get / To Do' : c}</button>
        ))}
        <div className="ml-auto">
          <button onClick={() => subtab === 'Todo' ? setTodoModal(true) : setTipModal(true)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-mauve text-white hover:bg-mauve/90 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add {subtab === 'Todo' ? 'Item' : 'Tip'}
          </button>
        </div>
      </div>

      {subtab !== 'Todo' && (
        <>
          <div className="flex gap-2 mb-3 flex-wrap">
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tips..."
              className="flex-1 min-w-[180px] px-3 py-1.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40" />
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40">
              <option value="all">All sources</option>
              {TIP_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            {filteredTips.map((t) => (
              <TipCard key={t.id} t={t} onUpdate={(u) => onUpdateTip(t.id, u)} onDelete={() => onDeleteTip(t.id)} />
            ))}
            {filteredTips.length === 0 && (
              <div className="text-center py-10 text-muted text-sm italic">No tips in {subtab} yet</div>
            )}
          </div>
        </>
      )}

      {subtab === 'Todo' && (
        <>
          <div className="glass-card rounded-2xl p-4 mb-4 relative overflow-hidden" style={{ borderLeft: '3px solid #8b5cf6' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">{doneCount} / {todos.length} done</span>
              <span className="text-lg font-bold text-purple-600">{todos.length > 0 ? Math.round((doneCount / todos.length) * 100) : 0}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-hover overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-400 to-violet-500 transition-all duration-700"
                style={{ width: `${todos.length > 0 ? (doneCount / todos.length) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            {todoSorted.map((it) => (
              <TodoItemCard key={it.id} item={it} onUpdate={(u) => onUpdateTodo(it.id, u)} onDelete={() => onDeleteTodo(it.id)} />
            ))}
            {todos.length === 0 && <div className="text-center py-10 text-muted text-sm italic">Nothing on the list yet</div>}
          </div>
        </>
      )}

      {tipModal && <TipModal onClose={() => setTipModal(false)} initial={{ subcategory: subtab === 'Todo' ? undefined : subtab }}
        onSave={(data) => { onSaveTip(data); setTipModal(false); }} />}
      {todoModal && <TodoModal onClose={() => setTodoModal(false)} onSave={(data) => { onSaveTodo(data); setTodoModal(false); }} />}
      <span className="hidden">{currentUser}</span>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// OUR HOME
// ═══════════════════════════════════════════════════════════════

function RoomModal({ room, onClose, onSave }: {
  room: HomeRoom | null; onClose: () => void;
  onSave: (data: { name: string; vibe: string; color_palette: string[]; notes: string }) => void;
}) {
  const [name, setName] = useState(room?.name || '');
  const [vibe, setVibe] = useState(room?.vibe || '');
  const [palette, setPalette] = useState<string[]>(room?.color_palette.length ? room.color_palette : ['#f5e6d3', '#d4a574', '#8c7b68', '#2c2416', '#ffffff']);
  const [notes, setNotes] = useState('');
  return (
    <div data-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xl p-4">
      <div className="glass-strong rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading italic text-xl text-foreground/80">{room ? 'Edit Room' : 'Add Room'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-hover">✕</button>
        </div>
        <div className="space-y-3">
          <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Room name (e.g. Nursery)"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40" />
          <input type="text" value={vibe} onChange={(e) => setVibe(e.target.value)}
            placeholder="Vibe / mood (e.g. cozy and warm)"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40" />
          <div>
            <label className="text-xs font-medium text-foreground/70 mb-1 block">Color palette (up to 5)</label>
            <div className="flex gap-2">
              {palette.map((c, i) => (
                <div key={i} className="relative">
                  <input type="color" value={c}
                    onChange={(e) => setPalette((p) => p.map((x, idx) => idx === i ? e.target.value : x))}
                    className="w-10 h-10 rounded-full border-2 border-white shadow cursor-pointer appearance-none" style={{ backgroundColor: c }} />
                  <button onClick={() => setPalette((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-400 text-white text-[10px] flex items-center justify-center">×</button>
                </div>
              ))}
              {palette.length < 5 && (
                <button onClick={() => setPalette((p) => [...p, '#cccccc'])}
                  className="w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted hover:text-foreground">+</button>
              )}
            </div>
          </div>
          {!room && (
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm resize-none focus:outline-none focus:border-mauve/40" />
          )}
          <button disabled={!name.trim()}
            onClick={() => name.trim() && onSave({ name: name.trim(), vibe: vibe.trim(), color_palette: palette, notes })}
            className={`w-full py-2.5 rounded-xl text-sm font-medium ${name.trim() ? 'bg-mauve text-white hover:bg-mauve/90' : 'bg-surface-hover text-muted'}`}>
            {room ? 'Save' : 'Add Room'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomItemModal({ roomName, item, onClose, onSave }: {
  roomName: string; item: RoomItem | null; onClose: () => void;
  onSave: (data: Omit<RoomItem, 'id' | 'created_at' | 'created_by' | 'room_id'>) => void;
}) {
  const [name, setName] = useState(item?.name || '');
  const [image, setImage] = useState(item?.image_url || '');
  const [price, setPrice] = useState(item?.price_estimate?.toString() || '');
  const [link, setLink] = useState(item?.link || '');
  const [status, setStatus] = useState<RoomItem['status']>(item?.status || 'dream');
  const [priority, setPriority] = useState(item?.priority || 2);
  const [notes, setNotes] = useState(item?.notes || '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const url = await uploadFamilyImage(file, `family/home/${roomName}`);
    if (url) setImage(url);
    setUploading(false);
  };

  return (
    <div data-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xl p-4">
      <div className="glass-strong rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading italic text-xl text-foreground/80">{item ? 'Edit Item' : 'Add Item'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-hover">✕</button>
        </div>
        <div className="space-y-3">
          <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40" />
          <div>
            <label className="text-xs font-medium text-foreground/70 mb-1 block">Image</label>
            {image ? (
              <div className="relative rounded-xl overflow-hidden mb-2">
                <img src={image} alt="" className="w-full h-40 object-cover" />
                <button onClick={() => setImage('')} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white text-xs">✕</button>
              </div>
            ) : null}
            <div className="flex gap-2">
              <input type="url" value={image} onChange={(e) => setImage(e.target.value)}
                placeholder="Paste image URL or upload →"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="px-3 py-2 rounded-lg bg-surface-hover text-foreground/70 text-sm">
                {uploading ? '…' : 'Upload'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); e.target.value = ''; }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="Price ($)"
              className="px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40" />
            <select value={priority} onChange={(e) => setPriority(Number(e.target.value))}
              className="px-2 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40">
              <option value={1}>★ Low</option>
              <option value={2}>★★ Med</option>
              <option value={3}>★★★ High</option>
            </select>
          </div>
          <input type="url" value={link} onChange={(e) => setLink(e.target.value)}
            placeholder="Product link"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-mauve/40" />
          <div className="flex gap-1.5">
            {(['dream', 'saving', 'ordered', 'have_it'] as const).map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium capitalize ${
                  status === s ? 'bg-mauve text-white' : 'bg-surface-hover text-muted'
                }`}>{s.replace('_', ' ')}</button>
            ))}
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm resize-none focus:outline-none focus:border-mauve/40" />
          <button disabled={!name.trim()}
            onClick={() => name.trim() && onSave({
              name: name.trim(), image_url: image || null, price_estimate: price ? Number(price) : null,
              link: link || null, status, priority, notes: notes || null,
            })}
            className={`w-full py-2.5 rounded-xl text-sm font-medium ${name.trim() ? 'bg-mauve text-white hover:bg-mauve/90' : 'bg-surface-hover text-muted'}`}>
            {item ? 'Save' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomItemCard({ it, onEdit, onDelete, onStatusChange }: {
  it: RoomItem; onEdit: () => void; onDelete: () => void; onStatusChange: (s: RoomItem['status']) => void;
}) {
  const statusCol: Record<RoomItem['status'], string> = {
    dream: 'bg-amber-50 text-amber-600 border-amber-100',
    saving: 'bg-blue-50 text-blue-600 border-blue-100',
    ordered: 'bg-purple-50 text-purple-600 border-purple-100',
    have_it: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };
  const have = it.status === 'have_it';
  return (
    <div className={`group relative rounded-2xl overflow-hidden border bg-surface/60 transition-all hover:shadow-md ${have ? 'border-emerald-300 bg-emerald-50/30' : 'border-border/50'}`}>
      {it.image_url && (
        <div className="relative h-40 bg-surface-hover overflow-hidden">
          <img src={it.image_url} alt={it.name} className="w-full h-full object-cover" />
          {have && (
            <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
              <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                <Check className="w-3 h-3" /> Have It
              </div>
            </div>
          )}
        </div>
      )}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={onEdit} className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-foreground/70 shadow hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-red-500 shadow hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
      <div className="p-3">
        <h4 className="font-medium text-sm text-foreground">{it.name}</h4>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <button onClick={() => {
            const next: RoomItem['status'] = it.status === 'dream' ? 'saving' : it.status === 'saving' ? 'ordered' : it.status === 'ordered' ? 'have_it' : 'dream';
            onStatusChange(next);
          }} className={`px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${statusCol[it.status]}`}>
            {it.status.replace('_', ' ')}
          </button>
          {[...Array(it.priority)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
          {it.price_estimate != null && it.price_estimate > 0 && <span className="text-[10px] text-muted">${it.price_estimate}</span>}
        </div>
        {it.link && (
          <a href={it.link} target="_blank" rel="noreferrer" className="text-[11px] text-mauve/80 hover:underline mt-1 inline-flex items-center gap-1">
            View product <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
        {it.notes && <p className="text-[11px] text-muted mt-1">{it.notes}</p>}
      </div>
    </div>
  );
}

function RoomMoodboard({ media, roomName, onUpload, onDelete, onUpdateCaption }: {
  media: RoomMedia[]; roomName: string;
  onUpload: (files: File[]) => void;
  onDelete: (id: string) => void;
  onUpdateCaption: (id: string, caption: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-heading italic text-sm text-foreground/80">Vibe Board · {media.length}</h4>
        <button onClick={() => fileRef.current?.click()} className="text-xs text-mauve/80 hover:text-mauve flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add image
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => { if (e.target.files?.length) onUpload(Array.from(e.target.files)); e.target.value = ''; }} />
      </div>
      {media.length === 0 ? (
        <div className="border-2 border-dashed border-border/60 rounded-2xl p-10 text-center text-muted text-xs">
          <span className="block text-2xl mb-1">🖼️</span>
          No vibe images yet — drop inspiration for {roomName}
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 gap-3 [column-fill:_balance]">
          {media.sort((a, b) => a.order_index - b.order_index).map((m) => (
            <div key={m.id} className="relative mb-3 rounded-xl overflow-hidden group break-inside-avoid bg-surface/60">
              <img src={m.url} alt="" className="w-full h-auto" />
              <button onClick={() => onDelete(m.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {editingId === m.id ? (
                  <input autoFocus value={editVal} onChange={(e) => setEditVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateCaption(m.id, editVal); setEditingId(null); } if (e.key === 'Escape') setEditingId(null); }}
                    onBlur={() => { onUpdateCaption(m.id, editVal); setEditingId(null); }}
                    className="w-full text-[11px] bg-white/10 text-white rounded px-2 py-1 border border-white/30 focus:outline-none" />
                ) : (
                  <button onClick={() => { setEditingId(m.id); setEditVal(m.caption); }}
                    className="text-[11px] text-white/90 italic text-left block w-full truncate">
                    {m.caption || 'add caption…'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RoomPanel({ room, items, media, currentUser, onUpdateRoom, onAddItem, onUpdateItem, onDeleteItem, onAddMedia, onDeleteMedia, onUpdateMediaCaption, onDeleteRoom }: {
  room: HomeRoom; items: RoomItem[]; media: RoomMedia[]; currentUser: string | null;
  onUpdateRoom: (u: Partial<HomeRoom>) => void;
  onAddItem: (data: Omit<RoomItem, 'id' | 'created_at' | 'created_by' | 'room_id'>) => void;
  onUpdateItem: (id: string, u: Partial<RoomItem>) => void;
  onDeleteItem: (id: string) => void;
  onAddMedia: (files: File[]) => void;
  onDeleteMedia: (id: string) => void;
  onUpdateMediaCaption: (id: string, caption: string) => void;
  onDeleteRoom: () => void;
}) {
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RoomItem | null>(null);
  const [showRoomEdit, setShowRoomEdit] = useState(false);
  const [vibeDraft, setVibeDraft] = useState(room.vibe || '');
  const [notesJ, setNotesJ] = useState(room.notes_joshua || '');
  const [notesS, setNotesS] = useState(room.notes_sophie || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const vibeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setVibeDraft(room.vibe || ''); setNotesJ(room.notes_joshua || ''); setNotesS(room.notes_sophie || ''); }, [room.id, room.vibe, room.notes_joshua, room.notes_sophie]);

  const debouncedUpdate = (u: Partial<HomeRoom>, timer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onUpdateRoom(u), 500);
  };

  const filteredItems = statusFilter === 'all' ? items : items.filter((i) => i.status === statusFilter);
  const sorted = [...filteredItems].sort((a, b) => b.priority - a.priority);
  const acquired = items.filter((i) => i.status === 'have_it').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Notes & Vibe */}
      <div className="rounded-2xl border border-border/50 bg-surface/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading italic text-lg text-foreground">{room.name}</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowRoomEdit(true)} className="text-xs text-muted hover:text-foreground">✎ Edit room</button>
            <button onClick={() => { if (confirm(`Delete room "${room.name}" and everything in it?`)) onDeleteRoom(); }}
              className="text-xs text-red-400 hover:text-red-600">Delete</button>
          </div>
        </div>
        <input type="text" value={vibeDraft}
          onChange={(e) => { setVibeDraft(e.target.value); debouncedUpdate({ vibe: e.target.value }, vibeTimer); }}
          placeholder="Vibe / mood..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm italic text-foreground/80 focus:outline-none focus:border-mauve/40 mb-3" />
        {room.color_palette.length > 0 && (
          <div className="flex gap-1.5 mb-4">
            {room.color_palette.map((c, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white shadow" style={{ backgroundColor: c }} title={c} />
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-blue-600 mb-1 block">Joshua&apos;s notes</label>
            <textarea value={notesJ} rows={3}
              onChange={(e) => { setNotesJ(e.target.value); debouncedUpdate({ notes_joshua: e.target.value }, noteTimer); }}
              className="w-full px-3 py-2 rounded-lg border border-blue-100 bg-blue-50/30 text-sm resize-none focus:outline-none focus:border-blue-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-pink-600 mb-1 block">Sophie&apos;s notes</label>
            <textarea value={notesS} rows={3}
              onChange={(e) => { setNotesS(e.target.value); debouncedUpdate({ notes_sophie: e.target.value }, noteTimer); }}
              className="w-full px-3 py-2 rounded-lg border border-pink-100 bg-pink-50/30 text-sm resize-none focus:outline-none focus:border-pink-300" />
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="font-heading italic text-lg text-foreground">Items & Products</h3>
            <p className="text-xs text-muted">{acquired} of {items.length} acquired</p>
          </div>
          <button onClick={() => { setEditingItem(null); setShowItemModal(true); }}
            className="px-3 py-1.5 rounded-full bg-mauve text-white text-xs font-medium flex items-center gap-1 hover:bg-mauve/90">
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {['all', 'dream', 'saving', 'ordered', 'have_it'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize ${
                statusFilter === s ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'glass text-muted hover:text-foreground'
              }`}>{s.replace('_', ' ')}</button>
          ))}
        </div>
        {items.length > 0 && (
          <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden mb-4">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all"
              style={{ width: `${(acquired / items.length) * 100}%` }} />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((it) => (
            <RoomItemCard key={it.id} it={it}
              onEdit={() => { setEditingItem(it); setShowItemModal(true); }}
              onDelete={() => { if (confirm(`Delete "${it.name}"?`)) onDeleteItem(it.id); }}
              onStatusChange={(s) => onUpdateItem(it.id, { status: s })} />
          ))}
        </div>
        {sorted.length === 0 && (
          <div className="text-center py-10 text-muted text-sm italic border-2 border-dashed border-border/40 rounded-2xl">
            No items yet — start dreaming
          </div>
        )}
      </div>

      {/* Moodboard */}
      <div className="rounded-2xl border border-border/50 bg-surface/50 p-5">
        <RoomMoodboard media={media} roomName={room.name} onUpload={onAddMedia} onDelete={onDeleteMedia} onUpdateCaption={onUpdateMediaCaption} />
      </div>

      {showItemModal && (
        <RoomItemModal roomName={room.name} item={editingItem}
          onClose={() => { setShowItemModal(false); setEditingItem(null); }}
          onSave={(data) => {
            if (editingItem) onUpdateItem(editingItem.id, data);
            else onAddItem(data);
            setShowItemModal(false); setEditingItem(null);
          }} />
      )}
      {showRoomEdit && (
        <RoomModal room={room} onClose={() => setShowRoomEdit(false)}
          onSave={(d) => { onUpdateRoom({ name: d.name, vibe: d.vibe, color_palette: d.color_palette }); setShowRoomEdit(false); }} />
      )}
      <span className="hidden">{currentUser}</span>
    </div>
  );
}

function HomeSection({ rooms, items, media, currentUser, onAddRoom, onUpdateRoom, onDeleteRoom, onAddItem, onUpdateItem, onDeleteItem, onAddMedia, onDeleteMedia, onUpdateMediaCaption }: {
  rooms: HomeRoom[]; items: RoomItem[]; media: RoomMedia[]; currentUser: string | null;
  onAddRoom: (d: { name: string; vibe: string; color_palette: string[] }) => void;
  onUpdateRoom: (id: string, u: Partial<HomeRoom>) => void;
  onDeleteRoom: (id: string) => void;
  onAddItem: (roomId: string, data: Omit<RoomItem, 'id' | 'created_at' | 'created_by' | 'room_id'>) => void;
  onUpdateItem: (id: string, u: Partial<RoomItem>) => void;
  onDeleteItem: (id: string) => void;
  onAddMedia: (roomId: string, files: File[], roomName: string) => void;
  onDeleteMedia: (id: string) => void;
  onUpdateMediaCaption: (id: string, caption: string) => void;
}) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);

  useEffect(() => {
    if (!selectedRoomId && rooms.length > 0) setSelectedRoomId(rooms[0].id);
    if (selectedRoomId && !rooms.find((r) => r.id === selectedRoomId)) setSelectedRoomId(rooms[0]?.id || null);
  }, [rooms, selectedRoomId]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || null;
  const roomItems = selectedRoom ? items.filter((i) => i.room_id === selectedRoom.id) : [];
  const roomMedia = selectedRoom ? media.filter((m) => m.room_id === selectedRoom.id) : [];

  const totalItems = items.length;
  const acquired = items.filter((i) => i.status === 'have_it').length;

  return (
    <section id="home" className="scroll-mt-24">
      <h2 className="font-heading italic text-2xl text-amber-700 mb-4">Our Future Home ✦</h2>

      {/* Summary */}
      <div className="glass-card rounded-2xl p-5 mb-4 relative overflow-hidden" style={{ borderLeft: '4px solid #d97706', background: 'linear-gradient(90deg, rgba(217,119,6,0.06) 0%, transparent 100%)' }}>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-5 select-none pointer-events-none">🏡</div>
        <div className="flex items-center gap-6 flex-wrap relative">
          <div>
            <div className="text-2xl font-bold text-amber-700">{rooms.length}</div>
            <div className="text-[11px] text-muted">Rooms planned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">{totalItems}</div>
            <div className="text-[11px] text-muted">Items total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{acquired}</div>
            <div className="text-[11px] text-muted">Acquired</div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <div className="h-2 rounded-full bg-surface-hover overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all"
                style={{ width: `${totalItems > 0 ? (acquired / totalItems) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Room tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-1 px-1">
        {rooms.map((r) => (
          <button key={r.id} onClick={() => setSelectedRoomId(r.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              selectedRoomId === r.id ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-surface-hover text-muted hover:text-foreground'
            }`}>
            {r.color_palette[0] && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color_palette[0] }} />}
            {r.name}
            <span className="text-[10px] opacity-70">{items.filter((i) => i.room_id === r.id).length}</span>
          </button>
        ))}
        <button onClick={() => setShowRoomModal(true)}
          className="shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add Room
        </button>
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-amber-200 rounded-3xl bg-amber-50/30">
          <span className="text-5xl block mb-3">🏠</span>
          <p className="text-muted mb-4">No rooms yet — start designing your future home</p>
          <button onClick={() => setShowRoomModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600">
            + Add your first room
          </button>
        </div>
      )}

      {selectedRoom && (
        <RoomPanel room={selectedRoom} items={roomItems} media={roomMedia} currentUser={currentUser}
          onUpdateRoom={(u) => onUpdateRoom(selectedRoom.id, u)}
          onAddItem={(d) => onAddItem(selectedRoom.id, d)}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onAddMedia={(files) => onAddMedia(selectedRoom.id, files, selectedRoom.name)}
          onDeleteMedia={onDeleteMedia}
          onUpdateMediaCaption={onUpdateMediaCaption}
          onDeleteRoom={() => onDeleteRoom(selectedRoom.id)} />
      )}

      {showRoomModal && (
        <RoomModal room={null} onClose={() => setShowRoomModal(false)}
          onSave={(d) => { onAddRoom(d); setShowRoomModal(false); }} />
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function FamilyPage() {
  const { currentUser } = useUser();
  const [names, setNames] = useState<BabyName[]>([]);
  const [tips, setTips] = useState<ParentingTip[]>([]);
  const [todos, setTodos] = useState<ParentingTodo[]>([]);
  const [rooms, setRooms] = useState<HomeRoom[]>([]);
  const [items, setItems] = useState<RoomItem[]>([]);
  const [media, setMedia] = useState<RoomMedia[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [n, t, td, r, i, m] = await Promise.all([
      supabase.from('baby_names').select('*').order('created_at', { ascending: false }),
      supabase.from('parenting_tips').select('*').order('created_at', { ascending: false }),
      supabase.from('parenting_todo').select('*').order('created_at', { ascending: false }),
      supabase.from('home_rooms').select('*').order('order_index', { ascending: true }).order('created_at', { ascending: true }),
      supabase.from('home_room_items').select('*').order('created_at', { ascending: false }),
      supabase.from('home_room_media').select('*').order('order_index', { ascending: true }),
    ]);
    if (n.data) setNames(n.data);
    if (t.data) setTips(t.data);
    if (td.data) setTodos(td.data.map((x: ParentingTodo) => ({ ...x, price_estimate: x.price_estimate != null ? Number(x.price_estimate) : null })));
    if (r.data) setRooms(r.data);
    if (i.data) setItems(i.data.map((x: RoomItem) => ({ ...x, price_estimate: x.price_estimate != null ? Number(x.price_estimate) : null })));
    if (m.data) setMedia(m.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useRealtimeSync('baby_names', fetchAll);
  useRealtimeSync('parenting_tips', fetchAll);
  useRealtimeSync('parenting_todo', fetchAll);
  useRealtimeSync('home_rooms', fetchAll);
  useRealtimeSync('home_room_items', fetchAll);
  useRealtimeSync('home_room_media', fetchAll);

  // ── Handlers ──────────────────────────────────────────────

  const saveName = async (data: Omit<BabyName, 'id' | 'created_at' | 'created_by' | 'joshua_loves' | 'sophie_loves'>, id?: string) => {
    if (id) await supabase.from('baby_names').update(data).eq('id', id);
    else await supabase.from('baby_names').insert({ ...data, created_by: currentUser });
    fetchAll();
  };
  const loveName = async (id: string, who: 'joshua' | 'sophie', value: boolean) => {
    const col = who === 'joshua' ? 'joshua_loves' : 'sophie_loves';
    setNames((prev) => prev.map((n) => n.id === id ? { ...n, [col]: value } : n));
    await supabase.from('baby_names').update({ [col]: value }).eq('id', id);
  };

  const saveTip = async (data: { tip: string; subcategory: string; source: string }) => {
    await supabase.from('parenting_tips').insert({ ...data, created_by: currentUser });
    fetchAll();
  };
  const updateTip = async (id: string, u: Partial<ParentingTip>) => {
    setTips((prev) => prev.map((t) => t.id === id ? { ...t, ...u } : t));
    await supabase.from('parenting_tips').update(u).eq('id', id);
  };

  const saveTodo = async (data: Omit<ParentingTodo, 'id' | 'created_at' | 'created_by'>) => {
    await supabase.from('parenting_todo').insert({ ...data, created_by: currentUser });
    fetchAll();
  };
  const updateTodo = async (id: string, u: Partial<ParentingTodo>) => {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, ...u } : t));
    await supabase.from('parenting_todo').update(u).eq('id', id);
  };

  const addRoom = async (d: { name: string; vibe: string; color_palette: string[] }) => {
    const maxOrder = rooms.length > 0 ? Math.max(...rooms.map((r) => r.order_index)) : 0;
    await supabase.from('home_rooms').insert({ ...d, order_index: maxOrder + 1 });
    fetchAll();
  };
  const updateRoom = async (id: string, u: Partial<HomeRoom>) => {
    setRooms((prev) => prev.map((r) => r.id === id ? { ...r, ...u } : r));
    await supabase.from('home_rooms').update(u).eq('id', id);
  };
  const deleteRoom = async (id: string) => {
    await supabase.from('home_rooms').delete().eq('id', id);
    fetchAll();
  };

  const addItem = async (roomId: string, data: Omit<RoomItem, 'id' | 'created_at' | 'created_by' | 'room_id'>) => {
    await supabase.from('home_room_items').insert({ ...data, room_id: roomId, created_by: currentUser });
    fetchAll();
  };
  const updateItem = async (id: string, u: Partial<RoomItem>) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...u } : i));
    await supabase.from('home_room_items').update(u).eq('id', id);
  };
  const deleteItem = async (id: string) => {
    await supabase.from('home_room_items').delete().eq('id', id);
    fetchAll();
  };

  const addMedia = async (roomId: string, files: File[], roomName: string) => {
    const existing = media.filter((m) => m.room_id === roomId);
    const maxIdx = existing.length > 0 ? Math.max(...existing.map((m) => m.order_index)) : -1;
    let idx = maxIdx + 1;
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const url = await uploadFamilyImage(file, `family/home/${roomName}/moodboard`);
      if (url) {
        await supabase.from('home_room_media').insert({ room_id: roomId, url, caption: '', order_index: idx });
        idx++;
      }
    }
    fetchAll();
  };
  const deleteMedia = async (id: string) => {
    await supabase.from('home_room_media').delete().eq('id', id);
    fetchAll();
  };
  const updateMediaCaption = async (id: string, caption: string) => {
    setMedia((prev) => prev.map((m) => m.id === id ? { ...m, caption } : m));
    await supabase.from('home_room_media').update({ caption }).eq('id', id);
  };

  // ── Sticky nav scroll handler ─────────────────────────────

  const [activeSection, setActiveSection] = useState<'baby-names' | 'parenting' | 'home'>('baby-names');
  useEffect(() => {
    const handler = () => {
      const sections: Array<'baby-names' | 'parenting' | 'home'> = ['baby-names', 'parenting', 'home'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < 200 && rect.bottom > 200) { setActiveSection(id); return; }
        }
      }
    };
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (loading) {
    return <Layout><div className="flex items-center justify-center py-32"><div className="w-8 h-8 rounded-full border-2 border-rose-300 border-t-transparent animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="pb-12 space-y-8">
        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50/40 px-6 py-10 sm:py-14 text-center">
          <div className="absolute top-6 right-8 opacity-10 text-5xl select-none pointer-events-none">👶</div>
          <div className="absolute bottom-6 left-8 opacity-10 text-4xl select-none pointer-events-none">🏡</div>
          <div className="absolute top-8 left-12 opacity-10 text-3xl select-none pointer-events-none">💕</div>
          <h1 className="font-heading italic text-4xl sm:text-5xl tracking-tight relative"
              style={{ background: 'linear-gradient(90deg, #e11d48, #d97706, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Our Future Family
          </h1>
          <p className="font-heading italic text-base text-foreground/60 mt-2 relative">dreaming, planning, building — together</p>
        </div>

        {/* Sticky sub-nav */}
        <div className="sticky top-20 z-30 bg-background/80 backdrop-blur-xl rounded-full shadow-sm border border-border/40 py-2 px-2 flex items-center justify-center gap-1 w-fit mx-auto">
          {([
            { id: 'baby-names' as const, label: '✦ Baby Names', color: 'text-rose-700 bg-rose-100' },
            { id: 'parenting' as const, label: '✦ Parenting', color: 'text-purple-700 bg-purple-100' },
            { id: 'home' as const, label: '✦ Our Home', color: 'text-amber-700 bg-amber-100' },
          ]).map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={(e) => {
              e.preventDefault();
              document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeSection === s.id ? s.color : 'text-muted hover:text-foreground'
              }`}>{s.label}</a>
          ))}
        </div>

        <BabyNamesSection names={names} currentUser={currentUser}
          onSave={saveName} onDelete={(id) => supabase.from('baby_names').delete().eq('id', id).then(fetchAll)}
          onLove={loveName} />

        <ParentingSection tips={tips} todos={todos} currentUser={currentUser}
          onSaveTip={saveTip} onUpdateTip={updateTip}
          onDeleteTip={(id) => supabase.from('parenting_tips').delete().eq('id', id).then(fetchAll)}
          onSaveTodo={saveTodo} onUpdateTodo={updateTodo}
          onDeleteTodo={(id) => supabase.from('parenting_todo').delete().eq('id', id).then(fetchAll)} />

        <HomeSection rooms={rooms} items={items} media={media} currentUser={currentUser}
          onAddRoom={addRoom} onUpdateRoom={updateRoom} onDeleteRoom={deleteRoom}
          onAddItem={addItem} onUpdateItem={updateItem} onDeleteItem={deleteItem}
          onAddMedia={addMedia} onDeleteMedia={deleteMedia} onUpdateMediaCaption={updateMediaCaption} />
      </div>
    </Layout>
  );
}
