# ASCENT — Shared Agent Contract

This document is the source of truth for the frontend and backend agents.

## 1. Mission

Deliver a working hackathon MVP in parallel without breaking each other's interfaces.

## 2. Parallel execution rules

- Frontend and backend may work simultaneously.
- Keep changes isolated by branch when possible.
- Both agents may create sub-agents for independent tasks such as UI polish, schema review, accessibility audit, asset optimization, or test generation.
- Sub-agents MUST report outputs back to the parent agent and must not rewrite shared contracts silently.
- Resolve interface conflicts by changing this document first, then updating both sides.

## 3. Shared domain model

```ts
interface Profile {
  id: string;
  displayName: string;
  level: number;
  totalXp: number;
  essence: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  str: number;
  int: number;
  disc: number;
  vit: number;
  cre: number;
}
```

```ts
interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: 'STR' | 'INT' | 'DISC' | 'VIT' | 'CRE';
  difficulty: 'easy' | 'standard' | 'hard';
  estimatedMinutes: number;
  dueDate?: string | null;
  recurrence: 'none' | 'daily';
  completed: boolean;
  createdAt: string;
}
```

## 4. Source of truth

Backend/database is authoritative.

Frontend cache is temporary presentation state.

Never use localStorage as primary persistence.

## 5. Completion contract

`POST /functions/v1/complete-quest` with `{taskId}`.

Expected response is documented in `docs/TECH_STACK.md`.

The frontend MUST treat `reward`, `progression`, `streak`, and `unlocks` as authoritative.

## 6. Level/rank derivation

- Level is derived from cumulative XP.
- Rank is derived from level.
- Frontend may display derived values but never persist them.

## 7. World milestones

Use deterministic milestones:

```ts
const WORLD_MILESTONES = {
  5: 'restored_structure',
  10: 'training_ground',
  15: 'library',
  20: 'forge',
  30: 'central_tower'
};
```

## 8. Asset contract

The MVP uses complete character artworks, not runtime character layers.

```text
public/
  character/
    character-l1.webp
    character-l7.webp
    character-l10.webp
    character-l15.webp
    character-l30.webp
  world/
    world-l1.webp
    world-l5.webp
    world-l10.webp
    world-l15.webp
    world-l20.webp
    world-l30.webp
    landing-hero.webp
    awakening.webp
    level-up.webp
  effects/
    aura-ring.png
    xp-burst.png
    reward-particles.png
    level-up-halo.png
    world-dust.png
  items/
    item-aura-01.png
    item-blade-01.png
    badge-awakened.png
```

Character files must be transparent and use consistent dimensions/anchors. World files are full 16:9 backgrounds. Effects/items use true alpha transparency.

Milestone mapping:

```ts
const CHARACTER_MILESTONES = {
  1: 'character-l1.webp',
  7: 'character-l7.webp',
  10: 'character-l10.webp',
  15: 'character-l15.webp',
  30: 'character-l30.webp'
};

const WORLD_MILESTONES = {
  1: 'world-l1.webp',
  5: 'world-l5.webp',
  10: 'world-l10.webp',
  15: 'world-l15.webp',
  20: 'world-l20.webp',
  30: 'world-l30.webp'
};
```

Do not introduce a layered-avatar pipeline unless both agents explicitly agree and the MVP is already complete.

## 9. Definition of done for an agent

An agent is done only when:

- feature works in a clean checkout
- types/build pass
- no console-breaking errors
- responsive layout is checked
- changes are committed with a descriptive message
- any assumptions/interface changes are documented

## 10. Forbidden shortcuts

- no localStorage-only gameplay
- no fake reward numbers generated purely in the browser
- no hard-coded single-user account
- no fake refresh persistence
- no placeholder dashboard presented as final UX
- no copied copyrighted anime character art
