'use client';

import { useState } from 'react';
import ConfettiEffect from './ConfettiEffect';

export interface BucketListItem {
  id: string;
  text: string;
  emoji: string;
  completed: boolean;
  category: string;
  created_at: string;
}

interface BucketItemProps {
  item: BucketListItem;
  onToggle: (id: string, completed: boolean) => void;
  onUpdateEmoji: (id: string, emoji: string) => void;
  onDelete: (id: string) => void;
  onEditCategory?: (id: string) => void;
}

export default function BucketItem({
  item,
  onToggle,
  onUpdateEmoji,
  onDelete,
  onEditCategory,
}: BucketItemProps) {
  const [confetti, setConfetti] = useState(false);
  const [editingEmoji, setEditingEmoji] = useState(false);
  const [emojiInput, setEmojiInput] = useState(item.emoji);

  const handleToggle = () => {
    if (!item.completed) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 100);
    }
    onToggle(item.id, !item.completed);
  };

  const handleEmojiSave = () => {
    onUpdateEmoji(item.id, emojiInput);
    setEditingEmoji(false);
  };

  return (
    <div
      className={`relative group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
        item.completed
          ? 'bg-sage/10 border border-sage/20'
          : 'bg-surface border border-rose-100 hover:border-rose-200 hover:shadow-md'
      }`}
    >
      <ConfettiEffect trigger={confetti} />

      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
          item.completed
            ? 'bg-emerald-400 border-emerald-400 text-white'
            : 'border-rose-300 hover:border-rose-400'
        }`}
      >
        {item.completed && (
          <svg
            className="w-3.5 h-3.5"
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
        )}
      </button>

      {/* Emoji */}
      {editingEmoji ? (
        <input
          type="text"
          value={emojiInput}
          onChange={(e) => setEmojiInput(e.target.value)}
          onBlur={handleEmojiSave}
          onKeyDown={(e) => e.key === 'Enter' && handleEmojiSave()}
          className="w-10 h-10 text-center text-2xl bg-transparent border border-rose-200 rounded-lg focus:outline-none"
          autoFocus
        />
      ) : (
        <button
          onClick={() => setEditingEmoji(true)}
          className="text-2xl hover:scale-110 transition-transform"
          title="Click to change emoji"
        >
          {item.emoji}
        </button>
      )}

      {/* Text */}
      <span
        className={`flex-1 text-sm font-medium transition-all ${
          item.completed
            ? 'line-through text-emerald-600/60 decoration-emerald-400'
            : 'text-foreground/80'
        }`}
      >
        {item.text}
      </span>

      {/* Category chip — clickable to edit */}
      <button
        onClick={() => onEditCategory?.(item.id)}
        className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-mauve/10 text-mauve border border-mauve/15 hover:bg-mauve/15 transition-colors"
        title="Click to change category"
      >
        {item.category}
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted/60 hover:text-red-400 text-sm"
      >
        ✕
      </button>
    </div>
  );
}
