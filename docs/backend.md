# CaseBuilder backend

Living design doc. Updated as the backend is built.

## Architecture

```
 Web app (Vercel)  ──writes job──►  Supabase (Postgres)  ◄──claims job──  Hermes worker (Oracle VPS)
       ▲                            accounts, deals, deck,                 one Hermes install,
       └────── Realtime ◄────────── chat, jobs, schedules  ──results──►    one profile per account
                                            ▲
                                   pg_cron, every minute
                                   (due schedules → jobs)
```

- **Supabase is the system of record.** Nothing user-facing is stored on the
  worker machine.
- **Hermes is the agent.** It runs connectors, search, lead finding, deck
  edits and chat replies. Each account gets its own Hermes profile (own
  memory and learned skills).
- **The queue is a table.** The web app inserts a job, the worker claims it,
  writes results back. The worker only makes outbound connections: no
  public port, no tunnel.

## Schema (`supabase/migrations/0001_init.sql`)

| Table | Holds | Who writes |
|---|---|---|
| `profiles` | role (`user` / `admin`) per auth user | trigger on signup |
| `deals` | the full deal record (fields, stakeholders, deck, connectors) as `jsonb`, plus `version` | user, worker |
| `chat_messages` | one thread per deal | user (`user` role only), worker (`assistant`, `status`) |
| `jobs` | the queue | user enqueues, worker does the rest |
| `schedules` | per-user recurring tasks | user (app or via chat) |

`deals.data` keeps the exact shape `src/dealStorage.js` already validates, so
moving from `localStorage` to Supabase swaps one adapter, not the app.

## Guarantees, each covered by a test (`supabase/schema.test.js`)

- **Account isolation (RLS).** A user cannot read, edit, delete, or create
  rows for another account. Admins can read everything.
- **No self-promotion.** Users cannot change their own role.
- **No silent overwrites.** `save_deal` takes the version you read; if
  someone (Chris or the agent) saved first it raises `deal_conflict`
  instead of merging.
- **Jobs cannot be forged.** Whatever a client sends, a new job starts as
  `queued`, 0 attempts, no result, unlocked.
- **Worker functions are server-only.** `claim_job`, `complete_job`,
  `fail_job`, `enqueue_due_schedules` are granted to `service_role` only.
- **Exactly-once claiming.** `FOR UPDATE SKIP LOCKED`; two workers never get
  the same job, and one worker cannot complete another's job.
- **Retries with backoff**, 3 attempts, then `failed`.
- **Crash recovery.** A job stuck in `running` for 10 minutes is requeued.
- **Rate limit.** 30 jobs per account per 10 minutes from the app.
- **Schedules.** Missed slots collapse into one job (no backlog storm), a
  slot can never be queued twice (`dedupe_key`), steps in the schedule's own
  timezone so 9 AM stays 9 AM across DST, minimum 1 hour, max 20 per account.

Tests run the real migration on real Postgres 18 in-process (PGlite) with a
stand-in for Supabase's `auth` schema. No Docker, no cloud project needed.

```
node --test supabase/schema.test.js
```

## Live project

Supabase project `casebuilder`, region `ca-central-1` (Canada Central, near
the Toronto demo audience), free plan. `0001_init.sql` applied 2026-10-24 and
verified in the live database: 5 tables with RLS on, 4 worker functions
server-only, signup trigger present, Realtime publishing `chat_messages` and
`jobs`, `pg_cron` available.

`0002_cron.sql` applied: cron job 1 runs every minute, verified in
`cron.job_run_details` (3 consecutive `succeeded` runs, 12:52 to 12:54 UTC).

Still to verify: whether the per-minute cron counts as activity for the
free-tier 7-day pause.

## Next

1. Hermes worker: claim → run Hermes in the account's profile → write back.
   Prove one job end to end before building on it.
2. `dealStorage.js` Supabase adapter behind the same interface.
3. Per-deal chat UI with Realtime.
4. CaseBuilder tools for Hermes (read/update deal, edit deck, find leads,
   search, create schedule), scoped to the job's account.
