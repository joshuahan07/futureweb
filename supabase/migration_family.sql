-- Family / Future planning tab tables

create table if not exists baby_names (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  name text not null,
  meaning text,
  origin text,
  vibe_tags text[] default '{}',
  gender text check (gender in ('girl', 'boy', 'neutral')) not null,
  notes text,
  joshua_loves boolean default false,
  sophie_loves boolean default false
);

create table if not exists parenting_tips (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  tip text not null,
  subcategory text,
  source text,
  bookmarked boolean default false,
  joshua_agrees boolean default false,
  sophie_agrees boolean default false
);

create table if not exists parenting_todo (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  item text not null,
  type text check (type in ('buy', 'do', 'research', 'ask_doctor')) default 'buy',
  priority int default 2,
  price_estimate numeric,
  link text,
  status text check (status in ('todo', 'in_progress', 'done')) default 'todo',
  notes text
);

create table if not exists home_rooms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  vibe text,
  color_palette text[] default '{}',
  notes_joshua text,
  notes_sophie text,
  order_index int default 0
);

create table if not exists home_room_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text check (created_by in ('joshua', 'sophie')),
  room_id uuid references home_rooms(id) on delete cascade,
  name text not null,
  image_url text,
  price_estimate numeric,
  link text,
  status text check (status in ('dream', 'saving', 'ordered', 'have_it')) default 'dream',
  priority int default 2,
  notes text
);

create table if not exists home_room_media (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  room_id uuid references home_rooms(id) on delete cascade,
  url text not null,
  caption text default '',
  order_index int default 0
);

-- Realtime (idempotent: skip if table is already in the publication)
do $$
declare t text;
begin
  foreach t in array array['baby_names', 'parenting_tips', 'parenting_todo', 'home_rooms', 'home_room_items', 'home_room_media']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end$$;

-- Row-level security: wide-open (matches other tables in this project)
alter table baby_names enable row level security;
alter table parenting_tips enable row level security;
alter table parenting_todo enable row level security;
alter table home_rooms enable row level security;
alter table home_room_items enable row level security;
alter table home_room_media enable row level security;

drop policy if exists "allow all" on baby_names;
drop policy if exists "allow all" on parenting_tips;
drop policy if exists "allow all" on parenting_todo;
drop policy if exists "allow all" on home_rooms;
drop policy if exists "allow all" on home_room_items;
drop policy if exists "allow all" on home_room_media;

create policy "allow all" on baby_names for all using (true) with check (true);
create policy "allow all" on parenting_tips for all using (true) with check (true);
create policy "allow all" on parenting_todo for all using (true) with check (true);
create policy "allow all" on home_rooms for all using (true) with check (true);
create policy "allow all" on home_room_items for all using (true) with check (true);
create policy "allow all" on home_room_media for all using (true) with check (true);

-- Category cover image (replaces color palette in UI)
alter table home_rooms add column if not exists image_url text;

-- Per-category subtabs (e.g. Items, Vision) on items
alter table home_room_items add column if not exists subcategory text;
