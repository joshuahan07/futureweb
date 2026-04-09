import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function subscribeToTable(
  table: string,
  callback: () => void
): RealtimeChannel {
  const channel = supabase
    .channel(`realtime-${table}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      () => callback()
    )
    .subscribe();

  return channel;
}
