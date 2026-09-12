# Backend API Reference

## Overview

All backend logic lives in Supabase (Postgres + RLS + SQL RPC functions).
The frontend calls these via the Supabase JS SDK's `.rpc()` method or Edge Functions.

## Database Tables

| Table | Description | RLS |
|---|---|---|
| `profiles` | User profile with stats, level, streak, essence | Selected/updated only by owner |
| `tasks` | User-created quest tasks | Full CRUD by owner |
| `task_completions` | Audit log of completed quests | Read by owner |
| `xp_events` | XP audit trail | Read by owner |
| `inventory` | User inventory items | Read/insert by owner |
| `item_catalog` | Store catalog with Essence costs | Public read |
| `quest_examples` | Default quest templates | Public read |
| `achievements` | Achievement catalog (public read) | Public read |
| `profile_achievements` | User achievement unlocks | Read by owner |

## SQL RPC Functions

### `complete_quest(p_task_id uuid)` → json

Server-authoritative quest completion. Accepts a task ID, returns the full authoritative state.

**Request (via Edge Function or direct RPC):**
```json
{ "taskId": "uuid" }
```

**Response:**
```json
{
  "success": true,
  "task": { "id": "uuid", "completed": true },
  "reward": { "xp": 50, "attribute": "INT", "attributeXp": 2, "essence": 12 },
  "progression": {
    "levelBefore": 1,
    "levelAfter": 2,
    "rankBefore": "E",
    "rankAfter": "E",
    "totalXp": 50,
    "xpToNextLevel": 80,
    "leveledUp": true
  },
  "streak": { "current": 1, "extended": true },
  "unlocks": [],
  "essenceTotal": 18,
  "systemMessage": "LEVEL UP."
}
```

**Error codes:** `AUTH_REQUIRED`, `TASK_NOT_FOUND`, `TASK_ALREADY_COMPLETED`, `REWARD_TRANSACTION_FAILED`

### `recommend_quest(p_goal_preferences json, p_level integer, p_stats json)` → json

Returns a single quest recommendation. Deterministic fallback based on weakest stat. In production, this would call Gemini inside an Edge Function.

### `get_progression(p_user_id uuid)` → json

Returns the player's current progression state as a JSON object.

## RLS Policies Summary

- `profiles`: select/update by owner only
- `tasks`: full CRUD by owner only
- `task_completions`: read by owner only (insert via trigger)
- `xp_events`: read by owner only
- `inventory`: read/insert by owner only
- `profile_achievements`: read by owner only
- `achievements`: public read

Client cannot directly insert/update on reward tables — all writes go through `complete_quest` function.

## Reward Calculation

| Difficulty | Base XP | Base Essence | Multiplier Cap |
|---|---|---|---|
| easy | 25 | 6 | +5% (streak 2) |
| standard | 50 | 12 | +10% (streak 3) |
| hard | 90 | 20 | +15% (streak 7+) |

## Level/Rank Derivation

- Level: derived from cumulative XP via `level_from_xp(total_xp)`
- Rank: derived from level via `rank_for_level(level)`
- XP curve: `xp_required_for_level(n) = round(80 + 25n + 15n^1.35)`

## World Milestones

| Level | Key |
|---|---|
| 5 | restored_structure |
| 10 | training_ground |
| 15 | library |
| 20 | forge |
| 30 | central_tower |
