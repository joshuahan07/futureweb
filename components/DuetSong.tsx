'use client';

interface Duet {
  id: string;
  title: string;
  artist?: string | null;
  category: 'song' | 'music_piece';
  status: 'done' | 'in_progress' | 'want_to_learn';
}

interface DuetSongProps {
  song: Duet;
  onStatusChange: (id: string, newStatus: Duet['status']) => void;
}

const statusConfig: Record<
  Duet['status'],
  { label: string; bg: string; text: string; next: Duet['status'] }
> = {
  done: {
    label: 'Done',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-600',
    next: 'in_progress',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-600',
    next: 'want_to_learn',
  },
  want_to_learn: {
    label: 'Want to Learn',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-600',
    next: 'done',
  },
};

export default function DuetSong({ song, onStatusChange }: DuetSongProps) {
  const config = statusConfig[song.status];

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface border border-border hover:border-border hover:shadow-sm transition-all duration-200 group">
      <div className="flex items-center gap-3 min-w-0">
        {/* Music note icon */}
        <span className="text-rose-300 text-base shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          &#9835;
        </span>

        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground/80 truncate">{song.title}</p>
          {song.artist && (
            <p className="text-[11px] text-muted truncate">{song.artist}</p>
          )}
        </div>
      </div>

      <button
        onClick={() => onStatusChange(song.id, config.next)}
        className={`shrink-0 ml-3 text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${config.bg} ${config.text}`}
        title={`Click to change to "${statusConfig[config.next].label}"`}
      >
        {config.label}
      </button>
    </div>
  );
}
