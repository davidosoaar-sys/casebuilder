# Composio connectors and pre-meeting briefs

Implemented locally on `bruno/composio`; not deployed or live-verified. No migration
is needed. Package version remains 0.17.1; this work is Unreleased.

## Environment

Set these **server-only variables on both Vercel and the VPS worker**, with the
same Composio project key and auth config IDs:

| Variable | Value |
| --- | --- |
| `COMPOSIO_API_KEY` | Your Composio project API key |
| `COMPOSIO_AUTH_GOOGLECALENDAR` | Google Calendar auth config ID |
| `COMPOSIO_AUTH_GMAIL` | Gmail auth config ID |
| `COMPOSIO_AUTH_SLACK` | Slack auth config ID |
| `COMPOSIO_AUTH_HUBSPOT` | HubSpot auth config ID |

Omit an auth config to leave that service as upload/paste only. Never prefix these
variables with `VITE_`. Create OAuth auth configs in Composio with the read scopes
needed by the tools below. Chris only uses Connect; he does not enter any keys.

**Vercel:** also set `CB_APP_URL` to the canonical app origin, for example
`https://casebuilder-three.vercel.app`. The callback is
`<CB_APP_URL>/?connector_callback=1`. Without that setting, the code uses
`VERCEL_PROJECT_PRODUCTION_URL`, then localhost:5173 for development. Existing
`SUPABASE_URL` (or `VITE_SUPABASE_URL`) and
`VITE_SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_PUBLISHABLE_KEY`) verify the bearer.
The connector endpoint does not need a saved model key or the Supabase service key.

**VPS worker:** retain existing `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and model/search
configuration. Users still need their saved model key. The worker and its shared
`prebuiltSkills.json` must be deployed together when deployment is authorized.
Composio variables are removed from the Hermes subprocess environment.

Optional worker version overrides (defaults pinned to the catalog versions read
for this implementation; confirm them against your project during the live check):

- `COMPOSIO_VERSION_GOOGLECALENDAR=20261010_00`
- `COMPOSIO_VERSION_GMAIL=20261023_00`
- `COMPOSIO_VERSION_SLACK=20261023_00`
- `COMPOSIO_VERSION_HUBSPOT=20261026_00`

For local Vite development put server variables in `.env.server.local` (untracked),
not a browser env file. The local `/api/connect` uses the production handler.

## Behavior and limits

- GET `/api/connect` returns configured toolkits and only this authenticated user's
  ACTIVE, enabled accounts matching the configured auth IDs. Credentials are never
  returned. POST `{toolkit}` starts a hosted Connect Link. POST
  `{toolkit, action: "disconnect"}` removes this user's matching active connections.
  Disconnect removes the Composio connection; it does not promise to revoke a
  provider-wide OAuth grant. Use the provider's account settings for that.
- Callback query parameters are navigation hints only; the UI re-fetches status.
  Failed/cancelled flows stay disconnected. This implementation uses the regular
  Connect Link callback, not Composio's optional callback identity-verifier mode.
- Live account authorization is account-wide. Existing per-project switches govern
  pasted/uploaded documents, independently of live authorization. Connecting does
  not toggle those permissions or mutate existing deals.
- The pre-meeting template stays daily at 8 AM in the user's schedule timezone.
  Each schedule remains attached to its selected deal. It reads the primary
  Calendar for the next 24 hours, including recurring instances, then matches
  attendees to the deal's brand website domain or the title to its company name.
  Matching is a candidate, not proof of buying-team membership. No cross-deal reads.
- Calendar is capped at five pages and 20 matching meetings. Gmail reads up to three
  threads per matching customer attendee domain (three domains maximum), sampled
  from up to 30 messages in the last 90 days and ordered by `internalDate`. This is
  a bounded recent sample, not guaranteed exhaustive or globally newest. Thread
  text is decoded; attachments are not fetched. Truncation is disclosed.
- General chat/research can also read bounded company searches from connected Slack
  and HubSpot, and domain-scoped Gmail. Only five explicitly allowed read tools are
  executable. No sends, CRM writes or calendar mutations are exposed.
- Without Calendar authorization, pre-meeting briefs retain the previous manual
  context behavior. Missing providers, empty results and read failures are distinct.
  Retrieved content is untrusted evidence. Chat input proposals from live-source
  runs are forced to `from_user=false` and use the existing suggestion flow.
- Calls have 15-second timeouts; source collection has a 75-second soft budget
  (an in-flight request may finish after that). Source text has bounded prompt sizes.

## Validation and live acceptance

Offline: `python3 -m pytest worker -q`, `npm test`, `npm run build`, and
`node scripts/review-composio.mjs`. The UI fixture uses fake API responses and no
real account or saved deals. Pytest may be run from an isolated venv if unavailable.
The UI script writes screenshots under `/tmp/composio-*`.

Before release, with real Composio credentials:

1. Confirm pinned tool schemas and read scopes in your Composio project. Connect
   each of the four toolkits from a signed-in test account, complete consent, and
   confirm the callback shows Connected. Test cancellation, expiry and reconnect.
2. Verify two CaseBuilder users cannot list, read or disconnect each other's
   connections. Disconnect each service and confirm subsequent reads stop.
3. Add a fictional deal with a known website domain, a matching primary-calendar
   event (including attendees, timezone and recurrence), and an unrelated event.
   Run its brief manually and via the daily 8 AM schedule; only the matching event
   should be used. Verify public attendee research and relevant Gmail thread text.
4. Check real Slack/HubSpot response shapes and source citations. Have test notes
   propose a case input: it must remain a suggestion until Chris confirms it.
5. Verify no-key/unconfigured fallback, revoked tokens, pagination and provider errors.

No push, tag, deployment, or live migration is part of this task.

References: [hosted authentication](https://docs.composio.dev/docs/tools-direct/authenticating-tools),
[direct execution](https://docs.composio.dev/docs/tools-direct/executing-tools),
[Calendar](https://docs.composio.dev/toolkits/googlecalendar),
[Gmail](https://docs.composio.dev/toolkits/gmail),
[Slack](https://docs.composio.dev/toolkits/slack),
[HubSpot](https://docs.composio.dev/toolkits/hubspot).

## Direct Google Slides and Canva export (v0.26.0)

Configure these server-only values on Vercel and in local .env.server.local:

- COMPOSIO_API_KEY: the existing Composio project key, with Proxy execute permission.
- COMPOSIO_AUTH_GOOGLEDRIVE: Google Drive OAuth auth config supporting https://www.googleapis.com/auth/drive.file (or an already authorized equivalent write scope). Drive creates and converts the PPTX to a native Google Slides presentation.
- COMPOSIO_AUTH_CANVA: Canva OAuth auth config supporting design:content:write for binary PPTX import and import-job status.
- CB_APP_URL: the canonical app origin; retain the existing Supabase URL/public key used to verify signed-in accounts.

In Composio, create/configure the googledrive and canva auth configs with those scopes. Set their IDs above, redeploy/restart, then have each user select Connect in the app (or the export error's Connect action) and authorize their own account. Existing read-only connections must be reauthorized for the write scopes. After authorization, return to the case and choose Export again. Never paste OAuth tokens into chat or frontend variables.

The endpoint /api/slide-export accepts only signed-in users and chooses a verified active account belonging to that user and the configured auth ID. It uses fixed provider endpoints, not browser-supplied endpoints or account IDs. PPTX bytes go directly through Composio to the destination; no public file staging. Canva jobs use short-lived owner-bound signed tickets. Large files (over about 2.8 MB) retain the downloadable PPTX route.

Once configured: Export → Google Slides uploads/converts and opens the new presentation; Export → Canva uploads, polls import completion and opens the editing link. Browser popup blocking leaves a clickable editing link. Unsupported destination fonts can still be substituted. No live import is claimed until configuration, user OAuth consent and a real file upload pass. The local Claude plugin still generates import files; this authenticated app endpoint does not grant the local plugin access to app accounts.

References: https://developers.google.com/workspace/drive/api/guides/manage-uploads ; https://www.canva.dev/docs/apps/rest-apis/reference/design-imports/create-design-import-job/ ; https://docs.composio.dev/reference/v3/api-reference/tools/postToolsExecuteProxy .
