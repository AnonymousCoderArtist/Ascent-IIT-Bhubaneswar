# ASCENT

> Your life. Your quests. Your evolution.

A Life RPG: complete real-life quests, earn XP, grow your attributes, and watch your character and world evolve.

Full spec lives in `ASCENT_MVP/` (PRD, tech stack, build plan, agent contracts, image prompts, DB schema).

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS v4 + custom design tokens
- Framer Motion, Three.js (WorldCanvas), Lucide icons
- Supabase (auth, Postgres, edge functions)

## Run it

```bash
npm install
cp .env.example .env   # fill in Supabase URL + anon key
npm run dev
```

## Structure

```text
src/
  app/        — App shell, routing, auth guard
  components/ — system, quest, character, world, ui
  pages/      — Landing, Auth, Awakening, Home, Inventory, Progress
  hooks/      — useAuth, useSystemMessage
  lib/        — supabase client, milestones, game constants, env
  services/   — api.ts (all backend calls, snake_case mapping)
  styles/     — global.css (fonts, tokens, HUD styles)
  types/      — contract.ts (shared with backend, do not drift)
public/
  character/  — character-l1.png ... character-l30.png
  world/      — world-l1.webp ... world-l30.webp
  fonts/      — Valorant.ttf
docs/         — build logs
```

Agents: frontend branch `frontend`, backend branch `backend`. Shared contract: `ASCENT_MVP/agents/SHARED_CONTRACT.md`.
