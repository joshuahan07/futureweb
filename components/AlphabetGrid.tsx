'use client';

import { useState } from 'react';

export interface AlphabetEntry {
  id: string;
  letter: string;
  activities: string;
  completed: boolean;
  date_completed: string | null;
}

interface AlphabetGridProps {
  entries: AlphabetEntry[];
  onComplete: (id: string, date: string) => void;
  onUncomplete: (id: string) => void;
}

export default function AlphabetGrid({
  entries,
  onComplete,
  onUncomplete,
}: AlphabetGridProps) {
  const [selectedLetter, setSelectedLetter] = useState<AlphabetEntry | null>(
    null
  );
  const [dateInput, setDateInput] = useState('');

  const completedCount = entries.filter((e) => e.completed).length;

  const handleComplete = () => {
    if (selectedLetter && dateInput) {
      onComplete(selectedLetter.id, dateInput);
      setSelectedLetter(null);
      setDateInput('');
    }
  };

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-3 rounded-full bg-rose-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${(completedCount / 26) * 100}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-muted">
          {completedCount}/26 letters done
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-3">
        {entries.map((entry) => (
          <button
            key={entry.id}
            onClick={() => {
              if (entry.completed) {
                onUncomplete(entry.id);
              } else {
                setSelectedLetter(entry);
              }
            }}
            className={`relative group p-3 rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${
              entry.completed
                ? 'bg-emerald-50 border-emerald-300 hover:border-emerald-400'
                : 'bg-surface border-rose-100 hover:border-rose-300 hover:shadow-md'
            }`}
          >
            <div
              className={`text-3xl font-bold mb-1 ${
                entry.completed ? 'text-emerald-500' : 'text-rose-400'
              }`}
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {entry.letter}
            </div>
            <div className="text-[10px] leading-tight text-muted line-clamp-2">
              {entry.activities}
            </div>
            {entry.completed && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
            {entry.date_completed && (
              <div className="text-[9px] text-emerald-500 mt-1 font-medium">
                {new Date(entry.date_completed + 'T00:00:00').toLocaleDateString(
                  'en-US',
                  { month: 'short', year: '2-digit' }
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Date modal */}
      {selectedLetter && (
        <div data-modal className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xl"
            onClick={() => setSelectedLetter(null)}
          />
          <div
            className="relative bg-surface rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            <h3 className="text-lg font-bold text-foreground mb-1">
              Letter {selectedLetter.letter} Complete! 🎉
            </h3>
            <p className="text-sm text-muted mb-4">
              {selectedLetter.activities}
            </p>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5">
              When did you do this?
            </label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border focus:border-rose-400 focus:outline-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedLetter(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-muted font-medium hover:bg-surface-hover/50"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-400 to-emerald-400 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Done!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
