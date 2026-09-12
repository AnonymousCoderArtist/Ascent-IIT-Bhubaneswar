-- ASCENT — Backend Schema Migration 001
-- Tables, types, RLS, indexes, helper functions, triggers
-- Supabase project: auth via Supabase Auth, all writes server-authoritative

create extension if not exists pgcrypto;

-- ============================================================
-- TYPES
-- ============================================================
create type task_stat as enum ('STR', 'INT', 'DISC', 'VIT', 'CRE');
create type task_difficulty as enum ('easy', 'standard', 'hard');

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Player',
  level integer not null default 1 check (level >= 1),
  total_xp integer not null default 0 check (total_xp >= 0),
  essence integer not null default 0 check (essence >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_activity_date date,
  str integer not null default 0 check (str >= 0),
  int integer not null default 0 check (int >= 0),
  disc integer not null default 0 check (disc >= 0),
  vit integer not null default 0 check (vit >= 0),
  cre integer not null default 0 check (cre >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- TASKS
-- ============================================================
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text,
  stat task_stat not null,
  difficulty task_difficulty not null default 'standard',
  estimated_minutes integer not null default 15 check (estimated_minutes between 1 and 600),
  due_date date,
  recurrence text not null default 'none' check (recurrence in ('none','daily')),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- TASK COMPLETIONS
-- ============================================================
create table if not exists task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  activity_date date not null default current_date,
  xp_awarded integer not null check (xp_awarded >= 0),
  attribute_xp_awarded integer not null check (attribute_xp_awarded >= 0),
  essence_awarded integer not null check (essence_awarded >= 0),
  unique (task_id, activity_date)
);

-- ============================================================
-- XP EVENTS (audit log)
-- ============================================================
create table if not exists xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  task_completion_id uuid references task_completions(id) on delete set null,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INVENTORY
-- ============================================================
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  item_key text not null,
  item_type text not null check (item_type in ('aura','outfit','weapon','title','world')),
  acquired_at timestamptz not null default now(),
  equipped boolean not null default false,
  unique (user_id, item_key)
);

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================
create table if not exists achievements (
  key text primary key,
  title text not null,
  description text not null,
  essence_reward integer not null default 0 check (essence_reward >= 0)
);

create table if not exists profile_achievements (
  user_id uuid not null references profiles(id) on delete cascade,
  achievement_key text not null references achievements(key) on delete cascade,
  achieved_at timestamptz not null default now(),
  primary key (user_id, achievement_key)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_tasks_user on tasks(user_id, created_at desc);
create index if not exists idx_completions_user_date on task_completions(user_id, activity_date desc);
create index if not exists idx_xp_events_user on xp_events(user_id, created_at desc);
create index if not exists idx_inventory_user on inventory(user_id);

-- ============================================================
-- RLS — every user-owned table locked to auth.uid()
-- ============================================================
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table task_completions enable row level security;
alter table xp_events enable row level security;
alter table inventory enable row level security;
alter table profile_achievements enable row level security;
alter table achievements enable row level security;

create policy "profiles_select_own" on profiles for select using (id = auth.uid());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());
create policy "tasks_select_own" on tasks for select using (user_id = auth.uid());
create policy "tasks_insert_own" on tasks for insert with check (user_id = auth.uid());
create policy "tasks_update_own" on tasks for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tasks_delete_own" on tasks for delete using (user_id = auth.uid());
create policy "completions_select_own" on task_completions for select using (user_id = auth.uid());
create policy "xp_events_select_own" on xp_events for select using (user_id = auth.uid());
create policy "inventory_select_own" on inventory for select using (user_id = auth.uid());
create policy "profile_achievements_select_own" on profile_achievements for select using (user_id = auth.uid());
create policy "achievements_public_read" on achievements for select using (true);

-- ============================================================
-- XP / LEVEL / RANK HELPERS
-- ============================================================
create or replace function xp_required_for_level(target_level integer)
returns integer
language sql
immutable
as $$
  select case
    when target_level <= 1 then 0
    else round(80 + 25 * target_level + 15 * power(target_level::numeric, 1.35))::integer
  end;
$$;

create or replace function level_from_xp(total_xp integer)
returns integer
language sql
immutable
strict
as $$
  select max(lvl)
  from generate_series(1, 100) as lvl
  where total_xp >= xp_required_for_level(lvl);
$$;

create or replace function rank_for_level(target_level integer)
returns text
language sql
immutable
as $$
  select case
    when target_level >= 51 then 'S'
    when target_level >= 36 then 'A'
    when target_level >= 21 then 'B'
    when target_level >= 11 then 'C'
    when target_level >= 6 then 'D'
    else 'E'
  end;
$$;

-- ============================================================
-- DEFAULT INVENTORY SEED FOR NEW USER
-- ============================================================
create or replace function seed_default_inventory(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into inventory (user_id, item_key, item_type, equipped)
  values
    (p_user_id, 'starter_aura', 'aura', true),
    (p_user_id, 'starter_outfit', 'outfit', false)
  on conflict (user_id, item_key) do nothing;
end;
$$;

-- ============================================================
-- PROFILE AUTO-CREATION TRIGGER
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'Player'))
  on conflict (id) do nothing;

  perform seed_default_inventory(new.id);

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function handle_new_user();
  end if;
end;
$$;

-- ============================================================
-- WORLD MILESTONE KEYS (for unlock response)
-- ============================================================
-- Milestones referenced by completion engine:
-- 5  -> restored_structure
-- 10 -> training_ground
-- 15 -> library
-- 20 -> forge
-- 30 -> central_tower

-- ============================================================
-- ACHIEVEMENT SEED
-- ============================================================
insert into achievements (key, title, description, essence_reward) values
  ('first_quest', 'Awakened', 'Complete your first quest.', 10),
  ('three_day_streak', 'Momentum', 'Complete quests on three consecutive days.', 25),
  ('level_five', 'First Evolution', 'Reach level 5.', 40)
on conflict (key) do nothing;
