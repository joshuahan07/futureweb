'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/lib/realtime';
import { useUser } from '@/components/UserContext';
import { Heart, Gift, ExternalLink, Check, Lock, Trash2, Plus, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

function PriorityHearts({ count, onChange }: { count: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((p) => (
        <button key={p} onClick={() => onChange?.(p)} className={onChange ? 'cursor-pointer' : 'cursor-default'}>
          <Heart className={`w-4 h-4 transition-colors ${p <= count ? 'text-red-400 fill-red-400' : 'text-foreground/20'}`} />
        </button>
      ))}
    </div>
  );
}

function PriceDisplay({ low, high }: { low?: number | null; high?: number | null }) {
  if (!low && !high) return null;
  const text = low && high ? `$${low} – $${high}` : low ? `$${low}+` : `Up to $${high}`;
  return <span className="text-sm text-foreground/50">{text}</span>;
}

// ── Add Modal ───────────────────────────────────────────────

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
  const [priority, setPriority] = useState(3);
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
      item: item.trim(), image_url: imageUrl || null,
      price_low: priceLow ? parseFloat(priceLow) : null,
      price_high: priceHigh ? parseFloat(priceHigh) : null,
      price_estimate: priceLow ? parseFloat(priceLow) : null,
      link: link.trim() || null, priority, category,
      notes: notes.trim() || null, added_by: currentUser,
    });
    onClose();
  };

  return (
    <div data-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-foreground">Add to Wishlist</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/5">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-foreground/50 mb-2 block">Item Name *</label>
            <input type="text" value={item} onChange={(e) => setItem(e.target.value)} required autoFocus
              placeholder="What do you want?"
              className="w-full px-3 py-2.5 rounded-xl glass border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20" />
          </div>

          {/* Image */}
          {imageUrl ? (
            <div className="relative rounded-xl overflow-hidden h-32">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setImageUrl(null)}
                className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-foreground text-xs hover:bg-black/70">✕</button>
            </div>
          ) : (
            <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) uploadFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={`h-20 rounded-xl border border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                dragOver ? 'border-white/30 bg-foreground/5' : 'border-foreground/10 hover:border-foreground/20'
              }`}>
              {uploading ? <div className="w-5 h-5 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
                : <><ImageIcon className="w-5 h-5 text-foreground/30 mb-1" /><span className="text-xs text-foreground/30">Drop image or click</span></>}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
          {!imageUrl && <input type="url" placeholder="Or paste image URL..." onChange={(e) => { if (e.target.value.trim()) setImageUrl(e.target.value.trim()); }}
            className="w-full px-3 py-2 rounded-xl glass border border-foreground/10 text-foreground placeholder:text-foreground/30 text-sm focus:outline-none" />}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-foreground/50 mb-2 block">Min Price</label>
              <input type="number" value={priceLow} onChange={(e) => setPriceLow(e.target.value)} placeholder="0"
                className="w-full px-3 py-2 rounded-xl glass border border-foreground/10 text-foreground focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-foreground/50 mb-2 block">Max Price</label>
              <input type="number" value={priceHigh} onChange={(e) => setPriceHigh(e.target.value)} placeholder="0"
                className="w-full px-3 py-2 rounded-xl glass border border-foreground/10 text-foreground focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-sm text-foreground/50 mb-2 block">Priority</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((p) => (
                <button key={p} type="button" onClick={() => setPriority(p)} className="flex-1 py-2 rounded-lg transition-all">
                  <Heart className={`w-5 h-5 mx-auto ${p <= priority ? 'text-red-400 fill-red-400' : 'text-foreground/20'}`} />
                </button>
              ))}
            </div>
          </div>

          <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (optional)"
            className="w-full px-3 py-2 rounded-xl glass border border-foreground/10 text-foreground placeholder:text-foreground/30 text-sm focus:outline-none" />

          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes (optional)"
            className="w-full px-3 py-2 rounded-xl glass border border-foreground/10 text-foreground placeholder:text-foreground/30 text-sm resize-none focus:outline-none" />

          <button type="submit" disabled={!item.trim()}
            className={`w-full py-3 rounded-xl font-medium transition-all ${
              item.trim() ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white active:scale-95' : 'bg-foreground/5 text-foreground/30'
            }`}>
            Add to Wishlist
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function WantlistPage() {
  const { currentUser } = useUser();
  const [items, setItems] = useState<WantlistItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const otherPerson = currentUser === 'joshua' ? 'sophie' : 'joshua';

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

  const joshuaItems = useMemo(() => items.filter((i) => i.added_by === 'joshua').sort((a, b) => (b.priority || 0) - (a.priority || 0)), [items]);
  const sophieItems = useMemo(() => items.filter((i) => i.added_by === 'sophie').sort((a, b) => (b.priority || 0) - (a.priority || 0)), [items]);

  if (!currentUser) return <div className="text-center py-20 text-foreground/40">Please select a user first.</div>;
  if (!loaded) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-foreground/20 border-t-mauve rounded-full animate-spin" /></div>;

  const WishlistColumn = ({ ownerItems, ownerName, ownerColor }: { ownerItems: WantlistItem[]; ownerName: string; ownerColor: string }) => {
    const isOwnList = currentUser === ownerName.toLowerCase();
    const pfp = typeof window !== 'undefined' ? localStorage.getItem(`js-pfp-${ownerName.toLowerCase()}`) : null;

    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center"
            style={{ borderColor: ownerColor, background: pfp ? undefined : ownerColor }}>
            {pfp ? <img src={pfp} alt={ownerName} className="w-full h-full object-cover" />
              : <span className="text-sm font-bold text-foreground">{ownerName[0]}</span>}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{ownerName}&apos;s Wishlist</h2>
            <p className="text-sm text-foreground/40">{ownerItems.length} items</p>
          </div>
          {isOwnList && (
            <button onClick={() => setShowAddModal(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-medium active:scale-95 transition-all">
              <Plus className="w-4 h-4" /> Add
            </button>
          )}
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {ownerItems.map((item, index) => {
              const isClaimed = !!item.claimed_by;
              const isClaimedByMe = item.claimed_by === currentUser;

              return (
                <motion.div key={item.id}
                  initial={{ opacity: 0, x: isOwnList ? -20 : 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  className={`glass-card p-4 ${isClaimed ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    {/* Image */}
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.item} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500/10 to-pink-500/10 flex items-center justify-center shrink-0">
                        <Gift className="w-6 h-6 text-foreground/20" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`font-medium ${isClaimed ? 'line-through text-foreground/40' : 'text-white'}`}>{item.item}</h3>
                          <div className="flex items-center gap-3 mt-1.5">
                            <PriorityHearts count={item.priority || 1} />
                            <PriceDisplay low={item.price_low || item.price_estimate} high={item.price_high} />
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {item.link && (
                            <a href={item.link} target="_blank" rel="noopener noreferrer"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground/30 hover:text-foreground hover:bg-foreground/5 transition-all">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {isOwnList && (
                            <button onClick={() => handleDelete(item.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {item.notes && <p className="text-xs text-foreground/40 mt-1.5">{item.notes}</p>}

                      {/* Claim section */}
                      {!isOwnList && (
                        <div className="mt-3">
                          <button onClick={() => handleClaim(item)}
                            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all active:scale-95 ${
                              isClaimedByMe
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-foreground/5 text-foreground/50 hover:bg-foreground/10 hover:text-white'
                            }`}>
                            {isClaimedByMe ? <><Check className="w-4 h-4" /> Claimed</> : <><Lock className="w-4 h-4" /> Claim</>}
                          </button>
                        </div>
                      )}

                      {isOwnList && isClaimed && (
                        <p className="mt-2 text-xs text-green-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Someone&apos;s getting this for you!
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {ownerItems.length === 0 && (
            <div className="text-center py-12 glass-card">
              <Gift className="w-10 h-10 text-foreground/15 mx-auto mb-2" />
              <p className="text-foreground/30 text-sm">No items yet</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Side-by-side wishlists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WishlistColumn ownerItems={joshuaItems} ownerName="Joshua" ownerColor="#3B82F6" />
        <WishlistColumn ownerItems={sophieItems} ownerName="Sophie" ownerColor="#EC4899" />
      </div>

      {showAddModal && currentUser && (
        <AddModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} currentUser={currentUser} />
      )}
    </div>
  );
}
