# Changelog

Every version that lands on `main` gets a line here and a git tag.

## How we version

- Format: `vMAJOR.MINOR.PATCH` (semantic versioning).
  - **PATCH** (`0.2.0` → `0.2.1`): bug fix, nothing new.
  - **MINOR** (`0.2.0` → `0.3.0`): new feature.
  - **MAJOR**: stays `0` until CaseBuilder is a real product.
- Only `main` gets versions. Work-in-progress branches do not.
- Each release: bump `version` in `package.json`, add an entry below, commit,
  then `git tag -a vX.Y.Z -m "..."` and `git push origin main --tags`.

## Rolling back

- **Production broke:** Vercel dashboard → Deployments → previous good
  deployment → "Promote to Production". No code needed.
- **Code broke:** `git revert <commit>` creates a new commit that undoes it.
  Never force-push `main`.
- **See what a version looked like:** `git checkout vX.Y.Z` (read-only).

---

## v0.4.0 (2026-10-25)

Added: accounts, saved deals, the app shell, and the Hermes worker. This is
the first version where CaseBuilder is a real multi-user app.

Accounts
- Sign in with email + password (Supabase auth). Signed-in email and Sign out
  in the sidebar.
- Create account with a 6-digit email code (no link). Sent from
  casebuilder.app@gmail.com through Gmail SMTP, so no domain is needed.
  Verified end to end: code arrives in ~11s, account opens on the Dashboard.
- Change password from Settings; the old password is checked and rejected
  when wrong.
- Admin role on accounts (David has one).

Deals
- Deals are saved to Supabase per account, not the browser. Versioned saves
  (stale writes refused), offline-safe write-ahead copy, one sample deal per
  new account.

App shell
- CaseBuilder wordmark (Case white, Builder mint, Outfit 600) matching the
  landing site; B mark fixed (was cropped at the bottom).
- Collapsible sidebar, Dashboard, Claude-style Projects index, unified page
  headers.
- Settings is a blurred overlay (gear, bottom-left) with Appearance and the
  API key box inside. Fixed: opening Settings no longer kicks you out of a
  project.
- "Connections" renamed to "Connectors" everywhere (menu, page title, input
  sheet, exported deck).

Backend
- Hermes worker: Supabase job queue -> one isolated Hermes profile per
  account -> answer back into chat. Runs on the Oracle VM under systemd
  (`worker/`, `infra/`).
- Per-account model keys stored in Supabase Vault
  (`supabase/migrations/0003_model_keys.sql`), with tests.
- Search key passed per job and shredded with the profile `.env`.

Checks: 180/180 tests, production build OK, sign-up email test
(`scripts/review-signup-email.mjs`) ALL PASS.

---

## v0.3.0 (2026-10-24)

Added: Supabase backend, database layer (not yet wired into the app; nothing
user-visible changes, the app still saves to the browser).
- `supabase/migrations/0001_init.sql`: 5 tables (profiles, deals, chat_messages,
  jobs, schedules), row-level security per account, admin role, versioned
  deal saves (`save_deal` refuses stale writes), job queue for the Hermes
  worker (exactly-once claiming, retries with backoff, crash recovery, rate
  limit), per-user schedules.
- `supabase/migrations/0002_cron.sql`: pg_cron runs `enqueue_due_schedules`
  every minute.
- `supabase/schema.test.js`: 18 database tests on real Postgres (PGlite).
- `docs/backend.md`: backend design and guarantees.
- Live project: Supabase `ca-central-1`, both migrations applied and verified.

Tests: 170 passing, 0 failing.

## v0.2.0 (2026-10-24)

Added (not yet wired into the app; nothing user-visible changes):
- `server/providers.js`: one `complete()` call over Anthropic, OpenAI,
  Google, and any OpenAI-compatible endpoint. Provider-agnostic backend.
- `server/search.js`: search runs on our side (Tavily, Google CSE, Brave,
  Serper) and builds a deduped, numbered evidence set. The model may only
  cite what is in it. Disabled-connector domains blocked, subdomains too.
- `server/providers.test.js`: 21 tests, including that provenance is identical
  across providers.

Tests: 152 passing, 0 failing.

## v0.1.0 (2026-10-24)

Baseline: David's CaseBuilder as of `da9a7cf`. Value model, deck builder,
provenance, connectors permission model, people finder, branding, publish,
Claude plugin. Storage is browser `localStorage`. 131 tests.
