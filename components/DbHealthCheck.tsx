'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const REQUIRED_TABLES = [
  'movies', 'bucket_list', 'alphabet_dating', 'matching_items', 'wantlist',
  'books', 'watchlist', 'duets', 'home_items', 'dishes', 'home_media',
  'wedding_notes', 'wedding_elements', 'wedding_element_images',
  'wedding_budget', 'qa_questions', 'qa_answers',
  'travel_locations', 'travel_pins',
];

export default function DbHealthCheck() {
  const [missing, setMissing] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('db-check-dismissed')) {
      setDismissed(true);
      setChecked(true);
      return;
    }

    (async () => {
      const missingTables: string[] = [];
      for (const table of REQUIRED_TABLES) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error && error.message.includes('schema cache')) {
          missingTables.push(table);
        }
      }
      setMissing(missingTables);
      setChecked(true);
    })();
  }, []);

  if (!checked || dismissed || missing.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[200] bg-red-50 border border-red-200 rounded-2xl p-4 shadow-xl animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-red-700">Missing Database Tables</h3>
          <p className="text-xs text-red-500 mt-1">
            {missing.length} tables need to be created. Go to your Supabase SQL Editor and run <code className="bg-red-100 px-1 rounded">supabase/migrate.sql</code>
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {missing.slice(0, 6).map((t) => (
              <span key={t} className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">{t}</span>
            ))}
            {missing.length > 6 && <span className="text-[10px] text-red-400">+{missing.length - 6} more</span>}
          </div>
        </div>
        <button onClick={() => { setDismissed(true); sessionStorage.setItem('db-check-dismissed', '1'); }}
          className="text-red-300 hover:text-red-500 shrink-0">✕</button>
      </div>
    </div>
  );
}
