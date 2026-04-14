'use client';

import { useState } from 'react';

interface WatchlistEntry {
  id: string;
  title: string;
  type: 'show' | 'movie';
  watched: boolean;
  watched_date?: string | null;
  notes?: string | null;
}

interface WatchlistItemProps {
  item: WatchlistEntry;
  onMarkWatched: (id: string, date: string) => void;
  onUpdate: (id: string, updates: Partial<WatchlistEntry>) => void;
}

export default function WatchlistItem({ item, onMarkWatched, onUpdate }: WatchlistItemProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const formatMonthYear = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (item.watched) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface-hover/50/80 border border-border transition-all duration-200">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-muted/60 text-sm">&#10003;</span>
          <span className="relative text-sm text-muted">
            <span className="opacity-60">{item.title}</span>
            <span
              className="absolute left-0 right-0 top-1/2 h-[1.5px] rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, #d4a0aa 15%, #c9a0b4 50%, #d4a0aa 85%, transparent 100%)',
                transform: 'translateY(-50%) rotate(-0.5deg)',
              }}
            />
          </span>
        </div>
        {item.watched_date && (
          <span className="shrink-0 ml-3 text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-400 border border-rose-100">
            {formatMonthYear(item.watched_date)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-3 rounded-xl glass-card hover:border-border hover:shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-sm font-medium text-foreground/80 truncate">
            {item.title}
          </span>
          <span
            className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              item.type === 'show'
                ? 'bg-indigo-50 text-indigo-500'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            {item.type === 'show' ? 'Show' : 'Movie'}
          </span>
        </div>

        {!showDatePicker && (
          <button
            onClick={() => setShowDatePicker(true)}
            className="shrink-0 ml-3 text-xs px-3 py-1 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors font-medium"
          >
            Mark as watched
          </button>
        )}
      </div>

      {showDatePicker && (
        <div className="flex items-center gap-2 mt-2.5 animate-fade-in">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs border border-border rounded-lg px-2 py-1 text-foreground/70 focus:outline-none focus:ring-1 focus:ring-rose-300"
          />
          <button
            onClick={() => {
              onMarkWatched(item.id, selectedDate);
              setShowDatePicker(false);
            }}
            className="text-xs px-3 py-1 rounded-full bg-sage text-white font-medium hover:opacity-90 transition-opacity"
          >
            Done
          </button>
          <button
            onClick={() => setShowDatePicker(false)}
            className="text-xs text-muted hover:text-foreground/70"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
