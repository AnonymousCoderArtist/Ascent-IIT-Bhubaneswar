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

### Checkpoint 6: GSAP game-feel animation pass

- `src/lib/animations.ts` — GSAP juice layer: `scrambleText` (glyph scramble resolve), `useScrambleIn` hook, `countUp` (number ticker with locale formatting), `shake` (camera-impact timeline), `bootSequence`, `floatLoop`, `radialBurst` (DOM shard burst). All respect `prefers-reduced-motion`.
- `SystemBoot` — console-style boot overlay on entering /home: staggered `>_ AUTH TOKEN VERIFIED...` lines, sigil pulse reveal (`back.out`), click-to-skip.
- Reward overlay — XP number GSAP count-up + impact shake on burst; screen shake + 14-shard radial burst on LEVEL UP; 20-shard burst on EVOLUTION.
- StatPanel — [ATTRIBUTES]/[NEXT] headers scramble-resolve on mount.
- LevelBar — total-XP count-up ticker + continuous shine sweep across the XP bar.

### Checkpoint 7: layout + style audit

- Fixed stats dead zone at 640-768px (StatPanel now shows from `sm` up, mobile strip below `sm` only — no gap where both hidden).
- Fixed mobile overlap: NEW QUEST button moved to top-right under the menu on small screens (bottom-right on desktop); mobile stats strip sits at bottom-24 clear of the XP bar; XP bar given full-width max-w-3xl constraint.
- Fixed invisible borders: ZoneRail locked buttons (border-ink on ink bg) now use white/5; QuestCard difficulty chips re-colored with explicit border widths.
- AuthPage: removed render-time navigate() side effect (React warning) — session redirect moved into useEffect.
- Inter font actually loaded via Google Fonts (was referenced but never requested).
- Landing loop row wraps gracefully on narrow screens; scroll chevron desktop-only.
- StatPanel narrows to w-52 at `sm` so it never crowds the character on small tablets.

### Checkpoint 8: award-pass — WebGL, particles, SFX, habit hooks

- **WorldCanvas rewrite** (`src/components/world/WorldCanvas.tsx`): custom GLSL twinkle shader (per-point scale/speed/offset, additive soft-core), 3 procedural nebula sprites (canvas-generated radial textures, deep parallax), pulsing landmark glow, 3 pooled shooting stars with randomized launches, camera parallax, DPR cap, tab-visibility pause, CSS starfield fallback. Three.js stays a lazy chunk — shell renders first.
- **AmbientLayer** (`src/components/world/AmbientLayer.tsx`): WAAPI drifting sparkles (10 mobile / 18 desktop, staggered rise+fade) + masked perspective grid floor.
- **GameArt SVG upgrades**: RankBadge rotating dashed ring, StreakFlame flicker keyframes, EssenceCrystal shimmer facet, SystemSigil ring rotation, LevelHalo counter-rotating rings.
- **Procedural SFX** (`src/lib/sfx.ts`): pure WebAudio oscillator synthesis — quest clear Cmaj chime, 6-note level-up arpeggio fanfare, evolution swell, register blips, UI ticks, fault buzz. Mute persisted in localStorage, toggle in SystemMenu. Zero audio assets.
- **Habit hooks** (`src/components/system/HabitHooks.tsx`): StreakWeek 7-day dot strip (loss-aversion cue), NextQuestNudge card with gap-framing copy ("Protect the 3-day chain", "The smallest one first. Momentum compounds."). Duolingo research pattern: small daily action, visible progress, framing the gap not the history.
- Progress page gained the StreakWeek strip.

### Research-informed notes for post-hackathon

- Streak freezes / grace periods (repair mechanics) are server-authoritative territory — backend agent should own them. The frontend already displays `lastActivityDate` correctly to support it.
- Variable-reward days (random 2x XP) would need backend RNG; noted as a PRD extension.

### Verification

- `npm run build` — TypeScript strict + Vite build, 0 errors.
- Dev-server smoke test — all pages serve, no transform errors.
- XP math cross-checked against backend SQL formula.
- Accessibility: aria-live system log, labeled forms, radiogroups, progressbar roles, focus-visible, reduced-motion paths, sr-only labels on icon buttons.

### Checkpoint 9: backend connection audit — typed errors + integration fixes

**Integration audit of the full request path** (client -> Edge Function -> RPC `complete_quest` -> response mapping back to camelCase contract):

- **Typed quest errors** (`src/services/api.ts`): new `QuestError extends Error { code }`. `completeQuest` now extracts the structured error payload (`{code, message}`) from `FunctionsError.context.payload` (edge function passes the RPC P0001-P0003 body through) or from a raw RPC error body, instead of throwing a generic Error. Previously every failure surfaced as "Connection unstable" regardless of cause.
- **Code-specific handling** (`src/hooks/useReward.tsx`): catch block now branches on `QuestError.code`:
  - `TASK_ALREADY_COMPLETED` -> "[SYSTEM] Quest already cleared. Status resynced." + store refresh
  - `TASK_NOT_FOUND` -> "[SYSTEM] Quest no longer exists. Status resynced." + store refresh
  - `AUTH_REQUIRED` -> "[SYSTEM] Session expired. Re-authentication required."
  - other codes -> surfaced message; network failures keep the "Connection unstable" path + `sfx.fault()`
- **`updateDisplayName` fixed**: previously chained `await` inside `.eq()` (the id could resolve to empty string and silently update nothing); now fetches the user first, throws "Not authenticated." if absent, then updates.
- **ProgressPage history embed fixed**: PostgREST many-to-one embed `tasks(title)` returns an **object**, not an array — `r.tasks?.[0]?.title` was always null, so every history row showed "Quest". Now `r.tasks?.title`.

**Audit findings flagged for backend agent** (not client-fixable):

- `inventory` table RLS has only a SELECT policy — there is no UPDATE policy, so equip/unequip cannot be written from the client, and no store-purchase endpoint exists in migrations. InventoryPage store tiles are display-only for the MVP.
- `recommend-quest` edge function: frontend has not yet wired the AI recommendation call — deterministic fallback works server-side without a Gemini key; real AI needs `GEMINI_API_KEY` from the user.

### Verification (Checkpoint 9)

- `npm run build` — 0 TS errors (main 675KB / lazy three 747KB chunks).
- Dev-server smoke test — /, /auth, /home, /inventory, /progress, /awakening all 200.

### Checkpoint 10: AI daily quests (Gemini) + necessary dailies

- **AI quest generation** (`src/lib/questGenerator.ts`): real Gemini 2.5 Flash calls with JSON response mode, strict validation (category/difficulty/minutes clamped, titles capped), once-per-day dedup via localStorage. Onboarding goals (saved to localStorage in Awakening) + weakest attributes feed the prompt. Deterministic weakest-stat fallback if no key / network / parse failure — app fully works without AI.
- **Key handling**: `VITE_GEMINI_API_KEY` lives in `.env` (gitignored, never committed). Client-side key is a hackathon tradeoff — for production, move generation to the `recommend-quest` Edge Function (backend agent) and keep the key server-side. Key usage: 3 test calls total during development.
- **Daily seeding** (`src/services/dailyQuests.ts`): first Home load of each day registers 4 necessary baseline quests (water, walk, read, tidy — recurrence: daily) + 3 AI quests. Idempotent by title. Manual "GENERATE NEW QUESTS [AI]" button under Today's Quests triggers a fresh AI call. New players still get the AWAKENING QUEST first (PRD 5.3).
- **Goal persistence**: Awakening step 2 choices saved via `saveGoals()` and sent to the generator.
- **Removed canned nudge copy** (the "AI slop"): NextQuestNudge now shows real data — weakest attribute + whether a matching quest is registered, with a register shortcut when it isn't.
- **Quest editing**: add/edit/delete quests already in place (QuestCard pencil/trash + QuestForm modal + NEW QUEST button) — covers "user can edit or add own quest in settings".
- **Store cut**: InventoryPage no longer shows the essence store (no backend purchase endpoint); shows owned items + level-based unlocks only.

### Verification (Checkpoint 10)

- `npm run build` 0 errors; all routes 200 on dev-server smoke test.
- Gemini integration tested live with the real key (JSON mode, 3 calls total).

### Checkpoint 11: bring-your-own-key AI settings

- **Users supply their own AI key** — no key is bundled in the repo or .env anymore. `VITE_GEMINI_API_KEY` removed from `.env.example`; the `.env` with the dev test key deleted from disk.
- **AI settings panel** (`src/components/system/AiSettingsPanel.tsx`): opened via the Sparkles button in SystemMenu (glowing dot when configured) or the "+ ADD AI KEY" chip on Home. Provider toggle: **Google Gemini** (default, model preset) or **OpenAI-compatible** (custom base URL, e.g. any self-hosted/alternative endpoint, + key + model name). Show/hide key, TEST button (round-trip check), SAVE, clear-settings. Settings persist in localStorage only.
- **AI client** (`src/lib/aiClient.ts`): one call path for both providers. Gemini native API with `thinkingConfig.thinkingBudget: 0` on flash models — thinking tokens were silently truncating the JSON output mid-string at 1024 max tokens (verified live: 503-retry then truncated parse, then clean 3-quest JSON with the fix). OpenAI path posts to `{baseUrl}/chat/completions` with Bearer auth.
- **Robust parsing** (`parseJsonLoose`): handles JSON wrapped in code fences or prose, plus strict validation (category/difficulty/minutes clamped, titles capped) and deterministic fallback on any failure.
- Unconfigured users still get the necessary dailies + deterministic weakest-stat quests; AI is purely additive.

### Verification (Checkpoint 11)

- `npm run build` 0 errors; all routes 200.
- Live end-to-end test of the exact production request (Gemini flash, thinkingBudget 0, 2048 tokens, JSON mode) returned 3 valid quests. Total dev key usage: 6 calls; key removed from the repo.
