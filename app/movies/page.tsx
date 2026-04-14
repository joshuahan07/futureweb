'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/lib/realtime';
import { useUser } from '@/components/UserContext';
import { seedIfEmpty } from '@/lib/seed';
import Layout from '@/components/Layout';
import MovieCard, { type Movie } from '@/components/MovieCard';
import AddMovieModal from '@/components/AddMovieModal';
import WatchlistItem from '@/components/WatchlistItem';

interface WatchlistEntry {
  id: string;
  title: string;
  type: 'show' | 'movie';
  watched: boolean;
  watched_date?: string | null;
  notes?: string | null;
  created_at?: string;
}

type FilterType = 'all' | 'movies' | 'shows' | 'joshua' | 'sophie';
type SortType = 'date' | 'alpha' | 'rating';
type ActiveTab = 'movies' | 'watchlist';

const SEED_WATCHLIST: Omit<WatchlistEntry, 'id' | 'created_at'>[] = [
  { title: 'Tangled', type: 'movie', watched: true, watched_date: '2024-09-15' },
  { title: 'Beauty and the Beast', type: 'movie', watched: true, watched_date: '2024-08-20' },
  { title: 'Aladdin', type: 'movie', watched: true, watched_date: '2024-10-01' },
  { title: 'The Little Mermaid', type: 'movie', watched: false },
  { title: 'Moana', type: 'movie', watched: false },
  { title: 'Frozen', type: 'movie', watched: false },
  { title: 'Bridgerton', type: 'show', watched: false },
  { title: 'Emily in Paris', type: 'show', watched: false },
];

export default function MoviesPage() {
  const { currentUser } = useUser();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('date');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('movies');
  const [showAddWatchlist, setShowAddWatchlist] = useState(false);
  const [newWatchlistItem, setNewWatchlistItem] = useState({
    title: '', type: 'movie' as 'show' | 'movie', notes: '',
  });

  const fetchMovies = useCallback(async () => {
    const { data } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setMovies(data.map((m: any) => ({
      id: m.id, title: m.title, type: m.type, created_at: m.created_at,
      watched: m.watched != null ? m.watched : (m.status === 'watched'),
      date_watched: m.date_watched ?? m.watched_date ?? null,
      added_by: m.added_by ?? m.created_by ?? null,
      rating: m.rating ?? 0, notes: m.notes ?? '', poster_url: m.poster_url ?? null,
      poster_position: m.poster_position ?? 'center', date_has_day: m.date_has_day ?? true,
      rating_joshua: m.rating_joshua ?? null,
      rating_sophie: m.rating_sophie ?? null,
    } as Movie)));
    setLoading(false);
  }, []);

  const fetchWatchlist = useCallback(async () => {
    const { data } = await supabase.from('watchlist').select('*').order('created_at', { ascending: true });
    if (data) setWatchlist(data.map((w: any) => ({
      id: w.id, title: w.title, type: w.type, created_at: w.created_at,
      watched: w.watched != null ? w.watched : (w.status === 'watched'),
      watched_date: w.watched_date ?? null, notes: w.notes ?? null,
    })));
  }, []);

  useEffect(() => {
    (async () => {
      await seedIfEmpty('watchlist', SEED_WATCHLIST as any);
      await Promise.all([fetchMovies(), fetchWatchlist()]);
    })();
  }, [fetchMovies, fetchWatchlist]);

  useRealtimeSync('movies', fetchMovies);
  useRealtimeSync('watchlist', fetchWatchlist);

  const handleSave = async (movie: Omit<Movie, 'id' | 'created_at'>) => {
    // Build row with both new and old column names for compatibility
    const newRow: Record<string, unknown> = {
      title: movie.title, type: movie.type, rating: movie.rating || null, notes: movie.notes,
      poster_url: movie.poster_url, poster_position: movie.poster_position || 'center',
      date_has_day: movie.date_has_day ?? true,
      // New columns
      watched: movie.watched, date_watched: movie.date_watched, added_by: movie.added_by,
      // Old columns
      status: movie.watched ? 'watched' : 'want_to_watch',
      watched_date: movie.date_watched, created_by: movie.added_by,
    };

    if (editingMovie) {
      // Try new cols first
      let { error } = await supabase.from('movies').update({
        title: movie.title, type: movie.type, notes: movie.notes,
        poster_url: movie.poster_url, poster_position: movie.poster_position || 'center',
        watched: movie.watched, date_watched: movie.date_watched, rating: movie.rating || null,
        date_has_day: movie.date_has_day ?? true,
      }).eq('id', editingMovie.id);
      if (error) {
        // Fallback: old column names only
        await supabase.from('movies').update({
          title: movie.title, type: movie.type, notes: movie.notes, poster_url: movie.poster_url,
          status: movie.watched ? 'watched' : 'want_to_watch', watched_date: movie.date_watched, rating: movie.rating || null,
        }).eq('id', editingMovie.id);
      }
    } else {
      const { error } = await supabase.from('movies').insert(newRow);
      if (error) {
        // Fallback: old columns only
        await supabase.from('movies').insert({
          title: movie.title, type: movie.type, status: movie.watched ? 'watched' : 'want_to_watch',
          watched_date: movie.date_watched, rating: movie.rating || null, notes: movie.notes,
          poster_url: movie.poster_url, created_by: movie.added_by,
        });
      }
    }
    setEditingMovie(null);
    fetchMovies();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('movies').delete().eq('id', id);
    fetchMovies();
  };

  const handleRate = async (id: string, person: 'joshua' | 'sophie', rating: number) => {
    const col = person === 'joshua' ? 'rating_joshua' : 'rating_sophie';
    const { error } = await supabase.from('movies').update({ [col]: rating }).eq('id', id);
    if (error) {
      // Fallback: update the single rating column
      await supabase.from('movies').update({ rating }).eq('id', id);
    }
    fetchMovies();
  };

  const handleMarkWatched = async (id: string, date: string) => {
    const { error } = await supabase.from('watchlist').update({ watched: true, watched_date: date }).eq('id', id);
    if (error) await supabase.from('watchlist').update({ status: 'watched', watched_date: date }).eq('id', id);
    fetchWatchlist();
  };

  const handleWatchlistUpdate = async (id: string, updates: Partial<WatchlistEntry>) => {
    const { error } = await supabase.from('watchlist').update(updates).eq('id', id);
    if (error) {
      // Fallback: only send columns that likely exist
      const safe: Record<string, unknown> = { title: updates.title, type: updates.type, notes: updates.notes };
      if (updates.watched != null) safe.status = updates.watched ? 'watched' : 'want';
      await supabase.from('watchlist').update(safe).eq('id', id);
    }
    fetchWatchlist();
  };

  const handleAddWatchlistItem = async () => {
    if (!newWatchlistItem.title.trim()) return;
    const row: Record<string, unknown> = {
      title: newWatchlistItem.title.trim(),
      type: newWatchlistItem.type,
    };
    // Try new columns first, fallback to old
    const { error } = await supabase.from('watchlist').insert({ ...row, watched: false, notes: newWatchlistItem.notes.trim() || null });
    if (error) {
      await supabase.from('watchlist').insert({ ...row, status: 'want' });
    }
    setNewWatchlistItem({ title: '', type: 'movie', notes: '' });
    setShowAddWatchlist(false);
    fetchWatchlist();
  };

  // Filter
  const filtered = movies.filter((m) => {
    if (filter === 'movies') return m.type === 'movie';
    if (filter === 'shows') return m.type === 'show';
    if (filter === 'joshua') return m.added_by === 'joshua';
    if (filter === 'sophie') return m.added_by === 'sophie';
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'alpha') return a.title.localeCompare(b.title);
    if (sort === 'rating') return b.rating - a.rating;
    return (
      new Date(b.date_watched || b.created_at).getTime() -
      new Date(a.date_watched || a.created_at).getTime()
    );
  });

  // Only show watched movies in "Our Movies" tab
  const displayMovies = sorted.filter((m) => m.watched);

  // Stats
  const totalWatched = movies.filter((m) => m.watched).length;
  const movieCount = movies.filter((m) => m.type === 'movie').length;
  const showCount = movies.filter((m) => m.type === 'show').length;
  const mostRecent = movies
    .filter((m) => m.date_watched)
    .sort(
      (a, b) =>
        new Date(b.date_watched!).getTime() -
        new Date(a.date_watched!).getTime()
    )[0];

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'movies', label: 'Movies' },
    { key: 'shows', label: 'Shows' },
  ];

  const sortButtons: { key: SortType; label: string }[] = [
    { key: 'date', label: 'Newest' },
    { key: 'alpha', label: 'A\u2013Z' },
    { key: 'rating', label: 'Top Rated' },
  ];

  // Watchlist splits
  const watchlistMovies = watchlist.filter((w) => w.type === 'movie');
  const watchlistShows = watchlist.filter((w) => w.type === 'show');

  return (
    <Layout>
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100/40 px-6 py-8 sm:py-10">
        <div className="absolute top-4 right-6 opacity-10 text-6xl select-none pointer-events-none">🎬</div>
        <div className="absolute bottom-3 left-6 opacity-10 text-3xl select-none pointer-events-none">🍿</div>
        <h1 className="font-heading italic text-3xl sm:text-4xl text-rose tracking-tight relative">Movies & Shows</h1>
        <p className="text-sm text-rose/70 mt-1 relative">Everything we&apos;ve watched (and want to watch) together</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-surface-hover rounded-full w-fit">
        {([
          { key: 'movies' as ActiveTab, label: 'Our Movies', icon: '🎬' },
          { key: 'watchlist' as ActiveTab, label: 'Watchlist', icon: '📋' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════ MOVIES TAB ═══════════ */}
      {activeTab === 'movies' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: totalWatched, label: 'Watched Together', icon: '❤️', accent: '#F4A5B0' },
              { value: movieCount, label: 'Movies', icon: '🎬', accent: '#ec4899' },
              { value: showCount, label: 'Shows', icon: '📺', accent: '#a855f7' },
              { value: mostRecent ? new Date(mostRecent.date_watched!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—', label: 'Last Watch', icon: '📅', accent: '#f59e0b' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-4 glass-card hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden" style={{ borderLeft: `3px solid ${s.accent}` }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{s.icon}</span>
                  <span className="text-xl font-bold" style={{ color: s.accent }}>{s.value}</span>
                </div>
                <div className="text-[11px] text-muted">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters + Add */}
          <div className="flex flex-wrap items-center gap-2">
            {filterButtons.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filter === f.key
                    ? 'bg-mauve/15 text-mauve border border-mauve/20'
                    : 'glass text-muted hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
            <div className="w-px h-5 bg-border mx-1" />
            {sortButtons.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  sort === s.key
                    ? 'bg-mauve/10 text-mauve border border-mauve/20'
                    : 'glass text-muted hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={() => {
                setEditingMovie(null);
                setIsModalOpen(true);
              }}
              className="ml-auto px-4 py-1.5 rounded-full bg-mauve text-white text-xs font-medium hover:bg-mauve/90 transition-colors shadow-sm"
            >
              + Add
            </button>
          </div>

          {/* Content — Our Movies tab only shows watched */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-mauve/40 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayMovies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-5xl mb-4">🎬</span>
              <h3 className="text-lg font-semibold text-foreground mb-1">No movies yet</h3>
              <p className="text-sm text-muted">Add your first one together</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {displayMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onEdit={(m) => { setEditingMovie(m); setIsModalOpen(true); }}
                  onDelete={handleDelete}
                  onRate={handleRate}
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ WATCHLIST TAB ═══════════ */}
      {activeTab === 'watchlist' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowAddWatchlist(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-mauve/10 text-mauve text-xs font-medium hover:bg-mauve/15 transition-colors"
            >
              <span className="text-sm">+</span> Add to Watchlist
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-base font-heading text-foreground">Movies</h3>
              <span className="text-[10px] bg-rose/10 text-rose px-2 py-0.5 rounded-full font-medium">
                {watchlistMovies.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {watchlistMovies.map((item) => (
                <WatchlistItem
                  key={item.id}
                  item={item}
                  onMarkWatched={handleMarkWatched}
                  onUpdate={handleWatchlistUpdate}
                />
              ))}
              {watchlistMovies.length === 0 && (
                <p className="text-sm text-muted text-center py-6">No movies yet</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-base font-heading text-foreground">Shows</h3>
              <span className="text-[10px] bg-mauve/10 text-mauve px-2 py-0.5 rounded-full font-medium">
                {watchlistShows.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {watchlistShows.map((item) => (
                <WatchlistItem
                  key={item.id}
                  item={item}
                  onMarkWatched={handleMarkWatched}
                  onUpdate={handleWatchlistUpdate}
                />
              ))}
              {watchlistShows.length === 0 && (
                <p className="text-sm text-muted text-center py-6">No shows yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {currentUser && (
        <AddMovieModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingMovie(null);
          }}
          onSave={handleSave}
          editMovie={editingMovie}
          currentUser={currentUser!}
          forceWatched={activeTab === 'movies' ? true : undefined}
        />
      )}

      {/* Add Watchlist Modal */}
      {showAddWatchlist && (
        <div data-modal className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xl" onClick={() => setShowAddWatchlist(false)} />
          <div className="relative glass-strong rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-fade-in border border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading text-foreground">Add to Watchlist</h3>
              <button onClick={() => setShowAddWatchlist(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-hover transition-colors">✕</button>
            </div>
            <input
              placeholder="Title"
              value={newWatchlistItem.title}
              onChange={(e) => setNewWatchlistItem({ ...newWatchlistItem, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose/30"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setNewWatchlistItem({ ...newWatchlistItem, type: 'movie' })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  newWatchlistItem.type === 'movie' ? 'bg-rose/15 text-rose' : 'bg-surface-hover text-muted'
                }`}
              >
                Movie
              </button>
              <button
                onClick={() => setNewWatchlistItem({ ...newWatchlistItem, type: 'show' })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  newWatchlistItem.type === 'show' ? 'bg-mauve/15 text-mauve' : 'bg-surface-hover text-muted'
                }`}
              >
                Show
              </button>
            </div>
            <textarea
              placeholder="Notes (optional)"
              value={newWatchlistItem.notes}
              onChange={(e) => setNewWatchlistItem({ ...newWatchlistItem, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose/30 resize-none h-20"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddWatchlist(false)}
                className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWatchlistItem}
                className="px-5 py-2 text-sm font-medium bg-mauve text-white rounded-full hover:opacity-90 transition-opacity"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
}
