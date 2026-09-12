-- ASCENT — Backend Migration 002
-- Server-authoritative RPC functions
-- All reward calculations happen here. Client cannot set XP/Essence/level/rank.

-- ============================================================
-- COMPLETE QUEST — main transactional endpoint
-- Called via: SELECT *::json complete_quest(task_id uuid);
-- or via Edge Function POST /functions/v1/complete-quest
-- ============================================================
create or replace function complete_quest(p_task_id uuid)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_task_title text;
  v_task_stat task_stat;
  v_task_difficulty task_difficulty;
  v_task_exists boolean;
  v_already_completed boolean;
  v_base_xp integer;
  v_base_essence integer;
  v_streak_multiplier numeric;
  v_attribute_xp integer;
  v_total_xp_before integer;
  v_total_xp_after integer;
  v_level_before integer;
  v_level_after integer;
  v_rank_before text;
  v_rank_after text;
  v_essence_before integer;
  v_essence_after integer;
  v_current_streak integer;
  v_last_activity date;
  v_today date;
  v_streak_extended boolean;
  v_new_unlocks json;
  v_xp_event_id uuid;
  v_completion_id uuid;
  v_essence_awarded integer;
  v_attr_xp_awarded integer;
  v_ach_key text;
  v_ach_reward integer;
  v_ach_awarded boolean;
begin
  -- 1. Authenticate user
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception '{"code":"AUTH_REQUIRED","message":"Authentication required"}' using errcode = 'P0001';
  end if;

  -- 2. Load task with ownership check
  select exists(
    select 1 from tasks where id = p_task_id and user_id = v_user_id
  ) into v_task_exists;

  if not v_task_exists then
    raise exception '{"code":"TASK_NOT_FOUND","message":"Task not found or access denied"}' using errcode = 'P0002';
  end if;

  select title, stat, difficulty, completed
  into v_task_title, v_task_stat, v_task_difficulty, v_already_completed
  from tasks where id = p_task_id;

  -- 3. Reject already completed
  if v_already_completed then
    raise exception '{"code":"TASK_ALREADY_COMPLETED","message":"Quest already cleared"}' using errcode = 'P0003';
  end if;

  -- 4. Calculate base rewards by difficulty (deterministic)
  case v_task_difficulty
    when 'easy' then
      v_base_xp := 25;
      v_base_essence := 6;
    when 'standard' then
      v_base_xp := 50;
      v_base_essence := 12;
    when 'hard' then
      v_base_xp := 90;
      v_base_essence := 20;
    else
      v_base_xp := 50;
      v_base_essence := 12;
  end case;

  -- 5. Streak calculation
  v_today := current_date;
  select current_streak, last_activity_date
  into v_current_streak, v_last_activity
  from profiles where id = v_user_id;

  v_streak_extended := false;
  v_streak_multiplier := 1.0;

  if v_last_activity is null then
    -- First ever activity
    v_current_streak := 1;
    v_streak_extended := true;
  elsif v_last_activity = v_today then
    -- Same day: streak unchanged, no multiplier boost
    v_streak_extended := false;
  elsif v_last_activity = v_today - interval '1 day' then
    -- Yesterday: streak extends
    v_current_streak := v_current_streak + 1;
    v_streak_extended := true;
    if v_current_streak >= 7 then
      v_streak_multiplier := 1.15;
    elsif v_current_streak >= 3 then
      v_streak_multiplier := 1.10;
    elsif v_current_streak >= 2 then
      v_streak_multiplier := 1.05;
    end if;
  else
    -- Gap: reset
    v_current_streak := 1;
    v_streak_extended := true;
  end if;

  -- 6. Attribute XP: primary stat gets +2, secondary gets +1
  -- Primary mapping: task stat gets attribute XP directly
  v_attribute_xp := 2;
  -- Award XP to the specific stat
  case v_task_stat
    when 'STR' then
      update profiles set str = str + v_attribute_xp where id = v_user_id;
    when 'INT' then
      update profiles set "int" = "int" + v_attribute_xp where id = v_user_id;
    when 'DISC' then
      update profiles set disc = disc + v_attribute_xp where id = v_user_id;
    when 'VIT' then
      update profiles set vit = vit + v_attribute_xp where id = v_user_id;
    when 'CRE' then
      update profiles set cre = cre + v_attribute_xp where id = v_user_id;
  end case;

  -- 7. Apply multiplier to base XP
  v_base_xp := round(v_base_xp * v_streak_multiplier);
  v_essence_awarded := round(v_base_essence * v_streak_multiplier);

  -- 8. Snapshot profile state before update
  select total_xp, essence, level, rank
  into v_total_xp_before, v_essence_before, v_level_before, v_rank_before
  from profiles where id = v_user_id;

  -- 9. Update profile: XP, Essence, streak, last activity
  v_total_xp_after := v_total_xp_before + v_base_xp;
  v_essence_after := v_essence_before + v_essence_awarded;

  update profiles set
    total_xp = v_total_xp_after,
    essence = v_essence_after,
    current_streak = v_current_streak,
    longest_streak = greatest(longest_streak, v_current_streak),
    last_activity_date = v_today,
    updated_at = now()
  where id = v_user_id;

  -- 10. Derive new level and rank
  v_level_after := level_from_xp(v_total_xp_after);
  v_rank_after := rank_for_level(v_level_after);

  update profiles set level = v_level_after, rank = v_rank_after where id = v_user_id;

  -- 11. Mark task as completed
  update tasks set completed = true, completed_at = now(), updated_at = now()
  where id = p_task_id;

  -- 12. Insert completion record (audit)
  insert into task_completions (task_id, user_id, xp_awarded, attribute_xp_awarded, essence_awarded)
  values (p_task_id, v_user_id, v_base_xp, v_attribute_xp, v_essence_awarded)
  returning id into v_completion_id;

  -- 13. Insert XP event
  insert into xp_events (user_id, task_completion_id, amount, reason)
  values (v_user_id, v_completion_id, v_base_xp, 'QUEST_CLEAR: ' || v_task_title)
  returning id into v_xp_event_id;

  -- 14. Check achievements
  v_ach_awarded := false;

  -- first_quest: any first completion
  if not exists (select 1 from profile_achievements where user_id = v_user_id and achievement_key = 'first_quest') then
    insert into profile_achievements (user_id, achievement_key) values (v_user_id, 'first_quest');
    select essence_reward into v_ach_reward from achievements where key = 'first_quest';
    if v_ach_reward > 0 then
      update profiles set essence = essence + v_ach_reward where id = v_user_id;
      v_essence_after := v_essence_after + v_ach_reward;
    end if;
    v_ach_awarded := true;
  end if;

  -- three_day_streak
  if v_current_streak >= 3 and not exists (select 1 from profile_achievements where user_id = v_user_id and achievement_key = 'three_day_streak') then
    insert into profile_achievements (user_id, achievement_key) values (v_user_id, 'three_day_streak');
    select essence_reward into v_ach_reward from achievements where key = 'three_day_streak';
    if v_ach_reward > 0 then
      update profiles set essence = essence + v_ach_reward where id = v_user_id;
      v_essence_after := v_essence_after + v_ach_reward;
    end if;
  end if;

  -- level_five
  if v_level_after >= 5 and not exists (select 1 from profile_achievements where user_id = v_user_id and achievement_key = 'level_five') then
    insert into profile_achievements (user_id, achievement_key) values (v_user_id, 'level_five');
    select essence_reward into v_ach_reward from achievements where key = 'level_five';
    if v_ach_reward > 0 then
      update profiles set essence = essence + v_ach_reward where id = v_user_id;
      v_essence_after := v_essence_after + v_ach_reward;
    end if;
  end if;

  -- 15. Check world/character milestone unlocks
  v_new_unlocks := '[]'::json;

  -- World milestones
  if v_level_before < 5 and v_level_after >= 5 then
    v_new_unlocks := v_new_unlocks || json_build_object('type', 'world', 'key', 'restored_structure');
  end if;
  if v_level_before < 10 and v_level_after >= 10 then
    v_new_unlocks := v_new_unlocks || json_build_object('type', 'world', 'key', 'training_ground');
  end if;
  if v_level_before < 15 and v_level_after >= 15 then
    v_new_unlocks := v_new_unlocks || json_build_object('type', 'world', 'key', 'library');
  end if;
  if v_level_before < 20 and v_level_after >= 20 then
    v_new_unlocks := v_new_unlocks || json_build_object('type', 'world', 'key', 'forge');
  end if;
  if v_level_before < 30 and v_level_after >= 30 then
    v_new_unlocks := v_new_unlocks || json_build_object('type', 'world', 'key', 'central_tower');
  end if;

  -- 16. Build and return response
  return json_build_object(
    'success', true,
    'task', json_build_object('id', p_task_id::text, 'completed', true),
    'reward', json_build_object(
      'xp', v_base_xp,
      'attribute', v_task_stat,
      'attributeXp', v_attribute_xp,
      'essence', v_essence_awarded
    ),
    'progression', json_build_object(
      'levelBefore', v_level_before,
      'levelAfter', v_level_after,
      'rankBefore', v_rank_before,
      'rankAfter', v_rank_after,
      'totalXp', v_total_xp_after,
      'xpToNextLevel', xp_required_for_level(v_level_after + 1) - xp_required_for_level(v_level_after),
      'leveledUp', v_level_after > v_level_before
    ),
    'streak', json_build_object(
      'current', v_current_streak,
      'extended', v_streak_extended
    ),
    'unlocks', v_new_unlocks,
    'essenceTotal', v_essence_after,
    'systemMessage', case
      when v_level_after > v_level_before and v_level_after >= 5 then 'EVOLUTION COMPLETE.'
      when v_level_after > v_level_before then 'LEVEL UP.'
      else 'QUEST CLEARED.'
    end
  );

exception
  when raise_exception then
    raise;
  when others then
    raise exception '{"code":"REWARD_TRANSACTION_FAILED","message":"Reward transaction failed, please retry"}' using errcode = 'P0004';
end;
$$;

-- ============================================================
-- RECOMMEND QUEST — AI suggestion endpoint (fallback included)
-- Called via: SELECT *::json recommend_quest(prefs json, level int, stats json);
-- ============================================================
create or replace function recommend_quest(
  p_goal_preferences json,
  p_level integer,
  p_stats json
)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_rec json;
begin
  -- Deterministic fallback: pick based on weakest stat
  -- This is always available; Gemini integration would replace this in Edge Function
  with stat_vals as (
    select 'STR' as stat, (p_stats->>'str')::int as val union all
    select 'INT', (p_stats->>'int')::int union all
    select 'DISC', (p_stats->>'disc')::int union all
    select 'VIT', (p_stats->>'vit')::int union all
    select 'CRE', (p_stats->>'cre')::int
  ),
  weakest as (
    select stat from stat_vals order by val asc limit 1
  )
  select json_build_object(
    'title', case (select stat from weakest)
      when 'STR' then '20 minute walk'
      when 'INT' then 'Read 10 pages'
      when 'DISC' then 'Clean your workspace for 10 minutes'
      when 'VIT' then 'Drink water and stretch for 10 minutes'
      when 'CRE' then 'Sketch for 15 minutes'
      else 'Take a 15 minute walk'
    end,
    'category', (select stat from weakest),
    'difficulty', 'easy',
    'estimatedMinutes', 15,
    'reason', 'Your ' || lower((select stat from weakest)) || ' progression is trailing your other attributes.'
  ) into v_rec;

  return v_rec;
end;
$$;

-- ============================================================
-- GET PROGRESSION — helper for frontend to fetch current state
-- ============================================================
create or replace function get_progression(p_user_id uuid)
returns json
language sql
stable
security definer set search_path = public
as $$
  select json_build_object(
    'level', p.level,
    'rank', rank_for_level(p.level),
    'totalXp', p.total_xp,
    'xpToNextLevel', xp_required_for_level(p.level + 1) - xp_required_for_level(p.level),
    'essence', p.essence,
    'currentStreak', p.current_streak,
    'longestStreak', p.longest_streak,
    'stats', json_build_object('str', p.str, 'int', p.int, 'disc', p.disc, 'vit', p.vit, 'cre', p.cre)
  )
  from profiles p
  where p.id = p_user_id;
$$;
