'use client';

import { useState } from 'react';

interface AddWantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: {
    item_name: string;
    price: number | null;
    category: string;
    link: string;
    priority: number;
    added_by: 'joshua' | 'sophie';
  }) => void;
  currentUser: 'joshua' | 'sophie';
}

const categories = [
  'Clothing',
  'Tech',
  'Home',
  'Experience',
  'Beauty',
  'Books',
  'Jewelry',
  'Other',
];

export default function AddWantModal({
  isOpen,
  onClose,
  onSave,
  currentUser,
}: AddWantModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Other');
  const [link, setLink] = useState('');
  const [priority, setPriority] = useState(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      item_name: name.trim(),
      price: price ? parseFloat(price) : null,
      category,
      link: link.trim(),
      priority,
      added_by: currentUser,
    });
    setName('');
    setPrice('');
    setCategory('Other');
    setLink('');
    setPriority(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xl"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg bg-surface rounded-t-3xl sm:rounded-3xl p-6"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            Add to Wishlist
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-muted hover:text-foreground/70"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              Item Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What do you want?"
              className="w-full px-4 py-3 rounded-xl border border-border focus:border-rose-400 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Price Estimate
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="$0"
                className="w-full px-4 py-3 rounded-xl border border-border focus:border-rose-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border focus:border-rose-400 focus:outline-none bg-surface"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              Link
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl border border-border focus:border-rose-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              Priority
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPriority(level)}
                  className={`text-2xl transition-all hover:scale-110 ${
                    level <= priority ? 'text-rose-400' : 'text-neutral-200'
                  }`}
                >
                  ♥
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-400 to-pink-400 text-white font-semibold hover:from-rose-500 hover:to-pink-500 transition-all active:scale-[0.98]"
          >
            Add to Wishlist
          </button>
        </form>
      </div>
    </div>
  );
}
