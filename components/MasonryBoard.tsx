'use client';

import { useState, useRef, DragEvent } from 'react';

export interface MediaItem {
  id: string;
  url: string;
  caption: string;
  position: number;
}

interface MasonryBoardProps {
  images: MediaItem[];
  onDelete: (id: string) => void;
  onUpdateCaption: (id: string, caption: string) => void;
  onReorder: (images: MediaItem[]) => void;
}

export default function MasonryBoard({
  images,
  onDelete,
  onUpdateCaption,
  onReorder,
}: MasonryBoardProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const captionInputRef = useRef<HTMLInputElement>(null);

  const sorted = [...images].sort((a, b) => a.position - b.position);

  const startEdit = (item: MediaItem) => {
    setEditingId(item.id);
    setEditValue(item.caption);
    setTimeout(() => captionInputRef.current?.focus(), 0);
  };

  const saveEdit = (id: string) => {
    onUpdateCaption(id, editValue);
    setEditingId(null);
  };

  const handleDragStart = (e: DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedId) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const fromIndex = sorted.findIndex((img) => img.id === draggedId);
    const toIndex = sorted.findIndex((img) => img.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = [...sorted];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const updated = reordered.map((img, i) => ({ ...img, position: i }));
    onReorder(updated);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  if (sorted.length === 0) {
    return (
      <div className="py-16 text-center">
        <svg
          className="w-16 h-16 mx-auto text-neutral-200 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6.75v11.25c0 1.242 1.008 2.25 2.25 2.25z"
          />
        </svg>
        <p className="text-muted text-sm">
          No images yet — drop some above!
        </p>
      </div>
    );
  }

  return (
    <div className="columns-2 md:columns-3 gap-4 space-y-4">
      {sorted.map((item) => (
        <div
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDrop={(e) => handleDrop(e, item.id)}
          onDragEnd={handleDragEnd}
          className={`group relative break-inside-avoid rounded-xl overflow-hidden bg-surface border transition-all duration-200 cursor-grab active:cursor-grabbing ${
            draggedId === item.id
              ? 'opacity-40 scale-95'
              : dragOverId === item.id
              ? 'border-amber-400 shadow-lg ring-2 ring-amber-200'
              : 'border-border hover:border-border hover:shadow-md'
          }`}
        >
          {/* Delete button */}
          <button
            onClick={() => onDelete(item.id)}
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/60"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Image */}
          <img
            src={item.url}
            alt={item.caption || 'Moodboard image'}
            className="w-full object-cover"
            loading="lazy"
          />

          {/* Caption */}
          <div className="p-2.5">
            {editingId === item.id ? (
              <input
                ref={captionInputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => saveEdit(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit(item.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="w-full text-xs text-foreground/70 bg-surface-hover/50 border border-border rounded-lg px-2 py-1 outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200"
                placeholder="Add a caption..."
              />
            ) : (
              <p
                onClick={() => startEdit(item)}
                className="text-xs text-muted cursor-text hover:text-foreground/80 transition-colors min-h-[20px]"
              >
                {item.caption || (
                  <span className="text-muted/60 italic">
                    Click to add caption...
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
