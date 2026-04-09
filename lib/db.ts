import { supabase } from './supabase';

/**
 * Wrapper for Supabase operations that logs errors visibly.
 * Use: const { data, error } = await dbInsert('table', row);
 */
export async function dbInsert(table: string, row: Record<string, unknown>) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) {
    console.error(`[DB INSERT ${table}]`, error.message);
    if (error.message.includes('schema cache') || error.message.includes('does not exist')) {
      alert(`Table "${table}" doesn't exist yet. Please run supabase/migrate.sql in your Supabase SQL Editor.`);
    }
  }
  return { data, error };
}

export async function dbUpdate(table: string, updates: Record<string, unknown>, id: string) {
  const { error } = await supabase.from(table).update(updates).eq('id', id);
  if (error) {
    console.error(`[DB UPDATE ${table}]`, error.message);
  }
  return { error };
}

export async function dbDelete(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    console.error(`[DB DELETE ${table}]`, error.message);
  }
  return { error };
}
