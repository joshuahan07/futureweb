-- Migration: Create all missing tables
-- Safe to run multiple times (IF NOT EXISTS)

-- Alphabet Dating
CREATE TABLE IF NOT EXISTS alphabet_dating (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  letter char(1) not null unique,
  activities text,
  completed boolean default false,
  date_completed date
);

-- Matching Items (code uses this instead of gifts_matching)
CREATE TABLE IF NOT EXISTS matching_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  category text,
  item_name text not null,
  image_url text,
  for_person text,
  status text default 'Want',
  notes text,
  link text,
  found_by text
);

-- Duets (code uses this instead of duet_songs)
CREATE TABLE IF NOT EXISTS duets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  title text not null,
  artist text,
  category text default 'song',
  status text default 'want_to_learn',
  added_by text
);

-- Dishes / Recipes
CREATE TABLE IF NOT EXISTS dishes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  name text not null,
  image_url text,
  ingredients text,
  video_url text,
  difficulty text,
  servings smallint,
  cuisine text,
  made_it boolean default false,
  made_date date
);

-- Wedding Notes
CREATE TABLE IF NOT EXISTS wedding_notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_name text not null unique,
  content text default ''
);

-- Wedding Elements
CREATE TABLE IF NOT EXISTS wedding_elements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  title text not null,
  category text not null,
  description text,
  status text default 'dream',
  priority boolean default false,
  order_index integer
);

-- Wedding Element Images
CREATE TABLE IF NOT EXISTS wedding_element_images (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  element_id uuid references wedding_elements(id) on delete cascade,
  url text not null,
  caption text
);

-- Wedding Media (moodboard - keeping for compatibility)
CREATE TABLE IF NOT EXISTS wedding_media (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  url text not null,
  caption text,
  tag text,
  order_index integer default 0
);

-- Wedding Budget (new version with label + paid)
CREATE TABLE IF NOT EXISTS wedding_budget (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  category text not null,
  label text not null default '',
  estimated numeric default 0,
  actual numeric default 0,
  paid boolean default false,
  notes text
);

-- Wedding Checklist (if missing)
CREATE TABLE IF NOT EXISTS wedding_checklist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  category text,
  subcategory text,
  item text not null,
  checked boolean default false
);

-- Add missing columns to existing tables (safe - does nothing if column exists)
DO $$ BEGIN
  ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS price_low numeric;
  ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS price_high numeric;
  ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS image_url text;
  ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS notes text;
  ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS claimed_by text;
  ALTER TABLE home_media ADD COLUMN IF NOT EXISTS position integer;
  ALTER TABLE home_items ADD COLUMN IF NOT EXISTS name text;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Enable RLS and allow anon on all new tables
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'alphabet_dating', 'matching_items', 'duets', 'dishes',
      'wedding_notes', 'wedding_elements', 'wedding_element_images',
      'wedding_media', 'wedding_budget', 'wedding_checklist'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    -- Drop policies if they exist, then recreate
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "anon_select" ON %I', t);
      EXECUTE format('DROP POLICY IF EXISTS "anon_insert" ON %I', t);
      EXECUTE format('DROP POLICY IF EXISTS "anon_update" ON %I', t);
      EXECUTE format('DROP POLICY IF EXISTS "anon_delete" ON %I', t);
    EXCEPTION WHEN others THEN NULL;
    END;

    EXECUTE format('CREATE POLICY "anon_select" ON %I FOR SELECT TO anon USING (true)', t);
    EXECUTE format('CREATE POLICY "anon_insert" ON %I FOR INSERT TO anon WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "anon_update" ON %I FOR UPDATE TO anon USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "anon_delete" ON %I FOR DELETE TO anon USING (true)', t);
  END LOOP;
END $$;

-- Create storage bucket if not exists (run this in Supabase dashboard if it fails)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;
