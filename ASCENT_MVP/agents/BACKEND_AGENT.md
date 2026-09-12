# BACKEND AGENT — ASCENT

## Mission

Build the secure, persistent RPG engine behind ASCENT. The browser should request actions; the backend should decide rewards and progression.

## Time budget

**Target:** 2.5–3.5 hours of autonomous work inside the 5–6 hour parallel build window.

Stop at MVP completeness. Optional AI should be last.

## Primary stack

- Supabase Auth
- PostgreSQL
- Row Level Security (RLS)
- Supabase Edge Functions / SQL RPC
- Optional Gemini call inside Edge Function

## Database model

Use `database/schema.sql` as the starting point.

Required tables:

- `profiles`
- `tasks`
- `task_completions`
- `xp_events`
- `inventory`
- `achievements`
- `profile_achievements` if needed

Keep the schema compact. Do not invent 30-table architecture.

## Security rules

### RLS

Every user-owned table must use policies based on `auth.uid()`.

### No client-authoritative rewards

The browser cannot send:

```json
{
  "xp": 500000,
  "essence": 100000,
  "level": 99
}
```

and expect those values to be accepted.

The completion endpoint accepts the task ID and derives everything else server-side.

## Task CRUD

Support:

- create
- list user tasks
- read task
- update task
- delete task

Validation:

- non-empty title
- reasonable max title length
- valid category
- valid difficulty
- positive estimated minutes
- optional due date format validation

## Completion transaction

Implement an atomic server transaction.

Algorithm:

```text
load authenticated user
↓
load task with ownership check
↓
reject already completed task
↓
insert completion record
↓
calculate base XP by difficulty
↓
calculate streak multiplier
↓
calculate attribute XP
↓
calculate Essence
↓
update profile total XP + stat + Essence + streak
↓
derive level + rank
↓
check milestone unlocks
↓
insert XP event / unlock records
↓
commit
↓
return complete authoritative state
```

Avoid race conditions. Use transaction/row locking or an idempotent database function.

## Non-linear progression

Implement a single deterministic function for total XP required.

Example:

```sql
-- Pseudocode; tune in implementation.
xp_required_for_level(level)
  = round(80 + 25*level + 15*power(level, 1.35))
```

You may use a cumulative threshold table/function, but the result must satisfy:

`required(level + 1) > required(level)`.

Level should be derived from cumulative XP and never be directly writable by the client.

## Rank

```text
E 1–5
D 6–10
C 11–20
B 21–35
A 36–50
S 51+
```

## Streaks

Use the user's calendar date.

Suggested algorithm:

```text
if last_activity_date is today:
    streak unchanged
else if last_activity_date is yesterday:
    streak += 1
else:
    streak = 1
last_activity_date = today
longest_streak = max(longest_streak, streak)
```

## Rewards

Suggested base rewards:

```text
EASY     20–30 XP, 5–8 Essence
STANDARD 35–60 XP, 8–15 Essence
HARD     70–110 XP, 15–25 Essence
```

Keep final values deterministic and auditable.

## Inventory/economy

Implement minimal store/inventory support:

- item catalog can be seeded in SQL
- item cost in Essence
- user ownership table
- equip/unequip

The actual store UI can be simple; the data model must be real.

## World unlocks

Use milestone unlock keys:

```text
restored_structure
training_ground
library
forge
central_tower
```

Return newly unlocked keys from completion response.

## AI recommendation endpoint

Only after the deterministic engine works.

Example:

`POST /functions/v1/recommend-quest`

Inputs:

```json
{
  "goalPreferences": ["MIND", "DISCIPLINE"],
  "level": 7,
  "stats": {
    "STR": 12,
    "INT": 34,
    "DISC": 21,
    "VIT": 18,
    "CRE": 27
  }
}
```

Return only one recommendation.

AI output should be validated into:

```json
{
  "title": "20 minute walk",
  "category": "STR",
  "difficulty": "easy",
  "estimatedMinutes": 20,
  "reason": "Your physical progression is trailing your other attributes."
}
```

If AI call fails, return a deterministic fallback.

## Seed data

Create a few safe default quest examples and cosmetic items.

Do not seed fake completed user activity.

## Backend error contract

Use stable error codes:

- `AUTH_REQUIRED`
- `TASK_NOT_FOUND`
- `TASK_ALREADY_COMPLETED`
- `INVALID_TASK`
- `REWARD_TRANSACTION_FAILED`
- `AI_UNAVAILABLE`

Return structured JSON for the frontend.

## Backend test checklist

Must verify:

- user A cannot read user B tasks
- user A cannot update user B tasks
- unauthenticated completion rejected
- empty task rejected
- duplicate completion grants no second reward
- level threshold increases
- rank changes at correct level
- streak increments correctly
- Essence balance updates atomically
- XP event is written for completion
- refresh returns persistent state

## Suggested branch/workstream decomposition

If multi-agent tooling permits sub-agents:

- **Schema/RLS agent:** migrations, policies, indexes
- **RPG engine agent:** XP/level/rank/streak/reward transaction
- **API agent:** task CRUD + completion function
- **AI agent:** Gemini recommendation + fallback
- **Security/test agent:** RLS and edge-case audit

Sub-agents must report schema/API changes before the parent merges them.

## Git commits

Prefer:

1. `feat(backend): add supabase schema and rls`
2. `feat(backend): implement task crud and seed data`
3. `feat(backend): implement transactional quest rewards`
4. `feat(backend): add progression api and optional ai recommendation`
