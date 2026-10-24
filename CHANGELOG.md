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

## v0.9.2 (2026-10-24)

- Added a fixed ORGANIZE_ONE_PAGER agent instruction for arranging existing inputs and model results into a branded A4 executive brief, with clear content slots, missing-data handling and legibility rules.
- Documentation only; current equations, website, deck and one-pager renderer remain unchanged. Validated instruction structure and package version consistency.
- Required pull was blocked by incoming changes overlapping the existing uncommitted working tree; Git preserved all local work. Local only, not committed, pushed or deployed.

## v0.9.1 (2026-10-24)

- Added a reference-backed, provider-neutral DESIGN_CASE instruction for the future design agent: brand/surface inspection, dark/light hierarchy, evidence-driven compositions, distinct website/deck layouts and visual QA gates.
- Added an allowlisted design-plan JSON schema and host handoff guide. This documents the future agent boundary; no live agent integration or current renderer/deck changes are claimed.
- Updated website framework notes to reflect removal of Explore actions. Validation: schema JSON/internal references, documentation links and consistent package versions. Local only; not committed, pushed or deployed.

## v0.9.0 (2026-10-24)

- Added editable Nike, Lovable and Fortnite sample projects with distinct illustrative inputs, company logos and branded website previews. All sample inputs are marked assumptions, with a clear fictional-case notice; existing projects are preserved and sample seeding runs once.
- Embedded public Nike and Lovable heading fonts. Fortnite explicitly uses Arial because its public font download was unavailable. Added a repeatable local preview generator at `scripts/preview-samples.mjs`.
- Fixed the website scroll hint overlapping the cover identity and improved logo sizing for wordmarks. Validation: sample data/provenance tests, full suite, production build and three browser previews.
- Local working-tree update; no commit, push or deployment.

## v0.8.1 (2026-10-24)

- Refined the website template using Impeccable guidance: distinct section compositions, stronger heading hierarchy, clearer chart labels and accessible focus states, preserving company fonts and colors.
- Removed the cover and header “Explore” actions; the logo/name opening now leads into natural scrolling. Removed redundant website section labels without editing the client deck or other output formats.
- Validation: full test suite, production build and dark/light browser previews. Local working-tree update; not deployed.

## v0.8.0 (2026-10-24)

- Website template opens with the company logo and name, followed by Overview, Business impact, Value drivers, What changes, The alternative and Stakeholders, using saved company branding and fonts.
- Added responsive annual-value/cost charts, proportional driver breakdowns, before/after diagrams and a self-hosting cost flow; scenario changes refresh the graphics. Missing figures remain unavailable and arithmetic stays expandable.
- Website-only change: model equations, client deck, PDF, Slides and one-pager remain unchanged. Validation: graphics/branding/export isolation tests, full test suite, production build and populated/empty browser previews.
- Working-tree update; not released or deployed.

## v0.7.0 (2026-10-24)

Working-tree update; not released.

- Simplified the website to the company logo/title on its flat authored cover
  background. Removed the glowing logo tile, gradients and floating pill styling.
- Replaced the Perspective selector with Explore the case and Adjust assumptions.
  The main case stays company-focused; stakeholder-specific framing lives in the map.
- Restored the original company-centered radial stakeholder layout, retaining
  saved positions. A pinned scroll journey moves the diagram between left and
  right as stakeholder briefs advance, with connected nodes, click/keyboard
  controls, progressive objection/response disclosure and reduced-motion support.
- Validation: 202 tests pass; production build passes. Browser checks cover
  company-colored covers, navigation, radial layout and alternating scroll stops.

## v0.6.0 (2026-10-24)

Working-tree update; not released.

- Added Claude to Connections using the existing permissioned paste/upload model;
  disabled Claude documents and Claude-hosted citations are excluded by the agent.
  The global Connections page can target a saved project for permissions/uploads.
- Set the website order to company logo/title, Overview, Business impact, Value
  drivers, What changes, The alternative, and an interactive stakeholder map.
  All seven sections remain available when figures are not yet computable.
- Map nodes animate open to show priorities, needs, objection and counter, with
  close/Escape controls and keyboard focus handling. Company fonts and model
  equations are retained; website edits keep their original deck destinations.
- Validation: 197 tests pass; production build passes. Browser checks cover the
  map interaction, required section order, missing inputs and Claude listing.

## v0.5.3 (2026-10-24)

Working-tree update; not released.

- Kept company heading/body fonts consistent across Website, PDF, Slides,
  One-pager and PPTX, including summary/metric headings and text overrides.
- Preserved font-family fallback lists and uploaded web-font data in HTML-based
  outputs. PPTX records actual typeface names and matching theme fonts; recipients
  still need the selected fonts installed. Corrected partial demo brand settings.
- Validation: 192 tests pass, including editable PPTX XML/theme checks and
  Website/PDF/Slides/One-pager font regression checks. Production build passes.

## v0.5.2 (2026-10-24)

Working-tree update; not released.

- Redesigned the website around the user-supplied CoreShift reference: centered
  company-logo artwork, connected stakeholder tiles, floating navigation,
  centered introduction and calls to action, and editorial/data section layouts.
- Changed the website to normal document scrolling with sticky introductions
  and viewport-based scroll reveals. Hero tiles select stakeholder perspectives.
  No reference media or company-specific stock photography is embedded.
- Existing deal content, equations, app sidebar, PDF and Slides remain intact.
- Validation: 188 tests pass; production build passes. Browser checks cover
  centered branding, mobile overflow, role selection, navigation and reveals.

## v0.5.1 (2026-10-24)

Working-tree update; not released.

- Refined website buttons with arrow/icon treatments, hover/press feedback,
  focus rings and an animated scenario panel. Cards respond to hover.
- Added once-only scroll and driver-bar reveals, with reduced-motion, print and
  unsupported-browser fallbacks. Scenario updates keep seen content visible.
- Uses existing 21st.dev navigation/Bento references; further source retrievals
  were unavailable under today's free quota. Motion is implemented locally.
- Validation: 185 tests pass; production build passes. Browser checks confirm
  offscreen reveals and interactive scenario-panel controls.

## v0.5.0 (2026-10-24)

Working-tree update; not released.

- Added a reusable, brand-adaptive interactive website framework, using 21st.dev
  navigation and Bento Grid references documented in docs/website-framework.md.
- Added contrast-safe theme tokens, readable block-color fallbacks, logo-free
  monograms, semantic navigation, responsive metric summaries, expandable
  arithmetic and empty states. Long content wraps and comparison rows scroll.
- Preview, downloaded HTML and published sites share the framework. Stored deck
  content, model equations, application sidebar, PDF and Slides stay unchanged.
- Validation: 183 tests pass, including multi-brand contrast and non-mutation
  checks; browser checks cover light/dark palettes, long names, missing figures,
  navigation and arithmetic disclosure. Production build passes.

## v0.4.1 (2026-10-24)

Working-tree update; not released.

- Refined the interactive website with a responsive branded hero, section tabs,
  reading progress, value cards, driver panels, and clear exploration actions.
- Added a live annual-value summary and accessible close/Escape controls to the
  scenario explorer. Website scrolling uses native keyboard behavior.
- Kept the app sidebar, client-deck content, equations, PDF and Slides layouts.
- Validation: 178 tests pass; production build passes. Browser checks confirm
  scenario recalculation/reset and stakeholder perspective switching.

## v0.4.0 (2026-10-24)

Working-tree update; not released.

- View as now opens PDF, Slides, One-pager, and Website previews without starting
  a download or print dialog. Download controls are separate from viewing.
- Added a paginated A4 landscape PDF layout and a slide presenter with previous/
  next controls, keyboard navigation, fullscreen, and an explicit PPTX download.
- Reorganized the one-pager into an A4 executive brief: impact metrics, drivers
  and arithmetic, Portal versus self-hosting, stakeholder needs and response.
- Website uses a scrolling page with section navigation, stakeholder perspectives,
  and live scenario sliders. Format switching preserves the selected audience.
- Recorded the working agreement to pull first and maintain change notes and
  consistent version numbers. Local notes were backed up before pulling v0.3.0.
- Validation: preview and export tests, production build, and browser checks for
  page fit, slide navigation, audience switching, scenario changes and reset.
  All 178 tests pass.

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
