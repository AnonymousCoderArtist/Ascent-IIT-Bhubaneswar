# FRONTEND AGENT — ASCENT

## Mission

Build the polished, responsive ASCENT client that makes ordinary productivity feel like a game. The frontend must look premium, feel tactile, and make the reward loop unmistakable.

## Time budget

**Target:** 2.5–3.5 hours of autonomous work inside the 5–6 hour parallel build window.

Work in this order; stop gold-plating when the MVP path is complete.

## Primary stack

- React + Vite + TypeScript
- Tailwind CSS + custom CSS variables
- Framer Motion
- Three.js
- Supabase JS client
- Lucide icons

## Visual direction

Think:

**dark futuristic System × premium product UI × cinematic RPG**

Palette:

- background: near-black
- primary text: off-white
- system accent: violet/indigo
- XP accent: electric blue/violet
- positive reward: green
- warning: red

Avoid:

- generic admin dashboard cards
- rainbow gamer UI
- excessive glassmorphism
- huge walls of stats
- copied Solo Leveling screenshots/assets

## Required screens

### 1. Landing

Hero:

```text
ASCENT
Your life. Your quests. Your evolution.
[ENTER THE SYSTEM]
```

Use subtle moving background particles and depth.

### 2. Auth

- signup
- login
- error states
- loading state
- accessible form labels

### 3. Awakening

- name
- growth goals
- character layer selection
- enter System

### 4. System Home

Above the fold:

- rank
- level
- XP bar
- character/world
- today's quests
- complete action
- stats/streak/Essence

Do NOT make this a giant dashboard.

### 5. Quest create/edit

Fast modal/sheet.

Fields:

- title
- description
- category
- difficulty
- minutes
- due date

### 6. Inventory/Character

- owned cosmetics
- equip button
- current loadout
- world/character unlocks

### 7. Progress

Minimal stats and recent completion history.

## Core interactions

### Quest completion

When complete button is pressed:

1. disable repeated click
2. show immediate micro-feedback
3. call completion endpoint
4. animate returned reward numbers
5. update cache from authoritative response
6. launch level-up sequence if `leveledUp === true`

### Level-up sequence

Implement the sequence from the PRD exactly.

Suggested motion primitives:

- scale 0.98 → 1
- opacity fade
- blur-to-sharp reveal
- ring expansion
- XP particles travelling toward XP bar
- full-screen typography for `LEVEL UP`

Do not create a 10-second cinematic; keep it 4–6 seconds.

## WebGL scope

Build a small `WorldCanvas` using Three.js.

### It should do only:

- subtle star/dust particles
- background depth
- mouse/touch parallax
- landmark glow

### It must:

- lazy-load if practical
- reduce effects on mobile
- stop animation on hidden tab
- respect `prefers-reduced-motion`
- not block the main UI from loading

### Fallback

When WebGL is unavailable, use CSS parallax or a static image.

## Character rendering — important MVP rule

Do **not** build a runtime layered-avatar compositor.

Render exactly one complete character image at a time:

```text
character-l1.png
character-l7.png
character-l10.png
character-l15.png
character-l30.png
```

Each is a transparent full-character artwork with the same canvas, proportions and anchor. On milestone unlock, crossfade/scale the whole image. This is deliberate: it is cleaner on responsive layouts, lighter on mobile GPUs, and much faster to implement reliably.

VFX such as aura rings, particles and level-up halos may still be separate transparent assets.

## Gamification details

The first few actions must feel easy and rewarding.

Examples:

- first quest creation → tiny `QUEST REGISTERED` pulse
- first completion → larger reward animation
- level 2 → first tiny cosmetic/title reward
- level 5 → first world restoration
- level 7 → character evolution artwork
- level 10 → major character + world evolution

Always communicate:

`what happened → what was earned → what changed`.

## Accessibility

Required:

- keyboard-first interaction
- focus-visible outlines
- `aria-live="polite"` System reward log
- text labels for icon-only controls
- `prefers-reduced-motion`
- contrast checks

## Error states

Never leave the user staring at an empty area.

Use System-style messages such as:

`[SYSTEM] Connection unstable. Reward is not yet confirmed.`

## Data integration

Use the exact structures in `agents/SHARED_CONTRACT.md`.

Do not duplicate RPG math in the UI.

## Suggested branch/workstream decomposition

If multi-agent tooling permits sub-agents:

- **UI shell agent:** layout, responsive CSS, design tokens
- **RPG interaction agent:** quest cards, completion flow, level-up animation
- **World/FX agent:** Three.js WorldCanvas + CSS fallback + level-up VFX
- **Accessibility/polish agent:** keyboard, reduced-motion, error states

Sub-agents may work independently but must not alter backend contracts.

## Frontend test checklist

- signup → home
- login → home
- create quest → appears
- edit quest → updated
- delete quest → removed
- complete quest → authoritative reward displayed
- level up → world changes
- inventory → equip item
- refresh → same state
- mobile viewport → no horizontal overflow
- keyboard → all critical actions accessible
- WebGL off/fail → app still works

## Git commits

Prefer small chronological commits:

1. `feat(frontend): build system shell and auth screens`
2. `feat(frontend): add quest CRUD and system home`
3. `feat(frontend): add reward and level-up experience`
4. `feat(frontend): add world evolution and accessibility polish`
