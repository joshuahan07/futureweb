'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/lib/realtime';
import { seedIfEmpty } from '@/lib/seed';
import BucketItem, { type BucketListItem } from '@/components/BucketItem';
import AlphabetGrid, { type AlphabetEntry } from '@/components/AlphabetGrid';

const SEED_BUCKET_ITEMS: Omit<BucketListItem, 'id' | 'created_at'>[] = [
  { text: 'Dance in the rain together', emoji: '💃', completed: false, category: 'Dates' },
  { text: 'Watch the sunrise', emoji: '🌅', completed: false, category: 'Dates' },
  { text: 'Build a blanket fort', emoji: '🏰', completed: false, category: 'Creative' },
  { text: 'Go stargazing', emoji: '⭐', completed: false, category: 'Dates' },
  { text: 'Have a picnic in the park', emoji: '🧺', completed: false, category: 'Dates' },
  { text: 'Write love letters to each other', emoji: '💌', completed: false, category: 'Creative' },
  { text: 'Cook a fancy dinner together', emoji: '👨‍🍳', completed: false, category: 'Daily' },
  { text: 'Take a pottery class', emoji: '🏺', completed: false, category: 'Creative' },
  { text: 'Road trip with no plan', emoji: '🚗', completed: false, category: 'Travel' },
  { text: 'See the Northern Lights', emoji: '🌌', completed: false, category: 'Travel' },
  { text: 'Skinny dip together', emoji: '🏊', completed: false, category: 'Dates' },
  { text: 'Plant a garden or tree', emoji: '🌱', completed: false, category: 'Creative' },
  { text: 'Attend a music festival', emoji: '🎶', completed: false, category: 'Dates' },
  { text: 'Learn a dance', emoji: '🕺', completed: false, category: 'Creative' },
  { text: 'Adopt a pet', emoji: '🐾', completed: false, category: 'Milestones' },
  { text: 'Go scuba diving', emoji: '🤿', completed: false, category: 'Travel' },
  { text: 'Hot air balloon ride', emoji: '🎈', completed: false, category: 'Travel' },
  { text: 'Run a race together (5K, 10K)', emoji: '🏃', completed: false, category: 'Milestones' },
  { text: 'Stay in an overwater bungalow', emoji: '🏝️', completed: false, category: 'Travel' },
  { text: 'Visit Tokyo', emoji: '🗼', completed: false, category: 'Travel' },
  { text: 'Go camping under the stars', emoji: '⛺', completed: false, category: 'Travel' },
  { text: 'Take a couple\'s cooking class', emoji: '🍳', completed: false, category: 'Creative' },
  { text: 'Volunteer together', emoji: '🤝', completed: false, category: 'Milestones' },
  { text: 'Write a bucket list for each decade', emoji: '📝', completed: false, category: 'Creative' },
  { text: 'Have a movie marathon day', emoji: '🎬', completed: false, category: 'Daily' },
  { text: 'Take a helicopter ride', emoji: '🚁', completed: false, category: 'Travel' },
  { text: 'Recreate our first date', emoji: '🥰', completed: false, category: 'Dates' },
  { text: 'Go to Disneyland/Disney World', emoji: '🏰', completed: false, category: 'Travel' },
  { text: 'Create a time capsule', emoji: '📦', completed: false, category: 'Creative' },
  { text: 'Move in together', emoji: '🏠', completed: false, category: 'Milestones' },
  { text: 'Travel to 10 countries together', emoji: '✈️', completed: false, category: 'Travel' },
  { text: 'Have a paint night', emoji: '🎨', completed: false, category: 'Creative' },
  { text: 'Get matching tattoos', emoji: '💉', completed: false, category: 'Milestones' },
  { text: 'Binge a new series together', emoji: '📺', completed: false, category: 'Daily' },
  { text: 'Try karaoke together', emoji: '🎤', completed: false, category: 'Dates' },
  { text: 'Visit a Christmas market', emoji: '🎄', completed: false, category: 'Dates' },
  { text: 'Try bungee jumping or skydiving', emoji: '🪂', completed: false, category: 'Travel' },
  { text: 'Make homemade pasta', emoji: '🍝', completed: false, category: 'Daily' },
  { text: 'Go ice skating', emoji: '⛸️', completed: false, category: 'Dates' },
  { text: 'Take a sunset boat ride', emoji: '🚤', completed: false, category: 'Dates' },
  { text: 'Build something with our hands', emoji: '🔨', completed: false, category: 'Creative' },
  { text: 'Go to a drive-in movie', emoji: '🚙', completed: false, category: 'Dates' },
  { text: 'Slow dance in the living room', emoji: '💕', completed: false, category: 'Daily' },
  { text: 'Watch all the Studio Ghibli films', emoji: '🎌', completed: false, category: 'Daily' },
  { text: 'Go horseback riding', emoji: '🐴', completed: false, category: 'Dates' },
  { text: 'Visit a vineyard / wine tasting', emoji: '🍷', completed: false, category: 'Dates' },
  { text: 'Learn a new language together', emoji: '🗣️', completed: false, category: 'Creative' },
];

const SEED_ALPHABET: Omit<AlphabetEntry, 'id'>[] = [
  { letter: 'A', activities: 'Aquarium, Art gallery, Archery', completed: false, date_completed: null },
  { letter: 'B', activities: 'Bowling, Beach day, Brunch', completed: false, date_completed: null },
  { letter: 'C', activities: 'Cooking class, Cinema, Camping', completed: false, date_completed: null },
  { letter: 'D', activities: 'Dancing, Drive-in, Dessert crawl', completed: false, date_completed: null },
  { letter: 'E', activities: 'Escape room, Explore a new town', completed: false, date_completed: null },
  { letter: 'F', activities: 'Farmers market, Fishing, Fondue', completed: false, date_completed: null },
  { letter: 'G', activities: 'Go-karting, Game night, Gardening', completed: false, date_completed: null },
  { letter: 'H', activities: 'Hiking, Hot springs, Horse riding', completed: false, date_completed: null },
  { letter: 'I', activities: 'Ice skating, Italian dinner, Island trip', completed: false, date_completed: null },
  { letter: 'J', activities: 'Jazz bar, Jet skiing, Jigsaw puzzle', completed: false, date_completed: null },
  { letter: 'K', activities: 'Kayaking, Karaoke, Kite flying', completed: false, date_completed: null },
  { letter: 'L', activities: 'Laser tag, Library date, Live music', completed: false, date_completed: null },
  { letter: 'M', activities: 'Museum, Mini golf, Movie marathon', completed: false, date_completed: null },
  { letter: 'N', activities: 'Night market, Nature walk, Noodle bar', completed: false, date_completed: null },
  { letter: 'O', activities: 'Observatory, Outdoor cinema, Opera', completed: false, date_completed: null },
  { letter: 'P', activities: 'Picnic, Pottery class, Planetarium', completed: false, date_completed: null },
  { letter: 'Q', activities: 'Quiz night, Quiet spa day', completed: false, date_completed: null },
  { letter: 'R', activities: 'Rock climbing, Road trip, Roller skating', completed: false, date_completed: null },
  { letter: 'S', activities: 'Sunset hike, Sushi making, Stargazing', completed: false, date_completed: null },
  { letter: 'T', activities: 'Thrift shopping, Trampoline park, Tea ceremony', completed: false, date_completed: null },
  { letter: 'U', activities: 'Underground tour, Ukulele lesson', completed: false, date_completed: null },
  { letter: 'V', activities: 'Vineyard tour, Volleyball, Volunteer', completed: false, date_completed: null },
  { letter: 'W', activities: 'Waterfall hike, Wine tasting, Waffle brunch', completed: false, date_completed: null },
  { letter: 'X', activities: 'X-treme sport, Xmas market', completed: false, date_completed: null },
  { letter: 'Y', activities: 'Yoga class, Yacht day, YouTube cooking', completed: false, date_completed: null },
  { letter: 'Z', activities: 'Zoo visit, Zen garden, Zipline', completed: false, date_completed: null },
];

type BucketFilter = 'all' | 'completed' | 'remaining';
const DEFAULT_CATEGORIES = ['All', 'Dates', 'Travel', 'Creative', 'Milestones', 'Daily'];

export default function BucketListPage() {
  const [items, setItems] = useState<BucketListItem[]>([]);
  const [alphabet, setAlphabet] = useState<AlphabetEntry[]>([]);
  const [filter, setFilter] = useState<BucketFilter>('all');
  const [category, setCategory] = useState<string>('All');
  const [customNewCat, setCustomNewCat] = useState('');
  const [editingItemCategory, setEditingItemCategory] = useState<string | null>(null);
  const [editCatValue, setEditCatValue] = useState('');
  const [editCatCustom, setEditCatCustom] = useState('');
  const [newText, setNewText] = useState('');
  const [newEmoji, setNewEmoji] = useState('✨');
  const [newCategory, setNewCategory] = useState<string>('Dates');
  const [alphabetOpen, setAlphabetOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchBucket = useCallback(async () => {
    const { data } = await supabase
      .from('bucket_list')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setItems(data);
    setLoading(false);
  }, []);

  const fetchAlphabet = useCallback(async () => {
    const { data } = await supabase
      .from('alphabet_dating')
      .select('*')
      .order('letter', { ascending: true });
    if (data) setAlphabet(data);
  }, []);

  useEffect(() => {
    const init = async () => {
      await seedIfEmpty('bucket_list', SEED_BUCKET_ITEMS as any);
      await seedIfEmpty('alphabet_dating', SEED_ALPHABET as any);
      await Promise.all([fetchBucket(), fetchAlphabet()]);
    };
    init();
  }, [fetchBucket, fetchAlphabet]);

  useRealtimeSync('bucket_list', fetchBucket);
  useRealtimeSync('alphabet_dating', fetchAlphabet);

  const handleToggle = async (id: string, completed: boolean) => {
    await supabase.from('bucket_list').update({ completed }).eq('id', id);
    fetchBucket();
  };

  const handleUpdateEmoji = async (id: string, emoji: string) => {
    await supabase.from('bucket_list').update({ emoji }).eq('id', id);
    fetchBucket();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('bucket_list').delete().eq('id', id);
    fetchBucket();
  };

  const handleAdd = async () => {
    if (!newText.trim()) return;
    const cat = newCategory === '__custom__' ? customNewCat.trim() || 'Dates' : newCategory;
    await supabase.from('bucket_list').insert({
      text: newText.trim(),
      emoji: newEmoji || '✨',
      completed: false,
      category: cat,
    });
    setNewText('');
    setNewEmoji('✨');
    setNewCategory('Dates');
    setCustomNewCat('');
    fetchBucket();
  };

  const handleUpdateCategory = async (id: string, newCat: string) => {
    await supabase.from('bucket_list').update({ category: newCat }).eq('id', id);
    fetchBucket();
  };

  const handleAlphabetComplete = async (id: string, date: string) => {
    await supabase
      .from('alphabet_dating')
      .update({ completed: true, date_completed: date })
      .eq('id', id);
    fetchAlphabet();
  };

  const handleAlphabetUncomplete = async (id: string) => {
    await supabase
      .from('alphabet_dating')
      .update({ completed: false, date_completed: null })
      .eq('id', id);
    fetchAlphabet();
  };

  // Filter items
  const filteredItems = items
    .filter((item) => {
      if (filter === 'completed') return item.completed;
      if (filter === 'remaining') return !item.completed;
      return true;
    })
    .filter((item) => {
      if (category === 'All') return true;
      return item.category === category;
    });

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const dynamicCats = [...new Set(items.map((i) => i.category).filter(Boolean))] as string[];
  const allCategories = ['All', ...new Set([...DEFAULT_CATEGORIES.slice(1), ...dynamicCats])];

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Progress bar */}
        <div className="mb-4 p-5 rounded-2xl glass-card shadow-sm relative overflow-hidden" style={{ borderLeft: '3px solid #10b981' }}>
          <div className="absolute -right-4 -bottom-4 text-5xl opacity-5 select-none pointer-events-none">🌱</div>
          <div className="flex items-center justify-between mb-2 relative">
            <span className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>🎯</span>
              {completedCount} of {totalCount} completed
            </span>
            <span className="text-xl font-bold text-emerald-600">
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-surface-hover overflow-hidden relative">
            <div className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Add new — moved under progress */}
        <div className="flex gap-2 p-3 rounded-2xl bg-surface border border-dashed border-mauve/20 mb-6">
          <input type="text" value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)}
            className="w-12 text-center text-xl bg-transparent border border-border rounded-xl focus:outline-none focus:border-mauve/30" placeholder="✨" />
          <input type="text" value={newText} onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()} placeholder="Add a new dream..."
            className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-mauve/30 placeholder-muted" />
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border text-xs text-muted focus:outline-none focus:border-mauve/30 bg-background">
            {allCategories.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="__custom__">+ New...</option>
          </select>
          {newCategory === '__custom__' && (
            <input type="text" value={customNewCat} onChange={(e) => setCustomNewCat(e.target.value)}
              className="w-24 px-2 py-2 rounded-xl border border-border text-xs bg-background text-foreground focus:outline-none focus:border-mauve/30"
              placeholder="Category..." />
          )}
          <button onClick={handleAdd}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              newText.trim() ? 'bg-mauve text-white hover:bg-mauve/90' : 'bg-surface-hover text-muted'
            }`}>
            Add
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(['all', 'completed', 'remaining'] as BucketFilter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                filter === f ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'glass text-muted hover:text-foreground'
              }`}>{f}</button>
          ))}
          <div className="w-px h-6 bg-border mx-1 self-center" />
          {allCategories.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === c ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'glass text-muted hover:text-foreground'
              }`}>{c}</button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {filteredItems.map((item) => (
              <BucketItem
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onUpdateEmoji={handleUpdateEmoji}
                onDelete={handleDelete}
                onEditCategory={(id) => {
                  setEditingItemCategory(id);
                  setEditCatValue(item.category || 'Dates');
                }}
              />
            ))}
          </div>
        )}

        {/* Category edit modal */}
        {editingItemCategory && (
          <div data-modal className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xl p-4">
            <div className="glass-strong rounded-2xl shadow-xl w-full max-w-sm p-5 animate-fade-in border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg text-foreground">Move to Category</h3>
                <button onClick={() => setEditingItemCategory(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-hover transition-colors">✕</button>
              </div>
              <select value={editCatValue} onChange={(e) => { setEditCatValue(e.target.value); setEditCatCustom(''); }}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-mauve/30 mb-2">
                {allCategories.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__custom__">+ New Category...</option>
              </select>
              {editCatValue === '__custom__' && (
                <input type="text" value={editCatCustom} placeholder="New category name..."
                  onChange={(e) => setEditCatCustom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-mauve/30 mb-2" autoFocus />
              )}
              <div className="flex gap-2 mt-3">
                <button onClick={() => setEditingItemCategory(null)} className="flex-1 py-2 rounded-lg border border-border text-muted text-sm hover:bg-surface-hover">Cancel</button>
                <button onClick={() => {
                  const finalCat = editCatValue === '__custom__' ? editCatCustom.trim() : editCatValue;
                  if (finalCat && editingItemCategory) handleUpdateCategory(editingItemCategory, finalCat);
                  setEditingItemCategory(null);
                  setEditCatCustom('');
                }} className="flex-1 py-2 rounded-lg bg-mauve text-white text-sm font-medium hover:bg-mauve/90">Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Alphabet Dating Section */}
        <div className="mt-12">
          <button
            onClick={() => setAlphabetOpen(!alphabetOpen)}
            className="flex items-center gap-3 mb-4 group"
          >
            <h2 className="text-2xl font-bold text-foreground">
              🔤 Alphabet Dating
            </h2>
            <svg
              className={`w-5 h-5 text-muted transition-transform ${alphabetOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <p className="text-muted text-sm mb-6">
            One date for every letter of the alphabet
          </p>

          {alphabetOpen && (
            <div className="p-5 rounded-2xl bg-surface border border-rose-100 shadow-sm">
              <AlphabetGrid
                entries={alphabet}
                onComplete={handleAlphabetComplete}
                onUncomplete={handleAlphabetUncomplete}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
