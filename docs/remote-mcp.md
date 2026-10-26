# Remote Claude connector (local implementation, not deployed)

Connectors → Connect to Claude creates a 256-bit secret URL, displayed only in
that component's memory. Copy it into Claude → Settings → Connectors → Add custom
connector. Revoke remains available after reloading. Each token grants access to
all saved deals owned by that account, independently of per-project upload permissions.
Treat the URL as a password; avoid logging query strings at the hosting/proxy layer.
Only its SHA-256 hash is saved in Supabase. No third-party connector is authorized
by this flow. Claude's own Gmail/Granola access remains separately authorized.

## Installation still required

- Apply exactly `supabase/migrations/0015_mcp_tokens.sql` through the normal release
  process. It creates the owner-only token table and grants token creation and
  revocation directly under RLS; no new RPC is needed.
- Deploy `api/mcp.js` with `SUPABASE_SECRET_KEY`, `SUPABASE_URL` (or
  `VITE_SUPABASE_URL`), and `APP_URL` set to the app's HTTPS origin.
  `VITE_APP_URL` or Vercel's production URL is a fallback for app links.
- The browser uses its existing Supabase session and publishable key.
- `vercel.json` gives the function 60 seconds. This is a stateless JSON-response
  Streamable HTTP endpoint; GET returns 405. It supports the three protocol
  versions requested in the brief. It does not provide the legacy SSE transport.
  Reference: https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2025-03-26/basic/transports.mdx

## Tools and saving

Six tools list/read deals, apply reviewed inputs, add approved context, calculate
using `src/model.js`, and return authenticated app links. `caseId` is the saved
deal ID. Read returns `version`; apply requires it as `expectedVersion` alongside
`approved:true`. Input state and origin are mandatory. Unknown keys are rejected.
The local and remote bridges share `plugin/scripts/reviewed-inputs.mjs`.

Remote saves use a single owner/id/version-filtered PATCH. The existing database
version trigger advances the version; zero updated rows means a conflict. This
preserves the app's optimistic-concurrency contract without invoking its
`save_deal` RPC with an unrestricted service role. Existing full deal data is
preserved. Context notes use the existing `project_files` representation and
limits. Read returns enabled project files only. Artifact links open the saved
deal in the app; they do not publish or update a public snapshot. Reload an
already-open app project to see remote changes; pending stale app saves conflict.

## Validation and live checklist

Offline: handler tests with fake Supabase fetch cover hashing, authentication,
protocol messages, owner scoping, approval/source validation, full-record writes,
stale conflicts and project context. PGlite runs the exact migration and checks
RLS, hash constraints, uniqueness and limited update privileges. The browser card
is checked with a mocked Supabase client, including connect/revoke and responsive
light/dark rendering.

After an authorized migration/deployment, check Claude custom-connector discovery
and tool calls from claude.ai, Desktop and Code. Use an isolated fictional deal:
read, propose/review/apply, race a stale version, add a sourced note, calculate,
and follow both links after signing in. Verify account isolation and revoke the
URL, then confirm it returns 401. These live checks have not been performed.
