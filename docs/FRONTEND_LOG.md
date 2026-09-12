# ASCENT — Frontend Build Log

Live log of frontend work. Newest entries at the bottom.

## 2026-09-12 — Basic structure (main branch)

### What was set up

- Vite + React 18 + TypeScript + Tailwind CSS v4 scaffold.
- Framer Motion, Lucide (icons), Supabase JS client, React Router.
- Fonts: `Valorant` (bundled at `public/fonts/Valorant.ttf`) for display type, `Anton` (Google Fonts) as secondary display. Both wired via `--font-display` in `src/styles/global.css`.
- Design tokens as Tailwind theme vars: `void`, `ink`, `ivory`, `mist`, `violet`, `arc`, `essence`, `danger`.
- Shared contract types in `src/types/contract.ts` — mirrors `ASCENT_MVP/agents/SHARED_CONTRACT.md` exactly (Profile, Task, CompleteQuestResponse, InventoryItem, error codes).
- Service layer `src/services/api.ts` — all Supabase calls in one place with snake_case → camelCase mapping, so backend endpoint changes only touch this file.
- Routes: `/` landing, `/auth`, `/awakening`, `/home`, `/inventory`, `/progress` with auth guard.
- `useAuth` hook (session, signOut), `SystemMessageProvider` (aria-live [SYSTEM] toasts).
- Basic components: `Button`, `XpBar`, stub `WorldCanvas` (CSS starfield until Three.js lands).
- Landing page fully styled (hero: ASCENT / tagline / ENTER THE SYSTEM). Auth page functional (signup/login, error + loading states, labeled fields). Home/Awakening/Inventory/Progress are placeholder shells for the frontend branch.
- Assets in place: `public/character/character-l1.png`, `public/world/world-l1.webp`, Valorant font. Remaining art drops into `public/character/`, `public/world/`, `public/effects/`, `public/items/` per `ASCENT_MVP/assets/IMAGE_PROMPTS.md`.

### Notes for the frontend branch

The full UI build (gamified System Home with center character, left icon rail, right stats + next-level preview, top menu, bottom XP bar, level-based world backgrounds, quest CRUD, reward + level-up sequences, Three.js WorldCanvas) starts from this skeleton on `frontend` branch.

### Asset status

Only `character-l1.png` and `world-l1.webp` are generated so far. `src/lib/milestones.ts` already falls back to the latest available asset, so missing higher-tier art won't break anything — it just reuses the previous tier until the new files are dropped in.
