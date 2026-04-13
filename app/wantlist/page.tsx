'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/lib/realtime';
import { useUser } from '@/components/UserContext';
import { Heart, Gift, ExternalLink, Check, EyeOff, Trash2, Filter, Plus, ImageIcon } from 'lucide-react';

interface WantlistItem {
  id: string;
  created_at: string;
  item: string;
  added_by: string | null;
  price_estimate: number | null;
  price_low: number | null;
  price_high: number | null;
  link: string | null;
  category: string | null;
  priority: number | null;
  image_url: string | null;
  notes: string | null;
  claimed_by: string | null;
}

type View = 'my' | 'their';
type SortBy = 'priority' | 'price' | 'newest';
type FilterBy = 'all' | 'claimed' | 'unclaimed';

const CATEGORIES = ['Beauty', 'Fashion', 'Experience', 'Tech', 'Books', 'Other'];

function PriorityHearts({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((p) => (
        <button key={p} type="button" onClick={() => onChange?.(p)} className={onChange ? 'cursor-pointer' : 'cursor-default'}>
          <Heart className={`w-4 h-4 transition-colors ${p <= value ? 'text-rose-400 fill-rose-400' : 'text-neutral-200'}`} />
        </button>
      ))}
    </div>
  );
}

function PriceDisplay({ low, high }: { low?: number | null; high?: number | null }) {
  if (!low && !high) return null;
  const text = low && high ? `$${low} – $${high}` : low ? `$${low}+` : `Up to $${high}`;
  return <span className="text-sm text-muted">{text}</span>;
}

// ── Add Item Modal ──────────────────────────────────────────

function AddModal({ onClose, onAdd, currentUser }: {
  onClose: () => void;
  onAdd: (item: Partial<WantlistItem>) => void;
  currentUser: string;
}) {
  const [item, setItem] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [priceLow, setPriceLow] = useState('');
  const [priceHigh, setPriceHigh] = useState('');
  const [link, setLink] = useState('');
  const [priority, setPriority] = useState(2);
  const [category, setCategory] = useState('Other');
  const [notes, setNotes] = useState('');

  const uploadFile = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `wishlist/${fileName}`;
    const { error } = await supabase.storage.from('media').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('media').getPublicUrl(path);
      setImageUrl(data.publicUrl);
    }
    setUploading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim()) return;
    onAdd({
      item: item.trim(),
      image_url: imageUrl || null,
      price_low: priceLow ? parseFloat(priceLow) : null,
      price_high: priceHigh ? parseFloat(priceHigh) : null,
      price_estimate: priceLow ? parseFloat(priceLow) : null,
      link: link.trim() || null,
      priority,
      category,
      notes: notes.trim() || null,
      added_by: currentUser,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-xl text-foreground">Add to My Wishlist</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-hover transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={item} onChange={(e) => setItem(e.target.value)} required autoFocus
            placeholder="Item name" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200" />
          {/* Image upload */}
          {imageUrl ? (
            <div className="relative rounded-xl overflow-hidden h-32">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setImageUrl(null)}
                className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/70">✕</button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) uploadFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={`h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                dragOver ? 'border-blue-400 bg-blue-50/50' : 'border-border hover:border-blue-300 hover:bg-surface-hover'
              }`}
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <><ImageIcon className="w-5 h-5 text-muted mb-1" /><span className="text-xs text-muted">Drop image or click to upload</span></>
              )}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
          {!imageUrl && (
            <input type="url" placeholder="Or paste image URL..."
              onChange={(e) => { if (e.target.value.trim()) setImageUrl(e.target.value.trim()); }}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-blue-300 placeholder-muted" />
          )}
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={priceLow} onChange={(e) => setPriceLow(e.target.value)}
              placeholder="Price from" className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200" />
            <input type="number" value={priceHigh} onChange={(e) => setPriceHigh(e.target.value)}
              placeholder="Price to" className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200" />
          </div>
          <input type="url" value={link} onChange={(e) => setLink(e.target.value)}
            placeholder="Link (optional)" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200" />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-blue-300">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Priority</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((p) => (
                <button key={p} type="button" onClick={() => setPriority(p)} className="p-1">
                  <Heart className={`w-6 h-6 transition-colors ${p <= priority ? 'text-rose-400 fill-rose-400' : 'text-neutral-200'}`} />
                </button>
              ))}
            </div>
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            placeholder="Notes (optional)" className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-none" />
          <button type="submit" disabled={!item.trim()}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${item.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-surface-hover text-muted'}`}>
            Add to Wishlist
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Item Card ───────────────────────────────────────────────

function WishlistCard({ item, currentUser, isOwnList, onClaim, onDelete }: {
  item: WantlistItem;
  currentUser: string;
  isOwnList: boolean;
  onClaim: () => void;
  onDelete: () => void;
}) {
  const isClaimedByMe = item.claimed_by === currentUser;
  const isClaimedByOther = item.claimed_by && item.claimed_by !== currentUser;

  return (
    <div className={`group bg-surface rounded-xl p-4 border transition-all ${
      isClaimedByMe ? 'border-green-200 bg-green-50/30' : 'border-border hover:border-blue-200'
    }`}>
      <div className="flex gap-4">
        {/* Image */}
        {item.image_url ? (
          <img src={item.image_url} alt={item.item} className="w-20 h-20 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center shrink-0">
            <Gift className="w-8 h-8 text-rose-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">{item.item}</p>
              <div className="flex items-center gap-3 mt-1">
                <PriorityHearts value={item.priority || 1} />
                {item.category && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-hover text-muted font-medium">{item.category}</span>
                )}
              </div>
              <PriceDisplay low={item.price_low || item.price_estimate} high={item.price_high} />
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer"
                  className="p-2 text-muted hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {isOwnList && (
                <button onClick={onDelete} className="p-2 text-muted hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {item.notes && <p className="text-sm text-muted mt-2">{item.notes}</p>}

          {/* Claim section */}
          {isOwnList && item.claimed_by && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-green-600">Someone&apos;s getting this for you!</span>
            </div>
          )}

          {!isOwnList && (
            <div className="mt-3">
              {isClaimedByOther ? (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <EyeOff className="w-4 h-4" />
                  <span>Someone else is getting this</span>
                </div>
              ) : (
                <button onClick={onClaim}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isClaimedByMe
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}>
                  {isClaimedByMe ? (
                    <><Check className="w-4 h-4" /> You&apos;re getting this!</>
                  ) : (
                    <><Heart className="w-4 h-4" /> Claim this gift</>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function WantlistPage() {
  const { currentUser } = useUser();
  const [items, setItems] = useState<WantlistItem[]>([]);
  const [view, setView] = useState<View>('their');
  const [sortBy, setSortBy] = useState<SortBy>('priority');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const otherPerson = currentUser === 'joshua' ? 'sophie' : 'joshua';
  const otherLabel = otherPerson === 'joshua' ? 'Joshua' : 'Sophie';

  const fetchItems = useCallback(async () => {
    const { data } = await supabase.from('wantlist').select('*');
    if (data) setItems(data);
  }, []);

  useEffect(() => { fetchItems().then(() => setLoaded(true)); }, [fetchItems]);
  useRealtimeSync('wantlist', fetchItems);

  const handleAdd = async (item: Partial<WantlistItem>) => {
    await supabase.from('wantlist').insert(item);
    fetchItems();
  };

  const handleClaim = async (item: WantlistItem) => {
    await supabase.from('wantlist').update({
      claimed_by: item.claimed_by === currentUser ? null : currentUser,
    }).eq('id', item.id);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('wantlist').delete().eq('id', id);
    fetchItems();
  };

  const displayItems = useMemo(() => {
    let filtered = items.filter((i) =>
      view === 'my' ? i.added_by === currentUser : i.added_by === otherPerson
    );
    if (filterBy === 'claimed') filtered = filtered.filter((i) => i.claimed_by);
    else if (filterBy === 'unclaimed') filtered = filtered.filter((i) => !i.claimed_by);

    const sorted = [...filtered];
    if (sortBy === 'priority') sorted.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    else if (sortBy === 'price') sorted.sort((a, b) => (a.price_low || a.price_estimate || 0) - (b.price_low || b.price_estimate || 0));
    else sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sorted;
  }, [items, view, filterBy, sortBy, currentUser, otherPerson]);

  if (!currentUser) return <div className="text-center py-20 text-muted">Please select a user first.</div>;

  if (!loaded) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-surface-hover rounded-full w-fit">
        <button onClick={() => setView('my')}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
            view === 'my' ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground'
          }`}>
          <Gift className="w-4 h-4" /> My Wishlist
        </button>
        <button onClick={() => setView('their')}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
            view === 'their' ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground'
          }`}>
          <Heart className="w-4 h-4" /> {otherLabel}&apos;s Wishlist
        </button>
      </div>

      {/* Title + Add */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl text-foreground">
          {view === 'my' ? 'My Wishlist' : `${otherLabel}'s Wishlist`}
        </h2>
        {view === 'my' && (
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        )}
      </div>

      {/* Filters (only on their list) */}
      {view === 'their' && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted" />
            {(['all', 'unclaimed', 'claimed'] as FilterBy[]).map((f) => (
              <button key={f} onClick={() => setFilterBy(f)}
                className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                  filterBy === f ? 'bg-blue-100 text-blue-600' : 'text-muted hover:bg-surface-hover'
                }`}>{f}</button>
            ))}
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="text-sm border border-border rounded-lg px-3 py-1.5 text-muted bg-background outline-none focus:border-blue-300">
            <option value="priority">Priority</option>
            <option value="price">Price: Low to High</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      )}

      {/* Items */}
      <div className="space-y-3">
        {displayItems.length === 0 ? (
          <div className="text-center py-16 bg-surface-hover/50 rounded-xl">
            {view === 'my' ? (
              <><Gift className="w-12 h-12 text-muted mx-auto mb-3" /><p className="text-muted">Your wishlist is empty</p></>
            ) : (
              <><Heart className="w-12 h-12 text-muted mx-auto mb-3" /><p className="text-muted">No items match your filters</p></>
            )}
          </div>
        ) : (
          displayItems.map((item) => (
            <WishlistCard key={item.id} item={item} currentUser={currentUser} isOwnList={view === 'my'}
              onClaim={() => handleClaim(item)} onDelete={() => handleDelete(item.id)} />
          ))
        )}
      </div>

      {showAddModal && currentUser && (
        <AddModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} currentUser={currentUser} />
      )}
    </div>
  );
}
