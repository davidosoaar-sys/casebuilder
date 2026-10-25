# Changelog

Every version that lands on `main` gets a line here and a git tag.

## How we version

- Format: `vMAJOR.MINOR.PATCH` (semantic versioning).
  - **PATCH** (`0.2.0` → `0.2.1`): bug fix, nothing new.
  - **MINOR** (`0.2.0` → `0.3.0`): new feature.
  - **MAJOR**: stays `0` until CaseBuilder is a real product.
- A version identifies a release pushed to `main`, not each local edit or milestone.
- Keep local work under an unversioned `Unreleased` heading; assign the next version when preparing the actual push. Work-in-progress snapshots do not count as releases.
- Each release: bump `version` in `package.json`, add an entry below, commit,
  then `git tag -a vX.Y.Z -m "..."` and `git push origin main --tags`.

## Rolling back

- **Production broke:** Vercel dashboard → Deployments → previous good
  deployment → "Promote to Production". No code needed.
- **Code broke:** `git revert <commit>` creates a new commit that undoes it.
  Never force-push `main`.
- **See what a version looked like:** `git checkout vX.Y.Z` (read-only).

---

## v0.7.0 (2026-10-25): the agent can change the deal

- Agent tab in every project, plus a split-screen mode beside Input sheet,
  Deck and Person lookup, with a draggable divider (width remembered).
  Chat history is saved per deal in Supabase.
- Ask in plain words ("They have 1,200 engineers"). The Hermes worker
  returns structured edits; the app checks each one again and applies it
  straight away. The deck, one-pager and summaries recalculate.
- Each reply that changed something shows a card (old -> new) with Undo.
  Undo restores the exact value and source; if you edited the field
  since, your number is kept. Edits apply once per reply, never twice.
- A figure you stated becomes your own number (assumption, "You said it
  in chat"); a figure the agent proposed becomes a suggestion with its
  reason. Neither counts as confirmed. The agent cannot change the
  company name, calendar constants, custom inputs or removed inputs.
- Message box with a mascot: model picker (Sonnet / Haiku / Opus 5.5) with
  a Low / Medium / High thinking level, attach text files (.txt, .md, .csv,
  .json, transcripts, up to 1 MB each, 5 files), web search on/off, voice
  dictation where the browser supports it. Copy on every message; edit and
  resend on your own messages (on hover).
- No API key: sending is blocked with a link to Settings. A failed request
  is reported in the chat instead of spinning. Leaving and coming back
  mid-reply picks the reply up.
- The agent addresses the signed-in user by name.
- Clicking the logo goes to the Dashboard.
- Fixed: Dashboard asked for job columns that do not exist, so its query
  failed on every load.

Checks: app tests and build pass; 11 worker tests pass. Real end-to-end
test `scripts/review-agent-chat.mjs` (browser -> Supabase -> Hermes worker
-> model -> deal -> Supabase): change applied and saved, deck renders with
the split pane, copy/edit on hover, Undo restores and saves, reload does
not re-apply. Web search checked on and off against the live worker.

## v0.6.0 (2026-10-25)

- 2026-10-25: Added evidence-linked professional conversation starters to Person lookup, with an explicitly inferred role-based fallback. Organized inputs into consistent sections with jump navigation; suggestion-only source notes are closed by default above values. Manual inputs retain their state controls without source-note UI. Equations and client deck unchanged. Validation: 236 tests pass; production build passes.

- Refined Person lookup with a compact unified search line, a useful empty state, readable sourced identity/brief sections, explicit inferred stakeholder fit and expandable reporting/source coverage. Sidebar and search/write behavior remain unchanged; styles support light/dark and narrow screens.
- Added app-specific agent command IDs and a trusted instruction registry, separate from the Claude plugin. New project/brand discovery, Find people, Person lookup and Suggest values now name their tasks and use centralized server instructions; framing/website/one-pager design are explicitly documented as future contracts. Format exports remain deterministic and reuse saved branding.
- Extended the Claude plugin with shared button/action contracts, company-to-case orchestration, brand discovery, person lookup, stakeholder proposals, deliverable instructions, examples and an evaluation scorecard.
- Added a portable action planner and evidence validator using the app's connector permissions and nearest-role mapping. Research remains proposed until selected; no app-to-Claude bridge or live connector access is implied.
- Plugin exports now use the case's branding; unsupported PowerPoint logo formats produce an explicit warning. Inferred person mappings survive case-file conversion. No model equations changed.
- Validation: 236 tests pass, including lookup view/source/action states, app command contracts/transports and an offline empty-case → sourced inputs → branded HTML/PPTX fixture; app and plugin builds pass. Lookup checked with fictional results in light/dark and at 390 px, including no-deal and added states. Extracted ZIP checked: 36 files, six action routes, portable planner and no environment files. Live agent invocation and connected-source research have not been tested. Release version: v0.6.0.

## v0.5.0 (2026-10-24)

- Combined Amr's accounts, password security, cloud deal storage, dashboard/settings and Hermes worker with David's website framework, previews, deck/input editing, Claude connector and design-agent instructions.
- Preserved the cloud-backed save lifecycle and project-scoped connector selection. Added explicit sample creation for Nike, Lovable and Fortnite in the cloud-backed project list.
- Validation: all 218 tests and the production build pass; isolated render checks cover the account dashboard, sample selector and project-scoped Claude connector. Local sign-in loads. Signed-in live account flows and production deployment have not been verified.

## v0.4.1 (2026-10-25)

Fixed: password security.
- Change password now asks for your **current password**. Supabase enforces
  it on the server (`security_update_password_require_current_password`), so
  the form cannot be skipped.
- A **"Your CaseBuilder password was changed"** email goes out after every
  change, from casebuilder.app@gmail.com, telling the owner what to do if it
  was not them.
- **Forgot password?** on the sign-in screen: email -> 6-digit reset code ->
  new password, all on one screen, no links. The screen says the same thing
  whether or not the email has an account, so it cannot be used to check who
  is signed up. The app only opens once the new password is saved.
- Supabase's minimum password length raised from 6 to 10, matching the forms.
- Auth settings are applied by script: `scripts/supabase-auth-settings.py`.

Correction to v0.4.0: it said the old password was "checked and rejected
when wrong". It was not; the test only checked that the old password stopped
working after a change. That check now exists, in this version.

Checks: 180/180 tests, production build OK. New real end-to-end test
`scripts/review-password-email.mjs` (fresh account, real Gmail inbox): wrong
current password rejected, right one accepted, change email arrives, reset
code arrives with no link, wrong reset code rejected, right one sets the new
password, only the newest password signs in. ALL PASS, two runs in a row.
`scripts/review-password.mjs` updated and ALL PASS.

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

## Development milestone history (not separate releases)

The following notes were recorded while David's work was local. Their features are combined in v0.5.0; historical local-only statements describe the state at the time. No release tags are implied.

### One-pager agent instruction (2026-10-24)

- Added a fixed ORGANIZE_ONE_PAGER agent instruction for arranging existing inputs and model results into a branded A4 executive brief, with clear content slots, missing-data handling and legibility rules.
- Documentation only; current equations, website, deck and one-pager renderer remain unchanged. Validated instruction structure and package version consistency.
- Required pull was blocked by incoming changes overlapping the existing uncommitted working tree; Git preserved all local work. Local only, not committed, pushed or deployed.

### Design-agent contract (2026-10-24)

- Added a reference-backed, provider-neutral DESIGN_CASE instruction for the future design agent: brand/surface inspection, dark/light hierarchy, evidence-driven compositions, distinct website/deck layouts and visual QA gates.
- Added an allowlisted design-plan JSON schema and host handoff guide. This documents the future agent boundary; no live agent integration or current renderer/deck changes are claimed.
- Updated website framework notes to reflect removal of Explore actions. Validation: schema JSON/internal references, documentation links and consistent package versions. Local only; not committed, pushed or deployed.

### Branded sample cases (2026-10-24)

- Added editable Nike, Lovable and Fortnite sample projects with distinct illustrative inputs, company logos and branded website previews. All sample inputs are marked assumptions, with a clear fictional-case notice; existing projects are preserved and sample seeding runs once.
- Embedded public Nike and Lovable heading fonts. Fortnite explicitly uses Arial because its public font download was unavailable. Added a repeatable local preview generator at `scripts/preview-samples.mjs`.
- Fixed the website scroll hint overlapping the cover identity and improved logo sizing for wordmarks. Validation: sample data/provenance tests, full suite, production build and three browser previews.
- Local working-tree update; no commit, push or deployment.

### Website design refinement (2026-10-24)

- Refined the website template using Impeccable guidance: distinct section compositions, stronger heading hierarchy, clearer chart labels and accessible focus states, preserving company fonts and colors.
- Removed the cover and header “Explore” actions; the logo/name opening now leads into natural scrolling. Removed redundant website section labels without editing the client deck or other output formats.
- Validation: full test suite, production build and dark/light browser previews. Local working-tree update; not deployed.

### Website diagrams and template (2026-10-24)

- Website template opens with the company logo and name, followed by Overview, Business impact, Value drivers, What changes, The alternative and Stakeholders, using saved company branding and fonts.
- Added responsive annual-value/cost charts, proportional driver breakdowns, before/after diagrams and a self-hosting cost flow; scenario changes refresh the graphics. Missing figures remain unavailable and arithmetic stays expandable.
- Website-only change: model equations, client deck, PDF, Slides and one-pager remain unchanged. Validation: graphics/branding/export isolation tests, full test suite, production build and populated/empty browser previews.
- Working-tree update; not released or deployed.

### Stakeholder scroll journey (2026-10-24)

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

### Claude connector and website story (2026-10-24)

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

### Brand typography across outputs (2026-10-24)

Working-tree update; not released.

- Kept company heading/body fonts consistent across Website, PDF, Slides,
  One-pager and PPTX, including summary/metric headings and text overrides.
- Preserved font-family fallback lists and uploaded web-font data in HTML-based
  outputs. PPTX records actual typeface names and matching theme fonts; recipients
  still need the selected fonts installed. Corrected partial demo brand settings.
- Validation: 192 tests pass, including editable PPTX XML/theme checks and
  Website/PDF/Slides/One-pager font regression checks. Production build passes.

### Website identity layout (2026-10-24)

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

### Website interaction refinement (2026-10-24)

Working-tree update; not released.

- Refined website buttons with arrow/icon treatments, hover/press feedback,
  focus rings and an animated scenario panel. Cards respond to hover.
- Added once-only scroll and driver-bar reveals, with reduced-motion, print and
  unsupported-browser fallbacks. Scenario updates keep seen content visible.
- Uses existing 21st.dev navigation/Bento references; further source retrievals
  were unavailable under today's free quota. Motion is implemented locally.
- Validation: 185 tests pass; production build passes. Browser checks confirm
  offscreen reveals and interactive scenario-panel controls.

### Website framework (2026-10-24)

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

### Preview polish (2026-10-24)

Working-tree update; not released.

- Refined the interactive website with a responsive branded hero, section tabs,
  reading progress, value cards, driver panels, and clear exploration actions.
- Added a live annual-value summary and accessible close/Escape controls to the
  scenario explorer. Website scrolling uses native keyboard behavior.
- Kept the app sidebar, client-deck content, equations, PDF and Slides layouts.
- Validation: 178 tests pass; production build passes. Browser checks confirm
  scenario recalculation/reset and stakeholder perspective switching.

### Output previews (2026-10-24)

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
