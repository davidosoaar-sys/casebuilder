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
