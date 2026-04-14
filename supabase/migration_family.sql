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

-- Realtime
alter publication supabase_realtime add table baby_names;
alter publication supabase_realtime add table parenting_tips;
alter publication supabase_realtime add table parenting_todo;
alter publication supabase_realtime add table home_rooms;
alter publication supabase_realtime add table home_room_items;
alter publication supabase_realtime add table home_room_media;

-- Row-level security: wide-open (matches other tables in this project)
alter table baby_names enable row level security;
alter table parenting_tips enable row level security;
alter table parenting_todo enable row level security;
alter table home_rooms enable row level security;
alter table home_room_items enable row level security;
alter table home_room_media enable row level security;

create policy "allow all" on baby_names for all using (true) with check (true);
create policy "allow all" on parenting_tips for all using (true) with check (true);
create policy "allow all" on parenting_todo for all using (true) with check (true);
create policy "allow all" on home_rooms for all using (true) with check (true);
create policy "allow all" on home_room_items for all using (true) with check (true);
create policy "allow all" on home_room_media for all using (true) with check (true);
