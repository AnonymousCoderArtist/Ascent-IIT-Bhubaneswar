# ASCENT — Frontend Handoff Status

**Branch**: `frontend` (all work pushed). **Build**: `npm run build` passes, 0 TS errors. All routes smoke-tested 200.

## DONE

- Full HUD home (top menu / left zone rail / center character / right stats / bottom XP bar), quest CRUD (add/edit/delete), reward engine with full-screen LEVEL UP cinematic, awakening onboarding, inventory, progress pages.
- Three.js GLSL world canvas + sparkles + procedural WebAudio SFX + GSAP juice. All documented in `docs/FRONTEND_LOG.md` checkpoints 1-11.
- Backend connection fixes: typed `QuestError` codes, display-name fix, history embed fix, migration 005 (profiles.rank).
- **AI daily quests**: Gemini OR any OpenAI-compatible endpoint. Settings panel in top menu (Sparkles icon) + "+ ADD AI KEY" chip on Home. Provider toggle / base URL / key / model / TEST button. Stored in localStorage. Env default via `.env` `VITE_GEMINI_API_KEY` (owner's key, gitignored). Onboarding goals (step 2) feed the AI prompt. 4 necessary daily quests (water/walk/read/tidy) auto-seed daily + 3 AI quests. `GENERATE NEW QUESTS [AI]` button on Home. Fallback: deterministic weakest-stat quests if no key/failure. Fixed Gemini thinking-token JSON truncation (thinkingBudget 0).
- Store section hidden (no backend purchase endpoint).
- `scripts/process-images.sh`: auto-detects milestone filenames (char/world + l1/l2/l5/l7/l10/l15/l20/l30), trims character art, resizes worlds to 1920 WebP, writes to `public/character/character-lN.png` and `public/world/world-lN.webp`.

## RAW IMAGES AVAILABLE (in `incoming/`, NOT yet processed)

- `character_lv2.png`, `character_lv7.png`, `character_lv30.png` — 842x1264, **white fake-alpha background, needs background removal** (near-white 253-255 corners). Use ImageMagick flood-fill/transparent white + trim.
- `world_l2.webp`, `world_lv30.webp` — 1376x768 scenes.
- `gen-9_20.png`, `gen-9_34.png` — scenic worlds (sky TL, dark BR vignette) — likely world-l5/l10 or l15/l20, NEED visual identification (I could not view them; agent with vision should look and assign).
- `gen-9_24.png`, `gen-9_25.png`, `gen-9_36.png` — dark scenes, need identification (worlds or level-up bg?).
- `gen-9_30.png` — white bg 1408x768, possibly another character or wide asset.
- `Awakening_screen.png`, `LevelUp_bg.png` — 1376x768 decorative screens (unwired, optional).
- `Essence_crystal.png`, `Streak_flame.png`, `Awakened_Badge.png`, `Training_Reward.png` — 1408x768 with alpha (likely reward/UI art; currently the app uses SVG versions in `GameArt.tsx` — optional swap).

## NOT DONE / TODO (priority order)

1. **LOCAL MODE BACKEND (user requested, IN PROGRESS)**: "backend created on users pc / cache". Plan: `src/services/localBackend.ts` — localStorage-backed implementation of the same interface as `services/api.ts` + local auth (email/password stored hashed in localStorage). When `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are absent, app uses local mode instead of showing the yellow warning. Reward math must mirror `supabase/migrations/002_functions.sql` `complete_quest` exactly: easy 25xp/6ess, standard 50/12, hard 90/20; streak >=2:1.05 >=3:1.10 >=7:1.15 (only when extending from yesterday; same-day no boost; gap resets to 1); +2 to task stat; xp_required_for_level = round(80+25L+15*L^1.35); rank E/D/C/B/A/S at 6/11/21/36/51; world unlocks at 5/10/15/20/30; achievements first_quest/three_day_streak/level_five essence bonuses; unlocks array `{type:"world",key}`. Files to touch: `services/api.ts` (branch on env at each call OR swap module), `hooks/useAuth.tsx` (local session), `pages/AuthPage.tsx` (local signup/login), `App.tsx` yellow warning → "LOCAL MODE" green badge or hidden.
2. **Yellow backend warning** is at `src/app/App.tsx` line ~45-49 (`backendReady` from `lib/supabase.ts`): currently bottom-center, user says it hides/is ugly — move to top or make dismissible; better: disappears entirely once local mode lands.
3. **Demo/admin credentials + instant level-up test**: user wants to see LEVEL 2 animation immediately. With local mode: add a "DEMO: +XP to next level" dev button OR seed demo account `demo@ascent.dev` with XP just below level 2 threshold (L2 = 168 XP) so one easy quest (25xp) levels up. Backend dummy account requires Supabase dashboard access (I don't have credentials — check with user for Supabase project URL/keys; none exist in repo/.env; only the Gemini key is in `.env`).
4. **Process images** (see list above): `bash scripts/process-images.sh` after renaming files to `character-lN`/`world-lN` pattern; white-bg removal for characters (flood-fill corners -> transparent -> trim) BEFORE running script, or add white-removal into the script.
5. **Character image bigger + float animation**: `src/components/character/CharacterStage.tsx` — increase `max-h-[62vh]` (e.g. `max-h-[75vh]`), add subtle y bob: framer-motion `animate={{ y: [0, -12, 0] }}` infinite ~6s ease-in-out (respect `reduced`).
6. **World-evolution popout at start**: user wants an intro overlay on first home load: "See the final world you are fighting toward" — show `world-l30.webp` (`worldAssetForLevel(30)`) full-screen with copy like "THE WORLD YOU WILL BUILD — LV.30 CENTRAL TOWER", fade out after ~2.5s or on tap. Persist seen-flag in localStorage (`ascent:intro-seen`). Add in `HomePage.tsx` before/over SystemBoot.
7. **Temp/scratch note**: user mentioned "bring the temp here add it in gitignore" — likely wants a scratch dir: create `.temp/` and add to `.gitignore` (NOT done yet).
8. AI quest generator currently uses stored goals + weakest stats — works; optional: surface `recommend-quest` edge function too (deterministic server fallback) — SKIP, client AI is enough for hackathon.

## KEY FILES

- AI: `src/lib/aiSettings.ts`, `src/lib/aiClient.ts`, `src/lib/questGenerator.ts`, `src/services/dailyQuests.ts`, `src/components/system/AiSettingsPanel.tsx`
- Backend calls: `src/services/api.ts` (all Supabase + QuestError), `src/lib/supabase.ts`, `src/hooks/useGameStore.tsx`, `src/hooks/useReward.tsx` (catch block already handles QuestError codes)
- Auth: `src/hooks/useAuth.tsx`, `src/pages/AuthPage.tsx`, `src/pages/AwakeningPage.tsx` (saves goals via `saveGoals`)
- Pages: `src/pages/HomePage.tsx` (daily seeding + GENERATE button + AI chip), `InventoryPage.tsx`, `ProgressPage.tsx`
- Assets: `src/lib/milestones.ts` (asset map + fallbacks), `public/character/character-l1.png`, `public/world/world-l1.webp` (only wired assets so far)
- SQL truth: `supabase/migrations/001..005` — local mode MUST mirror these
- Log: `docs/FRONTEND_LOG.md` (keep updating)

## GIT

- Everything through commit on `frontend` pushed. `.env` holds ONLY the Gemini key; Supabase env vars are empty — hence local mode is the path for demo credentials.
