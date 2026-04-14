'use client';

import { useState, useMemo } from 'react';

export interface BudgetItem {
  id: string;
  category: string;
  estimated: number;
  actual: number;
  notes: string;
}

interface BudgetTrackerProps {
  items: BudgetItem[];
  onUpdate: (item: BudgetItem) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export default function BudgetTracker({ items, onUpdate, onAdd, onDelete }: BudgetTrackerProps) {
  const totals = useMemo(() => {
    const estimated = items.reduce((sum, i) => sum + i.estimated, 0);
    const actual = items.reduce((sum, i) => sum + i.actual, 0);
    return { estimated, actual, difference: estimated - actual };
  }, [items]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#F5E6D3]/60 bg-surface/80 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#FFF8F0]/80">
            <th className="text-left px-4 py-3 font-heading text-foreground/70 font-medium">Category</th>
            <th className="text-right px-4 py-3 font-heading text-foreground/70 font-medium">Estimated ($)</th>
            <th className="text-right px-4 py-3 font-heading text-foreground/70 font-medium">Actual ($)</th>
            <th className="text-right px-4 py-3 font-heading text-foreground/70 font-medium">Difference</th>
            <th className="text-left px-4 py-3 font-heading text-foreground/70 font-medium">Notes</th>
            <th className="w-10 px-2 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <BudgetRow key={item.id} item={item} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-[#F5E6D3]/80 bg-[#FFF8F0]/50">
            <td className="px-4 py-3 font-heading font-semibold text-foreground/80">Total</td>
            <td className="text-right px-4 py-3 font-semibold text-foreground/80">
              ${totals.estimated.toLocaleString()}
            </td>
            <td className="text-right px-4 py-3 font-semibold text-foreground/80">
              ${totals.actual.toLocaleString()}
            </td>
            <td
              className={`text-right px-4 py-3 font-semibold ${
                totals.difference >= 0 ? 'text-sage' : 'text-red-500'
              }`}
            >
              {totals.difference >= 0 ? '+' : ''}${totals.difference.toLocaleString()}
            </td>
            <td className="px-4 py-3" />
            <td className="px-2 py-3" />
          </tr>
        </tfoot>
      </table>

      {/* Add row button */}
      <div className="px-4 py-3 border-t border-[#F5E6D3]/40">
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-sm text-[#D4A574] hover:text-[#c4955f] transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add item
        </button>
      </div>
    </div>
  );
}

function BudgetRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: BudgetItem;
  onUpdate: (item: BudgetItem) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const difference = item.estimated - item.actual;

  return (
    <tr
      className="border-t border-[#F5E6D3]/30 hover:bg-[#FFF8F0]/40 transition-colors group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td className="px-4 py-2.5">
        <EditableCell
          value={item.category}
          onChange={(val) => onUpdate({ ...item, category: val })}
        />
      </td>
      <td className="text-right px-4 py-2.5">
        <EditableNumber
          value={item.estimated}
          onChange={(val) => onUpdate({ ...item, estimated: val })}
        />
      </td>
      <td className="text-right px-4 py-2.5">
        <EditableNumber
          value={item.actual}
          onChange={(val) => onUpdate({ ...item, actual: val })}
        />
      </td>
      <td
        className={`text-right px-4 py-2.5 font-medium ${
          difference > 0
            ? 'text-sage'
            : difference < 0
            ? 'text-red-500'
            : 'text-muted'
        }`}
      >
        {difference !== 0 && (difference > 0 ? '+' : '')}
        ${Math.abs(difference).toLocaleString()}
      </td>
      <td className="px-4 py-2.5">
        <EditableCell
          value={item.notes}
          onChange={(val) => onUpdate({ ...item, notes: val })}
          placeholder="Add notes..."
        />
      </td>
      <td className="px-2 py-2.5">
        <button
          onClick={() => onDelete(item.id)}
          className={`w-6 h-6 flex items-center justify-center rounded-full text-muted/60 hover:text-red-400 hover:bg-red-50 transition-all duration-200 ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
          title="Delete row"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

function EditableCell({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onChange(draft);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="w-full bg-transparent border-b border-[#D4A574]/50 outline-none text-sm text-foreground/80 py-0.5 px-0"
      />
    );
  }

  return (
    <span
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={`cursor-pointer text-sm hover:text-[#D4A574] transition-colors ${
        value ? 'text-foreground/70' : 'text-muted/60 italic'
      }`}
    >
      {value || placeholder || '—'}
    </span>
  );
}

function EditableNumber({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    setEditing(false);
    const parsed = parseFloat(draft) || 0;
    if (parsed !== value) onChange(parsed);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(String(value));
            setEditing(false);
          }
        }}
        className="w-20 bg-transparent border-b border-[#D4A574]/50 outline-none text-sm text-foreground/80 py-0.5 px-0 text-right"
      />
    );
  }

  return (
    <span
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      className="cursor-pointer text-sm text-foreground/70 hover:text-[#D4A574] transition-colors"
    >
      ${value.toLocaleString()}
    </span>
  );
}
