'use client';

import { ReactNode, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from './UserContext';
import { useTheme } from './ThemeContext';
import { usePresence } from '@/lib/presence';
import { supabase } from '@/lib/supabase';
import AnimatedBackground from './AnimatedBackground';
import {
  Film, Star, BookOpen, UtensilsCrossed, Heart,
  MessageCircleQuestion, MapPin, Gift, LayoutDashboard,
  Sun, Moon, LogOut, Camera,
} from 'lucide-react';

const tabs = [
  { label: 'Home', href: '/', icon: LayoutDashboard },
  { label: 'Bucket List', href: '/lists', icon: Star },
  { label: 'Movies', href: '/movies', icon: Film },
  { label: 'Books', href: '/books', icon: BookOpen },
  { label: 'Recipes', href: '/recipes', icon: UtensilsCrossed },
  { label: 'Travel', href: '/travel', icon: MapPin },
  { label: 'Wedding', href: '/wedding', icon: Heart },
  { label: 'Q&A', href: '/qa', icon: MessageCircleQuestion },
  { label: 'Gifts', href: '/gifts', icon: Gift },
] as const;

function UserAvatar({ name, color, isOnline, pfpUrl }: {
  name: string; color: string; isOnline: boolean; pfpUrl?: string | null;
}) {
  return (
    <div className="relative">
      <div className="w-8 h-8 rounded-full overflow-hidden border-2 transition-all"
        style={{ borderColor: isOnline ? color : 'transparent', opacity: isOnline ? 1 : 0.4 }}>
        {pfpUrl ? (
          <img src={pfpUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white" style={{ background: color }}>
            {name[0]}
          </div>
        )}
      </div>
      {isOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
      )}
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const onlineUsers = usePresence(currentUser);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const joshuaPfp = typeof window !== 'undefined' ? localStorage.getItem('js-pfp-joshua') : null;
  const sophiePfp = typeof window !== 'undefined' ? localStorage.getItem('js-pfp-sophie') : null;

  const handleUploadPfp = async (file: File) => {
    if (!currentUser) return;
    setUploading(true);
    try {
      // Convert to JPEG via canvas (handles HEIC, WebP, etc)
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });
      const canvas = document.createElement('canvas');
      const size = Math.min(img.width, img.height, 512);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      // Center crop
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
      URL.revokeObjectURL(url);

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85)
      );

      const path = `pfp/${currentUser}.jpg`;
      // Delete old files first
      await supabase.storage.from('media').remove([`pfp/${currentUser}.jpg`, `pfp/${currentUser}.HEIC`, `pfp/${currentUser}.png`, `pfp/${currentUser}.webp`]);
      const { error } = await supabase.storage.from('media').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) { console.error('PFP upload error:', error.message); setUploading(false); return; }
      const { data } = supabase.storage.from('media').getPublicUrl(path);
      localStorage.setItem(`js-pfp-${currentUser}`, data.publicUrl + '?t=' + Date.now());
      window.location.reload();
    } catch (e) {
      console.error('PFP processing error:', e);
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      <AnimatedBackground />

      {/* ═══ TOP NAV ═══ */}
      <nav className="sticky top-0 z-50 border-b border-glass-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(236,72,153,0.3))', border: '1px solid rgba(255,255,255,0.15)' }}>
                <Heart className="w-4 h-4 text-white" fill="currentColor" />
              </div>
              <span className="font-bold text-foreground hidden sm:inline">LoveNest</span>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-2.5">
              <UserAvatar name="Joshua" color="#3B82F6" isOnline={onlineUsers.includes('joshua')} pfpUrl={joshuaPfp} />
              <UserAvatar name="Sophie" color="#EC4899" isOnline={onlineUsers.includes('sophie')} pfpUrl={sophiePfp} />
              <div className="w-px h-5 bg-foreground/10 mx-1" />

              {/* Change Photo — direct click */}
              <button onClick={() => fileRef.current?.click()}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all"
                title="Change profile photo">
                <Camera className="w-4 h-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadPfp(f); e.target.value = ''; }} />

              <button onClick={toggleTheme}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {currentUser && (
                <button onClick={() => { setUser(null); router.push('/'); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ═══ TAB BAR ═══ */}
      <div className="sticky top-14 z-40 border-b border-glass-border bg-background/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              return (
                <Link key={tab.href} href={tab.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 active:scale-95 ${
                    isActive
                      ? 'bg-foreground/10 text-white'
                      : 'text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5'
                  }`}>
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-6xl mx-auto px-4 sm:px-6 py-6"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <p className="text-foreground/20 text-xs">Joshua & Sophie&apos;s Private Space</p>
      </footer>
    </div>
  );
}
