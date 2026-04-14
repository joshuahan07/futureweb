'use client';

export interface HomeItemType {
  id: string;
  name: string;
  category: string;
  status: 'want' | 'ordered' | 'have';
  price?: number | null;
  link?: string | null;
  notes?: string | null;
  created_at?: string;
}

interface HomeItemProps {
  item: HomeItemType;
  onUpdate: (item: HomeItemType) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  want: { label: 'Want', bg: 'bg-blue-50', text: 'text-mauve', ring: 'ring-blue-200' },
  ordered: { label: 'Ordered', bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-200' },
  have: { label: 'Have', bg: 'bg-green-50', text: 'text-sage', ring: 'ring-green-200' },
};

const categoryColors: Record<string, string> = {
  Furniture: 'bg-amber-100/70 text-amber-700',
  Decor: 'bg-rose-100/70 text-rose-700',
  Kitchen: 'bg-orange-100/70 text-orange-700',
  Bedroom: 'bg-indigo-100/70 text-indigo-700',
  Bathroom: 'bg-teal-100/70 text-teal-700',
  Other: 'bg-surface-hover text-foreground/70',
};

const statusOrder: Array<'want' | 'ordered' | 'have'> = ['want', 'ordered', 'have'];

export default function HomeItem({ item, onUpdate, onDelete }: HomeItemProps) {
  const status = statusConfig[item.status];
  const categoryClass = categoryColors[item.category] || categoryColors.Other;

  const cycleStatus = () => {
    const currentIdx = statusOrder.indexOf(item.status);
    const nextStatus = statusOrder[(currentIdx + 1) % statusOrder.length];
    onUpdate({ ...item, status: nextStatus });
  };

  return (
    <div className="group flex items-center gap-3 px-4 py-3 rounded-xl glass-card hover:border-border hover:shadow-sm transition-all duration-200">
      {/* Name and details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground truncate">
            {item.name}
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryClass}`}
          >
            {item.category}
          </span>
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted/60 hover:text-amber-500 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
            </a>
          )}
        </div>
        {item.notes && (
          <p className="text-xs text-muted mt-0.5 truncate">
            {item.notes}
          </p>
        )}
      </div>

      {/* Price */}
      {item.price != null && item.price > 0 && (
        <span className="text-xs text-muted font-medium shrink-0">
          ${item.price}
        </span>
      )}

      {/* Status pill */}
      <button
        onClick={cycleStatus}
        className={`shrink-0 text-[11px] px-3 py-1 rounded-full font-medium ring-1 transition-all duration-200 hover:scale-105 active:scale-95 ${status.bg} ${status.text} ${status.ring}`}
      >
        {status.label}
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-muted/60 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-50 transition-all duration-200"
      >
        <svg
          className="w-3.5 h-3.5"
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
    </div>
  );
}
