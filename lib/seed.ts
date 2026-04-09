import { supabase } from './supabase';

const seededTables = new Set<string>();

/**
 * Seed a table only if it's empty. Uses a module-level Set to prevent
 * double-seeding from React Strict Mode double-mounts.
 */
export async function seedIfEmpty<T extends Record<string, unknown>>(
  table: string,
  rows: T[]
): Promise<void> {
  // Skip if we already seeded this table in this session
  if (seededTables.has(table)) return;
  seededTables.add(table);

  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.warn(`[seed] Table "${table}" may not exist:`, error.message);
    return;
  }

  if (count === 0) {
    const { error: insertError } = await supabase.from(table).insert(rows);
    if (insertError) {
      console.warn(`[seed] Failed to seed "${table}":`, insertError.message);
    }
  }
}
