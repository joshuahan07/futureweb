'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/lib/realtime';
import { useUser } from '@/components/UserContext';
import { seedIfEmpty } from '@/lib/seed';
import Layout from '@/components/Layout';
import GiftCategory, { type MatchingItem } from '@/components/GiftCategory';

const WantlistPage = dynamic(() => import('../wantlist/page'), { ssr: false });

const DEFAULT_CATEGORIES = [
  'Promise Rings', 'Bracelets', 'Necklaces', 'Keychains',
  'Hoodies', 'Shirts', 'Pants', 'Socks', 'Shoes',
];

const SEED_MATCHING: Omit<MatchingItem, 'id' | 'created_at'>[] = [
  { category: 'Promise Rings', item_name: 'Sun & Moon matching rings', status: 'Want', notes: '', link: '', found_by: 'sophie' },
  { category: 'Promise Rings', item_name: 'Infinity band set', status: 'Want', notes: '', link: '', found_by: 'joshua' },
  { category: 'Bracelets', item_name: 'Long distance touch bracelets', status: 'Want', notes: 'Bond Touch', link: '', found_by: 'sophie' },
  { category: 'Bracelets', item_name: 'Coordinates engraved bangles', status: 'Want', notes: '', link: '', found_by: 'joshua' },
  { category: 'Necklaces', item_name: 'Lock & Key necklace set', status: 'Want', notes: '', link: '', found_by: 'sophie' },
  { category: 'Necklaces', item_name: 'Half-heart pendants', status: 'Want', notes: 'Classic but cute', link: '', found_by: 'joshua' },
  { category: 'Keychains', item_name: 'Puzzle piece keychains', status: 'Want', notes: '', link: '', found_by: 'sophie' },
  { category: 'Keychains', item_name: 'Custom photo keychain', status: 'Want', notes: '', link: '', found_by: 'joshua' },
  { category: 'Hoodies', item_name: 'Matching "His & Hers" hoodies', status: 'Want', notes: '', link: '', found_by: 'sophie' },
  { category: 'Hoodies', item_name: 'Anime couple hoodies', status: 'Want', notes: '', link: '', found_by: 'joshua' },
  { category: 'Shirts', item_name: 'Player 1 / Player 2 tees', status: 'Want', notes: '', link: '', found_by: 'joshua' },
  { category: 'Pants', item_name: 'Matching joggers', status: 'Want', notes: '', link: '', found_by: 'sophie' },
  { category: 'Socks', item_name: 'Custom face socks', status: 'Want', notes: "Each with the other person's face!", link: '', found_by: 'sophie' },
  { category: 'Shoes', item_name: 'Matching AF1 customs', status: 'Want', notes: '', link: '', found_by: 'joshua' },
];

type Tab = 'matching' | 'wishlist';

export default function GiftsPage() {
  const { currentUser } = useUser();
  const [tab, setTab] = useState<Tab>('matching');
  const [matching, setMatching] = useState<MatchingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Category management
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const fetchMatching = useCallback(async () => {
    const { data } = await supabase.from('matching_items').select('*').order('created_at', { ascending: true });
    if (data) setMatching(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      await seedIfEmpty('matching_items', SEED_MATCHING as any);
      await fetchMatching();
    })();
  }, [fetchMatching]);

  useRealtimeSync('matching_items', fetchMatching);

  const handleStatusChange = async (id: string, status: 'Want' | 'Ordered' | 'Have') => {
    await supabase.from('matching_items').update({ status }).eq('id', id);
    fetchMatching();
  };

  const handleNotesChange = async (id: string, notes: string) => {
    await supabase.from('matching_items').update({ notes }).eq('id', id);
    fetchMatching();
  };

  const handleMatchingDelete = async (id: string) => {
    await supabase.from('matching_items').delete().eq('id', id);
    fetchMatching();
  };

  const handleMatchingAdd = async (item: Omit<MatchingItem, 'id' | 'created_at'>) => {
    await supabase.from('matching_items').insert(item);
    fetchMatching();
  };

  // Dynamic categories from data
  const liveCategories = [...new Set(matching.map((m) => m.category))];
  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...liveCategories])];

  // Category management handlers
  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name || allCategories.includes(name)) return;
    const custom = JSON.parse(localStorage.getItem('js-custom-gift-cats') || '[]');
    custom.push(name);
    localStorage.setItem('js-custom-gift-cats', JSON.stringify(custom));
    setNewCatName('');
    setShowCategoryManager(false);
    setMatching([...matching]); // force re-render
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) return;
    // Update all items in this category
    await supabase.from('matching_items').update({ category: newName.trim() }).eq('category', oldName);
    // Update localStorage custom cats
    const custom: string[] = JSON.parse(localStorage.getItem('js-custom-gift-cats') || '[]');
    const idx = custom.indexOf(oldName);
    if (idx !== -1) custom[idx] = newName.trim();
    localStorage.setItem('js-custom-gift-cats', JSON.stringify(custom));
    setRenamingCat(null);
    setRenameValue('');
    fetchMatching();
  };

  const handleDeleteCategory = async (catName: string) => {
    // Delete all items in this category
    await supabase.from('matching_items').delete().eq('category', catName);
    // Remove from localStorage
    const custom: string[] = JSON.parse(localStorage.getItem('js-custom-gift-cats') || '[]');
    localStorage.setItem('js-custom-gift-cats', JSON.stringify(custom.filter((c) => c !== catName)));
    fetchMatching();
  };

  // Include custom categories from localStorage
  const customCats: string[] = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('js-custom-gift-cats') || '[]')
    : [];
  const displayCategories = [...new Set([...allCategories, ...customCats])];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading text-foreground">Gifts</h1>
          <p className="text-sm text-muted mt-1">Matching items & wishlist</p>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 p-1 bg-surface-hover rounded-full w-fit mx-auto">
          {([
            { key: 'matching' as Tab, label: 'Matching Items' },
            { key: 'wishlist' as Tab, label: 'Wishlist' },
          ]).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                tab === t.key ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ MATCHING TAB ═══ */}
        {tab === 'matching' && (
          <div className="space-y-4 animate-fade-in">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {displayCategories.map((cat) => {
                  const catItems = matching.filter((m) => m.category === cat);
                  // Show category even if empty (for custom ones)
                  if (catItems.length === 0 && !customCats.includes(cat) && !DEFAULT_CATEGORIES.includes(cat)) return null;
                  return (
                    <GiftCategory
                      key={cat}
                      category={cat}
                      items={catItems}
                      onStatusChange={handleStatusChange}
                      onNotesChange={handleNotesChange}
                      onDelete={handleMatchingDelete}
                      onAdd={handleMatchingAdd}
                      currentUser={currentUser || 'joshua'}
                    />
                  );
                })}

                {/* Category manager section */}
                <div className="rounded-2xl border border-dashed border-border p-4">
                  {showCategoryManager ? (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">Manage Categories</h3>

                      {/* Add new */}
                      <div className="flex gap-2">
                        <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="New category name..."
                          className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-blue-300"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} />
                        <button onClick={handleAddCategory}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            newCatName.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-surface-hover text-muted'
                          }`}>Add</button>
                      </div>

                      {/* Existing categories */}
                      <div className="space-y-1.5 max-h-60 overflow-y-auto">
                        {displayCategories.map((cat) => (
                          <div key={cat} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-hover/50">
                            {renamingCat === cat ? (
                              <input type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                                className="flex-1 px-2 py-1 rounded border border-blue-200 bg-background text-foreground text-sm focus:outline-none"
                                autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleRenameCategory(cat, renameValue); if (e.key === 'Escape') setRenamingCat(null); }} />
                            ) : (
                              <span className="flex-1 text-sm text-foreground">{cat}</span>
                            )}
                            <span className="text-[10px] text-muted">{matching.filter((m) => m.category === cat).length} items</span>
                            {renamingCat === cat ? (
                              <button onClick={() => handleRenameCategory(cat, renameValue)}
                                className="text-xs text-blue-500 hover:text-blue-600 font-medium">Save</button>
                            ) : (
                              <button onClick={() => { setRenamingCat(cat); setRenameValue(cat); }}
                                className="text-xs text-muted hover:text-blue-500 transition-colors">Rename</button>
                            )}
                            <button onClick={() => { if (confirm(`Delete "${cat}" and all its items?`)) handleDeleteCategory(cat); }}
                              className="text-xs text-muted hover:text-red-400 transition-colors">Delete</button>
                          </div>
                        ))}
                      </div>

                      <button onClick={() => setShowCategoryManager(false)}
                        className="text-xs text-muted hover:text-foreground">Close</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={() => setShowCategoryManager(true)}
                        className="text-sm text-blue-400 hover:text-blue-500 font-medium transition-colors">
                        + Add Category
                      </button>
                      <span className="text-muted">·</span>
                      <button onClick={() => setShowCategoryManager(true)}
                        className="text-sm text-muted hover:text-foreground font-medium transition-colors">
                        Edit Categories
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══ WISHLIST TAB ═══ */}
        {tab === 'wishlist' && (
          <div className="animate-fade-in">
            <WantlistPage />
          </div>
        )}
      </div>
    </Layout>
  );
}
