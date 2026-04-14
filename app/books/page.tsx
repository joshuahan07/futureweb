'use client';

import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import BookCard from '@/components/BookCard';
import DuetSong from '@/components/DuetSong';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/lib/realtime';
import { useUser } from '@/components/UserContext';
import { seedIfEmpty as seedTable } from '@/lib/seed';

/* ─── Types ─── */
interface Book {
  id: string;
  title: string;
  author: string;
  series?: string | null;
  genre?: string | null;
  status: 'tbr' | 'read';
  rating?: number | null;
  read_date?: string | null;
  notes?: string | null;
  created_at?: string;
}

interface Duet {
  id: string;
  title: string;
  artist?: string | null;
  category: 'song' | 'music_piece';
  status: 'done' | 'in_progress' | 'want_to_learn';
  created_at?: string;
}

/* ─── Seed Data ─── */
const SEED_BOOKS: Omit<Book, 'id' | 'created_at'>[] = [
  // Rina Kent — Legacy of Gods
  { title: 'God of Malice', author: 'Rina Kent', series: 'Legacy of Gods #1', genre: 'Dark Romance', status: 'tbr' },
  { title: 'God of Pain', author: 'Rina Kent', series: 'Legacy of Gods #2', genre: 'Dark Romance', status: 'tbr' },
  { title: 'God of Wrath', author: 'Rina Kent', series: 'Legacy of Gods #3', genre: 'Dark Romance', status: 'tbr' },
  { title: 'God of Ruin', author: 'Rina Kent', series: 'Legacy of Gods #4', genre: 'Dark Romance', status: 'tbr' },
  { title: 'God of Fury', author: 'Rina Kent', series: 'Legacy of Gods #5', genre: 'Dark Romance', status: 'tbr' },
  { title: 'God of War', author: 'Rina Kent', series: 'Legacy of Gods #6', genre: 'Dark Romance', status: 'tbr' },
  // Rina Kent — Royal Elite
  { title: 'Cruel King', author: 'Rina Kent', series: 'Royal Elite #1', genre: 'Dark Romance', status: 'tbr' },
  { title: 'Deviant King', author: 'Rina Kent', series: 'Royal Elite #2', genre: 'Dark Romance', status: 'tbr' },
  { title: 'Steel Princess', author: 'Rina Kent', series: 'Royal Elite #3', genre: 'Dark Romance', status: 'tbr' },
  { title: 'Twisted Kingdom', author: 'Rina Kent', series: 'Royal Elite #4', genre: 'Dark Romance', status: 'tbr' },
  { title: 'Black Knight', author: 'Rina Kent', series: 'Royal Elite #5', genre: 'Dark Romance', status: 'tbr' },
  { title: 'Reign', author: 'Rina Kent', series: 'Royal Elite #6', genre: 'Dark Romance', status: 'tbr' },
  { title: 'Rise', author: 'Rina Kent', series: 'Royal Elite #7', genre: 'Dark Romance', status: 'tbr' },
  // Kylie Kent — Merge
  { title: 'Merged With Him', author: 'Kylie Kent', series: 'Merge #1', genre: 'Mafia Romance', status: 'tbr' },
  { title: 'Fused With Him', author: 'Kylie Kent', series: 'Merge #2', genre: 'Mafia Romance', status: 'tbr' },
  { title: 'Bonded With Him', author: 'Kylie Kent', series: 'Merge #3', genre: 'Mafia Romance', status: 'tbr' },
  { title: 'Entwined With Him', author: 'Kylie Kent', series: 'Merge #4', genre: 'Mafia Romance', status: 'tbr' },
  { title: 'Blended With Him', author: 'Kylie Kent', series: 'Merge #5', genre: 'Mafia Romance', status: 'tbr' },
  // Read
  { title: 'Haunting Adeline', author: 'H.D. Carlton', series: 'Cat and Mouse Duet #1', genre: 'Dark Romance', status: 'read', rating: 5, read_date: '2024-06-01' },
  { title: 'Hunting Adeline', author: 'H.D. Carlton', series: 'Cat and Mouse Duet #2', genre: 'Dark Romance', status: 'read', rating: 5, read_date: '2024-07-01' },
];

const SEED_DUETS: Omit<Duet, 'id' | 'created_at'>[] = [
  { title: 'Perfect', artist: 'Ed Sheeran', category: 'song', status: 'done' },
  { title: 'All of Me', artist: 'John Legend', category: 'song', status: 'done' },
  { title: 'A Thousand Years', artist: 'Christina Perri', category: 'song', status: 'in_progress' },
  { title: "Can't Help Falling in Love", artist: 'Elvis Presley', category: 'song', status: 'want_to_learn' },
  { title: 'Thinking Out Loud', artist: 'Ed Sheeran', category: 'song', status: 'want_to_learn' },
  { title: "Say You Won't Let Go", artist: 'James Arthur', category: 'song', status: 'in_progress' },
];

/* ─── Helpers ─── */
type SubTab = 'books' | 'duets';
type BookFilter = 'all' | 'rina' | 'kylie' | 'other';

// Uses shared seedTable from lib/seed.ts

/* ─── Page ─── */
export default function BooksPage() {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState<SubTab>('books');

  // Data states
  const [books, setBooks] = useState<Book[]>([]);
  const [duets, setDuets] = useState<Duet[]>([]);

  // UI states
  const [bookFilter, setBookFilter] = useState<BookFilter>('all');
  const [expandedAuthors, setExpandedAuthors] = useState<Record<string, boolean>>({
    'Rina Kent': true,
    'Kylie Kent': true,
  });
  const [showAddBook, setShowAddBook] = useState(false);
  const [showAddDuet, setShowAddDuet] = useState(false);

  // Add-form states
  const [newBook, setNewBook] = useState({
    title: '', author: '', series: '', genre: '', status: 'tbr' as 'tbr' | 'read', rating: 0, notes: '',
  });
  const [newDuet, setNewDuet] = useState({
    title: '', artist: '', category: 'song' as 'song' | 'music_piece', status: 'want_to_learn' as Duet['status'],
  });

  /* ─── Fetchers ─── */
  const fetchBooks = useCallback(async () => {
    const { data } = await supabase.from('books').select('*').order('created_at', { ascending: true });
    if (data) setBooks(data);
  }, []);

  const fetchDuets = useCallback(async () => {
    const { data } = await supabase.from('duets').select('*').order('created_at', { ascending: true });
    if (data) setDuets(data);
  }, []);

  /* ─── Seed + initial fetch ─── */
  useEffect(() => {
    (async () => {
      await seedTable('books', SEED_BOOKS);
      await seedTable('duets', SEED_DUETS);
      await Promise.all([fetchBooks(), fetchDuets()]);
    })();
  }, [fetchBooks, fetchDuets]);

  /* ─── Realtime ─── */
  useRealtimeSync('books', fetchBooks);
  useRealtimeSync('duets', fetchDuets);

  /* ─── Handlers ─── */
  const handleBookUpdate = async (id: string, updates: Partial<Book>) => {
    await supabase.from('books').update(updates).eq('id', id);
    fetchBooks();
  };

  const handleAddBook = async () => {
    if (!newBook.title.trim()) return;
    await supabase.from('books').insert({
      title: newBook.title.trim(),
      author: newBook.author.trim(),
      series: newBook.series.trim() || null,
      genre: newBook.genre.trim() || null,
      status: newBook.status,
      rating: newBook.status === 'read' ? newBook.rating || null : null,
      notes: newBook.notes.trim() || null,
    });
    setNewBook({ title: '', author: '', series: '', genre: '', status: 'tbr', rating: 0, notes: '' });
    setShowAddBook(false);
    fetchBooks();
  };

  const handleDuetStatusChange = async (id: string, newStatus: Duet['status']) => {
    await supabase.from('duets').update({ status: newStatus }).eq('id', id);
    fetchDuets();
  };

  const handleAddDuet = async () => {
    if (!newDuet.title.trim()) return;
    await supabase.from('duets').insert({
      title: newDuet.title.trim(),
      artist: newDuet.artist.trim() || null,
      category: newDuet.category,
      status: newDuet.status,
    });
    setNewDuet({ title: '', artist: '', category: 'song', status: 'want_to_learn' });
    setShowAddDuet(false);
    fetchDuets();
  };

  const toggleAuthor = (author: string) => {
    setExpandedAuthors((prev) => ({ ...prev, [author]: !prev[author] }));
  };

  /* ─── Filtered books ─── */
  const filterBooks = (list: Book[]) => {
    if (bookFilter === 'rina') return list.filter((b) => b.author === 'Rina Kent');
    if (bookFilter === 'kylie') return list.filter((b) => b.author === 'Kylie Kent');
    if (bookFilter === 'other') return list.filter((b) => b.author !== 'Rina Kent' && b.author !== 'Kylie Kent');
    return list;
  };

  const tbrBooks = filterBooks(books.filter((b) => b.status === 'tbr'));
  const readBooks = filterBooks(books.filter((b) => b.status === 'read'));

  // Group TBR by author for expandable sections
  const groupByAuthor = (list: Book[]) => {
    const groups: Record<string, Book[]> = {};
    list.forEach((b) => {
      if (!groups[b.author]) groups[b.author] = [];
      groups[b.author].push(b);
    });
    return groups;
  };

  const tbrGrouped = groupByAuthor(tbrBooks);

  // Duets split
  const duetSongs = duets.filter((d) => d.category === 'song');
  const duetPieces = duets.filter((d) => d.category === 'music_piece');

  /* ─── Tabs config ─── */
  const tabs: { key: SubTab; label: string; icon: string }[] = [
    { key: 'books', label: 'Books', icon: '📖' },
    { key: 'duets', label: 'Duets', icon: '🎵' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-heading text-foreground">Books & Media</h1>
          <p className="text-sm text-muted mt-1">Our shared reading, watching, and music list</p>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 p-1 bg-surface-hover rounded-full w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-muted hover:text-foreground/80'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ═══════════ BOOKS TAB ═══════════ */}
        {activeTab === 'books' && (
          <div className="space-y-5 animate-fade-in">
            {/* Filter bar + Add */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {([
                  { key: 'all', label: 'All' },
                  { key: 'rina', label: 'Rina Kent' },
                  { key: 'kylie', label: 'Kylie Kent' },
                  { key: 'other', label: 'Other' },
                ] as { key: BookFilter; label: string }[]).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setBookFilter(f.key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      bookFilter === f.key
                        ? 'bg-rose/15 text-rose'
                        : 'bg-surface-hover/50 text-muted hover:bg-surface-hover hover:text-foreground/70'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAddBook(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 text-rose-500 text-xs font-medium hover:bg-rose-100 transition-colors"
              >
                <span className="text-sm">+</span> Add Book
              </button>
            </div>

            {/* Two columns: TBR and Read */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* TBR Column */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-base font-heading text-foreground/80">To Be Read</h3>
                  <span className="text-[10px] bg-amber-50 text-amber-500 px-2 py-0.5 rounded-full font-medium">
                    {tbrBooks.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {Object.entries(tbrGrouped).map(([author, authorBooks]) => (
                    <div key={author}>
                      {/* Expandable author header */}
                      <button
                        onClick={() => toggleAuthor(author)}
                        className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface-hover/50 transition-colors group"
                      >
                        <span
                          className={`text-[10px] text-muted/60 transition-transform duration-200 ${
                            expandedAuthors[author] ? 'rotate-90' : ''
                          }`}
                        >
                          &#9654;
                        </span>
                        <span className="text-xs font-semibold text-muted group-hover:text-foreground/80">
                          {author}
                        </span>
                        <span className="text-[10px] text-muted/60">{authorBooks.length}</span>
                      </button>

                      {expandedAuthors[author] && (
                        <div className="space-y-1.5 ml-1 mt-1 animate-fade-in">
                          {authorBooks.map((book) => (
                            <BookCard key={book.id} book={book} onUpdate={handleBookUpdate} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {tbrBooks.length === 0 && (
                    <p className="text-sm text-muted/60 text-center py-8">No books in this filter</p>
                  )}
                </div>
              </div>

              {/* Read Column */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-base font-heading text-foreground/80">Read</h3>
                  <span className="text-[10px] bg-emerald-50 text-emerald-500 px-2 py-0.5 rounded-full font-medium">
                    {readBooks.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {readBooks.map((book) => (
                    <BookCard key={book.id} book={book} onUpdate={handleBookUpdate} />
                  ))}
                  {readBooks.length === 0 && (
                    <p className="text-sm text-muted/60 text-center py-8">No books in this filter</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ DUETS TAB ═══════════ */}
        {activeTab === 'duets' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-end">
              <button
                onClick={() => setShowAddDuet(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 text-rose-500 text-xs font-medium hover:bg-rose-100 transition-colors"
              >
                <span className="text-sm">+</span> Add Song
              </button>
            </div>

            {/* Staff-line background */}
            <div
              className="relative rounded-2xl p-5"
              style={{
                background: `repeating-linear-gradient(
                  to bottom,
                  transparent 0px,
                  transparent 23px,
                  #f0e6ea 23px,
                  #f0e6ea 24px
                )`,
              }}
            >
              {/* Songs */}
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-base font-heading text-foreground/80">Songs</h3>
                  <span className="text-[10px] bg-rose-50 text-rose-400 px-2 py-0.5 rounded-full font-medium">
                    {duetSongs.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {duetSongs.map((song) => (
                    <DuetSong key={song.id} song={song} onStatusChange={handleDuetStatusChange} />
                  ))}
                  {duetSongs.length === 0 && (
                    <p className="text-sm text-muted/60 text-center py-6">No songs yet</p>
                  )}
                </div>
              </div>

              {/* Music Pieces */}
              <div className="relative z-10 mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-base font-heading text-foreground/80">Music Pieces</h3>
                  <span className="text-[10px] bg-violet-50 text-violet-400 px-2 py-0.5 rounded-full font-medium">
                    {duetPieces.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {duetPieces.map((piece) => (
                    <DuetSong key={piece.id} song={piece} onStatusChange={handleDuetStatusChange} />
                  ))}
                  {duetPieces.length === 0 && (
                    <p className="text-sm text-muted/60 text-center py-6 italic">
                      No music pieces yet -- add your first one!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ MODALS ═══════════ */}

        {/* Add Book Modal */}
        {showAddBook && (
          <div data-modal className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xl" onClick={() => setShowAddBook(false)} />
            <div className="relative glass-strong rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading text-foreground">Add a Book</h3>
                <button onClick={() => setShowAddBook(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-hover transition-colors">✕</button>
              </div>

              <input
                placeholder="Title"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <input
                placeholder="Author"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Series (optional)"
                  value={newBook.series}
                  onChange={(e) => setNewBook({ ...newBook, series: e.target.value })}
                  className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
                <input
                  placeholder="Genre (optional)"
                  value={newBook.genre}
                  onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })}
                  className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setNewBook({ ...newBook, status: 'tbr' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    newBook.status === 'tbr' ? 'bg-amber-100 text-amber-700' : 'bg-surface-hover/50 text-muted'
                  }`}
                >
                  To Be Read
                </button>
                <button
                  onClick={() => setNewBook({ ...newBook, status: 'read' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    newBook.status === 'read' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-hover/50 text-muted'
                  }`}
                >
                  Read
                </button>
              </div>

              {newBook.status === 'read' && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewBook({ ...newBook, rating: star })}
                        className="text-lg transition-transform hover:scale-125"
                      >
                        <span className={star <= newBook.rating ? 'text-amber-400' : 'text-neutral-200'}>
                          &#9733;
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                placeholder="Notes (optional)"
                value={newBook.notes}
                onChange={(e) => setNewBook({ ...newBook, notes: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none h-20"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddBook(false)}
                  className="px-4 py-2 text-sm text-muted hover:text-foreground/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBook}
                  className="px-5 py-2 text-sm font-medium bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
                >
                  Add Book
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Duet Modal */}
        {showAddDuet && (
          <div data-modal className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xl" onClick={() => setShowAddDuet(false)} />
            <div className="relative glass-strong rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading text-foreground">Add a Song / Piece</h3>
                <button onClick={() => setShowAddDuet(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-hover transition-colors">✕</button>
              </div>

              <input
                placeholder="Title"
                value={newDuet.title}
                onChange={(e) => setNewDuet({ ...newDuet, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <input
                placeholder="Artist (optional)"
                value={newDuet.artist}
                onChange={(e) => setNewDuet({ ...newDuet, artist: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setNewDuet({ ...newDuet, category: 'song' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    newDuet.category === 'song' ? 'bg-rose-100 text-rose-700' : 'bg-surface-hover/50 text-muted'
                  }`}
                >
                  Song
                </button>
                <button
                  onClick={() => setNewDuet({ ...newDuet, category: 'music_piece' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    newDuet.category === 'music_piece' ? 'bg-violet-100 text-violet-700' : 'bg-surface-hover/50 text-muted'
                  }`}
                >
                  Music Piece
                </button>
              </div>

              <div className="flex gap-2">
                {(['want_to_learn', 'in_progress', 'done'] as Duet['status'][]).map((s) => {
                  const labels: Record<Duet['status'], string> = {
                    want_to_learn: 'Want to Learn',
                    in_progress: 'In Progress',
                    done: 'Done',
                  };
                  const colors: Record<Duet['status'], string> = {
                    want_to_learn: newDuet.status === s ? 'bg-blue-100 text-blue-700' : 'bg-surface-hover/50 text-muted',
                    in_progress: newDuet.status === s ? 'bg-amber-100 text-amber-700' : 'bg-surface-hover/50 text-muted',
                    done: newDuet.status === s ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-hover/50 text-muted',
                  };
                  return (
                    <button
                      key={s}
                      onClick={() => setNewDuet({ ...newDuet, status: s })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${colors[s]}`}
                    >
                      {labels[s]}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddDuet(false)}
                  className="px-4 py-2 text-sm text-muted hover:text-foreground/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDuet}
                  className="px-5 py-2 text-sm font-medium bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
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
