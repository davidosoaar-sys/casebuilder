# App button commands

These are the app's task instructions, separate from `plugin/` and its Claude
slash commands. `src/agentCommands.js` defines stable IDs; `index.js` defines
trusted instructions. Provider-specific schemas and evidence validation remain
in their current service modules. Changing a button's wording does not change
its task ID. Never accept a system prompt from a browser request.

| Button/action | Command | Current path |
| --- | --- | --- |
| New project / Find company branding | DISCOVER_BRAND | `/api/brand` → `server/brand.js`; model resolves the official site, service extracts supported assets. |
| People: Find people / Find everyone | FIND_STAKEHOLDERS | `/api/research` → `server/research.js`, one request per role. |
| Person lookup search | LOOKUP_PERSON | `/api/person` → `server/personAgent.js`, identity then enrichment. |
| Suggest values | SUGGEST_INPUTS | `/api/suggest` → `server/suggest.js`; returns proposals. |
| AI framing/edit | FRAME_CASE | Contract only; no new button or worker dispatch implemented here. |
| AI website design | DESIGN_WEBSITE | Contract only; use existing design specification before adding dispatch. |
| AI one-pager organization | ORGANIZE_ONE_PAGER | Contract only; fixed one-page content template. |

The four research services load the corresponding instructions at the provider
boundary. This centralizes their task definition.

## Who pays (since v0.8.0)

`server/accountKey.js` decides, per request: the signed-in user's own Anthropic
key (saved in Settings, read server-side from Supabase Vault after the session
token is verified with Supabase), else the server's `ANTHROPIC_API_KEY` behind
the workspace access code. The browser sends its Supabase session with every
`/api/*` command (`src/apiAuth.js`). The key never reaches the browser.

The server needs `SUPABASE_SECRET_KEY` for this. Locally it goes in
`.env.server.local` (git-ignored, read only by the dev server's API routes);
never give it a `VITE_` name.

## The chat agent runs the same commands

The Hermes worker can end a reply with a `casebuilder-commands` block naming
`FIND_STAKEHOLDERS`, `SUGGEST_INPUTS`, `LOOKUP_PERSON` or `DISCOVER_BRAND`. The
worker validates it (`parse_commands`), and the app runs each command through
the same client code as the button (`src/agentRunner.js` -> the same `/api/*`
route -> the same evidence checks). Results are proposals shown as cards
(`CommandCards.jsx`); nothing is written until the user picks, and picking makes
the same write the button flow makes. The three contract-only commands are not
exposed to the agent.

## Actions that do not need a new agent call

- Add a selected person, accept a suggested input or apply chosen assets: validate
  the selected result and perform an explicit app write. Do not run research again.
- Recalculate: use the canonical model, never agent arithmetic.
- View as PDF, Slides/PPTX, website or one-pager: read a consistent saved case,
  brand and authored design snapshot and render the format-specific template.
- Export MD, autosave, duplicate/delete and theme changes: deterministic app logic.

Website and one-pager organization instructions live in `docs/agents/`. A PDF or
PPTX must keep the same logo, heading/body faces, palette, text overrides and
figures as the case. Preserve font files where supported; PPTX font names do not
ensure recipient font installation. Report unavailable asset formats rather than
substituting another company's mark. Preview must not download automatically.

No source/confidence metadata belongs in client outputs. Missing figures remain
missing; a formatting command cannot make them computable. Publishing/sharing is
a separate explicit user action, never a side effect of research or export.
