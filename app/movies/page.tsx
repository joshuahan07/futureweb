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
    } as Movie)));
    setLoading(false);
  }, []);

  const fetchWatchlist = useCallback(async () => {
    const { data } = await supabase.from('watchlist').select('*').order('created_at', { ascending: true });
    if (data) setWatchlist(data);
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
    if (editingMovie) {
      const { error } = await supabase.from('movies').update(movie).eq('id', editingMovie.id);
      if (error) console.error('Update movie error:', error.message);
    } else {
      // Try with all columns first, fall back to basic columns
      const { error } = await supabase.from('movies').insert(movie);
      if (error) {
        console.error('Insert movie error:', error.message);
        // Fallback: use old column names
        const { error: e2 } = await supabase.from('movies').insert({
          title: movie.title, type: movie.type, status: movie.watched ? 'watched' : 'want_to_watch',
          watched_date: movie.date_watched, rating: movie.rating, notes: movie.notes,
          poster_url: movie.poster_url, created_by: movie.added_by,
        });
        if (e2) console.error('Fallback insert error:', e2.message);
      }
    }
    setEditingMovie(null);
    fetchMovies();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('movies').delete().eq('id', id);
    fetchMovies();
  };

  const handleToggleWatched = async (id: string, watched: boolean) => {
    await supabase.from('movies').update({ watched }).eq('id', id);
    fetchMovies();
  };

  const handleMarkWatched = async (id: string, date: string) => {
    await supabase.from('watchlist').update({ watched: true, watched_date: date }).eq('id', id);
    fetchWatchlist();
  };

  const handleWatchlistUpdate = async (id: string, updates: Partial<WatchlistEntry>) => {
    await supabase.from('watchlist').update(updates).eq('id', id);
    fetchWatchlist();
  };

  const handleAddWatchlistItem = async () => {
    if (!newWatchlistItem.title.trim()) return;
    await supabase.from('watchlist').insert({
      title: newWatchlistItem.title.trim(),
      type: newWatchlistItem.type,
      watched: false,
      notes: newWatchlistItem.notes.trim() || null,
    });
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
      <div>
        <h1 className="text-2xl font-heading text-foreground">Movies & Shows</h1>
        <p className="text-sm text-muted mt-1">
          Everything we&apos;ve watched (and want to watch) together
        </p>
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
            <div className="rounded-2xl p-4 bg-surface border border-border">
              <div className="text-2xl font-bold text-foreground">{totalWatched}</div>
              <div className="text-xs text-muted">Watched Together</div>
            </div>
            <div className="rounded-2xl p-4 bg-surface border border-border">
              <div className="text-2xl font-bold text-foreground">{movieCount}</div>
              <div className="text-xs text-muted">Movies</div>
            </div>
            <div className="rounded-2xl p-4 bg-surface border border-border">
              <div className="text-2xl font-bold text-foreground">{showCount}</div>
              <div className="text-xs text-muted">Shows</div>
            </div>
            <div className="rounded-2xl p-4 bg-surface border border-border">
              <div className="text-sm font-semibold text-rose">
                {mostRecent
                  ? new Date(mostRecent.date_watched!).toLocaleDateString(
                      'en-US',
                      { month: 'short', day: 'numeric' }
                    )
                  : '\u2014'}
              </div>
              <div className="text-xs text-muted">Last Watch Date</div>
            </div>
          </div>

          {/* Filters + Add */}
          <div className="flex flex-wrap items-center gap-2">
            {filterButtons.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filter === f.key
                    ? 'bg-blue-100 text-blue-600 border border-blue-200'
                    : 'bg-surface-hover text-muted border border-transparent hover:text-foreground'
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
                    ? 'bg-blue-50 text-blue-500 border border-blue-200'
                    : 'bg-surface-hover text-muted border border-transparent hover:text-foreground'
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
              className="ml-auto px-4 py-1.5 rounded-full bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors shadow-sm"
            >
              + Add
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-rose border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-5xl mb-4">🎬</span>
              <h3 className="text-lg font-semibold text-foreground mb-1">No movies yet</h3>
              <p className="text-sm text-muted">Add your first one together</p>
            </div>
          ) : (
            <div className="space-y-8">
              {sorted.filter((m) => !m.watched).length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
                    Watch Next
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sorted
                      .filter((m) => !m.watched)
                      .map((movie) => (
                        <MovieCard
                          key={movie.id}
                          movie={movie}
                          onEdit={(m) => {
                            setEditingMovie(m);
                            setIsModalOpen(true);
                          }}
                          onDelete={handleDelete}
                          onToggleWatched={handleToggleWatched}
                        />
                      ))}
                  </div>
                </div>
              )}

              {sorted.filter((m) => m.watched).length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
                    Watched Together
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sorted
                      .filter((m) => m.watched)
                      .map((movie) => (
                        <MovieCard
                          key={movie.id}
                          movie={movie}
                          onEdit={(m) => {
                            setEditingMovie(m);
                            setIsModalOpen(true);
                          }}
                          onDelete={handleDelete}
                          onToggleWatched={handleToggleWatched}
                        />
                      ))}
                  </div>
                </div>
              )}
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
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
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
          currentUser={currentUser}
        />
      )}

      {/* Add Watchlist Modal */}
      {showAddWatchlist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowAddWatchlist(false)} />
          <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-fade-in border border-border">
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
                className="px-5 py-2 text-sm font-medium bg-blue-500 text-white rounded-full hover:opacity-90 transition-opacity"
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
