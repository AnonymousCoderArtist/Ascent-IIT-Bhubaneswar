# ASCENT — Life RPG Hackathon MVP

> **Your life. Your quests. Your evolution.**

ASCENT turns real-life goals into a game-like progression loop: **Quest → Complete → XP → Stats → Level → Rank → World Evolution**.

This package is designed specifically for the IIT Bhubaneswar **Life RPG** web-hackathon brief and is deliberately scoped for a **5–6 hour parallel agent build**, leaving the remaining time for manual testing, polish, deployment, and the 90–180 second demo.

## Package

- `docs/PRD.md` — product requirements and judging-aligned scope
- `docs/TECH_STACK.md` — recommended stack, architecture and deployment
- `docs/BUILD_PLAN.md` — 5–6 hour parallel execution plan
- `docs/DEMO_SCRIPT.md` — 90–120 second judge demo
- `agents/FRONTEND_AGENT.md` — autonomous frontend agent contract
- `agents/BACKEND_AGENT.md` — autonomous backend agent contract
- `agents/SHARED_CONTRACT.md` — API/data/UI contract shared by both agents
- `database/schema.sql` — PostgreSQL/Supabase schema + RLS + reward functions/triggers
- `assets/IMAGE_PROMPTS.md` — generated-art prompts + transparent/background guidance
- `.env.example` — environment contract template

## Non-negotiable MVP

1. Real authentication and persistent backend data.
2. User-owned CRUD tasks.
3. Server-authoritative quest completion and reward calculation.
4. Non-linear XP progression.
5. Streaks, five attributes, Essence economy, inventory/equipment.
6. Complete-character progression and visible world evolution (single transparent character asset per milestone; no runtime layer compositor).
7. Responsive + keyboard/screen-reader friendly UI.
8. Public GitHub repo, live deployment, and a 90–180 second walkthrough proving refresh persistence.

## Core loop

```text
SYSTEM CHECK
   ↓
TODAY'S QUESTS
   ↓
COMPLETE QUEST
   ↓
SERVER REWARD ENGINE
   ↓
XP + STAT + ESSENCE + STREAK
   ↓
LEVEL / RANK CHECK
   ↓
CHARACTER + WORLD EVOLUTION
```

## Recommended implementation order

**Backend agent:** Auth → schema/RLS → task CRUD → transactional completion/reward engine → profile/progression API → optional AI quest suggestion edge function.

**Frontend agent:** visual system → auth screens → System home → task CRUD → reward animation → progression/world evolution → responsive/accessibility → deployment polish.

Both agents should work from `docs/SHARED_CONTRACT.md` and avoid inventing conflicting API names or database fields.

## Source alignment

The uploaded hackathon brief requires a full-stack Life RPG rather than a frontend-only mockup, secure authentication, persistent relational/document data, CRUD, non-linear leveling, streaks, attributes, rewards/economy, responsive accessibility, a public repository, a live deployment, and a 90–180 second video proving signup/login, task completion, leveling, and refresh persistence. The judging emphasizes design/UX, performance/SEO, creativity/gamification, robustness, accessibility, and responsiveness.

## Progression focus

Level 1→2 is intentionally a very easy first win (50 XP). Each subsequent level gradually requires more meaningful effort and grants a visible hook; milestone levels visibly evolve the complete character and world. See `docs/PRD.md` and `assets/IMAGE_PROMPTS.md`.
