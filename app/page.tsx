'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/components/UserContext';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/lib/realtime';
import { formatDistanceToNow } from 'date-fns';
import { Heart } from 'lucide-react';

// ── Identity Picker ──────────────────────────────────────────

function IdentityPicker({ onPick }: { onPick: (user: 'joshua' | 'sophie') => void }) {
  const joshuaPfp = typeof window !== 'undefined' ? localStorage.getItem('js-pfp-joshua') : null;
  const sophiePfp = typeof window !== 'undefined' ? localStorage.getItem('js-pfp-sophie') : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <FloatingBackground />
      <div className="text-center px-6 animate-scale-in relative z-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <Heart className="w-6 h-6 text-rose animate-heartbeat" fill="currentColor" />
        </div>
        <h1 className="font-heading text-5xl sm:text-6xl font-bold text-foreground mb-2 tracking-tight">
          LoveNest
        </h1>
        <p className="font-script text-2xl text-rose mb-2">Joshua & Sophie</p>
        <p className="text-muted mb-12">Who&apos;s here?</p>
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          {([
            { name: 'joshua' as const, color: '#3B82F6', gradient: 'from-blue-500 to-indigo-500', pfp: joshuaPfp },
            { name: 'sophie' as const, color: '#EC4899', gradient: 'from-pink-500 to-rose-500', pfp: sophiePfp },
          ]).map(({ name, color, gradient, pfp }) => (
            <button key={name} onClick={() => onPick(name)}
              className="group relative w-48 glass-card rounded-3xl p-6 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 active:scale-95">
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              <div className="relative flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-3xl shadow-lg"
                  style={{ background: pfp ? undefined : `linear-gradient(135deg, ${color}40, ${color}20)` }}>
                  {pfp ? <img src={pfp} alt={name} className="w-full h-full object-cover" /> : (name === 'joshua' ? '🧑' : '👩')}
                </div>
                <span className="font-heading text-lg font-semibold capitalize text-foreground">{name}</span>
                <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${gradient} opacity-50 group-hover:opacity-100 group-hover:w-16 transition-all duration-300`} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Floating Background ──────────────────────────────────────

function FloatingBackground() {
  const particles = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 15}s`,
      duration: `${15 + Math.random() * 20}s`,
      size: 10 + Math.random() * 14,
      type: i % 3 === 0 ? 'star' : 'heart',
    })),
    []
  );

  return (
    <div className="floating-bg fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <span key={p.id} className={p.type}
          style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration, fontSize: p.size, color: p.type === 'heart' ? '#F4A5B025' : '#C9A0B418' }}>
          {p.type === 'heart' ? '♥' : '✦'}
        </span>
      ))}
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
      className="group glass-card rounded-2xl p-4 hover:border-rose/30 transition-all hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${color}15` }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground group-hover:text-rose transition-colors">{title}</h3>
          <p className="text-xs text-muted mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

// ── Dashboard ────────────────────────────────────────────────

interface RecentItem {
  table: string;
  title: string;
  updated_at: string;
  created_by: string | null;
}

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

    const tables = ['movies', 'bucket_list', 'books', 'dishes'] as const;
    const results = await Promise.all(
      tables.map((t) =>
        supabase.from(t).select('updated_at, created_by').order('updated_at', { ascending: false }).limit(3)
          .then((r) => (r.data ?? []).map((row) => ({
            table: t, title: t.replace(/_/g, ' '), updated_at: row.updated_at, created_by: row.created_by,
          })))
      )
    );
    setRecentActivity(
      results.flat().sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 6)
    );
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRealtimeSync('movies', fetchData);
  useRealtimeSync('bucket_list', fetchData);

  return (
    <div className="relative z-10 space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="font-heading text-3xl sm:text-4xl text-foreground">
          {getGreeting(currentUser!)}
        </h1>
        <p className="text-muted mt-1 text-sm">Here&apos;s what&apos;s happening in your world</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Movies Watched', value: stats.movies, icon: '🎬' },
          { label: 'Books', value: stats.books, icon: '📚' },
          { label: 'Bucket List', value: `${stats.bucketDone}/${stats.bucketTotal}`, icon: '✨' },
          { label: 'Recipes Made', value: stats.recipes, icon: '🍳' },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{s.icon}</span>
              <span className="text-lg font-bold text-foreground">{s.value}</span>
            </div>
            <span className="text-[11px] text-muted">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="font-heading text-lg text-foreground mb-3">Quick Links</h2>
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
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-heading text-base text-foreground mb-3">Recently Watched</h2>
          {recentMovies.length === 0 ? (
            <p className="text-sm text-muted">No movies yet</p>
          ) : (
            <ul className="space-y-2">
              {recentMovies.map((m, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/80">{m.title}</span>
                  <span className="text-xs text-muted flex gap-2">
                    {m.rating_joshua != null && <span className="text-blue-400">J: {m.rating_joshua}/10</span>}
                    {m.rating_sophie != null && <span className="text-rose">S: {m.rating_sophie}/10</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bucket list */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-heading text-base text-foreground mb-3">Bucket List</h2>
          {bucketItems.length === 0 ? (
            <p className="text-sm text-muted">Nothing yet — dream big!</p>
          ) : (
            <ul className="space-y-2">
              {bucketItems.map((b, i) => (
                <li key={i} className="text-sm text-foreground/80">
                  {b.emoji && <span className="mr-1.5">{b.emoji}</span>}
                  {b.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Activity feed */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-heading text-base text-foreground mb-3">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted">No activity yet — start adding things together!</p>
        ) : (
          <ul className="space-y-2">
            {recentActivity.map((a, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-foreground/80 capitalize">{a.title}</span>
                <span className="text-muted text-xs">
                  {a.created_by && <span className="mr-2 capitalize">{a.created_by}</span>}
                  {formatDistanceToNow(new Date(a.updated_at), { addSuffix: true })}
                </span>
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
      <FloatingBackground />
      <Dashboard />
    </Layout>
  );
}
