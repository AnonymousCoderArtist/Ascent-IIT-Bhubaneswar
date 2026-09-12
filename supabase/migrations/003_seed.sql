-- ASCENT — Backend Migration 003
-- Seed data: inventory catalog items, additional achievements
-- No fake user activity is seeded.

-- ============================================================
-- ITEM CATALOG (referenced by inventory system)
-- ============================================================
-- These are catalog entries. User ownership lives in the inventory table.
-- Seed catalog items as achievements/references:

insert into achievements (key, title, description, essence_reward) values
  ('speed_run', 'Speed Runner', 'Complete a quest in under 5 minutes.', 15),
  ('weekly_master', 'Weekly Master', 'Maintain a 7-day streak.', 50),
  ('level_ten', 'Decade Hero', 'Reach level 10.', 100)
on conflict (key) do nothing;

-- ============================================================
-- DEFAULT INVENTORY TEMPLATES (for reference, not auto-seeded)
-- Actual user inventory is seeded per-user via handle_new_user trigger
-- ============================================================
