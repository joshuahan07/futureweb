'use client';

import { ReactNode, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from './UserContext';
import { useTheme } from './ThemeContext';
import { usePresence } from '@/lib/presence';
import { supabase } from '@/lib/supabase';
import {
  Film, ListTodo, BookOpen, UtensilsCrossed, Heart,
  MessageCircle, MapPin, Gift, Home, Sun, Moon, LogOut,
  Settings, Camera,
} from 'lucide-react';

const tabs = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Bucket List', href: '/lists', icon: ListTodo },
  { label: 'Movies', href: '/movies', icon: Film },
  { label: 'Books', href: '/books', icon: BookOpen },
  { label: 'Recipes', href: '/recipes', icon: UtensilsCrossed },
  { label: 'Travel', href: '/travel', icon: MapPin },
  { label: 'Wedding', href: '/wedding', icon: Heart },
  { label: 'Q&A', href: '/qa', icon: MessageCircle },
  { label: 'Gifts', href: '/gifts', icon: Gift },
] as const;

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme}
      className="w-9 h-9 flex items-center justify-center rounded-xl glass hover:bg-surface-hover transition-all duration-200 active:scale-95"
      aria-label="Toggle theme">
      {theme === 'light' ? <Moon className="w-4 h-4 text-foreground/60" /> : <Sun className="w-4 h-4 text-foreground/60" />}
    </button>
  );
}

function UserAvatar({ name, color, isOnline, pfpUrl, onClick }: {
  name: string; color: string; isOnline: boolean; pfpUrl?: string | null; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="relative group" title={`${name} ${isOnline ? 'is online' : 'is offline'}`}>
      <div className={`w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
        isOnline
          ? 'ring-2 ring-offset-2 ring-offset-background'
          : 'opacity-50'
      }`}
        style={{ background: pfpUrl ? undefined : color, ['--tw-ring-color' as string]: isOnline ? color : undefined } as React.CSSProperties}>
        {pfpUrl ? (
          <img src={pfpUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white">{name[0]}</span>
        )}
      </div>
      {isOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-sage rounded-full border-2 border-background animate-pulse" />
      )}
    </button>
  );
}

function SettingsDropdown({ onClose }: { onClose: () => void }) {
  const { currentUser } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadPfp = async (file: File) => {
    if (!currentUser) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `pfp/${currentUser}.${ext}`;
    await supabase.storage.from('media').upload(path, file, { upsert: true });
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    localStorage.setItem(`js-pfp-${currentUser}`, data.publicUrl + '?t=' + Date.now());
    setUploading(false);
    onClose();
    window.location.reload();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-56 glass-card rounded-2xl p-2 animate-scale-in z-50">
      <div className="px-3 py-2 text-xs text-muted font-medium uppercase tracking-wider">Settings</div>
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/80 hover:bg-surface-hover transition-colors">
        <Camera className="w-4 h-4 text-mauve" />
        {uploading ? 'Uploading...' : 'Change Profile Photo'}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadPfp(f); }} />
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setUser } = useUser();
  const onlineUsers = usePresence(currentUser);
  const [showSettings, setShowSettings] = useState(false);

  // Load profile photos from localStorage
  const joshuaPfp = typeof window !== 'undefined' ? localStorage.getItem('js-pfp-joshua') : null;
  const sophiePfp = typeof window !== 'undefined' ? localStorage.getItem('js-pfp-sophie') : null;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* ── Top Navigation ── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b border-glass-border transition-colors duration-300"
        style={{ background: 'var(--topnav-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-heading text-xl font-bold text-foreground group-hover:text-rose transition-colors">J</span>
              <Heart className="w-4 h-4 text-rose animate-heartbeat" fill="currentColor" />
              <span className="font-heading text-xl font-bold text-foreground group-hover:text-rose transition-colors">S</span>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <UserAvatar name="Joshua" color="#3B82F6" isOnline={onlineUsers.includes('joshua')} pfpUrl={joshuaPfp}
                onClick={currentUser === 'joshua' ? () => setShowSettings(!showSettings) : undefined} />
              <UserAvatar name="Sophie" color="#EC4899" isOnline={onlineUsers.includes('sophie')} pfpUrl={sophiePfp}
                onClick={currentUser === 'sophie' ? () => setShowSettings(!showSettings) : undefined} />

              <div className="w-px h-6 bg-border mx-1" />

              <ThemeToggle />

              {currentUser && (
                <button
                  onClick={() => { setUser(null); router.push('/'); }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl glass hover:bg-surface-hover transition-all duration-200 active:scale-95"
                  aria-label="Switch user" title="Switch user">
                  <LogOut className="w-4 h-4 text-foreground/60" />
                </button>
              )}

              {/* Settings dropdown */}
              {showSettings && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                  <div className="relative">
                    <SettingsDropdown onClose={() => setShowSettings(false)} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Tab Bar ── */}
      <div className="sticky top-16 z-40 backdrop-blur-lg border-b border-glass-border transition-colors duration-300"
        style={{ background: 'var(--topnav-bg)' }}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-center gap-1 overflow-x-auto py-2.5 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;

              return (
                <Link key={tab.href} href={tab.href}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 active:scale-95 ${
                    isActive
                      ? 'bg-mauve text-white shadow-lg shadow-mauve/25'
                      : 'text-muted hover:text-foreground hover:bg-surface-hover'
                  }`}>
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="py-8 text-center text-sm">
        <p className="text-muted/60">Made with <Heart className="w-3 h-3 text-rose inline animate-heartbeat" fill="currentColor" /> for J & S</p>
      </footer>
    </div>
  );
}
