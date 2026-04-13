-- Fix column mismatches between code and actual DB tables
-- Safe to run multiple times

-- Movies: add missing columns
-- Drop old rating constraint that blocks rating=0
ALTER TABLE movies DROP CONSTRAINT IF EXISTS movies_rating_check;

ALTER TABLE movies ADD COLUMN IF NOT EXISTS watched boolean DEFAULT false;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS date_watched date;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS added_by text;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS rating_joshua smallint;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS rating_sophie smallint;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS date_has_day boolean DEFAULT true;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS poster_position text DEFAULT 'center';

-- Sync existing data: copy status -> watched, watched_date -> date_watched
UPDATE movies SET watched = (status = 'watched') WHERE watched IS NULL OR watched = false;
UPDATE movies SET date_watched = watched_date WHERE date_watched IS NULL AND watched_date IS NOT NULL;
UPDATE movies SET added_by = created_by WHERE added_by IS NULL AND created_by IS NOT NULL;

-- Watchlist: add missing columns
ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS watched boolean DEFAULT false;
ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS watched_date date;
ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS notes text;

-- Sync watchlist: copy status -> watched
UPDATE watchlist SET watched = (status = 'watched') WHERE watched IS NULL OR watched = false;

-- Home items: ensure 'name' column exists (old schema might use 'title')
ALTER TABLE home_items ADD COLUMN IF NOT EXISTS name text;
UPDATE home_items SET name = title WHERE name IS NULL AND title IS NOT NULL;

-- Wantlist: add all missing columns
ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS price_low numeric;
ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS price_high numeric;
ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE wantlist ADD COLUMN IF NOT EXISTS claimed_by text;

-- Books: add notes column if missing
ALTER TABLE books ADD COLUMN IF NOT EXISTS notes text;
