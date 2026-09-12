# ASCENT — 5–6 Hour Agent Build Plan

## Operating model

Run two primary agents in parallel:

- **Frontend Agent** → UI, interactions, WebGL, responsive/accessibility
- **Backend Agent** → Supabase, schema, RLS, RPG engine, API, optional AI

Allow each primary agent to spawn specialist sub-agents for isolated work if the tool supports it.

## Hour 0:00–0:20 — Contract lock

Human + agents:

- create repo
- copy `docs/`, `agents/`, `database/`
- configure Supabase project
- agree environment names
- confirm shared contract

## 0:20–1:50 — Parallel foundation

### Frontend

- Vite/React/TS shell
- theme tokens
- landing
- auth screens
- authenticated route shell
- responsive layout

### Backend

- schema migration
- auth integration
- profiles
- tasks
- RLS
- seeds

## 1:50–3:15 — Core loop

### Frontend

- System home
- quest card
- create/edit task flow
- stats/XP bar
- API hooks

### Backend

- task CRUD endpoints
- completion transaction
- XP/level/rank
- streaks
- Essence
- completion response

## 3:15–4:15 — Hero experience

### Frontend

- reward animation
- level-up sequence
- world evolution
- character layers
- lightweight WebGL background

### Backend

- unlock records
- inventory seed/catalog
- progression response
- optional AI function only if core is stable

## 4:15–5:00 — Integration + hardening

Both:

- signup → task → completion → refresh
- RLS audit
- mobile audit
- keyboard audit
- error states
- build check
- remove console errors

## 5:00–6:00 — Release candidate

- deploy
- run exact demo script
- fix only blocker bugs
- add screenshots/GIF if useful
- commit history cleanup
- final README
- record/prepare video

## Cut order if behind schedule

Cut in this order:

1. advanced inventory/store UI
2. multiple AI modes
3. complex character customization
4. advanced WebGL post-processing
5. achievements beyond a few milestone unlocks

Never cut:

- auth
- DB persistence
- task CRUD
- server reward engine
- non-linear XP
- streaks
- attributes
- Essence
- responsive/accessibility baseline
- level-up reward moment
- refresh persistence

## Progression-specific QA

Before deployment, verify:

- New user can reach Level 2 quickly using an easy quest.
- Level 2 rewards are visibly different from a normal completion.
- Level 5 changes the world background.
- Level 7 changes the complete character artwork.
- Level 10 changes both character and world.
- Refresh after every milestone preserves the correct state.
- XP requirements after Level 2 are strictly increasing.
- A user cannot submit the same quest twice and receive duplicate rewards.
