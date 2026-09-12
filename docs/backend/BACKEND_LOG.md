# ASCENT Backend Documentation

Live log of backend work. Newest entries at the bottom.

## 2026-09-12 — Backend schema, RPC functions, and seed data

### What was built

- **Supabase schema** (`supabase/migrations/001_schema.sql`):
  - All tables: `profiles`, `tasks`, `task_completions`, `xp_events`, `inventory`, `achievements`, `profile_achievements`
  - Full RLS policies — every user-owned table locked to `auth.uid()`
  - Types: `task_stat` enum, `task_difficulty` enum
  - Indexes on all foreign key + query patterns
  - XP/level/rank helper functions: `xp_required_for_level()`, `level_from_xp()`, `rank_for_level()`
  - Auto-profile creation trigger on `auth.users` insert
  - Default inventory seed function for new users
  - Achievement seeds: `first_quest`, `three_day_streak`, `level_five`

- **Server-authoritative RPC functions** (`supabase/migrations/002_functions.sql`):
  - `complete_quest(task_id)` — atomic transaction handling:
    - Authenticates via `auth.uid()`
    - Ownership check on task
    - Duplicate completion rejection
    - Streak calculation with multipliers (2-day: 1.05x, 3-day: 1.10x, 7-day: 1.15x)
    - Attribute XP award (task category stat +2)
    - Essence calculation by difficulty (easy: 6, standard: 12, hard: 20 base)
    - Level/rank derivation from cumulative XP
    - Achievement checks (first_quest, three_day_streak, level_five)
    - World milestone unlocks (restored_structure, training_ground, library, forge, central_tower)
    - Returns authoritative state: reward, progression, streak, unlocks, systemMessage
  - `recommend_quest(preferences, level, stats)` — deterministic fallback based on weakest stat
  - `get_progression(user_id)` — helper for fetching current profile state as JSON

- **Seed data** (`supabase/migrations/003_seed.sql`):
  - Additional achievements: `speed_run`, `weekly_master`, `level_ten`

- **Item catalog & quest seeds** (`supabase/migrations/004_item_catalog_and_seeds.sql`):
  - `item_catalog` table with Essence costs for store system
  - 7 catalog items: starter_aura, starter_outfit, aura_i, training_blade, essence_crystal, badge_awakened, forge_outfit
  - `quest_examples` table with 6 default quest templates (AWAKENING QUEST, FRESH AIR, STUDY SESSION, etc.)
  - `verify_no_duplicate_completion()` safety check function
  - Achievement seeds: speed_run, weekly_master, level_ten

### Backend error codes

| Code | Meaning |
|---|---|
| AUTH_REQUIRED | No valid auth session |
| TASK_NOT_FOUND | Task doesn't exist or not owned |
| TASK_ALREADY_COMPLETED | Duplicate completion rejected |
| INVALID_TASK | Task data fails validation |
| REWARD_TRANSACTION_FAILED | Transaction error, retry |
| AI_UNAVAILABLE | AI recommendation unavailable |

### Alignment with contracts

- Mirrors `ASCENT_MVP/agents/SHARED_CONTRACT.md` types exactly
- `complete_quest` response matches `docs/TECH_STACK.md` §6 schema
- Milestone keys match `ASCENT_MVP/agents/SHARED_CONTRACT.md` §7 and §8
- Reward values match `ASCENT_MVP/agents/BACKEND_AGENT.md` ranges

### Next steps

- Deploy schema to Supabase project
- Wire `complete_quest` as Edge Function (thin wrapper over SQL RPC)
- Implement AI quest recommendation Edge Function with Gemini fallback
- Write RLS audit tests
