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
  const [imgError, setImgError] = useState(false);
  const showImg = pfpUrl && !imgError;

  return (
    <div className="relative">
      <div className="w-8 h-8 rounded-full overflow-hidden border-2 transition-all"
        style={{ borderColor: isOnline ? color : 'transparent', opacity: isOnline ? 1 : 0.4 }}>
        {showImg ? (
          <img src={pfpUrl} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
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
  const [cropFile, setCropFile] = useState<string | null>(null);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropImgSize, setCropImgSize] = useState({ w: 0, h: 0 });
  const cropImgRef = useRef<HTMLImageElement>(null);

  const [joshuaPfp, setJoshuaPfp] = useState<string | null>(null);
  const [sophiePfp, setSophiePfp] = useState<string | null>(null);

  // Load and validate pfp URLs from localStorage
  useState(() => {
    if (typeof window === 'undefined') return;
    const jp = localStorage.getItem('js-pfp-joshua');
    const sp = localStorage.getItem('js-pfp-sophie');
    // Clear broken HEIC URLs
    if (jp?.includes('.HEIC')) { localStorage.removeItem('js-pfp-joshua'); } else if (jp) setJoshuaPfp(jp);
    if (sp?.includes('.HEIC')) { localStorage.removeItem('js-pfp-sophie'); } else if (sp) setSophiePfp(sp);
  });

  // Step 1: User picks file → show crop modal
  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setCropImgSize({ w: img.width, h: img.height });
      setCropOffset({ x: 0, y: 0 });
      setCropFile(url);
    };
    img.src = url;
  };

  // Step 2: User confirms crop → upload
  const handleCropConfirm = async () => {
    if (!currentUser || !cropFile) return;
    setUploading(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = cropFile; });

      const canvas = document.createElement('canvas');
      const outSize = 512;
      canvas.width = outSize;
      canvas.height = outSize;
      const ctx = canvas.getContext('2d')!;

      // Calculate crop region based on drag offset
      const scale = Math.max(outSize / img.width, outSize / img.height);
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      const drawX = (outSize - scaledW) / 2 + cropOffset.x * scale;
      const drawY = (outSize - scaledH) / 2 + cropOffset.y * scale;

      // Clip to circle shape
      ctx.beginPath();
      ctx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, drawX, drawY, scaledW, scaledH);

      URL.revokeObjectURL(cropFile);
      setCropFile(null);

      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9));
      const path = `pfp/${currentUser}.jpg`;
      await supabase.storage.from('media').remove([`pfp/${currentUser}.jpg`, `pfp/${currentUser}.HEIC`, `pfp/${currentUser}.png`]);
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
                className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-all"
                title="Change profile photo">
                <Camera className="w-4 h-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ''; }} />

              <button onClick={toggleTheme}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-all">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {currentUser && (
                <button onClick={() => { setUser(null); router.push('/'); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground/60 hover:text-red-400 hover:bg-red-500/10 transition-all">
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
                      ? 'bg-mauve text-white shadow-lg shadow-mauve/20'
                      : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
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

      {/* ═══ CROP MODAL ═══ */}
      {cropFile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-3xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-foreground text-center mb-2">Position Your Photo</h3>
            <p className="text-foreground/40 text-xs text-center mb-5">Drag the image to adjust</p>

            {/* Crop area — circular mask */}
            <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-2 border-foreground/20 cursor-grab active:cursor-grabbing select-none"
              onMouseDown={(e) => {
                const startX = e.clientX;
                const startY = e.clientY;
                const startOff = { ...cropOffset };
                const onMove = (ev: MouseEvent) => {
                  setCropOffset({ x: startOff.x + (ev.clientX - startX), y: startOff.y + (ev.clientY - startY) });
                };
                const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
              }}
              onTouchStart={(e) => {
                const startX = e.touches[0].clientX;
                const startY = e.touches[0].clientY;
                const startOff = { ...cropOffset };
                const onMove = (ev: TouchEvent) => {
                  setCropOffset({ x: startOff.x + (ev.touches[0].clientX - startX), y: startOff.y + (ev.touches[0].clientY - startY) });
                };
                const onEnd = () => { document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd); };
                document.addEventListener('touchmove', onMove);
                document.addEventListener('touchend', onEnd);
              }}
            >
              <img ref={cropImgRef} src={cropFile} alt="Crop preview" draggable={false}
                className="absolute pointer-events-none"
                style={{
                  width: cropImgSize.w > cropImgSize.h ? 'auto' : '100%',
                  height: cropImgSize.h > cropImgSize.w ? 'auto' : '100%',
                  minWidth: '100%', minHeight: '100%',
                  left: `calc(50% + ${cropOffset.x}px)`,
                  top: `calc(50% + ${cropOffset.y}px)`,
                  transform: 'translate(-50%, -50%)',
                }} />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { URL.revokeObjectURL(cropFile); setCropFile(null); }}
                className="flex-1 py-2.5 rounded-xl border border-foreground/10 text-foreground/60 text-sm hover:bg-foreground/5 transition-all">
                Cancel
              </button>
              <button onClick={handleCropConfirm} disabled={uploading}
                className="flex-1 py-2.5 rounded-xl bg-mauve text-white text-sm font-medium hover:bg-mauve/90 active:scale-95 transition-all disabled:opacity-50">
                {uploading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
