# CaseBuilder for Claude

## Connected-case prototype (local, unreleased)

Onboarding asks Chris to choose sources, connect selected accounts, confirm scope,
review evidence/inputs and choose Live Room, one-pager or editable deck. It uses
Claude's multi-select UI only if the host provides it, with text choices otherwise;
there is no custom checkbox screen in this ZIP. Output selection is not inferred
as "all". See skills/connected-case/onboarding.md and pranav-framework.md for the
flow, eight-part framework and acceptance scorecard.

The plugin now includes a local stdio MCP server with eight tools: save reviewed official branding, inspect the input
schema, create/read a case, apply reviewed sourced inputs, calculate, build and explicitly approved website publishing.
Brand discovery uses the host’s authorized web/download tools, saves reviewed assets with provenance, then deck-design guides composition and visual checks.
The tools call the same bundled CaseBuilder model/exporters as the existing CLI.
No Anthropic API key is needed by this local bridge: Claude supplies the reasoning.

1. Build with `npm run build:plugin -- --zip`.
2. In Claude Code: `claude --plugin-dir ./plugin`, then `/mcp` to check CaseBuilder.
3. Run `/casebuilder:connect Granola` and connect through Claude's service settings.
   Granola's official endpoint is https://mcp.granola.ai/mcp. This package does not
   silently install external connectors or authenticate accounts. Gong and other
   services require their supported connector and workspace permission.
4. Try: "Build a Northwind case from these uploaded notes. Propose the inputs for
   my approval, then generate a one-pager and editable PPTX."

Claude Desktop supports a manual local MCP entry pointing `node` at the absolute
path to `plugin/scripts/mcp.mjs`; enable the plugin's skills in a compatible host.
For example, in Desktop's MCP configuration:

```json
{"mcpServers":{"casebuilder":{"command":"node","args":["C:/absolute/path/to/plugin/scripts/mcp.mjs"]}}}
```

Local cases/artifacts are stored under `~/.casebuilder` or CASEBUILDER_HOME, outside
the plugin installation. The server cannot publish or send email. The upload ZIP
does not make a local server available to cloud-only chat/Cowork: those need a
separately hosted, authenticated remote endpoint. Supabase deal sync and live
account integrations are not implemented by this prototype.

Offline test: `node --test plugin-src/mcp.test.mjs` exercises the real stdio tools,
source round-trip, write approval, path rejection and actual artifact generation.
The Claude-host/Granola sign-in smoke test still needs to be run in your account.

A local Claude plugin that turns a company name and supplied discovery material
into a sourced case file and requested business-case deliverables. It contains
commands, reusable skills, templates, design references, a deterministic model
CLI, an action planner, evidence checks and an offline fixture.

## Commands

| Command | Purpose |
| --- | --- |
| `/casebuilder:new <company>` | Create an empty case and discover official branding when web is enabled. |
| `/casebuilder:run <company> [discovery files]` | Coordinate the full input → research → calculation → output workflow. |
| `/casebuilder:assets <company or case>` | Return sourced logo, font and color findings with explicit fallbacks. |
| `/casebuilder:lookup <name, email or LinkedIn URL>` | Brief a person, even without a case; no automatic case writes. |
| `/casebuilder:stakeholders <company or case> [role]` | Return sourced candidates for the relevant stakeholder roles. |
| `/casebuilder:research ...` | Alias for stakeholder research. |
| `/casebuilder:build <case> [format]` | Build website, editable PPTX or one-pager using the case's branding/model. |
| `/casebuilder:whatif <case> <changes>` | Calculate a scenario on a copy; preserve the original case. |

A typical request is: "Build a case for Northwind using this discovery transcript."
Claude coordinates the routine steps. Ambiguous people/companies, selected case
writes and unavailable access may require a question; missing figures stay missing.

## Load and test locally

Requires Node 18+ in the environment where Claude executes commands.

```text
npm run build:plugin -- --zip
claude --plugin-dir ./plugin
```

Then invoke the commands above in Claude Code. For hosts offering custom plugin
upload, the package is `dist-plugin/casebuilder-plugin.zip`. Host capabilities
vary: hooks/subagents need a supporting host; the bundled Node CLI needs command
execution. A chat-only environment without those capabilities can produce a plan
or findings but must not claim it ran the CLI or built artifacts.

This package has not been automatically installed, uploaded or tested inside a
Claude account by the build. Follow `evaluations/scorecard.md` to run the Claude
host smoke test yourself. No publish or marketplace release is performed here.

## What is actually connected

The planner maps app-style action IDs to skills; it is not an app-to-Claude API.
Research uses tools already available to the host agent. No LinkedIn/Clay provider
is hard-coded, and naming Gong, HubSpot or Slack does not connect an account.
Enabled-source settings govern access and citations. Missing tools/auth are
reported as unavailable; disabled sources are reported as disabled.

Lookup returns proposals. Add to deal and applying suggested inputs require a
separate selection. Existing authored brand choices are preserved until selected
for replacement. All arithmetic is the bundled canonical model, never agent math.

The CLI uses local `.case.json` files. There is no automatic Supabase sync or
case-import button in the web app. The file contract remains useful for the local
plugin; do not imply that file creation also writes to an authenticated app deal.

## Framework layout

```text
plugin/
  .claude-plugin/plugin.json
  commands/                         Claude entry points
  skills/case-workflow/              coordinating instructions
  skills/brand-discovery/            official assets and fallback rules
  skills/person-brief/               quick sourced lookup
  skills/account-research/           role/candidate research
  skills/business-case/              numeric/file CLI and model references
  skills/case-deliverables/           website/deck/one-pager design references
  agents/account-researcher.md        read-only research helper
  framework/actions.json             button → action → command → skill
  framework/README.md                eight-part workflow contract
  scripts/workflow.mjs                generated planner/evidence validator
  templates/                         findings/report shapes
  examples/                          fictional offline material
  evaluations/scorecard.md            acceptance checks and host smoke test
```

Run the planner without executing research or writing a case:

```text
node plugin/scripts/workflow.mjs plan brand-assets --request plugin/examples/request.json
node plugin/scripts/workflow.mjs validate people --file plugin/examples/people-findings.json --demo
```

`--demo` permits fictional `.example` evidence for testing only. Validation checks
structure and source permissions; Claude must still verify the meaning of pages.

## Outputs and limitations

Website and one-pager HTML embed supported brand images/fonts. PPTX keeps selected
font names; recipients need those fonts installed. A PNG/JPEG logo can be embedded
in PPTX; other logo formats produce an explicit omission warning. PDF generation
requires a supported local browser. Report unverified clipping/font states rather
than declaring visual success from file existence.

The packaged design instructions describe the target quality/template. Some
proposed design-plan layouts are not consumed by the current renderer; instructions
alone do not implement new rendering features. The CLI uses existing exporters.

Publishing is separate: `CB publish <case>` is a dry run. `--yes` exposes the case
and requires a specific publish request after reviewing the concrete output.
Nothing sends customer messages or publishes automatically.

## Maintenance

Edit sources in `plugin-src/`, `src/` and `docs/agents/`, then rebuild. The CLI,
planner, model reference tables and copied deliverable references are generated.
Hand-written skills, commands, templates and fixtures remain in `plugin/`.
Workflow/content owner and technical maintainer must be named before wider team
rollout; they are not assigned by this prototype. Release versions are assigned
only on an authorized release push. Current work is recorded under Unreleased.

## Output compatibility and sharing

The plugin uses the same split-image cover as CaseBuilder. Build `google-slides` or `canva` for editable PPTX imports; upload the resulting file in that service. Font names are preserved, but availability in the destination controls editable rendering. These are not direct account uploads.

For a shareable Live Room, `/casebuilder:publish` or the local `casebuilder_publish` tool uses your host Vercel setup after explicit approval. Configure your own VERCEL_TOKEN in the host environment, or use an authenticated Vercel CLI. No credentials ship in the package. Publish returns the actual URL; changes require republishing. Without hosting configuration, you still get a portable interactive HTML file.
