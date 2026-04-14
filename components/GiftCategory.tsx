'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface MatchingItem {
  id: string;
  category: string;
  item_name: string;
  image_url?: string | null;
  for_person?: 'joshua' | 'sophie' | 'both' | null;
  status: 'Want' | 'Ordered' | 'Have';
  notes: string;
  link: string;
  found_by: 'joshua' | 'sophie';
  created_at: string;
}

interface GiftCategoryProps {
  category: string;
  items: MatchingItem[];
  onStatusChange: (id: string, status: 'Want' | 'Ordered' | 'Have') => void;
  onNotesChange: (id: string, notes: string) => void;
  onDelete: (id: string) => void;
  onAdd: (item: Omit<MatchingItem, 'id' | 'created_at'>) => void;
  currentUser: 'joshua' | 'sophie';
}

const statusColors: Record<string, string> = {
  Want: 'bg-amber-100 text-amber-700 border-amber-200',
  Ordered: 'bg-blue-100 text-blue-700 border-mauve/20',
  Have: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const nextStatus: Record<string, 'Want' | 'Ordered' | 'Have'> = {
  Want: 'Ordered', Ordered: 'Have', Have: 'Want',
};

function ItemRow({ item, onStatusChange, onNotesChange, onDelete }: {
  item: MatchingItem;
  onStatusChange: (id: string, status: 'Want' | 'Ordered' | 'Have') => void;
  onNotesChange: (id: string, notes: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState(item.notes);

  return (
    <div className={`group flex items-start gap-3 p-3 rounded-xl transition-all ${
      item.status === 'Have' ? 'bg-sage/5' : 'bg-glass hover:bg-surface-hover'
    }`}>
      {item.image_url && (
        <img src={item.image_url} alt={item.item_name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => onStatusChange(item.id, nextStatus[item.status])}
            className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${statusColors[item.status]}`}>
            {item.status === 'Have' && '✓ '}{item.status}
          </button>
          <span className={`text-sm font-medium ${item.status === 'Have' ? 'text-emerald-700' : 'text-foreground'}`}>
            {item.item_name}
          </span>
          <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ backgroundColor: item.found_by === 'joshua' ? '#7BA5D4' : '#F4A5B0' }}>
            {item.found_by === 'joshua' ? 'J' : 'S'}
          </span>
          {item.link && (
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-mauve/80 hover:text-mauve text-xs">🔗</a>
          )}
        </div>
        {editingNotes ? (
          <input type="text" value={notesInput} onChange={(e) => setNotesInput(e.target.value)}
            onBlur={() => { onNotesChange(item.id, notesInput); setEditingNotes(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onNotesChange(item.id, notesInput); setEditingNotes(false); } }}
            className="mt-1 w-full text-xs px-2 py-1 rounded-lg border border-mauve/20 bg-background text-foreground focus:outline-none focus:border-mauve/40"
            autoFocus placeholder="Add a note..." />
        ) : (
          <button onClick={() => { setNotesInput(item.notes); setEditingNotes(true); }}
            className="text-xs text-muted hover:text-foreground mt-0.5 text-left">
            {item.notes || 'Add note...'}
          </button>
        )}
      </div>
      <button onClick={() => onDelete(item.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all text-sm">✕</button>
    </div>
  );
}

export default function GiftCategory({
  category, items, onStatusChange, onNotesChange, onDelete, onAdd, currentUser,
}: GiftCategoryProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newForPerson, setNewForPerson] = useState<'joshua' | 'sophie' | 'both'>('both');
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const joshuaItems = items.filter((i) => i.for_person === 'joshua');
  const sophieItems = items.filter((i) => i.for_person === 'sophie');
  const bothItems = items.filter((i) => !i.for_person || i.for_person === 'both');
  const hasPersonSplit = joshuaItems.length > 0 || sophieItems.length > 0;

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `gifts/${fileName}`;
    const { error } = await supabase.storage.from('media').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('media').getPublicUrl(path);
      setNewImageUrl(data.publicUrl);
    }
    setUploading(false);
  };

  const handleAddItem = () => {
    if (!newName.trim()) return;
    onAdd({
      category, item_name: newName.trim(), image_url: newImageUrl, for_person: newForPerson,
      status: 'Want', notes: '', link: newLink.trim(), found_by: currentUser,
    });
    setNewName(''); setNewLink(''); setNewImageUrl(null); setNewForPerson('both'); setAdding(false);
  };

  const renderItems = (list: MatchingItem[], label?: string) => {
    if (list.length === 0) return null;
    return (
      <div>
        {label && <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5 px-1">{label}</p>}
        <div className="space-y-1.5">
          {list.map((item) => (
            <ItemRow key={item.id} item={item} onStatusChange={onStatusChange} onNotesChange={onNotesChange} onDelete={onDelete} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden transition-all">
      <button onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-hover/50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-foreground">{category}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-mauve/10 text-mauve font-medium">{items.length}</span>
          {items.some((i) => i.status === 'Have') && (
            <span className="text-xs text-emerald-500">✓ {items.filter((i) => i.status === 'Have').length} owned</span>
          )}
        </div>
        <svg className={`w-5 h-5 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {hasPersonSplit ? (
            <>
              {renderItems(joshuaItems, "For Joshua")}
              {renderItems(sophieItems, "For Sophie")}
              {renderItems(bothItems, bothItems.length > 0 ? "For Both" : undefined)}
            </>
          ) : (
            renderItems(items)
          )}

          {adding ? (
            <div className="space-y-2 p-3 rounded-xl border border-dashed border-mauve/20 bg-blue-50/20">
              <div className="flex gap-2">
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="Item name" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-mauve/30" />
                <input type="url" value={newLink} onChange={(e) => setNewLink(e.target.value)}
                  placeholder="Link (optional)" onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-mauve/30" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">For:</span>
                {(['joshua', 'sophie', 'both'] as const).map((p) => (
                  <button key={p} onClick={() => setNewForPerson(p)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors capitalize ${
                      newForPerson === p ? 'bg-mauve/15 text-mauve' : 'bg-surface-hover text-muted'
                    }`}>{p}</button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {newImageUrl ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                    <img src={newImageUrl} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setNewImageUrl(null)} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs opacity-0 hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg border border-dashed border-border text-xs text-muted hover:border-mauve/30 hover:text-mauve transition-colors">
                    {uploading ? '...' : '📷 Photo'}
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddItem}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    newName.trim() ? 'bg-mauve text-white hover:bg-mauve/90' : 'bg-surface-hover text-muted'
                  }`}>Add</button>
                <button onClick={() => { setAdding(false); setNewImageUrl(null); }}
                  className="px-3 py-2 rounded-lg bg-surface-hover text-muted text-sm hover:text-foreground">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)}
              className="w-full py-2 rounded-xl border-2 border-dashed border-mauve/15 text-blue-300 text-sm font-medium hover:border-mauve/20 hover:text-mauve/80 transition-colors">
              + Add item
            </button>
          )}
        </div>
      )}
    </div>
  );
}
