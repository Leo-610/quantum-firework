-- Quantum Fireworks · Auth + personal data
-- Applied remotely via Supabase MCP (project bicwyluctcwebhfdldgd)
-- Keep this file as source of truth for local review / re-apply.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  campus_id text not null default 'bjtu' check (campus_id in ('bjtu', 'pku')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emotion_plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  campus_id text not null default 'bjtu' check (campus_id in ('bjtu', 'pku')),
  lat double precision not null,
  lng double precision not null,
  plant_type text,
  color text,
  glow text,
  echo_text text,
  location_name text,
  local_id text,
  planted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  campus_id text not null default 'bjtu' check (campus_id in ('bjtu', 'pku')),
  dish_name text,
  review_text text,
  style_id text,
  rewritten_text text,
  radar_data jsonb,
  canteen_id text,
  created_at timestamptz not null default now()
);

create index if not exists emotion_plants_user_id_idx on public.emotion_plants (user_id);
create index if not exists food_logs_user_id_idx on public.food_logs (user_id);

alter table public.profiles enable row level security;
alter table public.emotion_plants enable row level security;
alter table public.food_logs enable row level security;
