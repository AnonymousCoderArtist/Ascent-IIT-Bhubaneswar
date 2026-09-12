# ASCENT — Product Requirements Document (MVP v2)

## 1. Product identity

**Name:** ASCENT  
**Tagline:** *Your life. Your quests. Your evolution.*  
**Genre:** Life RPG / productivity game  
**Theme:** Original dark-fantasy / futuristic System aesthetic inspired by RPG progression, without copying copyrighted characters, screenshots, logos, or exact UI assets.

### One-line judge pitch

> ASCENT turns real-life goals into a persistent RPG: every completed quest grants XP, grows attributes, evolves your character, and rebuilds your world.

## 2. Hackathon fit

The IIT Bhubaneswar brief identifies delayed gratification as the central problem and explicitly asks for a full-stack Life RPG with secure persistence, authentication, CRUD, non-linear XP, streaks, attributes, rewards/economy, responsive accessibility, a public GitHub repository, a live deployment, and a 90–180 second persistence demo. ASCENT is designed directly around those requirements.

## 3. MVP north star

The MVP has one hero loop:

> **Open → See quest → Complete → Reward → Level/progress → World/character evolution → Return tomorrow.**

The application is intentionally narrow. The level-up and evolving-world experience are the differentiators; social, combat, multiplayer, voice and complex 3D systems are out of scope.

## 4. Core experience principles

### 4.1 Immediate gratification

Every quest completion gives an immediate visual response, while the backend remains authoritative.

### 4.2 Easy first win

Level 1 → Level 2 must be deliberately easy. The user should experience a meaningful success within the first few minutes of onboarding.

### 4.3 Increasing challenge

After Level 2, required cumulative XP increases non-linearly. The exact values are deterministic and tunable, but the curve must always become harder gradually rather than suddenly.

### 4.4 Every milestone has a consequence

A level is not just a number. Important levels unlock a visible change to the character, world, cosmetics, titles, or System effects.

### 4.5 The System feels alive

Messages are short and confident:

```text
[SYSTEM]
Quest cleared.
+45 XP
+2 INT
+10 ESSENCE
```

```text
[SYSTEM]
EVOLUTION COMPLETE.
NEW AREA UNLOCKED.
```

## 5. Progression design — retention-first MVP

ASCENT should behave like a real-life RPG, but the early game must be extremely welcoming. The first success should happen quickly; later levels should gradually require more effort without creating a sudden grind wall.

### 5.1 Core progression philosophy

**Level 1 → Level 2 is the onboarding payoff.** The first recommended quest should be achievable in roughly 2–10 minutes. Completing it should provide enough XP to reach Level 2 immediately.

After Level 2:

- XP requirements increase gradually.
- Quest durations can increase from minutes to meaningful habits.
- Every level grants something visible, even if small.
- Major milestones change the character or world.
- Never make the next level feel impossibly far away.

The goal is the loop:

```text
SMALL WIN
  ↓
VISIBLE REWARD
  ↓
"I can do one more"
  ↓
LONGER QUEST
  ↓
MAJOR EVOLUTION
```

### 5.2 MVP level ladder

Use these cumulative thresholds for the demo build. They are intentionally simple, readable, and tunable.

| Level | Total XP | Typical effort | Hook / reward |
|---:|---:|---|---|
| 1 | 0 | onboarding | Awakening; starter quest |
| 2 | 50 | 2–10 min | **Aura I + first title + celebratory level-up** |
| 3 | 130 | 5–15 min | Essence chest + new System accent |
| 4 | 240 | 10–20 min | Achievement badge + stronger XP burst |
| 5 | 390 | 15–30 min | **World Restoration I** — first structure appears |
| 6 | 570 | 20–35 min | Streak reward chest + new quest card variant |
| 7 | 800 | 20–45 min | **Character Evolution I** |
| 8 | 1,070 | 30–50 min | Cosmetic item + stronger aura particles |
| 9 | 1,380 | 30–60 min | Ambient world effect + streak flame upgrade |
| 10 | 1,740 | 45–75 min | **Training Ground + Character Evolution II** |
| 11 | 2,150 | 45–90 min | Hard quests become available |
| 12 | 2,620 | 45–100 min | Achievement + Essence bonus |
| 13 | 3,160 | 60–110 min | Cosmetic/title unlock |
| 14 | 3,770 | 60–120 min | System mastery visual effect |
| 15 | 4,450 | 60–150 min | **Knowledge Library + Character Evolution III** |
| 16–19 | increasing | gradual | smaller cosmetics / titles / streak rewards |
| 20 | 7,000 | long-term | **Forge District + major evolution reward** |
| 30 | 14,000 | long-term | **Central Tower + Ascended showcase state** |

For levels 16–19, use a deterministic increasing formula rather than manually authored thresholds. Suggested: `nextLevelXP = round(70 + level * 42 + level^2 * 12)`. The backend remains authoritative.

### 5.3 Why Level 1 → 2 is intentionally easy

The first recommended quest should be something like:

> **AWAKENING QUEST**
> Drink a glass of water and take a 5-minute walk.
> +50 XP

The completion experience should teach the user that real-world action creates an immediate game reaction. This directly targets the brief's delayed-gratification problem. fileciteturn0file0L3-L9

Do not require a 30-minute workout, long study session, or complex setup before the first level-up.

### 5.4 Quest difficulty bands

| Tier | Suggested duration | XP range | When introduced |
|---|---|---:|---|
| Quick Win | 2–10 min | 20–50 | Level 1 |
| Easy | 10–20 min | 30–60 | Level 2 |
| Standard | 20–45 min | 45–90 | Level 3 |
| Focus | 45–90 min | 70–130 | Level 6 |
| Hard | 60–150 min | 100–180 | Level 11 |

The user should always have at least one achievable quest available. The system should encourage consistency rather than obsessive grinding.

### 5.5 Every-level hook

Each level has a micro-reward so progress never feels empty:

- **L2:** aura ignition
- **L3:** Essence chest
- **L4:** badge
- **L5:** first world restoration
- **L6:** streak chest
- **L7:** first character evolution
- **L8:** cosmetic unlock
- **L9:** environmental particles
- **L10:** Training Ground
- **L11:** Hard quest tier
- **L12:** achievement reward
- **L13:** title/cosmetic
- **L14:** System mastery FX
- **L15:** Knowledge Library + major character evolution
- **L20:** Forge District
- **L30:** Central Tower

This gives the judge a visible progression story without requiring dozens of systems.

### 5.6 Level-up presentation

A normal level-up lasts 2–3 seconds. A milestone level-up lasts 4–6 seconds.

Normal:

`quest → XP burst → bar fill → LEVEL UP → micro reward → System message`

Milestone:

`quest → XP burst → bar fill → LEVEL UP → screen pause → character swap → world swap → aura burst → EVOLUTION COMPLETE`

## 6. Character system — final MVP

### 6.1 Complete character artwork only

**Do not build runtime body/hair/outfit layers.**

Generate each evolution as a complete standalone character illustration. The frontend only swaps one image asset at milestone levels. This is intentionally optimized for responsive rendering and a five-to-six-hour implementation window.

The character should be the **same fictional person** across all states. Keep face identity, body proportions, camera angle, costume language and lighting consistent.

### 6.2 Character states

Required assets:

- `character-l1.png` — awakened / minimal
- `character-l2.png` — aura ignition
- `character-l7.png` — first evolution
- `character-l10.png` — training evolution
- `character-l15.png` — knowledge evolution
- `character-l20.png` — forge evolution
- `character-l30.png` — ascended showcase

Recommended source size: 1536×2048 portrait PNG with real alpha. Production can serve WebP derivatives.

### 6.3 Evolution rule

The player should never feel that a new asset is a random new character. Every evolution is an upgraded version of the same identity:

`L1 → L2` = subtle glow / confidence
`L2 → L7` = better clothing and stronger aura
`L7 → L10` = refined training gear
`L10 → L15` = intelligent high-tier design
`L15 → L20` = craft/forge-oriented high-tier attire
`L20 → L30` = elegant ascended state

## 7. World evolution — final MVP

World progression should feel like the user's environment responds to their effort. Use complete static background states and swap them at milestone levels.

Required assets:

- `world-l1.webp` — Ruined Settlement
- `world-l5.webp` — Restored Outpost
- `world-l10.webp` — Training Ground
- `world-l15.webp` — Knowledge Library
- `world-l20.webp` — Forge District
- `world-l30.webp` — Central Tower

All backgrounds use the same fictional geography/camera language. Each state should look like the **same place becoming more alive**, not six unrelated illustrations.

## 7.1 Responsive world composition

Keep the lower-middle character zone visually calm. Avoid critical architectural detail behind the protagonist's torso. Use CSS `background-position`/`object-position` presets for mobile and desktop rather than generating separate mobile compositions for the MVP.

## 8. Attributes

Five stats:

- `STR` — physical action
- `INT` — learning / knowledge
- `DISC` — consistency / habits
- `VIT` — wellbeing / recovery
- `CRE` — creativity / building

Suggested mapping:

| Activity | Primary | Secondary |
|---|---|---|
| Study / learning | INT | DISC |
| Coding / building | INT | CRE |
| Exercise | STR | VIT |
| Sleep / recovery | VIT | DISC |
| Habits / routine | DISC | VIT |
| Art / writing / design | CRE | INT |

## 9. Streaks

- Completing at least one quest on a local calendar day counts as an active day.
- Consecutive active days increase the current streak.
- Missed days break the streak.
- History remains stored for auditability.
- Show current streak prominently but do not overwhelm the UI.

Suggested bonuses:

- Day 2: +5% XP
- Day 3: +10%
- Day 7+: +15% cap

## 10. Rank system

| Rank | Level range |
|---|---:|
| E | 1–5 |
| D | 6–10 |
| C | 11–20 |
| B | 21–35 |
| A | 36–50 |
| S | 51+ |

Rank is derived from level and cannot be edited by the client.

## 11. Essence economy

One currency: `ESSENCE`.

Earn from:

- quest completion
- streak milestones
- level-up bonuses
- achievements

Spend on:

- aura cosmetics
- outfits / character variants
- weapons/props
- titles
- world cosmetics

The economy is intentionally shallow for the hackathon: the user should understand it in seconds.

## 12. System AI

AI is an enhancement, never a dependency.

Inputs:

- level
- recent quest history
- attributes
- weakest/least active stat
- goals

Output:

- one short personalized quest recommendation
- one-sentence reason
- recommended attribute/category
- suggested difficulty

On AI failure, deterministic templates remain available.

## 13. Screens

### Public

- Landing
- Login
- Signup

### Onboarding

- Awakening
- Goals
- Character preview

### Authenticated

- System Home
- Quest create/edit
- Inventory / Character
- Progress / Stats
- Profile / Settings (minimal)

## 14. System Home

Keep the home screen focused, not dashboard-heavy:

```text
E-RANK    LV.07    1,240 XP
[ XP BAR ]

          [EVOLVED CHARACTER]
      [LIVING WORLD BACKGROUND]

[SYSTEM]
DAILY QUEST
Study Chemistry — 45 min
+60 XP   +2 INT   +10 ESSENCE
                         [COMPLETE]

STR 12   INT 34   DISC 21
VIT 18   CRE 27   STREAK 4
```

## 15. Hero level-up sequence

Target: **4–6 seconds**.

1. Quest button locks.
2. Background subtly darkens.
3. Reward particles travel toward XP bar.
4. `+XP`, `+STAT`, and `+ESSENCE` appear.
5. XP bar fills.
6. If threshold crossed, normal UI pauses briefly.
7. `LEVEL UP` appears.
8. Character image swaps to the newly unlocked milestone artwork.
9. World background swaps if a world milestone was crossed.
10. New aura/particle FX play.
11. `[SYSTEM] EVOLUTION COMPLETE.`
12. UI returns to normal.

This sequence is the centerpiece of the public demo.

## 16. WebGL scope

Use a small Three.js `WorldCanvas` purely for visual enhancement:

- floating dust / particles
- subtle depth movement
- mouse/touch parallax
- soft landmark glow
- level-up particle burst

No 3D avatar and no complex 3D world.

Fallback must be CSS/DOM so WebGL failure never blocks the app.

On mobile or reduced motion:

- fewer particles
- slower animation
- static fallback where needed

## 17. Accessibility

Required:

- semantic HTML
- keyboard navigation
- visible focus states
- `aria-live` System message region
- no color-only status indicators
- strong contrast
- reduced motion
- touch targets around 44px+
- accessible form labels

## 18. Backend and security

- Supabase Auth
- PostgreSQL
- RLS on user-owned tables
- server-authoritative reward calculation
- atomic completion transaction
- idempotent completion handling
- client cannot set XP, Essence, level or rank

## 19. Minimum database

- `profiles`
- `tasks`
- `task_completions`
- `xp_events`
- `inventory`
- `achievements`

Optional derived/view tables only if needed for performance.

## 20. Error states

### Empty task
Prevent submission with inline validation.

### Duplicate completion
Return a safe already-completed response; never award twice.

### Network failure
Do not show a fake permanent success. Reconcile with the server.

### AI failure
Use deterministic fallback.

### Session expiry
Prompt for re-authentication cleanly.

### Database/API failure
Show a compact System message; never a blank screen.

## 21. Hackathon compliance matrix

| Requirement | ASCENT implementation |
|---|---|
| Full-stack Life RPG | React + Supabase/Postgres + server reward engine |
| Authentication | Supabase Auth |
| User isolation | RLS |
| CRUD | Task create/read/update/delete |
| Non-linear leveling | Increasing XP thresholds |
| Streaks | Active-day calculation |
| Attributes | STR / INT / DISC / VIT / CRE |
| Rewards/economy | Essence + inventory |
| Responsive/accessibility | Responsive UI + keyboard + screen reader support |
| Public GitHub | Source + README + `.env.example` |
| Live backend | Supabase project |
| Live frontend | Netlify or Vercel |
| Demo | Signup → quest → reward → level-up → refresh |
| Creative differentiation | Evolving character + evolving world |
| Performance | Optimized image sizes + limited WebGL |
| Robustness | Validation + error handling + idempotency |

## 22. Explicit MVP cuts

Do not build:

- multiplayer
- leaderboard
- chat
- combat
- full 3D world
- voice assistant
- giant agent system
- complex skill tree
- social feed
- payments
- notification engine
- runtime layered character compositor

## 23. Definition of done

A clean build must support:

1. Signup/login.
2. Goal onboarding.
3. Character selection/preview using complete artwork.
4. Quest CRUD.
5. Quest completion through the real backend.
6. Server-calculated rewards.
7. XP/level/rank/stats/streak persistence.
8. Essence and inventory.
9. Character evolution at milestones.
10. World evolution at milestones.
11. Refresh persistence.
12. Responsive keyboard-accessible UI.
13. WebGL enhancement with fallback.
14. No runtime crash during the judge demo.
