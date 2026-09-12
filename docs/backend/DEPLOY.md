# Deployment Instructions

## 1. Create Supabase Project

```bash
supabase init
supabase link --project-ref <your-project-ref>
```

## 2. Push Schema

```bash
supabase db push
```

This applies all migrations in order:
1. `001_schema.sql` — tables, RLS, helper functions, triggers
2. `002_functions.sql` — complete_quest, recommend_quest, get_progression RPCs
3. `003_seed.sql` — additional achievement seeds

## 3. Deploy Edge Functions

```bash
supabase functions deploy complete-quest
supabase functions deploy recommend-quest
```

Set the service role key as a secret:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## 4. Set Environment Variables

Frontend `.env`:
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_APP_URL=http://localhost:5173
```

## 5. Verify

Run the verification script in `docs/backend/VERIFICATION.sql` in the Supabase SQL Editor.

## 6. Connecting to Frontend

The frontend already uses `src/lib/supabase.ts` with the Supabase JS client.
All backend calls go through:
- `src/services/api.ts` — task CRUD via Supabase SDK
- `src/services/api.ts` — completeQuest via `supabase.functions.invoke("complete-quest")`
