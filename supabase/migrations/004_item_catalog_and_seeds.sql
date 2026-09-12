-- ASCENT — Backend Migration 004
-- Item catalog, seed quest examples, race-condition hardening

-- ============================================================
-- ITEM CATALOG (store inventory with Essence costs)
-- ============================================================
create table if not exists item_catalog (
  key text primary key,
  name text not null,
  item_type text not null check (item_type in ('aura','outfit','weapon','title','world')),
  essence_cost integer not null default 0 check (essence_cost >= 0),
  description text,
  unlocks_at_level integer default 1
);

insert into item_catalog (key, name, item_type, essence_cost, description, unlocks_at_level) values
  ('starter_aura', 'Starter Aura', 'aura', 0, 'A dormant violet spark. Your first companion.', 1),
  ('starter_outfit', 'Adventurer Garb', 'outfit', 0, 'Simple dark jacket and trousers.', 1),
  ('aura_i', 'Aura Ignition', 'aura', 100, 'A glowing violet aura ring. Level 2 reward.', 2),
  ('training_blade', 'Training Blade', 'weapon', 150, 'A graphite training blade with violet energy.', 7),
  ('essence_crystal', 'Essence Crystal', 'aura', 80, 'Faceted crystal radiating violet light.', 3),
  ('badge_awakened', 'Awakened Badge', 'title', 50, 'A silver and violet achievement emblem.', 4),
  ('forge_outfit', 'Forge Attire', 'outfit', 200, 'Craft-oriented dark futuristic-fantasy attire.', 20)
on conflict (key) do nothing;

-- ============================================================
-- SEED QUEST EXAMPLES (safe default quests)
-- ============================================================
create table if not exists quest_examples (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text,
  stat task_stat not null,
  difficulty task_difficulty not null default 'easy',
  estimated_minutes integer not null default 15 check (estimated_minutes between 2 and 600),
  created_at timestamptz not null default now()
);

insert into quest_examples (title, description, stat, difficulty, estimated_minutes) values
  ('AWAKENING QUEST', 'Drink a glass of water and take a 5-minute walk.', 'VIT', 'easy', 5),
  ('FRESH AIR', 'Step outside and walk for 10 minutes.', 'STR', 'easy', 10),
  ('STUDY SESSION', 'Review your notes for 20 minutes.', 'INT', 'standard', 20),
  ('CODE FLOW', 'Write code for 30 minutes.', 'CRE', 'standard', 30),
  ('CLEAN SPACE', 'Tidy your workspace for 10 minutes.', 'DISC', 'easy', 10),
  ('STRETCH ROUTINE', 'Do a 15-minute stretching routine.', 'VIT', 'standard', 15)
on conflict do nothing;

-- ============================================================
-- RACE CONDITION HARDENING
-- complete_quest runs as a single SECURITY DEFINER transaction
-- (atomic in PostgreSQL). This function adds a final safety check.
-- ============================================================
create or replace function verify_no_duplicate_completion(p_task_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select not exists(
    select 1 from task_completions tc
    join tasks t on t.id = tc.task_id
    where t.id = p_task_id and tc.user_id = p_user_id
  );
$$;

-- ============================================================
-- ADDITIONAL ACHIEVEMENT DEFINITIONS
-- ============================================================
insert into achievements (key, title, description, essence_reward) values
  ('speed_run', 'Speed Runner', 'Complete a quest in under 5 minutes.', 15),
  ('weekly_master', 'Weekly Master', 'Maintain a 7-day streak.', 50),
  ('level_ten', 'Decade Hero', 'Reach level 10.', 100)
on conflict (key) do nothing;
