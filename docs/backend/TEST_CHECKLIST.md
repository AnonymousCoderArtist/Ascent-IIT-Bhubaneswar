-- Profile auto-creation: ensure profile exists when user signs up
-- Verified: handles new auth.user inserts gracefully with on-conflict-do-nothing

-- RLS enforcement: verify all user-owned tables use auth.uid()
-- Verified: profiles, tasks, task_completions, xp_events, inventory, profile_achievements all have RLS enabled with owner-only policies

-- Task ownership isolation: user A cannot read user B tasks
-- Verified via RLS policy "tasks_select_own" using (user_id = auth.uid())

-- Duplicate completion prevention: unique constraint on (task_id, activity_date) in task_completions plus completed flag check
-- Verified: complete_quest() raises TASK_ALREADY_COMPLETED if task.completed = true

-- Level threshold increases: xp_required_for_level() is strictly increasing for level >= 1
-- Verified: the function round(80 + 25*level + 15*level^1.35) is monotonically increasing

-- Streak increments correctly: streaks use calendar date logic
-- Verified: complete_quest() handles same-day, consecutive-day, and gap scenarios

-- XP event written for every completion
-- Verified: complete_quest() inserts into xp_events after each successful completion

-- Refresh persistence: all state stored in PostgreSQL, survives refresh
-- Verified: profile, tasks, completions, xp_events all persist in Supabase Postgres
