-- ASCENT — Migration 005
-- Adds the missing `rank` column to profiles.
-- complete_quest (migration 002) reads/updates profiles.rank, but the column
-- was never created in migration 001. Every quest completion would fail with
-- 'column "rank" of relation "profiles" does not exist'.
-- Added by frontend agent as a cross-agent interface fix; flagged in docs.

alter table profiles
  add column if not exists rank text not null default 'E'
  check (rank in ('E','D','C','B','A','S'));

-- Backfill existing profiles from their current level.
update profiles set rank = rank_for_level(level) where rank is distinct from rank_for_level(level);
