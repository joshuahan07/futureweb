'use client';

import { ReactNode, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from './UserContext';
import { useTheme } from './ThemeContext';
import { usePresence } from '@/lib/presence';
import { supabase } from '@/lib/supabase';
import AnimatedBackground from './AnimatedBackground';
import {
  Film, Star, BookOpen, UtensilsCrossed, Heart,
  MessageCircleQuestion, MapPin, Gift, LayoutDashboard,
  Sun, Moon, LogOut, Camera, Menu, X,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Movies & Shows', href: '/movies', icon: Film },
  { label: 'Bucket List', href: '/lists', icon: Star },
  { label: 'Books & Duets', href: '/books', icon: BookOpen },
  { label: 'Recipes', href: '/recipes', icon: UtensilsCrossed },
  { label: 'Travel', href: '/travel', icon: MapPin },
  { label: 'Wedding', href: '/wedding', icon: Heart },
  { label: 'Q&A Journal', href: '/qa', icon: MessageCircleQuestion },
  { label: 'Gifts', href: '/gifts', icon: Gift },
] as const;

function UserAvatar({ name, color, isOnline, pfpUrl }: {
  name: string; color: string; isOnline: boolean; pfpUrl?: string | null;
}) {
  return (
    <div className="relative">
      <div className="w-8 h-8 rounded-full overflow-hidden border-2 transition-all"
        style={{ borderColor: color, opacity: isOnline ? 1 : 0.5 }}>
        {pfpUrl ? (
          <img src={pfpUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white" style={{ background: color }}>
            {name[0]}
          </div>
        )}
      </div>
      {isOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
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
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const joshuaPfp = typeof window !== 'undefined' ? localStorage.getItem('js-pfp-joshua') : null;
  const sophiePfp = typeof window !== 'undefined' ? localStorage.getItem('js-pfp-sophie') : null;

  const handleUploadPfp = async (file: File) => {
    if (!currentUser) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `pfp/${currentUser}.${ext}`;
    await supabase.storage.from('media').upload(path, file, { upsert: true });
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    localStorage.setItem(`js-pfp-${currentUser}`, data.publicUrl + '?t=' + Date.now());
    setUploading(false);
    setShowSettings(false);
    window.location.reload();
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="p-5 flex items-center">
        <Link href="/" className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(236,72,153,0.3))', border: '1px solid rgba(255,255,255,0.2)' }}>
          <Heart className="w-5 h-5 text-white" />
        </Link>
        {(sidebarExpanded || mobile) && (
          <span className="ml-3 font-bold text-foreground whitespace-nowrap">LoveNest</span>
        )}
      </div>

      {/* User avatars */}
      <div className="px-4 pb-3 flex items-center justify-center gap-2">
        <UserAvatar name="Joshua" color="#3B82F6" isOnline={onlineUsers.includes('joshua')} pfpUrl={joshuaPfp} />
        <UserAvatar name="Sophie" color="#EC4899" isOnline={onlineUsers.includes('sophie')} pfpUrl={sophiePfp} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              onClick={() => mobile && setMobileMenuOpen(false)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                  style={{ background: 'linear-gradient(180deg, #3B82F6, #EC4899)' }} />
              )}
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(sidebarExpanded || mobile) && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-2 space-y-1 border-t border-white/10">
        <button onClick={() => { setShowSettings(!showSettings); if (!sidebarExpanded && !mobile) fileRef.current?.click(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all">
          <Camera className="w-5 h-5 flex-shrink-0" />
          {(sidebarExpanded || mobile) && <span className="text-sm font-medium whitespace-nowrap">{uploading ? 'Uploading...' : 'Profile Photo'}</span>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadPfp(f); }} />
        {showSettings && (sidebarExpanded || mobile) && (
          <button onClick={() => fileRef.current?.click()}
            className="w-full text-left px-6 py-2 rounded-xl text-mauve hover:bg-mauve/10 transition-all text-sm animate-fade-in">
            Upload new photo
          </button>
        )}

        <button onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all">
          {theme === 'dark' ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
          {(sidebarExpanded || mobile) && <span className="text-sm font-medium whitespace-nowrap">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {currentUser && (
          <button onClick={() => { setUser(null); router.push('/'); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(sidebarExpanded || mobile) && <span className="text-sm font-medium whitespace-nowrap">Switch User</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen relative">
      <AnimatedBackground />

      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <aside className="hidden md:block fixed left-0 top-0 h-full z-50 glass-strong transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
        style={{ width: sidebarExpanded ? 240 : 72 }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => { setSidebarExpanded(false); setShowSettings(false); }}>
        <SidebarContent />
      </aside>

      {/* ═══ MOBILE TOP BAR ═══ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-strong h-14 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(236,72,153,0.3))', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-foreground text-sm">LoveNest</span>
        </Link>
        <div className="flex items-center gap-2">
          <UserAvatar name="Joshua" color="#3B82F6" isOnline={onlineUsers.includes('joshua')} pfpUrl={joshuaPfp} />
          <UserAvatar name="Sophie" color="#EC4899" isOnline={onlineUsers.includes('sophie')} pfpUrl={sophiePfp} />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-9 h-9 rounded-xl glass flex items-center justify-center text-foreground/60">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setMobileMenuOpen(false)} />
          <div className="md:hidden fixed right-0 top-0 h-full w-64 z-50 glass-strong animate-fade-in">
            <div className="pt-16">
              <SidebarContent mobile />
            </div>
          </div>
        </>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 relative z-10 md:ml-[72px] mt-14 md:mt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
