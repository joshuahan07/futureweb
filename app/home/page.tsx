'use client';

import { useState, useCallback, useEffect } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/lib/realtime';
import { seedIfEmpty } from '@/lib/seed';
import DropZone from '@/components/DropZone';
import MasonryBoard, { MediaItem } from '@/components/MasonryBoard';
import HomeItem, { HomeItemType } from '@/components/HomeItem';

// ── Seed Data ────────────────────────────────────────────────────

const SEED_ITEMS = [
  { title: 'Giant Teddy Bear', name: 'Giant Teddy Bear', category: 'Decor', status: 'want', notes: 'The really big one from Costco' },
  { title: 'Human Dog Bed', name: 'Human Dog Bed', category: 'Furniture', status: 'want', notes: 'For movie nights' },
  { title: 'Shower Bench', name: 'Shower Bench', category: 'Bathroom', status: 'want', notes: 'Teak wood bench' },
  { title: 'Hidden Library Door', name: 'Hidden Library Door', category: 'Furniture', status: 'want', notes: 'Secret bookshelf door' },
  { title: 'Oversized Rocking Chair', name: 'Oversized Rocking Chair', category: 'Furniture', status: 'want', notes: 'Big enough for two' },
];

const CATEGORIES = ['Furniture', 'Decor', 'Kitchen', 'Bedroom', 'Bathroom', 'Other'];

// ── Add Item Modal ───────────────────────────────────────────────

function AddItemModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (item: Omit<HomeItemType, 'id' | 'created_at'>) => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Furniture');
  const [price, setPrice] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'want' | 'ordered' | 'have'>('want');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      category,
      status,
      price: price ? parseFloat(price) : null,
      link: link.trim() || null,
      notes: notes.trim() || null,
    });
    onClose();
  };

  return (
    <div data-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xl p-4">
      <div className="glass-strong rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-xl text-foreground">Add Item</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-hover transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200"
              placeholder="What do we need?"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 bg-surface"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'want' | 'ordered' | 'have')}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 bg-surface"
              >
                <option value="want">Want</option>
                <option value="ordered">Ordered</option>
                <option value="have">Have</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Link</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 resize-none"
              placeholder="Any details..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add to Our Nest
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page Component ───────────────────────────────────────────────

export default function HomePage() {
  const [items, setItems] = useState<HomeItemType[]>([]);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // ── Fetch functions ──────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from('home_items')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setItems(data.map((d: any) => ({ ...d, name: d.name ?? d.title ?? '' })));
    return data;
  }, []);

  const fetchImages = useCallback(async () => {
    const { data } = await supabase
      .from('home_media')
      .select('*')
      .eq('section', 'home')
      .order('position', { ascending: true });
    if (data) setImages(data);
    return data;
  }, []);

  // ── Seeding ──────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      await seedIfEmpty('home_items', SEED_ITEMS as any);
      await Promise.all([fetchItems(), fetchImages()]);
      setSeeded(true);
    })();
  }, [fetchItems, fetchImages]);

  // ── Realtime ─────────────────────────────────────────────────

  useRealtimeSync('home_items', fetchItems);
  useRealtimeSync('home_media', fetchImages);

  // ── Item handlers ────────────────────────────────────────────

  const addItem = async (item: Omit<HomeItemType, 'id' | 'created_at'>) => {
    // Send both name and title for DB compat
    const row = { ...item, title: item.name, name: item.name };
    const { error } = await supabase.from('home_items').insert(row);
    if (error) await supabase.from('home_items').insert({ ...item, title: item.name });
    await fetchItems();
  };

  const updateItem = async (item: HomeItemType) => {
    const { id, created_at, ...updates } = item;
    await supabase.from('home_items').update({ ...updates, title: updates.name }).eq('id', id);
    await fetchItems();
  };

  const deleteItem = async (id: string) => {
    await supabase.from('home_items').delete().eq('id', id);
    await fetchItems();
  };

  // ── Media handlers ───────────────────────────────────────────

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = `home/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(path);

      const nextPos = images.length > 0 ? Math.max(...images.map((i) => i.position)) + 1 : 0;

      await supabase.from('home_media').insert({
        url: urlData.publicUrl,
        caption: '',
        section: 'home',
        position: nextPos,
      });
    }
    await fetchImages();
  };

  const handleDeleteImage = async (id: string) => {
    const image = images.find((i) => i.id === id);
    if (image) {
      // Extract path from URL for storage deletion
      const url = new URL(image.url);
      const storagePath = url.pathname.split('/storage/v1/object/public/media/')[1];
      if (storagePath) {
        await supabase.storage.from('media').remove([storagePath]);
      }
    }
    await supabase.from('home_media').delete().eq('id', id);
    await fetchImages();
  };

  const handleUpdateCaption = async (id: string, caption: string) => {
    await supabase.from('home_media').update({ caption }).eq('id', id);
    await fetchImages();
  };

  const handleReorder = async (reordered: MediaItem[]) => {
    setImages(reordered);
    await Promise.all(
      reordered.map((img) =>
        supabase.from('home_media').update({ position: img.position }).eq('id', img.id)
      )
    );
  };

  if (!seeded) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 rounded-full border-2 border-amber-200 border-t-amber-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        {/* ── Items List Section ────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              {/* Home icon */}
              <svg
                className="w-6 h-6 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
              <h2 className="font-heading text-2xl text-foreground">Our Nest</h2>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm hover:shadow"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <HomeItem
                key={item.id}
                item={item}
                onUpdate={updateItem}
                onDelete={deleteItem}
              />
            ))}
            {items.length === 0 && (
              <p className="text-sm text-muted text-center py-8">
                No items yet — add something to your nest!
              </p>
            )}
          </div>
        </section>

        {/* ── Moodboard Section ────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            {/* Sparkle icon */}
            <svg
              className="w-6 h-6 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
              />
            </svg>
            <h2 className="font-heading text-2xl text-foreground">
              Our Home Moodboard
            </h2>
          </div>

          <div className="space-y-6">
            <DropZone onUpload={handleUpload} section="moodboard" />
            <MasonryBoard
              images={images}
              onDelete={handleDeleteImage}
              onUpdateCaption={handleUpdateCaption}
              onReorder={handleReorder}
            />
          </div>
        </section>
      </div>

      {/* ── Add Item Modal ───────────────────────────────────── */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdd={addItem}
        />
      )}
    </Layout>
  );
}
