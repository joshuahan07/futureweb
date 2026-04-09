'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/lib/realtime';
import { seedIfEmpty } from '@/lib/seed';

interface DishItem {
  id: string;
  name: string;
  image_url: string | null;
  ingredients: string | null;
  video_url: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  servings: number | null;
  cuisine: string | null;
  made_it: boolean;
  made_date: string | null;
  created_at?: string;
}

const SEED_DISHES: Omit<DishItem, 'id' | 'created_at'>[] = [
  { name: 'Malatang', image_url: null, ingredients: 'Broth, vegetables, noodles, mushrooms, tofu, chili oil', video_url: null, difficulty: 'medium', servings: 2, cuisine: 'Chinese', made_it: false, made_date: null },
  { name: 'Cheung Fun', image_url: null, ingredients: 'Rice flour, water, shrimp/pork, soy sauce, sesame oil', video_url: null, difficulty: 'hard', servings: 4, cuisine: 'Chinese', made_it: false, made_date: null },
  { name: 'Steak', image_url: null, ingredients: 'Ribeye, butter, garlic, thyme, salt, pepper', video_url: null, difficulty: 'easy', servings: 2, cuisine: 'Other', made_it: false, made_date: null },
  { name: 'Omakase (at home)', image_url: null, ingredients: 'Sushi rice, assorted sashimi, nori, wasabi, soy sauce, pickled ginger', video_url: null, difficulty: 'hard', servings: 2, cuisine: 'Japanese', made_it: false, made_date: null },
];

const DEFAULT_CUISINES = ['Chinese', 'Japanese', 'Korean', 'Italian', 'Thai', 'Other'];
const DIFFICULTIES: { key: DishItem['difficulty']; label: string; color: string }[] = [
  { key: 'easy', label: 'Easy', color: 'bg-green-50 text-green-600' },
  { key: 'medium', label: 'Medium', color: 'bg-amber-50 text-amber-600' },
  { key: 'hard', label: 'Hard', color: 'bg-red-50 text-red-600' },
];

// ── Image Upload Drop Zone ──────────────────────────────────

function ImageDropZone({ imageUrl, onImageChange }: {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `recipes/${fileName}`;
    const { error } = await supabase.storage.from('media').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('media').getPublicUrl(path);
      onImageChange(data.publicUrl);
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) uploadFile(file);
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted mb-1 block">Photo</label>
      {imageUrl ? (
        <div className="relative rounded-xl overflow-hidden h-40">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          <button onClick={() => onImageChange(null)}
            className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/70">
            ×
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragOver ? 'border-blue-400 bg-blue-50/50' : 'border-border hover:border-blue-300 hover:bg-surface-hover'
          }`}
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-6 h-6 text-muted mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span className="text-xs text-muted">Drop image or click to upload</span>
            </>
          )}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
    </div>
  );
}

// ── Add Recipe Modal ────────────────────────────────────────

function AddRecipeModal({ onClose, onAdd, existingCuisines }: {
  onClose: () => void;
  onAdd: (dish: Omit<DishItem, 'id' | 'created_at'>) => void;
  existingCuisines: string[];
}) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [difficulty, setDifficulty] = useState<DishItem['difficulty']>('easy');
  const [servings, setServings] = useState('2');
  const [cuisine, setCuisine] = useState('Other');
  const [customCuisine, setCustomCuisine] = useState('');

  const allCuisines = [...new Set([...DEFAULT_CUISINES, ...existingCuisines])];
  const finalCuisine = cuisine === '__custom__' ? customCuisine.trim() : cuisine;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fade-in border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-xl text-foreground">Add Recipe</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-hover transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Dish Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
              placeholder="What are we making?" autoFocus />
          </div>

          <ImageDropZone imageUrl={imageUrl} onImageChange={setImageUrl} />

          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Ingredients</label>
            <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-none"
              placeholder="Comma-separated: eggs, flour, butter..." />
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Video / Recipe Link</label>
            <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
              placeholder="YouTube or recipe URL..." />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Difficulty</label>
              <div className="flex gap-1">
                {DIFFICULTIES.map((d) => (
                  <button key={d.key} onClick={() => setDifficulty(d.key)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${difficulty === d.key ? d.color : 'bg-surface-hover text-muted'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Servings</label>
              <input type="number" value={servings} onChange={(e) => setServings(e.target.value)} min={1}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-blue-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Cuisine</label>
              <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-blue-300">
                {allCuisines.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__custom__">+ New Cuisine...</option>
              </select>
              {cuisine === '__custom__' && (
                <input type="text" value={customCuisine} onChange={(e) => setCustomCuisine(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-blue-300"
                  placeholder="Enter cuisine..." autoFocus />
              )}
            </div>
          </div>

          <button
            onClick={() => {
              if (!name.trim()) return;
              onAdd({
                name: name.trim(), image_url: imageUrl, ingredients: ingredients.trim() || null,
                video_url: videoUrl.trim() || null, difficulty, servings: servings ? parseInt(servings) : null,
                cuisine: finalCuisine || null, made_it: false, made_date: null,
              });
              onClose();
            }}
            disabled={!name.trim()}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
              name.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-surface-hover text-muted cursor-not-allowed'
            }`}
          >
            Add Recipe
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Cuisine Modal ──────────────────────────────────────

function EditCuisineModal({ dish, allCuisines, onSave, onClose }: {
  dish: DishItem;
  allCuisines: string[];
  onSave: (id: string, cuisine: string) => void;
  onClose: () => void;
}) {
  const [cuisine, setCuisine] = useState(dish.cuisine || 'Other');
  const [custom, setCustom] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-5 animate-fade-in border border-border">
        <h3 className="font-heading text-lg text-foreground mb-4">Move &ldquo;{dish.name}&rdquo;</h3>
        <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-blue-300 mb-2">
          {[...new Set([...DEFAULT_CUISINES, ...allCuisines])].map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="__custom__">+ New Cuisine...</option>
        </select>
        {cuisine === '__custom__' && (
          <input type="text" value={custom} onChange={(e) => setCustom(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-blue-300 mb-2"
            placeholder="New cuisine name..." autoFocus />
        )}
        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-border text-muted text-sm hover:bg-surface-hover transition-colors">Cancel</button>
          <button onClick={() => { onSave(dish.id, cuisine === '__custom__' ? custom.trim() : cuisine); onClose(); }}
            className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Recipe Card ─────────────────────────────────────────────

function RecipeCard({ dish, onToggle, onDelete, onEditCuisine }: {
  dish: DishItem;
  onToggle: () => void;
  onDelete: () => void;
  onEditCuisine: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const diffLabel = DIFFICULTIES.find((d) => d.key === dish.difficulty);

  return (
    <div className={`rounded-2xl overflow-hidden border transition-all duration-200 ${
      dish.made_it ? 'bg-green-50/30 border-green-200/50' : 'bg-surface border-border hover:border-blue-200'
    }`}>
      {dish.image_url && (
        <div className="h-40 overflow-hidden">
          <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 flex-1 text-left">
            <span className={`text-sm font-medium ${dish.made_it ? 'text-green-600 line-through' : 'text-foreground'}`}>
              {dish.name}
            </span>
            {dish.made_it && (
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          <div className="flex items-center gap-2">
            {diffLabel && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${diffLabel.color}`}>{diffLabel.label}</span>}
            {dish.cuisine && (
              <button onClick={onEditCuisine} className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-surface-hover text-muted hover:bg-blue-50 hover:text-blue-500 transition-colors" title="Change cuisine">
                {dish.cuisine}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted">
          {dish.servings && <span>Serves {dish.servings}</span>}
          {dish.made_it && dish.made_date && (
            <span>Made {new Date(dish.made_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          )}
          {dish.video_url && (
            <a href={dish.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              Video
            </a>
          )}
        </div>
        {expanded && dish.ingredients && (
          <div className="mt-3 pt-3 border-t border-border-light animate-fade-in">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Ingredients</span>
            <p className="text-xs text-foreground/80 mt-0.5">{dish.ingredients}</p>
          </div>
        )}
        <div className="flex items-center gap-2 mt-3">
          <button onClick={onToggle}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:scale-105 active:scale-95 ${
              dish.made_it ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}>
            {dish.made_it ? 'Made it!' : 'Made it?'}
          </button>
          <button onClick={() => setExpanded(!expanded)}
            className="text-[10px] px-2 py-1 rounded-full bg-surface-hover text-muted hover:text-foreground transition-colors">
            {expanded ? 'Less' : 'More'}
          </button>
          <button onClick={onDelete} className="ml-auto text-muted hover:text-red-400 text-xs transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function RecipesPage() {
  const [dishes, setDishes] = useState<DishItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingCuisine, setEditingCuisine] = useState<DishItem | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [filterCuisine, setFilterCuisine] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'done'>('all');

  const fetchDishes = useCallback(async () => {
    const { data } = await supabase.from('dishes').select('*').order('created_at', { ascending: true });
    if (data) setDishes(data);
    return data;
  }, []);

  useEffect(() => {
    (async () => {
      await seedIfEmpty('dishes', SEED_DISHES as any);
      await fetchDishes();
      setLoaded(true);
    })();
  }, [fetchDishes]);

  useRealtimeSync('dishes', fetchDishes);

  const toggleDish = async (dish: DishItem) => {
    const newMadeIt = !dish.made_it;
    await supabase.from('dishes').update({ made_it: newMadeIt, made_date: newMadeIt ? new Date().toISOString().split('T')[0] : null }).eq('id', dish.id);
    await fetchDishes();
  };

  const addDish = async (dish: Omit<DishItem, 'id' | 'created_at'>) => {
    await supabase.from('dishes').insert(dish);
    await fetchDishes();
  };

  const deleteDish = async (id: string) => {
    await supabase.from('dishes').delete().eq('id', id);
    await fetchDishes();
  };

  const updateCuisine = async (id: string, cuisine: string) => {
    await supabase.from('dishes').update({ cuisine }).eq('id', id);
    await fetchDishes();
  };

  const madeCount = dishes.filter((d) => d.made_it).length;
  const cuisines = [...new Set(dishes.map((d) => d.cuisine).filter(Boolean))] as string[];

  const filtered = dishes
    .filter((d) => filterCuisine === 'all' || d.cuisine === filterCuisine)
    .filter((d) => { if (filterStatus === 'todo') return !d.made_it; if (filterStatus === 'done') return d.made_it; return true; });

  if (!loaded) {
    return <Layout><div className="flex items-center justify-center py-32"><div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading text-foreground">Recipes</h1>
            <p className="text-sm text-muted mt-1">Dishes to make together &mdash; {madeCount} of {dishes.length} made</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm">
            + Add Recipe
          </button>
        </div>

        {/* Progress */}
        <div className="bg-surface rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">{madeCount} / {dishes.length}</span>
            <span className="text-sm font-bold text-blue-500">
              {dishes.length > 0 ? Math.round((madeCount / dishes.length) * 100) : 0}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-surface-hover overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-green-400 transition-all duration-700"
              style={{ width: `${dishes.length > 0 ? (madeCount / dishes.length) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'todo', 'done'] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                filterStatus === s ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-surface-hover text-muted border border-transparent'
              }`}>
              {s === 'all' ? 'All' : s === 'todo' ? 'To Make' : 'Made'}
            </button>
          ))}
          {cuisines.length > 1 && (
            <>
              <div className="w-px h-5 bg-border mx-1" />
              <button onClick={() => setFilterCuisine('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterCuisine === 'all' ? 'bg-blue-50 text-blue-500 border border-blue-200' : 'bg-surface-hover text-muted border border-transparent'
                }`}>All Cuisines</button>
              {cuisines.map((c) => (
                <button key={c} onClick={() => setFilterCuisine(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filterCuisine === c ? 'bg-blue-50 text-blue-500 border border-blue-200' : 'bg-surface-hover text-muted border border-transparent'
                  }`}>{c}</button>
              ))}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((dish) => (
            <RecipeCard key={dish.id} dish={dish} onToggle={() => toggleDish(dish)} onDelete={() => deleteDish(dish.id)}
              onEditCuisine={() => setEditingCuisine(dish)} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16"><span className="text-4xl mb-3 block">🍳</span><p className="text-muted">No recipes match your filters</p></div>
        )}
      </div>

      {showAdd && <AddRecipeModal onClose={() => setShowAdd(false)} onAdd={addDish} existingCuisines={cuisines} />}
      {editingCuisine && <EditCuisineModal dish={editingCuisine} allCuisines={cuisines} onSave={updateCuisine} onClose={() => setEditingCuisine(null)} />}
    </Layout>
  );
}
