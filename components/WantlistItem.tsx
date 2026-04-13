'use client';

export interface WantItem {
  id: string;
  item_name: string;
  price: number | null;
  category: string;
  link: string;
  priority: number;
  added_by: 'joshua' | 'sophie';
  created_at: string;
}

interface WantlistItemProps {
  item: WantItem;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: number) => void;
}

export default function WantlistItem({
  item,
  onDelete,
  onPriorityChange,
}: WantlistItemProps) {
  return (
    <div className="group flex items-center gap-4 p-4 rounded-2xl bg-surface border border-rose-100 hover:shadow-md hover:border-rose-200 transition-all">
      {/* Priority hearts */}
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            onClick={() => onPriorityChange(item.id, level)}
            className={`text-lg transition-all hover:scale-110 ${
              level <= item.priority ? 'text-rose-400' : 'text-neutral-200'
            }`}
          >
            ♥
          </button>
        ))}
      </div>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground/80 truncate">
            {item.item_name}
          </span>
          <span
            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{
              backgroundColor:
                item.added_by === 'joshua' ? '#7BA5D4' : '#F4A5B0',
            }}
          >
            {item.added_by === 'joshua' ? 'J' : 'S'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-400 font-medium">
            {item.category}
          </span>
          {item.price !== null && (
            <span className="text-xs text-muted font-medium">
              ~${item.price.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Link */}
      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-400 text-xs font-medium hover:bg-rose-100 transition-colors"
        >
          View →
        </a>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted/60 hover:text-red-400 transition-all"
      >
        ✕
      </button>
    </div>
  );
}
