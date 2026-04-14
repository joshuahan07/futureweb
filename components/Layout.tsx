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
  const [cropZoom, setCropZoom] = useState(1);
  const cropZoomRef = useRef(1);
  const [cropDragging, setCropDragging] = useState(false);
  const CIRCLE = 240;

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
      setCropZoom(1); cropZoomRef.current = 1;
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

      // Use EXACT same math as preview, scaled to output size
      const aspect = img.width / img.height;
      const previewScaledW = aspect >= 1 ? CIRCLE * cropZoom * aspect : CIRCLE * cropZoom;
      const previewScaledH = aspect >= 1 ? CIRCLE * cropZoom : CIRCLE * cropZoom / aspect;
      // Clamp offset same as preview
      const maxX = Math.max(0, (previewScaledW - CIRCLE) / 2);
      const maxY = Math.max(0, (previewScaledH - CIRCLE) / 2);
      const cx = Math.min(maxX, Math.max(-maxX, cropOffset.x));
      const cy = Math.min(maxY, Math.max(-maxY, cropOffset.y));
      // Scale everything from CIRCLE space to outSize space
      const s = outSize / CIRCLE;
      const drawW = previewScaledW * s;
      const drawH = previewScaledH * s;
      const drawX = (outSize - drawW) / 2 + cx * s;
      const drawY = (outSize - drawH) / 2 + cy * s;

      // Clip to circle shape
      ctx.beginPath();
      ctx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

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
      <nav className="app-nav sticky top-0 z-50 border-b border-glass-border bg-background/80 backdrop-blur-xl">
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
      <div className="app-tabs sticky top-14 z-40 border-b border-glass-border bg-background/70 backdrop-blur-xl">
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
      {cropFile && (() => {
        const aspect = cropImgSize.w / (cropImgSize.h || 1);
        const scaledW = aspect >= 1 ? CIRCLE * cropZoom * aspect : CIRCLE * cropZoom;
        const scaledH = aspect >= 1 ? CIRCLE * cropZoom : CIRCLE * cropZoom / aspect;
        // Clamp offset so image covers circle
        const maxX = Math.max(0, (scaledW - CIRCLE) / 2);
        const maxY = Math.max(0, (scaledH - CIRCLE) / 2);
        const cx = Math.min(maxX, Math.max(-maxX, cropOffset.x));
        const cy = Math.min(maxY, Math.max(-maxY, cropOffset.y));

        return (
          <div data-modal className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl p-6 w-full max-w-sm flex flex-col items-center gap-6"
              style={{ background: '#0a0a0a' }}>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">Profile photo</h3>
                <p className="text-white/40 text-sm mt-1">Drag to reposition · Scroll to zoom</p>
              </div>

              {/* Crop circle */}
              <div className="relative select-none" style={{ width: CIRCLE + 40, height: CIRCLE + 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: cropDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  setCropDragging(true);
                  const startX = e.clientX, startY = e.clientY;
                  const startOff = { x: cx, y: cy };
                  e.currentTarget.setPointerCapture(e.pointerId);
                  const onMove = (ev: PointerEvent) => {
                    // Recalculate max based on current zoom (zoom may change during drag via scroll)
                    const a = cropImgSize.w / (cropImgSize.h || 1);
                    const z = cropZoomRef.current;
                    const sw = a >= 1 ? CIRCLE * z * a : CIRCLE * z;
                    const sh = a >= 1 ? CIRCLE * z : CIRCLE * z / a;
                    const mx = Math.max(0, (sw - CIRCLE) / 2);
                    const my = Math.max(0, (sh - CIRCLE) / 2);
                    const nx = Math.min(mx, Math.max(-mx, startOff.x + (ev.clientX - startX)));
                    const ny = Math.min(my, Math.max(-my, startOff.y + (ev.clientY - startY)));
                    setCropOffset({ x: nx, y: ny });
                  };
                  const onUp = () => { setCropDragging(false); document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); };
                  document.addEventListener('pointermove', onMove);
                  document.addEventListener('pointerup', onUp);
                }}
                onWheel={(e) => { e.preventDefault(); setCropZoom(z => { const nz = Math.min(3, Math.max(1, z - e.deltaY * 0.002)); cropZoomRef.current = nz; return nz; }); }}
              >
                {/* Image in circle */}
                <div style={{ position: 'absolute', width: CIRCLE, height: CIRCLE, borderRadius: '50%', overflow: 'hidden' }}>
                  <img src={cropFile} alt="" draggable={false}
                    style={{
                      position: 'absolute', pointerEvents: 'none',
                      left: `calc(50% - ${scaledW / 2}px + ${cx}px)`,
                      top: `calc(50% - ${scaledH / 2}px + ${cy}px)`,
                      width: scaledW, height: scaledH, objectFit: 'cover',
                      transition: cropDragging ? 'none' : 'all 0.15s',
                    }} />
                </div>
                {/* Border + shadow */}
                <div style={{
                  position: 'absolute', width: CIRCLE, height: CIRCLE, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.55), inset 0 0 30px rgba(0,0,0,0.2)',
                  pointerEvents: 'none',
                }} />
                {/* Grid lines while dragging */}
                {cropDragging && (
                  <svg width={CIRCLE} height={CIRCLE} viewBox={`0 0 ${CIRCLE} ${CIRCLE}`}
                    style={{ position: 'absolute', pointerEvents: 'none', opacity: 0.3 }}>
                    <defs><clipPath id="cc"><circle cx={CIRCLE/2} cy={CIRCLE/2} r={CIRCLE/2} /></clipPath></defs>
                    <g clipPath="url(#cc)">
                      <line x1={CIRCLE/3} y1={0} x2={CIRCLE/3} y2={CIRCLE} stroke="white" strokeWidth="0.5" />
                      <line x1={CIRCLE*2/3} y1={0} x2={CIRCLE*2/3} y2={CIRCLE} stroke="white" strokeWidth="0.5" />
                      <line y1={CIRCLE/3} x1={0} y2={CIRCLE/3} x2={CIRCLE} stroke="white" strokeWidth="0.5" />
                      <line y1={CIRCLE*2/3} x1={0} y2={CIRCLE*2/3} x2={CIRCLE} stroke="white" strokeWidth="0.5" />
                    </g>
                  </svg>
                )}
              </div>

              {/* Zoom slider */}
              <div className="flex items-center gap-3 w-full max-w-[280px]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
                </svg>
                <div className="flex-1 relative h-9 flex items-center">
                  <div className="absolute left-0 right-0 h-[3px] rounded-full bg-white/10" />
                  <div className="absolute left-0 h-[3px] rounded-full" style={{ width: `${((cropZoom - 1) / 2) * 100}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
                  <input type="range" min="1" max="3" step="0.01" value={cropZoom}
                    onChange={(e) => { const nz = parseFloat(e.target.value); setCropZoom(nz); cropZoomRef.current = nz; }}
                    className="relative w-full h-9 appearance-none bg-transparent cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer" />
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /><line x1="11" y1="8" x2="11" y2="14" />
                </svg>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 w-full max-w-[280px]">
                <button onClick={() => { URL.revokeObjectURL(cropFile); setCropFile(null); }}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button onClick={handleCropConfirm} disabled={uploading}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-semibold active:scale-95 transition-all disabled:opacity-50"
                  style={{ background: uploading ? '#22c55e' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                  {uploading ? '✓ Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}
