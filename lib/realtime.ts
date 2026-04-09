'use client';

import { useEffect } from 'react';
import { subscribeToTable } from './supabase';

export function useRealtimeSync(table: string, refetch: () => void) {
  useEffect(() => {
    const channel = subscribeToTable(table, refetch);
    return () => {
      channel.unsubscribe();
    };
  }, [table, refetch]);
}
