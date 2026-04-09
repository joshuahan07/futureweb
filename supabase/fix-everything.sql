-- ═══════════════════════════════════════════════════════════
-- J & S — Complete Database Fix
-- Run this ONCE in Supabase SQL Editor to:
-- 1. Create all missing tables
-- 2. Remove duplicate data
-- 3. Set up RLS policies
-- ═══════════════════════════════════════════════════════════

-- ══ STEP 1: Create missing tables ══

CREATE TABLE IF NOT EXISTS alphabet_dating (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(), updated_at timestamptz default now(),
  created_by text, letter char(1) not null unique, activities text,
  completed boolean default false, date_completed date
);

CREATE TABLE IF NOT EXISTS matching_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(), updated_at timestamptz default now(),
  created_by text, category text, item_name text not null, image_url text,
  for_person text, status text default 'Want', notes text, link text, found_by text
);

CREATE TABLE IF NOT EXISTS duets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(), updated_at timestamptz default now(),
  created_by text, title text not null, artist text,
  category text default 'song', status text default 'want_to_learn', added_by text
);

CREATE TABLE IF NOT EXISTS dishes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(), updated_at timestamptz default now(),
  created_by text, name text not null, image_url text, ingredients text,
  video_url text, difficulty text, servings smallint, cuisine text,
  made_it boolean default false, made_date date
);

CREATE TABLE IF NOT EXISTS wedding_notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(), updated_at timestamptz default now(),
  user_name text not null unique, content text default ''
);

CREATE TABLE IF NOT EXISTS wedding_elements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(), updated_at timestamptz default now(),
  created_by text, title text not null, category text not null,
  description text, status text default 'dream', priority boolean default false,
  order_index integer
);

CREATE TABLE IF NOT EXISTS wedding_element_images (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  element_id uuid references wedding_elements(id) on delete cascade,
  url text not null, caption text
);

CREATE TABLE IF NOT EXISTS wedding_media (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(), updated_at timestamptz default now(),
  created_by text, url text not null, caption text, tag text, order_index integer default 0
);

CREATE TABLE IF NOT EXISTS wedding_budget (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(), updated_at timestamptz default now(),
  created_by text, category text not null, label text not null default '',
  estimated numeric default 0, actual numeric default 0,
  paid boolean default false, notes text
);

CREATE TABLE IF NOT EXISTS wedding_checklist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(), updated_at timestamptz default now(),
  created_by text, category text, subcategory text, item text not null,
  checked boolean default false
);

-- Add missing columns to existing tables
DO $$ BEGIN
  ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS price_low numeric;
  ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS price_high numeric;
  ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS image_url text;
  ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS notes text;
  ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS claimed_by text;
  ALTER TABLE home_media ADD COLUMN IF NOT EXISTS position integer;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ══ STEP 2: Remove ALL duplicate data ══

-- Deduplicate wedding_elements
DELETE FROM wedding_elements a USING wedding_elements b
WHERE a.ctid > b.ctid AND a.title = b.title AND a.category = b.category;

-- Deduplicate qa_questions
DELETE FROM qa_questions a USING qa_questions b
WHERE a.ctid > b.ctid AND a.question = b.question;

-- Deduplicate books
DELETE FROM books a USING books b
WHERE a.ctid > b.ctid AND a.title = b.title;

-- Deduplicate bucket_list
DELETE FROM bucket_list a USING bucket_list b
WHERE a.ctid > b.ctid AND a.text = b.text;

-- Deduplicate watchlist
DELETE FROM watchlist a USING watchlist b
WHERE a.ctid > b.ctid AND a.title = b.title;

-- Deduplicate matching_items
DELETE FROM matching_items a USING matching_items b
WHERE a.ctid > b.ctid AND a.item_name = b.item_name AND a.category = b.category;

-- Deduplicate travel_locations
DELETE FROM travel_locations a USING travel_locations b
WHERE a.ctid > b.ctid AND a.name = b.name AND a.country = b.country;

-- Deduplicate wedding_budget
DELETE FROM wedding_budget a USING wedding_budget b
WHERE a.ctid > b.ctid AND a.category = b.category AND a.label = b.label;

-- Deduplicate dishes
DELETE FROM dishes a USING dishes b
WHERE a.ctid > b.ctid AND a.name = b.name;

-- Deduplicate duets
DELETE FROM duets a USING duets b
WHERE a.ctid > b.ctid AND a.title = b.title;

-- Deduplicate alphabet_dating
DELETE FROM alphabet_dating a USING alphabet_dating b
WHERE a.ctid > b.ctid AND a.letter = b.letter;

-- Deduplicate home_items
DELETE FROM home_items a USING home_items b
WHERE a.ctid > b.ctid AND a.name = b.name;

-- ══ STEP 3: Enable RLS + anon policies on ALL tables ══

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'movies','bucket_list','alphabet_dating','matching_items','wantlist',
    'books','watchlist','duets','home_items','dishes','home_media',
    'wedding_notes','wedding_elements','wedding_element_images',
    'wedding_media','wedding_budget','wedding_checklist',
    'qa_questions','qa_answers','travel_locations','travel_pins'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "anon_select" ON %I', t);
      EXECUTE format('DROP POLICY IF EXISTS "anon_insert" ON %I', t);
      EXECUTE format('DROP POLICY IF EXISTS "anon_update" ON %I', t);
      EXECUTE format('DROP POLICY IF EXISTS "anon_delete" ON %I', t);
      EXECUTE format('DROP POLICY IF EXISTS "Allow all select for anon" ON %I', t);
      EXECUTE format('DROP POLICY IF EXISTS "Allow all insert for anon" ON %I', t);
      EXECUTE format('DROP POLICY IF EXISTS "Allow all update for anon" ON %I', t);
      EXECUTE format('DROP POLICY IF EXISTS "Allow all delete for anon" ON %I', t);
    EXCEPTION WHEN others THEN NULL;
    END;
    EXECUTE format('CREATE POLICY "anon_all" ON %I FOR ALL TO anon USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ══ STEP 4: Create storage bucket ══

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to media bucket
CREATE POLICY "Public read media" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'media');
CREATE POLICY "Anon upload media" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'media');
CREATE POLICY "Anon delete media" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'media');

-- ══ DONE! Refresh your app. ══
