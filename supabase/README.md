# Supabase setup (Phase 1)

## Apply all migrations (recommended)

With the project linked (`npx supabase link`):

```bash
npx supabase db push
```

This runs migrations **in order**:

| File | Purpose |
|------|---------|
| `0000_initial_schema.sql` | Tables + enums (from Drizzle schema) |
| `0001_auth_trigger.sql` | Profile row on signup |
| `0002_rls_policies.sql` | Row Level Security |
| `0003_storage.sql` | `courses` storage bucket |

## If you already pushed 0001 but 0002 failed

`0002` needs tables from `0000`. Either:

**A — Drizzle only for schema, then Supabase for the rest:**

```bash
npm run db:migrate
npx supabase db push
```

(Supabase will skip `0001` if already applied and apply `0002` + `0003`.)

**B — Push again after adding `0000`:**

```bash
npx supabase db push
```

(Supabase applies `0000` first, then retries `0002` and `0003`.)

## After schema changes in code

1. `npm run db:generate` — updates `drizzle/*.sql`
2. Copy the new SQL into `supabase/migrations/` (or run `npm run db:migrate` only)
3. `npx supabase db push` for RLS/storage/triggers

## Auth

Dashboard → Authentication → enable Email and set confirm-email policy as needed.

Storage paths: `{courseId}/{contentId}/{filename}`.
