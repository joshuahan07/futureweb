-- J & S — Full Database Schema
-- Aligned with actual page code from parallel prompts

-- Movies (movies page uses: watched boolean, added_by, date_watched)
create table movies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  title text not null,
  type text check (type in ('movie', 'show')) not null,
  watched boolean default false,
  date_watched date,
  poster_url text,
  rating smallint check (rating between 1 and 5) default 0,
  notes text,
  added_by text check (added_by in ('joshua', 'sophie'))
);

-- Bucket List
create table bucket_list (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  text text not null,
  category text,
  completed boolean default false,
  completed_date date,
  completed_by text check (completed_by in ('joshua', 'sophie')),
  emoji text
);

-- Alphabet Dating (bucketlist page)
create table alphabet_dating (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  letter char(1) not null unique,
  activities text,
  completed boolean default false,
  date_completed date
);

-- Matching Items (gifts page uses 'matching_items' table with item_name, found_by)
create table matching_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  category text,
  item_name text not null,
  image_url text,
  for_person text check (for_person in ('joshua', 'sophie', 'both')),
  status text default 'Want',
  notes text,
  link text,
  found_by text check (found_by in ('joshua', 'sophie'))
);

-- Wantlist (gifts page + wantlist page)
create table wantlist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  item text not null,
  added_by text check (added_by in ('joshua', 'sophie')),
  price_estimate numeric,
  price_low numeric,
  price_high numeric,
  link text,
  category text,
  priority smallint,
  image_url text,
  notes text,
  claimed_by text check (claimed_by in ('joshua', 'sophie'))
);

-- Books
create table books (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  title text not null,
  author text,
  status text check (status in ('tbr', 'read')) not null default 'tbr',
  series text,
  read_date date,
  rating smallint check (rating between 1 and 5),
  genre text,
  notes text,
  added_by text check (added_by in ('joshua', 'sophie'))
);

-- Watchlist (books page uses 'watched' boolean instead of status)
create table watchlist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  title text not null,
  type text check (type in ('show', 'movie')) not null,
  watched boolean default false,
  watched_date date,
  notes text,
  added_by text check (added_by in ('joshua', 'sophie'))
);

-- Duets (books page uses 'duets' table with artist, category fields)
create table duets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  title text not null,
  artist text,
  category text check (category in ('song', 'music_piece')) default 'song',
  status text check (status in ('done', 'want_to_learn', 'in_progress')) not null default 'want_to_learn',
  added_by text check (added_by in ('joshua', 'sophie'))
);

-- Home Items (home page uses 'name' instead of 'title')
create table home_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  name text not null,
  category text,
  image_url text,
  notes text,
  link text,
  status text check (status in ('want', 'have')) not null default 'want'
);

-- Dishes / Recipes
create table dishes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  name text not null,
  image_url text,
  ingredients text,
  video_url text,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  servings smallint,
  cuisine text,
  made_it boolean default false,
  made_date date
);

-- Home Media
create table home_media (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  filename text not null,
  url text not null,
  file_type text,
  caption text,
  position integer,
  section text check (section in ('home', 'wedding')) not null default 'home'
);

-- Wedding Notes (jot pad per user)
create table wedding_notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  user_name text check (user_name in ('joshua', 'sophie')) not null unique,
  content text default ''
);

-- Wedding Elements (vision board cards)
create table wedding_elements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  title text not null,
  category text not null,
  description text,
  status text check (status in ('dream', 'in_progress', 'done')) not null default 'dream',
  priority boolean default false,
  order_index integer
);

-- Wedding Element Images
create table wedding_element_images (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  element_id uuid not null references wedding_elements(id) on delete cascade,
  url text not null,
  caption text
);

-- Wedding Media (moodboard — separate from home_media)
create table wedding_media (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  url text not null,
  caption text,
  tag text,
  order_index integer default 0
);

-- Wedding Budget (redesigned)
create table wedding_budget (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  category text not null,
  label text not null,
  estimated numeric default 0,
  actual numeric default 0,
  paid boolean default false,
  notes text
);

-- Keep old wedding_checklist for migration compatibility
create table wedding_checklist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  category text,
  subcategory text,
  item text not null,
  checked boolean default false
);

-- Q&A Questions
create table qa_questions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  question text not null,
  category text,
  order_index integer
);

-- Q&A Answers
create table qa_answers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  question_id uuid not null references qa_questions(id) on delete cascade,
  answered_by text check (answered_by in ('joshua', 'sophie')) not null,
  answer text not null
);

-- Travel Locations
create table travel_locations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  name text not null,
  country text,
  region text check (region in ('North America', 'South America', 'Europe', 'Asia', 'Africa', 'America', 'Other')),
  status text check (status in ('future', 'future_both', 'visited')) not null default 'future'
);

-- Travel Pins
create table travel_pins (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  location_id uuid not null references travel_locations(id) on delete cascade,
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  category text check (category in ('food', 'activity', 'stay', 'other')) not null default 'other',
  notes text,
  link text
);

-- Enable Row Level Security on all tables
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'movies', 'bucket_list', 'alphabet_dating', 'matching_items', 'wantlist',
      'books', 'watchlist', 'duets', 'home_items', 'dishes', 'home_media',
      'wedding_notes', 'wedding_elements', 'wedding_element_images',
      'wedding_media', 'wedding_budget', 'wedding_checklist',
      'qa_questions', 'qa_answers', 'travel_locations', 'travel_pins'
    ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "Allow all select for anon" on %I for select to anon using (true)', t);
    execute format('create policy "Allow all insert for anon" on %I for insert to anon with check (true)', t);
    execute format('create policy "Allow all update for anon" on %I for update to anon using (true) with check (true)', t);
    execute format('create policy "Allow all delete for anon" on %I for delete to anon using (true)', t);
  end loop;
end
$$;

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'movies', 'bucket_list', 'alphabet_dating', 'matching_items', 'wantlist',
      'books', 'watchlist', 'duets', 'home_items', 'dishes', 'home_media',
      'wedding_notes', 'wedding_elements', 'wedding_element_images',
      'wedding_media', 'wedding_budget', 'wedding_checklist',
      'qa_questions', 'qa_answers', 'travel_locations', 'travel_pins'
    ])
  loop
    execute format('create trigger set_updated_at before update on %I for each row execute function update_updated_at()', t);
  end loop;
end
$$;
