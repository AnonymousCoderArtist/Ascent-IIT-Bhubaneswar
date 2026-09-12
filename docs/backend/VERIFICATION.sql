-- RLS + Transaction Verification Script
-- Run in Supabase SQL Editor after deploying migrations

-- 1. Verify all tables exist
select table_name from information_schema.tables
where table_schema = 'public' and table_name in (
  'profiles','tasks','task_completions','xp_events',
  'inventory','achievements','profile_achievements'
) order by table_name;

-- 2. Verify RLS enabled on user-owned tables
select relname, rlspolicies from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in (
  'profiles','tasks','task_completions','xp_events','inventory','profile_achievements'
);

-- 3. Test complete_quest without auth (should fail with AUTH_REQUIRED)
select complete_quest(gen_random_uuid());

-- 4. Verify level_from_xp returns correct values
select level_from_xp(0) as lvl0;   -- expect 1
select level_from_xp(50) as lvl50; -- expect 2
select level_from_xp(130) as lvl130; -- expect 3

-- 5. Verify rank_for_level
select rank_for_level(1);  -- E
select rank_for_level(6);  -- D
select rank_for_level(11); -- C
select rank_for_level(21); -- B
select rank_for_level(36); -- A
select rank_for_level(51); -- S

-- 6. Verify xp_required_for_level is strictly increasing
select level, xp_required_for_level(level) as xp
from generate_series(1, 15) as level
order by level;

-- 7. Check tasks RLS policy exists
select conname from pg_constraint where conrelid = 'tasks'::regclass;
