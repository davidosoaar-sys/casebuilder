# What we are building

CaseBuilder is a platform for Chris to turn customer conversations, research and
his business-case inputs into one credible case he can present in a Live Room,
slides, PDF or a one-pager.

First-visit guidance explains the real page over a softly blurred background.
Okay clears the card and blur; the user then clicks the highlighted control.
Guidance waits for actual page/stage changes instead of navigating automatically.
Other workspace pages have independent tips, remembered per account in this
browser. Onboarding itself never creates deals, runs research or sets up tools.

New-case setup follows stakeholders → company assets → people → theme. Company
uses a white canvas and company typography/accent; Backstage applies its full dark
palette and typography. Existing decks change only when explicitly selected.
Backstage’s partner mark stays green. Transparent black/white customer marks adapt
to the theme with originals retained; multicolor and opaque artwork stay intact.

## Who and why
Chris sells Spotify Portal for Backstage against running open-source Backstage
in-house. He manages several evolving deals. The product should reduce repeated
research, last-minute rebuilding and coordination, not give him another chore.

## The core workflow
Company → stakeholders and branding → case inputs and evidence → client-facing
case artifacts → revise as the deal changes. The Live Room is the primary artifact
experience. A published snapshot updates when republished; automatic shared-link
synchronization and team collaboration are not assumed to exist.

## Keep fixed
- Chris’s deterministic equations and source objects; missing values are unknown.
- Customer identity across formats; preserve company type/palette in Company theme,
  or the explicitly selected Backstage typography/palette in Backstage theme.
- Authored edits, saved deals, private notes and enabled-source boundaries.
- The established application sidebar and light/dark visual system.
- Private evidence, objections, inferred framing and preparation stay out of
  client-facing stakeholder sections. Client requirements are recorded explicitly.

## Scope filter
Before adding anything, explain how it helps the core workflow above. Prefer
improving an existing step. Do not turn this into a general CRM, task manager,
finance system or slide-generation playground. No new connector/backend claims
without a working integration. No fake customer evidence or testimonials.

## Current work — 2026-10-25
Claude artifact generation now explicitly invokes official brand discovery and
the deck-design skill. A local MCP tool saves authorized brand findings; actual
research/downloads require host web tools, and visual QA remains host-dependent.
The four platform built-in skills share source-safe, framework-based instructions
for manual and scheduled runs. Client logo blocks pair customer × Backstage while
preserving company fonts/colors. Worker changes take effect on worker deployment.
The separate Evidence review tab is removed; input source data remains available.
Deck Undo/Redo have visible labels; added pages inherit the active page's styles
within the existing company theme. Creating a separate new project does not copy
another company's branding.
Claude onboarding now explicitly requests sources, connection/scope, input review
and output selection. Choices use host controls if available or text; no custom
graphical onboarding or automatic third-party authorization is claimed.
2026-10-26: The Claude package includes a local MCP prototype for reviewed case
inputs, canonical calculations and artifact builds. Claude uses separately
authorized host connectors; the prototype does not host OAuth or sync app deals.
2026-10-26: Gmail is available as a default-off connector for project email threads
pasted or uploaded by Chris. This does not connect to a live inbox or send email.
Local meeting work: evidence review, optional case context and impact-first new
templates. Implemented locally: Live Room first, optional/automatically sourced brand imagery, refined one-pager, client-safe stakeholder requirements/statuses, sourced portrait support, and product/demo storytelling. Private notes remain internal.
Local v0.16.0 work (2026-10-26): the Agent can revise the case artifacts from chat
(page wording and text styles, adding, removing and reordering pages and blocks,
brand colours and fonts). Changes apply straight away, show in a change card and
can always be undone; if the user changed the same thing since, the card asks
first. It cannot add images or logos, and figures still come only from the inputs.
Every change in a project (deck, brand, inputs, stakeholders, the Agent's) can be
undone and redone with Cmd/Ctrl+Z or the toolbar buttons, for the session; deletes
show a toast with Undo instead of asking first. Edit slides has a page rail, one
menu per page, block tools in a bar that never covers the content, and "+" or "/"
to add blocks. The Agent chat renders replies as formatted text with numbered
source chips instead of raw links, offers four starter prompts in an empty chat
(they fill the box, never send), and keeps "Use a skill" in the composer.
The Dashboard answers which deal needs Chris before his next meeting: deals
least confirmed first (there are no meeting dates without a calendar
connector), each with a readiness bar, value as a range, stakeholders covered
and one next action, plus what changed since his last visit. No CRM metrics.
Local connector work (2026-10-27, Unreleased): Composio-hosted account sign-in for
Google Calendar, Gmail, Slack and HubSpot, with server-verified status/disconnect.
Services without configured auth IDs retain labelled upload/paste fallbacks.
Live authorization is account-wide; upload permissions remain per-project. The
8 AM daily pre-meeting template can read matching primary-calendar meetings in
the next 24 hours and bounded recent Gmail threads for the selected deal. General
chat/research can read company-scoped Slack/HubSpot context. Connected notes only
produce unconfirmed input suggestions. Connect Link and tool schemas are checked against the live Composio API; a real
OAuth sign-in and a scheduled run with a connected calendar still need live checks.
This does not add calendar ordering to the Dashboard or automatic input confirmation.
Amr owns agents/APIs, connector and file ingestion, account/backend changes.
Coordinate shared navigation/data contracts rather than duplicating his work.

2026-10-27 local implementation: the Claude card creates a revocable remote MCP
URL for the account's saved projects. Claude can read deals, apply approved sourced
inputs with version checks, add approved project context, calculate and open
Live Room/deck links. Requires migration 0015 and deployment; live Claude host
compatibility is not yet verified. No automatic publishing or third-party OAuth.

## Platform
Web application: existing React/Vite frontend, Supabase persistence and server/
worker integrations. Keep localhost:5173. Vercel configuration is currently owned
by the user; do not deploy unless requested.

## Maintain this file
At each completed logical change, update Current work and any changed product
facts. Keep the opening sentence simple. Record ideas separately until approved.
See WORKING_AGREEMENT.md for the implementation and release process.
