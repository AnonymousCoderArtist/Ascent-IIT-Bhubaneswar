# ASCENT — Tech Stack & Architecture

## 1. Chosen stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + TypeScript | Fast iteration, componentized UI, familiar ecosystem |
| Styling | Tailwind CSS + CSS variables | Fast responsive build while preserving custom visual identity |
| Motion | Framer Motion | UI transitions and reward sequencing |
| Visual effects | Three.js | Small WebGL world/particle enhancement |
| Icons | Lucide React | Consistent SVG icon system |
| Backend/BaaS | Supabase | Auth + Postgres + RLS + server-side functions |
| Database | PostgreSQL | Relational history + inventory + transactional reward model |
| Server logic | Supabase Edge Functions / SQL RPC | Keep reward calculations server-authoritative |
| AI | Gemini via Edge Function | Optional personalized quest recommendation |
| Frontend hosting | Netlify | Simple Git-based deployment and HTTPS |
| Source control | GitHub | Required public repo + chronological commits |

No Electron, Tauri, or desktop runtime is needed.

---

## 2. Repository layout

```text
ascent/
├─ src/
│  ├─ app/
│  ├─ components/
│  │  ├─ system/
│  │  ├─ quest/
│  │  ├─ character/
│  │  ├─ world/
│  │  └─ ui/
│  ├─ pages/
│  ├─ hooks/
│  ├─ lib/
│  ├─ services/
│  ├─ styles/
│  └─ types/
├─ public/
│  ├─ character/
│  ├─ world/
│  └─ effects/
├─ supabase/
│  ├─ migrations/
│  └─ functions/
├─ database/
│  └─ schema.sql
├─ docs/
├─ .env.example
└─ README.md
```

---

## 3. High-level architecture

```text
                  ┌─────────────────┐
                  │     React       │
                  │  System Client  │
                  └────────┬────────┘
                           │
                Supabase JS SDK
                           │
          ┌────────────────┼─────────────────┐
          │                │                 │
          ▼                ▼                 ▼
     Supabase Auth      Postgres         Edge Functions
          │              + RLS                 │
          │                │             Reward Engine
          │                │                 │
          │                └──────┬──────────┘
          │                       │
          └──────────────► Player State
                                  │
                                  ▼
                            Gemini (optional)
```

---

## 4. Client responsibilities

Client may:

- display state
- request task CRUD
- request completion
- animate optimistic/pending transitions
- render character/world composition
- request AI quest recommendation

Client may NOT decide final:

- XP granted
- Essence granted
- level
- rank
- streak final value
- permanent inventory unlocks

---

## 5. Server responsibilities

Server must:

- authenticate user
- enforce RLS ownership
- validate task completion
- create completion event
- calculate reward
- update user progression
- create unlocks
- reject duplicate completion

---

## 6. Recommended RPC/API contract

### `POST /functions/v1/complete-quest`

Request:

```json
{
  "taskId": "uuid"
}
```

Response:

```json
{
  "success": true,
  "task": {
    "id": "uuid",
    "completed": true
  },
  "reward": {
    "xp": 45,
    "attribute": "DISC",
    "attributeXp": 2,
    "essence": 10
  },
  "progression": {
    "levelBefore": 4,
    "levelAfter": 5,
    "rankBefore": "E",
    "rankAfter": "E",
    "totalXp": 410,
    "xpToNextLevel": 700,
    "leveledUp": true
  },
  "streak": {
    "current": 4,
    "extended": true
  },
  "unlocks": [
    {
      "type": "world",
      "key": "training_ground"
    }
  ]
}
```

The frontend can animate entirely from this response.

---

## 7. WebGL architecture

Create a self-contained:

`<WorldCanvas />`

Responsibilities:

- background particle field
- subtle camera/parallax movement
- atmospheric particles
- optional landmark glow

The world scene itself should stay mostly as pre-rendered transparent layers. This keeps load and implementation risk low.

### Performance rules

- lazy-load Three.js chunk after authenticated shell is ready
- use a small canvas size / devicePixelRatio cap
- pause animation when tab is hidden
- reduce particles on mobile
- honor `prefers-reduced-motion`
- avoid expensive post-processing unless tested

---

## 8. AI integration

Use a single Edge Function such as:

`/functions/v1/recommend-quest`

The function should construct a compact prompt from structured user state and ask the chosen Gemini model for one quest recommendation.

Return a strict JSON schema. The client must not trust AI output for rewards; the server validates category/difficulty and computes rewards itself.

Fallback template examples:

- `20-minute walk` → STR
- `Read 10 pages` → INT
- `Clean your workspace for 10 minutes` → DISC
- `Sketch for 15 minutes` → CRE
- `Drink water + stretch for 10 minutes` → VIT

---

## 9. Deployment

### Frontend

Deploy Vite build to Netlify.

### Backend

Supabase project holds Auth/Postgres/Edge Functions.

### Environment variables

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_URL=
```

Secrets used only in Edge Functions:

```bash
GEMINI_API_KEY=
```

Never ship service-role keys or Gemini secrets to the browser.

---

## 10. Observability for demo readiness

At minimum, log:

- auth errors
- completion errors
- reward transaction errors
- AI recommendation errors

In production UI, show friendly System messages instead of raw errors.
