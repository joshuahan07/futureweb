'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/components/UserContext';
import Layout from '@/components/Layout';
import AnimatedBackground from '@/components/AnimatedBackground';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/lib/realtime';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePfps } from '@/lib/pfp';

// ── Identity Picker ──────────────────────────────────────────

const users = [
  { id: 'joshua' as const, name: 'Joshua', color: '#3B82F6' },
  { id: 'sophie' as const, name: 'Sophie', color: '#EC4899' },
];

function LoadingScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2000); return () => clearTimeout(t); }, [onDone]);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-[200]">
      <div className="relative z-10 flex flex-col items-center">
        <motion.div className="relative mb-8" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
          <motion.div className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(236,72,153,0.2))', border: '1px solid rgba(255,255,255,0.2)' }}
            animate={{ boxShadow: ['0 0 20px rgba(139,92,246,0.3)', '0 0 60px rgba(139,92,246,0.6)', '0 0 20px rgba(139,92,246,0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <Heart className="w-12 h-12" fill="url(#heartGrad)" stroke="none" />
            </motion.div>
            <svg width="0" height="0"><defs>
              <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs></svg>
          </motion.div>
        </motion.div>
        <motion.h1 className="text-3xl font-bold mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <span className="gradient-text">LoveNest</span>
        </motion.h1>
        <motion.p className="text-foreground/40 text-sm mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          Joshua & Sophie&apos;s Space
        </motion.p>
        <motion.div className="relative w-12 h-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
            <motion.circle cx="24" cy="24" r="20" fill="none" stroke="url(#progGrad)" strokeWidth="3" strokeLinecap="round"
              strokeDasharray="125.6" initial={{ strokeDashoffset: 125.6 }} animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }} />
            <defs><linearGradient id="progGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#EC4899" />
            </linearGradient></defs>
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

function IdentityPicker({ onPick }: { onPick: (user: 'joshua' | 'sophie') => void }) {
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { joshuaPfp, sophiePfp } = usePfps();

  const handleSelect = (user: 'joshua' | 'sophie') => {
    setSelectedUser(user);
    setIsTransitioning(true);
    setTimeout(() => onPick(user), 800);
  };

  if (loading) return <LoadingScreen onDone={() => setLoading(false)} />;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-background">
      <AnimatedBackground />

      <div className="relative z-10 text-center px-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-foreground/60">Welcome back to LoveNest</span>
          </div>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-6xl font-bold text-foreground mb-4">Who are you?</motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-foreground/40 text-lg mb-12">Select your profile to continue</motion.p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          {users.map((user, index) => {
            const pfp = user.id === 'joshua' ? joshuaPfp : sophiePfp;
            return (
              <motion.button key={user.id} onClick={() => handleSelect(user.id)} className="relative group"
                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <AnimatePresence>
                  {selectedUser === user.id && isTransitioning && (
                    <motion.div className="absolute inset-0 rounded-3xl z-20" style={{ backgroundColor: user.color }}
                      initial={{ scale: 1, opacity: 1 }} animate={{ scale: 50, opacity: 0 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: 'easeInOut' }} />
                  )}
                </AnimatePresence>
                <div className={`relative w-56 h-72 rounded-3xl overflow-hidden transition-all duration-500 ${selectedUser === user.id ? 'ring-4 ring-white/50' : ''}`}
                  style={{ background: `linear-gradient(135deg, ${user.color}15 0%, ${user.color}05 100%)`, border: `1px solid ${user.color}30`, boxShadow: `0 0 40px ${user.color}15` }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 50% 30%, ${user.color}25 0%, transparent 60%)` }} />
                  <div className="absolute top-10 left-1/2 -translate-x-1/2">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 flex items-center justify-center"
                      style={{ borderColor: `${user.color}40`, background: pfp ? undefined : `${user.color}15` }}>
                      {pfp ? <img src={pfp} alt={user.name} className="w-full h-full object-cover" />
                        : <span className="text-2xl font-bold" style={{ color: user.color }}>{user.name[0]}</span>}
                    </div>
                  </div>
                  <div className="absolute bottom-10 left-0 right-0 text-center">
                    <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                    <p className="text-foreground/30 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click to enter</p>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 rounded-full animate-pulse-glow" style={{ backgroundColor: user.color }} />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="mt-16 text-foreground/20 text-sm">Joshua & Sophie&apos;s Private Space</motion.p>
      </div>
    </div>
  );
}

// ── Greeting ─────────────────────────────────────────────────

function getGreeting(name: string) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  return `${g}, ${name.charAt(0).toUpperCase() + name.slice(1)}`;
}

// ── Quick Link Card ──────────────────────────────────────────

function QuickCard({ href, icon, title, subtitle, color }: {
  href: string; icon: string; title: string; subtitle: string; color: string;
}) {
  return (
    <Link href={href}
      className="group glass-card rounded-2xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden"
      style={{ borderColor: `${color}30` }}>
      <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full opacity-5 group-hover:opacity-15 transition-opacity" style={{ background: color }} />
      <div className="flex items-center gap-3 relative">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: `${color}20` }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground transition-colors" style={{ color: undefined }}>{title}</h3>
          <p className="text-xs text-muted mt-0.5 truncate">{subtitle}</p>
        </div>
        <span className="text-muted opacity-0 group-hover:opacity-100 transition-opacity text-lg shrink-0" style={{ color }}>→</span>
      </div>
    </Link>
  );
}

// ── Dashboard ────────────────────────────────────────────────

interface RecentItem {
  table: string;
  icon: string;
  label: string;     // e.g. "added a movie"
  detail: string;    // the actual title/name
  href: string;
  updated_at: string;
  created_by: string | null;
}

// Per-table config: title column, label verb, icon, destination, creator column override.
const ACTIVITY_TABLES: { name: string; titleCol: string; icon: string; label: string; href: string; byCol?: string }[] = [
  { name: 'movies', titleCol: 'title', icon: '🎬', label: 'added a movie', href: '/movies', byCol: 'added_by' },
  { name: 'bucket_list', titleCol: 'text', icon: '✨', label: 'added to bucket list', href: '/lists' },
  { name: 'alphabet_dating', titleCol: 'activities', icon: '💌', label: 'updated alphabet date', href: '/lists' },
  { name: 'matching_items', titleCol: 'item_name', icon: '🎁', label: 'added a matching gift', href: '/gifts', byCol: 'found_by' },
  { name: 'wantlist', titleCol: 'item', icon: '🎀', label: 'added to wishlist', href: '/wantlist', byCol: 'added_by' },
  { name: 'books', titleCol: 'title', icon: '📚', label: 'added a book', href: '/books', byCol: 'added_by' },
  { name: 'watchlist', titleCol: 'title', icon: '📺', label: 'added to watchlist', href: '/books', byCol: 'added_by' },
  { name: 'duets', titleCol: 'title', icon: '🎵', label: 'added a duet', href: '/books', byCol: 'added_by' },
  { name: 'home_items', titleCol: 'name', icon: '🏠', label: 'added a home item', href: '/home' },
  { name: 'dishes', titleCol: 'name', icon: '🍳', label: 'added a recipe', href: '/recipes' },
  { name: 'wedding_elements', titleCol: 'title', icon: '💒', label: 'updated wedding', href: '/wedding' },
  { name: 'wedding_budget', titleCol: 'label', icon: '💰', label: 'updated wedding budget', href: '/wedding' },
  { name: 'qa_questions', titleCol: 'question', icon: '❓', label: 'asked a question', href: '/qa' },
  { name: 'qa_answers', titleCol: 'answer', icon: '💬', label: 'answered a question', href: '/qa', byCol: 'answered_by' },
  { name: 'travel_locations', titleCol: 'name', icon: '🌍', label: 'added a travel location', href: '/travel' },
  { name: 'travel_pins', titleCol: 'name', icon: '📍', label: 'added a travel pin', href: '/travel' },
];

function Dashboard() {
  const { currentUser } = useUser();
  const [recentMovies, setRecentMovies] = useState<{ title: string; rating_joshua: number | null; rating_sophie: number | null }[]>([]);
  const [bucketItems, setBucketItems] = useState<{ text: string; emoji: string | null }[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentItem[]>([]);
  const [stats, setStats] = useState({ movies: 0, books: 0, bucketDone: 0, bucketTotal: 0, recipes: 0 });

  const fetchData = useCallback(async () => {
    const [moviesRes, bucketRes, bucketAll, booksRes, recipesRes] = await Promise.all([
      supabase.from('movies').select('title, rating_joshua, rating_sophie').order('created_at', { ascending: false }).limit(5),
      supabase.from('bucket_list').select('text, emoji').eq('completed', false).limit(5),
      supabase.from('bucket_list').select('completed'),
      supabase.from('books').select('id'),
      supabase.from('dishes').select('made_it'),
    ]);

    if (moviesRes.data) setRecentMovies(moviesRes.data);
    if (bucketRes.data) setBucketItems(bucketRes.data);

    const bucketDone = (bucketAll.data ?? []).filter((b: { completed: boolean }) => b.completed).length;
    setStats({
      movies: moviesRes.data?.length ?? 0,
      books: booksRes.data?.length ?? 0,
      bucketDone,
      bucketTotal: bucketAll.data?.length ?? 0,
      recipes: (recipesRes.data ?? []).filter((r: { made_it: boolean }) => r.made_it).length,
    });

    const results = await Promise.all(
      ACTIVITY_TABLES.map(async (cfg) => {
        const byCol = cfg.byCol ?? 'created_by';
        const cols = ['updated_at', cfg.titleCol, 'created_by', byCol].filter((v, i, a) => a.indexOf(v) === i).join(', ');
        const { data, error } = await supabase.from(cfg.name).select(cols).order('updated_at', { ascending: false }).limit(5);
        if (error || !data) return [];
        return (data as unknown as Record<string, string | null>[]).map((row) => ({
          table: cfg.name,
          icon: cfg.icon,
          label: cfg.label,
          detail: (row[cfg.titleCol] as string) || '',
          href: cfg.href,
          updated_at: row.updated_at as string,
          created_by: (row[byCol] as string | null) ?? (row.created_by as string | null),
        }));
      })
    );
    setRecentActivity(
      results.flat()
        .filter((r) => r.updated_at && r.detail)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 10)
    );
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRealtimeSync('movies', fetchData);
  useRealtimeSync('bucket_list', fetchData);
  useRealtimeSync('alphabet_dating', fetchData);
  useRealtimeSync('matching_items', fetchData);
  useRealtimeSync('wantlist', fetchData);
  useRealtimeSync('books', fetchData);
  useRealtimeSync('watchlist', fetchData);
  useRealtimeSync('duets', fetchData);
  useRealtimeSync('home_items', fetchData);
  useRealtimeSync('dishes', fetchData);
  useRealtimeSync('wedding_elements', fetchData);
  useRealtimeSync('wedding_budget', fetchData);
  useRealtimeSync('qa_questions', fetchData);
  useRealtimeSync('qa_answers', fetchData);
  useRealtimeSync('travel_locations', fetchData);
  useRealtimeSync('travel_pins', fetchData);

  return (
    <div className="relative z-10 space-y-8">

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Movies Watched', value: stats.movies, icon: '🎬', accent: '#F4A5B0', href: '/movies' },
          { label: 'Books', value: stats.books, icon: '📚', accent: '#7BA5D4', href: '/books' },
          { label: 'Bucket List', value: `${stats.bucketDone}/${stats.bucketTotal}`, icon: '✨', accent: '#A8C5A0', href: '/lists' },
          { label: 'Recipes Made', value: stats.recipes, icon: '🍳', accent: '#C9A0B4', href: '/recipes' },
        ].map((s) => (
          <Link key={s.label} href={s.href}
            className="glass-card rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden group"
            style={{ borderLeft: `3px solid ${s.accent}` }}>
            <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-0 group-hover:opacity-10 transition-opacity" style={{ background: s.accent }} />
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{s.icon}</span>
              <span className="text-xl font-bold" style={{ color: s.accent }}>{s.value}</span>
            </div>
            <span className="text-[11px] text-muted">{s.label}</span>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="font-heading text-lg text-foreground mb-3 flex items-center gap-2">
          <span className="text-base">✨</span> Quick Links
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickCard href="/movies" icon="🎬" title="Movies & Shows" subtitle="Add what you watched" color="#F4A5B0" />
          <QuickCard href="/lists" icon="📝" title="Bucket List" subtitle="Dreams to chase together" color="#A8C5A0" />
          <QuickCard href="/recipes" icon="🍳" title="Recipes" subtitle="Dishes to cook together" color="#C9A0B4" />
          <QuickCard href="/books" icon="📚" title="Books & Duets" subtitle="Reading & music list" color="#7BA5D4" />
          <QuickCard href="/wedding" icon="💒" title="Wedding" subtitle="Planning our big day" color="#F4A5B0" />
          <QuickCard href="/travel" icon="✈️" title="Travel" subtitle="Places to explore" color="#A8C5A0" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Recently watched */}
        <Link href="/movies" className="glass-card rounded-2xl p-5 hover:shadow-md transition-all group block" style={{ borderTop: '3px solid #F4A5B0' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-base text-foreground flex items-center gap-2">
              <span>🎬</span> Recently Watched
            </h2>
            <span className="text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity">View all →</span>
          </div>
          {recentMovies.length === 0 ? (
            <p className="text-sm text-muted italic">No movies yet</p>
          ) : (
            <ul className="space-y-1.5">
              {recentMovies.map((m, i) => (
                <li key={i} className="flex items-center justify-between text-sm py-1 border-b border-border/20 last:border-0">
                  <span className="text-foreground/80 truncate">{m.title}</span>
                  <span className="text-xs text-muted flex gap-2 shrink-0 ml-2">
                    {m.rating_joshua != null && <span className="text-mauve/80">J {(m.rating_joshua / 2).toFixed(1)}★</span>}
                    {m.rating_sophie != null && <span className="text-rose">S {(m.rating_sophie / 2).toFixed(1)}★</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Link>

        {/* Bucket list */}
        <Link href="/lists" className="glass-card rounded-2xl p-5 hover:shadow-md transition-all group block" style={{ borderTop: '3px solid #A8C5A0' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-base text-foreground flex items-center gap-2">
              <span>✨</span> Bucket List
            </h2>
            <span className="text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity">View all →</span>
          </div>
          {bucketItems.length === 0 ? (
            <p className="text-sm text-muted italic">Nothing yet — dream big!</p>
          ) : (
            <ul className="space-y-1.5">
              {bucketItems.map((b, i) => (
                <li key={i} className="text-sm text-foreground/80 py-1 border-b border-border/20 last:border-0 flex items-start gap-1.5">
                  {b.emoji && <span className="shrink-0">{b.emoji}</span>}
                  <span className="truncate">{b.text}</span>
                </li>
              ))}
            </ul>
          )}
        </Link>
      </div>

      {/* Activity feed */}
      <div className="glass-card rounded-2xl p-5" style={{ borderTop: '3px solid #C9A0B4' }}>
        <h2 className="font-heading text-base text-foreground mb-3 flex items-center gap-2">
          <span>📋</span> Recent Activity
        </h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted">No activity yet — start adding things together!</p>
        ) : (
          <ul className="space-y-2">
            {recentActivity.map((a, i) => (
              <li key={`${a.table}-${i}`}>
                <Link href={a.href} className="flex items-start gap-3 text-sm hover:bg-surface-hover/50 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                  <span className="text-base leading-5 shrink-0">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground/80 truncate">
                      {a.created_by && <span className="capitalize font-medium">{a.created_by}</span>}
                      {a.created_by && ' '}
                      <span className="text-muted">{a.label}:</span>{' '}
                      <span className="text-foreground">{a.detail}</span>
                    </p>
                  </div>
                  <span className="text-muted text-[11px] shrink-0 mt-0.5">
                    {formatDistanceToNow(new Date(a.updated_at), { addSuffix: true })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function HomePage() {
  const { currentUser, setUser } = useUser();

  if (!currentUser) {
    return <IdentityPicker onPick={setUser} />;
  }

  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}
