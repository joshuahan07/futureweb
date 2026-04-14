'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const pfpCache: Record<string, string | null> = {};
let loaded = false;
const listeners: (() => void)[] = [];

async function loadPfps() {
  if (loaded) return;
  for (const user of ['joshua', 'sophie']) {
    const { data: files } = await supabase.storage.from('media').list('pfp', { search: `${user}.` });
    if (files && files.length > 0) {
      const file = files.find(f => f.name.startsWith(user));
      if (file) {
        const { data } = supabase.storage.from('media').getPublicUrl(`pfp/${file.name}`);
        pfpCache[user] = data.publicUrl + '?t=' + file.updated_at;
      }
    }
  }
  loaded = true;
  listeners.forEach(fn => fn());
}

export function usePfp(user: string): string | null {
  const [url, setUrl] = useState<string | null>(pfpCache[user] || null);

  useEffect(() => {
    if (pfpCache[user]) { setUrl(pfpCache[user]); return; }
    loadPfps().then(() => setUrl(pfpCache[user] || null));
    const fn = () => setUrl(pfpCache[user] || null);
    listeners.push(fn);
    return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
  }, [user]);

  return url;
}

export function usePfps() {
  const joshua = usePfp('joshua');
  const sophie = usePfp('sophie');
  return { joshuaPfp: joshua, sophiePfp: sophie };
}

export function invalidatePfpCache() {
  loaded = false;
  delete pfpCache['joshua'];
  delete pfpCache['sophie'];
}
