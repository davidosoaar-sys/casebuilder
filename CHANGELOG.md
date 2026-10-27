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
- Then publish it on GitHub Releases: `python3 scripts/publish-releases.py`
  (creates a release for every tag that has none, notes taken from this file).

## Rolling back

- **Production broke:** Vercel dashboard → Deployments → previous good
  deployment → "Promote to Production". No code needed.
- **Code broke:** `git revert <commit>` creates a new commit that undoes it.
  Never force-push `main`.
- **See what a version looked like:** `git checkout vX.Y.Z` (read-only).

---

## Unreleased
- Live room: the site now sizes against its own container instead of the viewport, so the top bar, hero lockup, KPI row and stakeholder centre no longer overlap inside the app; partner logos lose their white boxes and the client sees the company name without the sample suffix.

## v0.19.2 (2026-10-27): Live calendar and Gmail fixes from the first real connection

- Fix: a project named like "Nike · sample" never matched a meeting titled "Nike ..." because the label suffix was part of the company name. The suffix is now ignored ("Nikelodeon" still does not match).
- Fix: Gmail threads were picked in random order on live data. Composio returns messageTimestamp, not internalDate; threads are now newest first.
- Verified live on Amr's account: Google Calendar and Gmail ACTIVE, worker read 3 days of real events and real Gmail threads through Composio. 100 worker tests pass.

## v0.19.1 (2026-10-27): Claude connector accepts current Claude clients

- Fix: adding the CaseBuilder connector in Claude failed with 400 "Not found". Claude sends MCP protocol 2025-11-25, which the server refused. The server now accepts it and no longer refuses newer protocol headers; claude.com is an allowed origin alongside claude.ai.
- Validation: 484 tests pass (MCP handler test covers 2025-11-25, a future version and the claude.ai origin); build passes.

## v0.19.0 (2026-10-27): Live connectors, Claude connector, editable brand

- Brand discovery is now a starting point, not a lock. In Deck design you can replace the logo or brand image by upload, pick another logo or image found during discovery, remove either, or hide the logo everywhere (deck, Live room, exports). Colours and fonts stay editable as before.
- The agent can change the same things from chat: hide or show the logo, swap the logo or brand image (a discovered one, a direct image link, or a public page it found with web search whose own hero image is used), set the image description and source, and rename Live room sections. The server fetches and checks every web image the same way brand discovery does (public HTTPS only, real PNG/JPEG/WebP bytes, landscape and large enough) and records where it came from. Each change shows on the change card with Undo, like other deck edits.
- The agent's reply no longer claims a case change landed on its own say-so: when a reply carries case changes, the text comes from what was actually applied, and failed or refused changes are listed on the card.
- Live room cover: no empty box over the photo when the logo is hidden, and the logo lockup and image credit fit on phone screens.
- Add Composio-hosted Google Calendar, Gmail, Slack and HubSpot connections with Supabase-authenticated status/disconnect, callback refresh, and honest upload/paste fallbacks. Live credentials stay server-side; reads are scoped to the signed-in owner.
- Pre-meeting briefs keep the daily 8 AM default and can use matching primary-calendar events over the next 24 hours plus bounded recent Gmail threads. Chat/research can read company-scoped Slack/HubSpot context; connected notes can only propose unconfirmed input changes. Verified against the live Composio API: Connect Link returns a hosted sign-in URL for all four toolkits, and the pinned tool argument names match the published schemas. A real OAuth sign-in and a scheduled run with a connected calendar are still unverified; setup and acceptance steps are in `docs/composio-setup.md`.
- Keep the live test-account token utility out of automatic offline test execution, preventing accidental sign-in/token output from `npm test`.
- Add a revocable Claude connector URL, six owner-scoped remote MCP tools,
  reviewed input updates with stale-write protection, project context notes and
  signed-in Live Room/deck links. Share input validation with the local bridge.
  Migration 0015 is included but not applied; deployment/live Claude checks remain.
- Keep the manual account-token utility out of Node's automatic test discovery
  by renaming it to `scripts/account-token.mjs`; offline tests no longer require
  live credentials or risk printing a session token.
- Validation: 463 tests pass, including handler and token-migration/RLS coverage;
  production build passes (existing chunk-size warning). Mocked browser connect/revoke
  passes at desktop/light and mobile/dark sizes without overflow.
- Web search is on by default in every agent chat.
- Merged David's plugin update (casebuilder_apply_brand, deck-design skill).

## v0.18.0 (2026-10-27): Plugin brand workflow and provider routing fixes

- Release validation: 26 targeted tests pass; application and plugin builds pass. Local Tavily live search succeeded. Signed-in Gemini search, Claude host brand research and production deployment remain unverified. Secrets are excluded from Git.

- Prevent signed-in research requests from falling back to the shared Anthropic key when server settings cannot read the selected account key. Local checks found missing Supabase service and Tavily configuration; Gemini adapter/account tests pass, but no live saved-Gemini-key request was performed.

- Explain insufficient Anthropic API credits on stakeholder search instead of the generic 400 error, without exposing raw provider details. Local fallback-key diagnostic confirmed a low-credit rejection. Validation: provider error classification test; signed-in saved-key routing not verified.

- Make the Claude connected workflow explicitly discover official branding before artifact generation, with an approved brand-write MCP tool. Add a decision-focused deck-design skill with storyboard, brand, editable-layout and visual QA rules. Uses host web/download tools; no invented automated provider connection. Validation: MCP brand/source round-trip integration test and plugin build.



## v0.17.1 (2026-10-27): Gemini keys work again, any provider's key falls back, setup shows its progress

- Gemini: Google AI Studio now issues keys that start with `AQ.`; Settings only accepted the old `AIza` keys, so a new Gemini key could not be saved. Both are accepted now (migration 0014, applied live). The buttons (Find people, Suggest values, Person lookup, brand) reach Gemini through Google's own API instead of its OpenAI-compatible endpoint, which rejects the new keys.
- Every provider (Anthropic, OpenAI, Gemini, OpenRouter): when a model refuses the key (out of quota, overloaded, not on the account), the request runs on the next model down instead of failing. Free Gemini keys get no Gemini 3.1 Pro and 20 Flash requests a day, so a free key now still answers on Flash Lite. A model that hangs is cut off after 60 seconds (buttons). A rejected key is not retried: the chat says the key was rejected and to check Settings, instead of "couldn't finish that request". The key never appears in the message.
- Project setup: brand discovery and Find people show what the agent is doing while it works (the steps, a placeholder in the shape of the result, the time taken), instead of a button that only said "Searching…".
- Tests: app 452/452, worker 87/87. Through the app on the VPS test copy: a real Gemini key saves and the agent answers on Gemini, a wrong key gets the clear message (8/8); Anthropic agent chat 16/16; brand discovery for Apple and Visa 4/4.


## v0.17.0 (2026-10-26): Connected Claude prototype, skills and deck refinements

- Release checks: 407 offline src/server/plugin tests pass; application and plugin builds pass. The unrestricted test discovery also encounters a live-account helper requiring local credentials and an existing locale-sensitive schedule assertion (pm versus PM). Real Claude sign-in and worker deployment remain unverified.

- Strengthen the four platform skills with explicit trigger/source boundaries, processing, examples, evaluation and deterministic/judgment rules shared by manual and scheduled runs. Add customer × Backstage co-branding to deck logo blocks and shared HTML brand output. Validation: skills/export tests and builds; live worker requires its normal deployment.

- Remove the separate Evidence review tab (input sources remain intact). Make deck Undo/Redo buttons visibly labeled and inherit active-page appearance for newly added pages, retaining company branding and template content. Validation: style inheritance test, history tests and production build.

- Specify Claude onboarding: explicit source selection, account connection and scoped context review, then requested output formats/audience. Add Pranav's eight-part framework mapping and host acceptance scorecard. Uses host choice UI where available, text fallback otherwise; no standalone checkbox screen. Validation: plugin packaging and MCP integration test.

- Extend the Claude plugin with a local MCP bridge for case creation, reviewed sourced inputs, canonical calculations and existing artifact exporters. Add source-connection guidance and a connected-case skill; no automatic account authorization, remote hosting or app sync. Validation: stdio workflow integration test and plugin build.

- Add Gmail to Connectors with its logo, default-off read permission and project-scoped pasted/uploaded email context. Uses the existing material-upload flow; no live inbox access or email sending. Validation: connector permission tests and production build.

## v0.16.0 (2026-10-26): The redesign: Dashboard, Skills, Scheduled, Customize, agent deck editing, undo

- Skills page redesign: Discover and Yours tabs with a sliding pill, live search, a featured Pre-meeting brief panel, two-column cards with an add / added button and Try, a detail dialog (inputs, runs as, settings, edit and delete), and new skill, edit and project pick as dialogs. Trying a skill that is not added adds it first; with one project, Try opens it directly. Scheduling moves off this page. Motion respects reduced motion. Checked with `vite build` and `npm test` (381 pass, same as before); not yet checked in a browser.
- Scheduled page redesign, a sibling of Skills: Yours and Templates tabs, task rows with the skill or prompt icon, project and type, the repeat, next run and last run with a status dot, an on / paused switch and a menu (Open chat, Run now, Edit, Delete). The card body opens Edit; Run now shows "Starting…". Five templates (a skill or a prompt plus a schedule) open the form with the first run set to the next matching time; skill templates need the skill added first. The task form is now a dialog that starts with what runs (skill, agent prompt or deep research). Empty state, skeleton loading, removal animates out. Dialog, tabs, skeleton and icons moved to a shared `ui.jsx`. No data model change. Checked with `vite build`, `npm test` (383 pass, 2 new for `nextAt` and `fmtClock`), `review-v0160-scheduled-ui.mjs` (30/30, read-only) and `review-v0160-skills-ui.mjs` (19/19).
- App-wide motion and polish, UI only. A custom select in `ui.jsx` (listbox popover with keyboard, type-ahead and a checkmark) replaces the native selects on Scheduled, Skills, Projects, Connectors, Case artifacts, the deck toolbar, stakeholder requirements and the input sheet; the waitlist role and block alignment/weight stay native. The menu's active item has a sliding pill instead of the left accent bar, in the main and project menus and when collapsed. Under 860px a top bar with the page title and a menu button opens the menu as a drawer from the left. Save status is a dot and label in the menu footer (green Saved, pulsing amber Saving, pink Not saved). Pages fade in with a 4px rise (not the full-screen Agent). Buttons get a press scale and an accent focus ring. Case artifacts keeps Copy link, the format select and Edit content, with the rest in a "..." menu (the "..." menu moved to `ui.jsx`). Left accent stripes on saved instructions, agent change notes and app quotes became panels (slide quotes unchanged). Projects, Connectors, Files and Dashboard load with skeletons; project and connector cards lift on hover and stagger in. Reduced motion respected. Review scripts use the new `scripts/lib/pick.mjs`. Checked with `vite build`, `npm test` (383 pass), `review-v0160-polish.mjs` (26/26, read-only, new), `review-v0160-scheduled-ui.mjs` (30/30) and `review-v0160-skills-ui.mjs` (19/19).
- Fix: a company site that never sets a page colour (Apple) now gets the browser default white page, not CaseBuilder's dark theme and mint accent. Brand discovery reads html, body and main backgrounds (shorthand and inline styles too), skips dark-scheme media blocks, uses a neutral `theme-color` as the page colour, and finds an accent from the link colour, a button colour or a coloured `theme-color` before falling back to the text colour. Brands that rescan pick this up; saved brands keep their colours until rescanned.
- Fix: SVG logos are cropped to what they draw (Apple's 14 x 44 frame becomes about 14 x 17), with no new dependency. Anything the code cannot measure (transforms, text, odd units) is left as it was. A single-colour logo that would vanish on the page background is recoloured to the text colour (SVG) or gets a plain field (PNG). The deck design panel shows the logo on the deck's own background.
- Pages hidden from client output are explained: PDF, Slides, One-pager and the Live room show "N pages are hidden until their numbers are filled in: ..." with up to four missing inputs and a "Fill them in" button that opens Case inputs. The preview's format picker is the shared select. Client output (Live room, PDF, PowerPoint, one-pager) no longer shows "No requirements recorded yet."; the requirements block is left out when there are none.
- "View as" is now "Export", and each format says what you get: PDF, PowerPoint (.pptx), PDF or HTML, or a shareable link. Case artifacts has the same Export button next to its format select. Checked with `vite build`, `npm test` (397 pass, 14 new), `check-brand-palette.mjs` (12 companies, no CaseBuilder colour; Nike's own #111111 is reported as a site colour), `review-v0160-export.mjs` (13/13, read-only, new), `review-v0160-polish.mjs` (26/26), `review-v0160-scheduled-ui.mjs` (30/30) and `review-v0160-skills-ui.mjs` (19/19).
- The Agent edits the case artifacts. Each turn the worker gives it an outline of the deck (pages, block ids, styles, text) and the brand, and it can reply with a `casebuilder-deck` block of up to 25 operations: set text, set a text style, add, remove or move a page, add or remove a block (no images or logos), and set brand colours (#rrggbb) or fonts (the brand panel's list plus the brand's own). The worker checks every operation against the saved deck (`parse_deck_ops`), and the app checks again and applies it once per reply (`src/agentDeckEdits.js`, same agentLog entry as input edits). The change card gets a "Changed the case" list in plain sentences, one Undo for the whole reply, and View, which opens the Live room with the Agent beside it. Undo only reverts what still holds the agent's change, so the user's later edits win. A pending edit is saved before a message is sent, so follow-ups work on the deck on screen. The split-view hints include two deck examples. The worker is not deployed. Checked with `vite build`, `npm test` (409 pass, 12 new), worker unit tests (74 pass, 12 new), `review-v0160-skills-ui.mjs` (19/19), `review-v0160-scheduled-ui.mjs` (30/30), `review-v0160-polish.mjs` (26/26) and `review-v0160-export.mjs` (13/13). `review-v0160-agent-deck.mjs` (VPS harness) and `shoot-v0160-agent-deck.mjs` (UI only, writes blocked) are written but not yet run.
- Undo and redo everywhere in a project. Every change to the deck, brand, inputs or stakeholders is a step with a short label ("Deleted page 2", "Edited text on page 1", "Agent: changed the hero title on page 1"); typing into the same block within a second is one step; up to 100 steps per project, kept in memory for the session (`src/useHistory.js`). Cmd/Ctrl+Z undoes, Cmd/Ctrl+Shift+Z and Ctrl+Y redo, except inside a text field, which keeps its own undo. Undo and redo buttons with the step in their tooltip sit in the Edit slides and Live room toolbars. Deleting a page no longer asks first: it deletes and shows a "Page deleted" toast with Undo (bottom centre, about 5 seconds, pauses on hover, Escape dismisses); the same for deleting a block, removing a stakeholder, and duplicating or moving a page. Agent changes are steps too, and the chat Undo now always undoes: if you changed the same thing since, the card asks "You edited page 2 since. Undo anyway?" with Undo anyway and Keep mine, for inputs as well as the deck. An undone change card offers Redo.
- Edit slides redesign. A rail of page thumbnails on the left (the page's heading, a Hidden pill, the current page highlighted) that you click to jump to and drag to reorder, or Alt+Up and Alt+Down; "New page" under it opens the templates. Each page has one "..." menu (page colour, text colour, hero background, add a block, duplicate, move up, move down, delete) instead of seven permanent controls; colours open brand swatches plus a hex field and the system picker. Clicking a block outlines it and puts its tools (text style, alignment, weight, colour, more formatting, duplicate, delete) in a bar under the toolbar, never over the content; a handle beside the block drags it within the page; Escape deselects. Blocks are added from a "+" line that appears between blocks, or "/" in empty text, both opening a block menu you can type to filter. Hidden pages say "Hidden from the client until N inputs are filled in. Fill them in", with "Show which" for the list; the page label is "Page 2" with a Hidden pill. Slides render as before. On a 6-page deck the pages carry 15 buttons instead of 153. Checked with `vite build`, `npm test` (420 pass, 11 new), `review-v0160-deck-editor.mjs` (40/40, read-only with every database write blocked, new), `review-v0160-skills-ui.mjs` (19/19), `review-v0160-scheduled-ui.mjs` (30/30), `review-v0160-polish.mjs` (26/26, its toolbar check now expects the undo and redo buttons) and `review-v0160-export.mjs` (13/13).
- Agent chat polish. Agent replies render Markdown (headings, lists, bold, code, links that open in a new tab). Bare URLs and "[1] https://..." source lists become numbered source chips ("1 en.wikipedia.org", full title or URL in a tooltip on hover and keyboard focus) plus a wrapping row of two-line source chips; Deep research sources use the same chips (`extractSources` in `src/research.js`). Your messages sit on the right in a filled bubble; the agent's sit on the left without a bubble, at reading width, with a small mark (the mascot's screen) at the start of each turn. Copy, the time and the model show on hover as icon buttons; edit is on your last message only. "Use a skill" is now in the composer's tool row (shared `Menu`, which gained a custom trigger and left alignment). The mascot sits above the composer card instead of over its edge. With one chat or none, the full page drops the empty chat rail and keeps the list in the header menu (with a count); with two or more, the rail shows title and time, a sliding pill on the open chat and a "..." menu for Rename and Delete. New messages fade in with a 6px rise, and the one you send rises from the composer. While the agent works, the current step shimmers beside three softly pulsing dots. The tool trace opens and closes with a height animation. The list follows new messages only when you are near the bottom; otherwise a "New message" pill jumps down. Reduced motion is respected. The empty Agent shows "What do you want to work on for <company>?" and four starter chips that fill the box without sending, replacing the split-view example list. Change cards are a quiet panel with small Undo, Redo and View. Under 860px the full-page chat fits below the top bar, so the composer stays on screen; under 560px the composer tools are icon-only. Checked with `vite build`, `npm test` (424 pass, 4 new), `review-v0160-chat-ui.mjs` (53/53, read-only with every database write blocked and no message sent, new), and the skills, scheduled, polish, export and deck-editor reviews.
- Dashboard redesign: it now answers "which deal needs me before my next meeting?". Needs attention lists up to five deals, least confirmed first, each with one stacked readiness bar (confirmed, assumption, suggestion, empty; counts on hover or keyboard focus), its yearly value as a range ("$1.4M to $8.3M a year", or "Not enough inputs to value yet"), stakeholders covered ("2 of 4 roles have a person. No CTO yet") and one next action: Review N suggestions, Fill N inputs or Confirm N inputs (open Case inputs), Find the <role> (opens the Agent in a new chat with "Find the <role> at <company>" in the box, not sent) or Rescan branding (when the brand is still the app default). Clicking the row opens the deal. Since you last looked shows up to six items (suggestions waiting, new files, agent changes to the case that were not undone) with relative times, or "Nothing new since <time>"; "last looked" is stored per account in this browser and moves forward when you leave the Dashboard. Other deals follow as compact rows. The header keeps one pipeline line ("3 deals, $X to $Y a year in total"). The stat tiles and the agent job log are gone. The value range re-runs the deck's model with every assumed or suggested number moved 20% in whichever direction lowers or raises the total; confirmed inputs stay fixed (`valueRange` in `src/valueModel.js`; the other helpers are in `src/dashboard.js`). Rows stagger in, bars grow from the left once, skeletons show while deals load, reduced motion is respected. Checked with `vite build`, `npm test` (439 pass, 15 new), `review-v0160-dashboard.mjs` (all pass, read-only with every database write blocked; two deals get fixture values in the browser only so every action runs, new), and the skills (19), scheduled (30), polish (26), export (13), agent-deck shoot (11), deck-editor, chat-ui (53) and searchpick (10) reviews, all passing.
- Customize: Skills and Connectors now live under one sidebar item, like Claude's Customize page. One title, a Skills / Connectors section nav (mint underline, arrow keys), then each page's own controls. Customize stays lit on either tab; nothing about how skills or connectors work changed.
- Agent formatting: chat replies render headings and sub-headings, dividers, quotes, tables (scroll sideways on a phone) and code blocks, and keep single line breaks (a haiku or an address no longer runs into one line). The agent is told it can use them for longer answers and to keep short answers plain. Deep research answers get the same, without the line-break change.
- Fix: a reply to a chat deleted while the agent was working is dropped. Before, it was posted into another chat on the same project and its edits were still applied.
- Fixes from a full Codex review of this release: a toast's Undo only acts on its own project and latest step; an agent edit never overwrites a value you changed since it read the deck, and Redo asks first if you edited since the Undo; the agent cannot type figures (money, percentages, counts) onto slides; dragging blocks never drops one the agent just added; a crafted logo PNG can no longer exhaust server memory.
- Tests: app 445/445, worker 76/76. Every review script for this release passes on localhost, and the agent ones on the VPS test copy running the new worker (agent chat 16/16, chat sees research 5/5, formatting 8/8, deck edits 19/19).

## v0.15.2 (2026-10-26): Forgot password works again

- "Forgot password?" no longer crashes to a blank page. The reset screen referred to a value
  that only exists on the sign-up screen (broken since the waitlist change in v0.11.0).
- Tests: app 381/381. Checked in the browser: the reset screen opens with no errors.

## v0.15.1 (2026-10-26): Scheduled and Skills move to the main menu

- Scheduled and Skills are in the main menu (Dashboard, Projects, Scheduled, Skills,
  Connectors), not inside a project.
- Skills are now the account's: one library for every project. "Use" and "Schedule" ask
  which project. Migration 0013 (no skills existed yet, nothing moved).
- Scheduled lists every task across your projects, each card naming its project. A new
  task starts by picking the project; its results still land in a chat in that project.
- Tests: app 381/381, database 35/35, worker 62/62. Browser reviews: skills 19/19,
  scheduled 18/18, with real agent runs.

## v0.15.0 (2026-10-26): any AI provider, chat history, Deep research in chat, scheduled tasks, skills

- **Bring your own key, any provider.** Settings takes a key for Anthropic, OpenAI, Google
  Gemini or OpenRouter. With more than one, you choose which the agent uses. Every AI
  feature (find people, suggest values, person lookup, brand, chat, research) follows it,
  and the chat's model picker names that provider's models (fast / balanced / best).
  Migration 0009. Not yet tried with a real OpenAI, Gemini or OpenRouter key.
- **Chat history.** A project has a list of chats, like Claude: new chat, rename, delete,
  reopen. Full page shows the list on the left, split screen in a dropdown. Existing
  messages became one "Earlier chat" per project. The agent sees the last 40 messages of
  the current chat (was 8). The list pages 50 at a time ("Show older chats"). Migration 0010.
- **Deep research is a chat mode.** A Deep research switch in the chat box: the agent
  searches widely, reads pages in full and answers with numbered sources, and follow-ups
  work because it sees the chat. The separate Research page is gone; its menu slot is now
  Person lookup.
- **Scheduled tasks.** A Scheduled page per project: an agent prompt, a Deep research
  question or a skill on a repeat (1 hour to 31 days). Each task has its own chat where every
  run lands, labelled "Scheduled run". Run now, pause, edit, delete. 20 per account.
  Migration 0011.
- **Skill library.** A Skills page per project with 4 built-in skills (Pre-meeting brief,
  Account news digest, Stakeholder map, Objection prep), each switchable and configurable,
  plus your own (name + instructions). Use one from the chat ("Use a skill") or schedule
  it. Migration 0012.
- Security: the worker only posts into a chat, or runs a custom skill, that belongs to the
  job's owner and project. Research no longer reads deck instructions.
- Every release is now also published on GitHub Releases.
- Tests: app 380/380, database 34/34, worker 62/62. Browser reviews: keys 9/9, chats 13/13,
  older chats 5/5, research 15/15, scheduled 17/17, skills 16/16, each with real agent runs.

## v0.14.3 (2026-10-26): approval emails, admin view switch, tidier sidebar and connectors

- Approving someone on the Waitlist now emails them a confirmation from the CaseBuilder
  Gmail, naming the exact address to sign up with. One email per approval; each approved
  row shows Email queued / sent / failed. Needs migration 0008 (applied) and the worker
  redeployed with the Gmail app password.
- Admins get an Admin / Regular user switch in Settings. Regular user hides admin-only
  pages (Waitlist) to see the app as everyone else does; the choice is remembered.
- Connectors are listed alphabetically, and Claude shows its real logo.
- The version number moved under Settings in the bottom-left corner.
- Tests 358/358; shell review script 10/10 (scripts/review-v0143-shell.mjs).

## v0.14.2 (2026-10-26): headshots on found people now actually show (fix)

- Released as v0.15.0 by mistake and retagged v0.14.2: this fixes a feature that was already meant to work, it is not a new one.

- People search now adds headshots: when the agent returns no photo, a fallback searches "<name> <company>" and takes a portrait from a public page that names both (exact or suffixed alt text, a file named after the person, or the share image on the person's own page). Skips LinkedIn, social and podcast sites, group shots, signatures and icons; falls back to initials. Checks the pages the agent cited first, so it works without a search key (Tavily widens it). Spot check: 7 of 8 real execs got a correct headshot, checked by eye. 356/356 tests.

## v0.14.1 (2026-10-26): clear error when the server cannot read saved API keys

- Fixed: a signed-in user with an API key saved in Settings was asked for the workspace
  access code when the deployment had no `SUPABASE_SECRET_KEY`. The server could not
  read the saved key, treated the user as signed out and fell back to the code prompt.
  It now says the server is missing `SUPABASE_SECRET_KEY` (Find people, agent commands,
  person lookup). Signed-out users still get the access-code prompt. Tests 350/350.

## v0.14.0 (2026-10-26): stakeholder briefs, brand lookup fixed, the Agent sees project research

- Fixed: finding a company's branding failed for many names (Apple, Visa and others)
  with an API error about a "thinking block". The search loop removed the search tool
  after the last allowed search, and the model's thinking is bound to the tool list, so
  the API rejected the next turn. The tool list now stays the same on every turn.
- Brand lookup finds more official sites: a homepage proposed from evidence (e.g. a
  Wikipedia infobox) is accepted when the page itself names the company, or when it is
  plainly the company's own domain and the site blocks automated requests; otherwise one
  plain search is tried, keeping only the company's own domains (never a subdomain of a
  site builder). Large homepages (Netflix) and sites that refuse non-browser requests
  (Uber) now load.
- The Agent sees the project's research: each chat reads the last six finished research
  runs on the project, with their sources, and lists "Read earlier research" in Used N
  tools. This is the first step of the decision to make research a chat mode with one
  shared history; the merged chat/research history list is not built yet.
- Stakeholder briefs: every stakeholder on the map has a "Brief" link that opens their
  own page. The agent reads the project's files and connector material (no web search)
  and writes a synthesis about that one person: where they stand (Champion to Blocker),
  what they care about, their concerns, requirements and open asks as status chips
  (Actioned / In progress / Waiting for approval / Open, with who it is on), decisions
  with dates, the next step before the next conversation, and their own words. It is
  not a copy of the transcripts. Every quote is checked word for word against the
  material by the worker and dropped if it is not there; a named person is only shown
  if the material names them. Project instructions are left out of briefs (they are
  about decks). Refresh brief re-runs it; the latest is remembered.
  New job kind stakeholder_brief (migration 0007, applied live).

 scripts/review-stakeholder-brief.mjs on
localhost against the real worker: 14/14 (fictional Spotify call + Slack thread; the
Finance brief named Priya Raman, the 12-month payback bar and the security review from
the thread; status chips; quotes verbatim; no 80-character run copied outside quotes;
saved brief shown on reopen).

Checks: 349 app tests and 44 worker tests pass. On localhost with the test account and
the real worker: review-new-project-brand.mjs (New project -> branding finds the logo for
Apple, Visa, Netflix); check-brand-names.mjs through the server code, 16 of 17 companies
found (Tesla blocks automated requests and asks for its brand page; Visa can resolve to a
regional Visa site); review-chat-sees-research.mjs 4/4; review-stakeholder-brief.mjs 14/14;
review-nav-instructions.mjs 19/19; review-connectors.mjs 9/9; review-chat-attach.mjs 4/4;
review-new-project-dialog.mjs 3/3.

## v0.13.0 (2026-10-25): Live Room templates and stakeholder requirements

- Lead Case Artifacts with the Live Room; preserve company fonts, logo and colors across formats. Add optional sourced company imagery and refreshed website/one-pager layouts.
- Add trackable stakeholder requirements and private preparation notes. Client outputs omit internal strategy and source metadata.
- Add private Evidence review and optional customer workflow context. Preserve equations, saved inputs and authored slides.
- Refresh the Nike sample once with official imagery and illustrative requirement statuses, preserving existing edits.
- Show the installed version in the sidebar; document product scope, design and shared working/release instructions.
- Merge Amr’s v0.12.0 research, connector and upload improvements. Shared Live Room links still require republishing after edits.
- Validation: app/server tests, production and plugin builds; prior six-brand desktop/mobile export checks. See product storyboard and Chris demo guide for workflow.

## v0.12.0 (2026-10-25): Case inputs, Case artifacts and Live room, Research in the project, new connectors

- Project menu renamed from Ali's feedback: "Input sheet" is now **Case inputs**;
  "Deck" is now **Case artifacts** and opens on the **Live room** (was "Website"),
  with "Edit deck" to reach the slides.
- Research moved into the project: it sits in the project menu, runs for that
  project only (its files and connectors), and lists only that project's research.
  The global Research tab is gone.
- Files: saved instructions show as text with an Edit button instead of an open
  box. Edit opens the box with Cancel and Save changes.
- The separate Person lookup tab is gone: it lives in Research, under the Person toggle.
- Fixed: cancelling "New project" on the Dashboard made the New project dialog reopen
  every time Projects was opened, covering the project you clicked.
- Fixed: chat attachments only took text files. They now read PDF, Word, PowerPoint
  and Excel with the same reader as Files.
- Connectors: added Granola (meeting notes), Google Sheets and Excel (finance models),
  Figma (design specs) and Canva (decks), with their logos. Like the others they take
  uploaded or pasted material for now; every connector upload now reads PDF and
  Office files too. With every connection off, a gap says so in one line instead of
  listing all eleven.

Checks: 334 app tests pass. On localhost with the test account:
scripts/review-nav-instructions.mjs 19/19 (menu names and order, Live room default,
Research inside the project with its Person toggle, instructions saved view, edit,
cancel, save changes, reload); scripts/review-new-project-dialog.mjs 3/3;
scripts/review-chat-attach.mjs 4/4 (real agent answered from an attached PDF and
Excel file with Search off); scripts/review-connectors.mjs 9/9 (all 11 logos load,
an Excel file uploads into the Excel connector as spreadsheet text).

## v0.11.0 (2026-10-25): Project Files and the waitlist

- Project Files: each project has a Files page, like a Claude Project's files.
  Instructions (how to work on this account) plus any files: no file types to pick;
  the user says what a file is for when they ask ("check my deck against the one I
  attached"). Reads PDF, Word, PowerPoint (with speaker notes), Excel and text in the browser;
  each file can be switched off or previewed as the text the agent
  reads. Every chat and research run for the project reads the enabled files and
  lists each one in "Used N tools". New table project_files (migration 0004),
  owner-only under RLS, 50 files / 2M characters per project.

- Waitlist: new people join a waitlist instead of creating an account (?waitlist,
  with an optional ?ref= tag to see where they came from). The form asks name,
  email and a role from a short list (Account Executive, Sales Engineer, Sales
  leader, Founder, Consultant, Student, Other). An approved email goes straight
  from the form to choosing a password; anyone else sees "You're on the list";
  an existing account is sent to Sign in. Only approved emails can create an
  account, enforced in the database (migrations 0005, 0006); existing accounts
  were carried over. Admins get a Waitlist page: counts, a shareable link with a
  source tag, Approve per person, and "Let someone in" to approve an email before
  they join. Approving sends no email; the team tells the person.
  Team-created accounts (worker/create_account.py) are approved first.
  The "You're on the list" message says "a few at a time while we test it".

Checks: 334 app tests (329 pass; the 5 brand/people research failures also fail on v0.10.0), 34 worker tests, build OK. scripts/review-waitlist.mjs on the
live database: 16/16 (form fields, on the list, refused before approval, admin
pre-approves, approved email goes straight to password and the email code, existing
account sent to Sign in, non-admin cannot see, read or approve, cleanup).
scripts/review-files.mjs on the
real worker: 15/15 (four real files uploaded and read; agent answered three facts
that exist only in the PDF, Word and Excel files, with Search off, and followed
the saved instructions).

## v0.10.0 (2026-10-25): verified brand assets and sourced agent research

- Added official brand/media resource discovery and bounded agent asset selection. Rejects main-logo favicons, invalid/tiny images and unsafe/empty SVGs. Onboarding and chat check logo decoding, full-mark visibility, published variants and embedded font loading automatically; failed marks fall back to the company name. Genuine company ambiguity offers sourced choices.
- Preserved company heading/body fonts and original logo artwork across previews/exports. Fixed Adidas base paths/spelling, compressed public CSS, video/icon-font selection, regular-versus-italic font files, logo sizing and light/dark logo legibility.
- Expanded the four live research-command prompts with triggers, source limits, processing, examples, evaluation and judgment criteria. Added inspectable prompt documentation and an offline evaluation suite. Future framing/website/one-pager generation contracts remain inactive.
- Added source-bound professional portraits, published emails, LinkedIn and public links to people lookup, Find people and chat cards. Selected media and its evidence survive case storage. Live profile retrieval quality has not been evaluated for this revision.
- Restricted input suggestions to blank fields and prevented late responses from replacing manually entered values. Preserved existing financial equations and client content.
- Includes Amr’s v0.9.1/v0.9.2 Tavily search, company icons, deck color fixes, Research page, live tool traces and search/connector controls. Preserves per-URL evidence across both search backends.
- Validation: 322 app/server tests, 30 worker tests, 11 offline command evaluations, production build and plugin packaging pass. Official assets from Microsoft, Adidas, Shopify, Spotify, Nike and Lovable passed 24 format previews and six mobile website checks without overflow or page errors.
- Known limits: Microsoft’s font files were unavailable; sourced family names and the fallback warning are preserved. A live model-selection probe hit insufficient credit on the local Anthropic key; live name-to-domain/model-selection accuracy remains unverified. Local Settings-key access still needs its server configuration. Automated display checks do not certify semantic identity or overall design quality.

## v0.9.2 (2026-10-25): Research page, "Used N tools" trace, search toggle

- Research: the main menu's "Person lookup" is now "Research". Ask any question,
  optionally for one project; the account's own agent researches it (Tavily search
  and full-page reads, plus connectors switched on for that project) and answers
  with inline numbered citations and a sources list. A cited link the agent's
  searches never returned is removed and the count is shown. Past research is
  listed and reopens after reload. A "Person" tab runs the existing person lookup.
  Inside a project, Person lookup stays in the project menu.
- "Used N tools" on chat replies and research answers: a timeline of every search
  (query and results), page read and connector, read from the agent's own session
  log on the worker, not from the model's account. Steps appear live while it works.
- Chat search toggle: with Search on the agent is told to search for anything that
  can change; with Search off it has no search tools and the reply is marked
  "search off". Connector material switched on for a deal is now given to the chat
  agent too; switched-off connectors are never read.

Checks: 274 app tests (5 new), 30 worker tests (13 new), build OK.
`scripts/review-research.mjs` against the real worker: 15/15 (research answer with
Tavily trace and sources, live steps, reopen after reload, chat trace with Search
on, no web tools with Search off, mobile width, no page or Supabase errors).

## v0.9.1 (2026-10-25): research on Tavily, brand icon, deck colour fixes

- Research (Find people, Suggest values, Person lookup, brand website lookup) now
  searches through Tavily via our own search loop (server/agentSearch.js), not
  Anthropic's built-in search. Every source is still checked against what the
  search returned. With no search key configured it falls back to Anthropic
  search and reports search: "anthropic".
- The chat agent's Hermes is pinned to Tavily (web.backend: tavily) per account.
- Brand discovery also finds the square icon (no wordmark) from the site's icon
  links; project cards use it. Brand settings can upload/remove the icon. Deck
  title logos are sized by height so wide wordmarks are readable.
- Deck: the objection box used the app's dark background and was unreadable on
  light decks until hovered; it now uses the deck colours. The title page no
  longer fades to a different grey; cards use a shade of the page colour.
- Deploy needs TAVILY_API_KEY and SUPABASE_SECRET_KEY in Vercel (server-only).

Checks: 269 app tests, 18 worker tests, build OK; end-to-end agent commands
ALL PASS with Tavily; one Find people run made 1 Tavily + 2 Anthropic requests.

## v0.9.0 (2026-10-25)

- Added company brand review after stakeholder setup, with logo/palette/type preview, correction controls and a deliberate continue-without-logo option. Discovered logos also appear on the setup map.
- Brand discovery prioritizes official home-link images, inline SVGs and Organization metadata over customer/product logos. Supports official brand-page fallback for blocked homepages and separates default palette tokens from dark overrides. Font selection follows the actual heading family; unavailable font files are disclosed.
- Removed misleading Backstage-logo fallbacks from the client deck and PDF/slides/one-pager rendering. Project cards prefer the saved brand logo. Company colors stay scoped to the slide so editing controls remain readable with light-brand decks.
- Brand scans authenticate signed-in sessions server-side on Vercel. Configured production/preview Supabase and server-only research settings with explicit approval; Git deployments use main for production, with a pinned Vite build/output configuration.
- Validation: live official-asset discovery tested for Microsoft, Lovable and Shopify; isolated brand/deck previews checked at desktop/mobile. Microsoft’s font name is preserved but its font download is unavailable; fallback is disclosed. All 262 tests, production build and plugin packaging pass after merging Amr’s v0.8.0 account-key and chat-command release.

- 2026-10-25: Moved Suggest values into a single top action and removed per-field Suggest/Refresh controls. Replaced uneven group columns with stacked sections and compact field rows; collapsed the long missing-input breakdown. Source disclosures, editable inputs and model calculations are preserved. Validation: 249 tests and production build pass; isolated desktop/mobile previews have one suggestion action and no horizontal overflow.

## v0.8.0 (2026-10-25): AI buttons use your key; the agent runs the research commands

Work in progress: this release works end to end for the main path but needs
fixes and bug patches. Known gaps are listed below.

- The AI buttons (Find people, Find everyone, Suggest values, Person lookup,
  brand discovery) use the signed-in user's own Anthropic key from Settings.
  The server checks the session with Supabase and reads the key server-side;
  it never reaches the browser. Without a session or saved key it falls back
  to the server's ANTHROPIC_API_KEY behind the access code, as before.
- The chat agent can run Find people, Suggest values, Person lookup and Find
  branding. The app runs them through the same code as the buttons, with the
  same evidence checks. Results come back as cards; nothing is written to the
  deal until you pick (Add to deal / Use / Use branding).
- The agent describes what it is searching for in plain words, never command
  names or keys.
- Setup: the server needs SUPABASE_SECRET_KEY. Locally it goes in
  .env.server.local (git-ignored). See README.

Checks: 255 app tests, 16 worker tests, build OK. Real end-to-end test
scripts/review-agent-commands.mjs with no server key configured: button route
refused without a session and ran on the account key with one; in chat, "Find
the VP of Engineering" ran Find people, returned a sourced person, Add to deal
saved them in Supabase. ALL PASS. The Find people button in the app ran
without the "not connected" notice.

Known gaps, to fix next:
- Suggest values, Person lookup and Find branding from chat are built on the
  same path but not tested end to end.
- Brand discovery fails on sites that block scanners (e.g. lovable.dev, 403).
- Commands run in the browser: closing the tab mid-run stops them; an old
  reply's research is not re-run on reload (a "Run it now" link is shown).
- David's local copy needs SUPABASE_SECRET_KEY in .env.server.local for the
  buttons to use saved keys; otherwise his own ANTHROPIC_API_KEY.
- The app is still not deployed; the deployed server will need
  SUPABASE_SECRET_KEY in its settings.

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
