# ASCENT — Frontend Build Log

Live log of frontend work. Newest entries at the bottom.

## 2026-09-12 — Basic structure (main branch)

- Vite + React 18 + TS + Tailwind v4 scaffold, Framer Motion, Lucide, Supabase JS, React Router.
- Fonts: `Valorant` (public/fonts/Valorant.ttf) + `Anton` (Google Fonts) via `--font-display`.
- Design tokens: void/ink/ivory/mist/violet/arc/essence/danger.
- Contract types in `src/types/contract.ts` mirroring `ASCENT_MVP/agents/SHARED_CONTRACT.md`.
- Service layer `src/services/api.ts` (snake_case -> camelCase mapping).
- Routes: `/` landing, `/auth`, `/awakening`, `/home`, `/inventory`, `/progress` with auth guard.
- `useAuth`, `SystemMessageProvider` (aria-live toasts), `Button`, `XpBar`, stub `WorldCanvas`.

## 2026-09-12 — Frontend branch build

### Checkpoint 1: state + reward engine

- Merged `backend/initial-schema` into `frontend`.
- `src/lib/progression.ts` — display-only math mirroring backend SQL `xp_required_for_level` (`round(80 + 25*L + 15*L^1.35)`), `levelForXp`, `rankForLevel`, `levelDisplay`, PRD 5.5 level hooks for next-reward preview.
- `src/lib/catalog.ts` — item catalog keyed to backend `item_catalog` rows, stat metadata, difficulty meta (hard unlocks at LV.11), world zones for the rail.
- `src/services/api.ts` — real endpoints: tasks CRUD, profile, `complete-quest` edge function, inventory, item_catalog, quest_examples.
- `src/hooks/useGameStore.tsx` — authoritative profile+tasks cache, optimistic CRUD with rollback, system messages.
- `src/hooks/useReward.tsx` — completion orchestration: burst (1.6s) -> LEVEL UP -> EVOLUTION reveal for milestone unlocks; disables double-click; falls back to `[SYSTEM] Connection unstable` on failure; refreshes from server response.

### Checkpoint 2: System Home HUD

Layout exactly per user spec:
- Top-center: `SystemMenu` pill (System / Inventory / Progress / sign out).
- Left: `ZoneRail` — 6 world-zone icons (settlement -> central tower) with lock states, glow on current, tooltips.
- Center: `CharacterStage` — complete character artwork (single asset per milestone, PRD 6.1) over world background, rotating aura ring, vignettes for panel readability.
- Right: `StatPanel` — 5 animated attribute bars, streak flame, essence crystal, NEXT panel (next level, rank, XP to go, reward hook, world-evolution milestone).
- Bottom: `LevelBar` — rank SVG badge, level, XP bar with spring fill.
- Below fold: today's quests with active/cleared split.
- `QuestCard` — stat icon, difficulty chip colors, edit/delete/CLEAR with busy state.
- `QuestForm` modal — title/desc/attribute/difficulty (hard gated to LV.11)/minutes/due/recurrence with inline validation.

### Checkpoint 3: screens

- `AwakeningPage` — 3-step onboarding (name -> growth goals -> welcome + first-quest card), character preview, writes display_name, enters System.
- `InventoryPage` — character card, owned items (equipped state), recent unlocks, essence store with affordability.
- `ProgressPage` — total XP/streak/quest stat cards, animated attribute bars, completion history from `task_completions` join, next-rank line.

### Checkpoint 4: game art + world canvas

- `src/components/ui/GameArt.tsx` — original inline SVGs: `RankBadge` (hexagonal, rank-colored), `EssenceCrystal`, `StreakFlame`, `SystemSigil`, `XpSpark`, `LevelHalo`. All original geometry, no copyrighted art.
- `WorldCanvas` — real Three.js: lazy-loaded chunk, 350 (mobile) / 800 (desktop) dust particles, additive blending, pointer parallax, landmark glow, DPR cap, `visibilitychange` pause, `prefers-reduced-motion` and WebGL-failure CSS starfield fallback.
- Landing hero rebuilt with sigil, sparks, horizon glow, loop text.

### Checkpoint 5: first-win + responsive

- `src/services/awakeningSeed.ts` — auto-registers the PRD 5.3 AWAKENING QUEST (uses `quest_examples` seed row) when a player has zero tasks, so Level 1 -> 2 is always one CLEAR away.
- Mobile: StatPanel hidden below `md`, compact stats strip (stats + streak + essence) above the XP bar instead.

### Cross-agent fix (migration 005)

`complete_quest` (migration 002) selects/updates `profiles.rank`, but the column was never created in migration 001 — every completion would fail with `column "rank" does not exist`. Added `supabase/migrations/005_profiles_rank_fix.sql` (column + backfill via `rank_for_level`). Backend agent should review and pull.

### Asset status

Only `character-l1.png` + `world-l1.webp` generated so far. `src/lib/milestones.ts` falls back to the latest available tier, so new art is drop-in: `public/character/character-l{2,7,10,15,20,30}.png`, `public/world/world-l{5,10,15,20,30}.webp`.

### Verification

- `npm run build` — TypeScript strict + Vite build, 0 errors.
- Dev-server smoke test — all pages serve, no transform errors.
- XP math cross-checked against backend SQL formula.
- Accessibility: aria-live system log, labeled forms, radiogroups, progressbar roles, focus-visible, reduced-motion paths, sr-only labels on icon buttons.
