'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function usePresence(currentUser: string | null) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('online-users', {
      config: { presence: { key: currentUser } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.keys(state);
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user: currentUser, online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [currentUser]);

  return onlineUsers;
}
