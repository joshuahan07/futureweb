'use client';

import { useState, useMemo } from 'react';

export interface ChecklistItem {
  id: string;
  category: string;
  subcategory?: string;
  item: string;
  checked: boolean;
}

interface WeddingChecklistProps {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
}

interface CategoryGroup {
  category: string;
  subcategories: Map<string, ChecklistItem[]>;
  uncategorized: ChecklistItem[];
  total: number;
  done: number;
}

export default function WeddingChecklist({ items, onToggle }: WeddingChecklistProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    const map = new Map<string, CategoryGroup>();

    for (const item of items) {
      if (!map.has(item.category)) {
        map.set(item.category, {
          category: item.category,
          subcategories: new Map(),
          uncategorized: [],
          total: 0,
          done: 0,
        });
      }
      const group = map.get(item.category)!;
      group.total++;
      if (item.checked) group.done++;

      if (item.subcategory) {
        if (!group.subcategories.has(item.subcategory)) {
          group.subcategories.set(item.subcategory, []);
        }
        group.subcategories.get(item.subcategory)!.push(item);
      } else {
        group.uncategorized.push(item);
      }
    }

    return Array.from(map.values());
  }, [items]);

  const toggleCategory = (category: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isOpen = expanded.has(group.category);
        const progress = group.total > 0 ? (group.done / group.total) * 100 : 0;

        return (
          <div
            key={group.category}
            className="rounded-2xl border border-[#F5E6D3]/60 bg-surface/80 overflow-hidden shadow-sm"
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(group.category)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#FFF8F0]/60 transition-colors duration-200"
            >
              {/* Expand chevron */}
              <svg
                className={`w-4 h-4 text-[#D4A574] shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-90' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>

              <span className="font-heading text-base text-foreground/80 flex-1">
                {group.category}
              </span>

              {/* Progress indicator */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-xs text-[#D4A574] font-medium whitespace-nowrap">
                  {group.done}/{group.total} done
                </span>
                <div className="w-16 h-1.5 rounded-full bg-[#F5E6D3]/50 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: progress === 100 ? '#A8C5A0' : '#D4A574',
                    }}
                  />
                </div>
              </div>
            </button>

            {/* Collapsible content */}
            <div
              className="transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden"
              style={{
                maxHeight: isOpen ? `${(group.total + group.subcategories.size) * 48 + 40}px` : '0px',
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div className="px-5 pb-4 space-y-1">
                {/* Items without subcategory */}
                {group.uncategorized.map((item) => (
                  <ChecklistRow key={item.id} item={item} onToggle={onToggle} />
                ))}

                {/* Subcategory groups */}
                {Array.from(group.subcategories.entries()).map(([subcat, subItems]) => (
                  <div key={subcat} className="mt-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D4A574]/80 pl-8 mb-1">
                      {subcat}
                    </h4>
                    {subItems.map((item) => (
                      <ChecklistRow key={item.id} item={item} onToggle={onToggle} indent />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChecklistRow({
  item,
  onToggle,
  indent,
}: {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  indent?: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer hover:bg-[#FFF8F0]/80 transition-colors duration-150 ${
        indent ? 'ml-4' : ''
      }`}
    >
      {/* Custom checkbox */}
      <div className="relative shrink-0">
        <input
          type="checkbox"
          checked={item.checked}
          onChange={() => onToggle(item.id)}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
            item.checked
              ? 'bg-[#D4A574] border-[#D4A574]'
              : 'border-[#F5E6D3] bg-surface hover:border-[#D4A574]/50'
          }`}
        >
          {item.checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </div>
      </div>

      <span
        className={`text-sm transition-all duration-200 ${
          item.checked
            ? 'line-through text-muted opacity-60'
            : 'text-foreground/70'
        }`}
      >
        {item.item}
      </span>
    </label>
  );
}
