'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from './UserContext';
import { useTheme } from './ThemeContext';
import { usePresence } from '@/lib/presence';
import {
  Film,
  ListTodo,
  BookOpen,
  UtensilsCrossed,
  Heart,
  MessageCircle,
  MapPin,
  Gift,
  Home,
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
    <button
      onClick={toggleTheme}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-hover text-foreground/70 hover:text-foreground transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setUser } = useUser();
  const onlineUsers = usePresence(currentUser);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* ── Top Navigation ── */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-rose/15 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="font-heading text-2xl text-foreground">J</span>
              <Heart className="w-5 h-5 text-rose" fill="currentColor" />
              <span className="font-heading text-2xl text-foreground">S</span>
            </Link>

            {/* Right side: avatars + theme */}
            <div className="flex items-center gap-3">
              {/* Joshua avatar */}
              <div className="relative" title={onlineUsers.includes('joshua') ? 'Joshua is online' : 'Joshua is offline'}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  onlineUsers.includes('joshua')
                    ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-[#0B0F1A]'
                    : 'bg-surface-hover text-muted'
                }`}>
                  J
                </div>
                {onlineUsers.includes('joshua') && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-surface animate-pulse" />
                )}
              </div>

              {/* Sophie avatar */}
              <div className="relative" title={onlineUsers.includes('sophie') ? 'Sophie is online' : 'Sophie is offline'}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  onlineUsers.includes('sophie')
                    ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-400 ring-offset-2 dark:ring-offset-[#0B0F1A]'
                    : 'bg-surface-hover text-muted'
                }`}>
                  S
                </div>
                {onlineUsers.includes('sophie') && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-surface animate-pulse" />
                )}
              </div>

              <ThemeToggle />
              {currentUser && (
                <button
                  onClick={() => { setUser(null); router.push('/'); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-hover text-foreground/70 hover:text-foreground transition-colors"
                  aria-label="Switch user"
                  title="Switch user"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Tab Bar ── */}
      <div className="sticky top-16 z-40 bg-surface/90 backdrop-blur-sm border-b border-rose/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto py-3 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-400 to-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-rose-900/30'
                      : 'text-muted hover:bg-rose/8 hover:text-rose'
                  }`}
                >
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
      <footer className="py-8 text-center text-muted text-sm">
        <p>Made with love for J & S</p>
      </footer>
    </div>
  );
}
