# CaseBuilder

A business case builder for selling **Spotify Portal for Backstage**. You enter a
customer's own numbers, it turns them into an ROI case framed for each person who
has to approve the deal, finds who holds those roles, and exports the result as a
deck, a PowerPoint, a one-pager and an interactive website.

It comes in two forms that share one value model and one case-file format:

| | What it is | Best for |
|---|---|---|
| **The app** (this repo's web app) | A stand-alone web app. Projects, a draggable stakeholder map, a block-based deck editor, exports. | Working a case visually, editing the deck, presenting |
| **The Claude plugin** (`plugin/`) | A plugin for Claude Code and Claude Cowork. Claude runs the conversation, researches people itself, and builds the exports. | Building a case from a discovery call, no API key needed |

A case started in one can be finished in the other: both read and write the same
`.case.json` file.

## The app

```bash
npm install        # run again after every pull that changes package.json
cp .env.example .env.local   # then fill in VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
# optional, so the AI buttons use each user's own saved key (ask Amr, never commit):
#   echo "SUPABASE_SECRET_KEY=..." > .env.server.local
npm run dev        # http://localhost:5173 (fails instead of switching ports if it is taken)
npm run build
```

Node 18 or newer. You sign in with a CaseBuilder account; deals are saved to
Supabase per account (see `docs/backend.md`).

If Vite says `Failed to resolve import "@supabase/supabase-js"` (or any other
package) after a pull, run `npm install`: the pull added a dependency your
`node_modules` does not have yet.

### Quick person lookup

Click **Person lookup** in the sidebar to open its dedicated page, including when no deal is open. Enter
a name, `Name at Company`, an email or a LinkedIn profile; paste multiple people
on separate lines or separate them with semicolons. An open deal supplies the
default company. Identity streams first, followed by public context. Repeated
lookups use a session cache; changing deals or connector permissions invalidates
the visible results. Unsourced claims are discarded.

**Add to this deal** saves a named stakeholder and an explicitly inferred role
mapping. Existing role framings are reused; missing ones are added. Numerical
findings require a separate **Review suggested input** and **Apply suggestion**
step. Searches never write directly to a deal.

The **Demo fixture** checkbox uses a fixed fictional result, without an API call.
Live search needs the existing `ANTHROPIC_API_KEY` server configuration (and the
workspace access code on Vercel). Connector toggles control uploaded material;
only enabled material with source links can be used. These are the app's existing
uploaded exports, not live OAuth connections.

Provider/search implementation lives in `server/personAgent.js`. The UI calls
`src/personAgent.js`, which reads NDJSON from `POST /api/person`. Each claim is
`{ value, sourceUrl, sourceType }`; public signals use `claim` in place of `value`.
Snapshots contain identity, role match, reporting lines, public signals, likely
priorities, suggested inputs, ambiguity candidates, and sources used/skipped.
`src/personAgentStub.js` implements the same streaming interface for UI demos.

- **Projects.** Start a project with just the company name. A new project walks
  through a stakeholder map, then people, then lands on its Details.
- **Details.** Inputs (each one an *assumption* until the customer confirms it,
  with a live "case confidence"), the stakeholder map (drag people, add and
  remove, "Tidy up"), and People.
- **People.** An AI agent searches the public web for who holds each role and
  returns names, titles, public emails, LinkedIn profiles and a short professional
  bio, each with its sources. Anything it cannot support is left blank. This needs
  an API key; see below.
- **Deck.** Every page is a list of blocks you can add, delete, reorder and
  restyle (text, quote, columns, image, key numbers, value-driver chart,
  self-hosting comparison, assumptions, stakeholder brief). Click any text to edit
  it. Text can use tokens like `{company}` and `{headline}` that fill in per
  stakeholder.
- **View as.** PDF opens a paginated A4 landscape layout; Slides opens a presenter
  with keyboard navigation and fullscreen; One-pager opens an A4 executive brief;
  Website opens an interactive scrolling page. Switching views never downloads a
  file or opens a print dialog. Each view has a separate download action. PDF
  downloads use the browser's Save as PDF dialog; Slides downloads an editable
  PowerPoint only when **Download PPTX** is clicked.
- **Website.** Viewers can switch stakeholder perspectives, navigate sections,
  and adjust scenario sliders to watch figures update. **Edit content** enables
  editing that saves into the deck. **Copy link** publishes to Vercel. The site
  can also be downloaded as an offline HTML file or a Vercel project.
- **Markdown.** Use **Export MD file** on the Input sheet to carry a deal into
  another assistant, including its inputs, arithmetic and sources.

### Copy link (publishing the website)

**Copy link** creates one Vercel project for the case and deploys the page to
production at `https://bc-<company>-<random>.vercel.app` (long, unlisted, and the
page asks search engines not to index it). It waits until the site is ready and
checks that the address is really public; if Vercel Authentication is turning
visitors away it says so and how to fix it. **A case keeps the same link**: edit
the website, press Copy link again, and the link you already sent shows the new
version. If nothing changed since the last publish it just copies the link.

The link is not locked: anyone who has it can read the numbers. Don't send it
until the case is ready for the customer to see.

Needs `VERCEL_TOKEN` (create one at vercel.com/account/tokens; add `VERCEL_TEAM_ID`
if the token belongs to a team). **A deployed copy of the app will not publish
unless `RESEARCH_ACCESS_CODE` is also set**, so strangers cannot put pages on your
account. Free plan limits to know: 100 deployments a day and 200 projects; delete a
case's project in the Vercel dashboard to take its site down.

### The AI features need keys

The people-finder runs in a server function (`api/research.js`) and publishing in
`api/publish.js`; the dev server serves both. Copy `.env.example` to `.env.local`:

```
ANTHROPIC_API_KEY=...            # people-finder
VERCEL_TOKEN=...                 # Publish to Vercel
VERCEL_TEAM_ID=...               # only if the token belongs to a team
RESEARCH_ACCESS_CODE=...         # REQUIRED on any deployed copy; protects both
RESEARCH_MODEL=claude-sonnet-5-5 # optional; defaults to claude-opus-5-5
```

On Vercel add the same variables under Project Settings, then redeploy. Every
person the agent returns must cite a source it actually retrieved; unsourced
people, guessed emails and invented LinkedIn URLs are dropped on the server.

## The Claude plugin

The plugin keeps the value model and the exports identical to the app, but Claude
does the work: it asks for inputs in small groups, marks a number *confirmed* only
when the customer said it, runs the model (it never does the arithmetic itself),
researches people with its own web search, and builds the files.

**Claude Code**

```
/plugin marketplace add davidosoaar-sys/casebuilder
/plugin install casebuilder --marketplace davidosoaar-sys/casebuilder
```

or, from a local checkout: `claude --plugin-dir ./plugin`.

**Claude Cowork / Claude desktop:** run `npm run build:plugin -- --zip`, then
*Customize > Plugins > Add > Upload plugin* and choose `dist-plugin/casebuilder-plugin.zip`.

To share the interactive website as a link, ask Claude to publish it. It builds a dry run first and **will not publish until you say yes**, asking whether the case is ready for the customer to see; it uses `VERCEL_TOKEN`, or the Vercel CLI if you are logged in (`vercel login`).

Then try `/casebuilder:new Northwind Retail`. Commands: `new`, `research`,
`build`, `whatif`. The same workflow also triggers from plain requests like
"build a business case for Acme". Needs **Node.js 18+** on the machine that runs
it. See [plugin/README.md](plugin/README.md).

After changing the value model, deck model or exporters, rebuild the plugin so it
ships the same code: `npm run build:plugin` (it regenerates the bundled script
and the reference docs from `src/valueModel.js`).

## How the numbers work

Every figure on the deck is plain arithmetic in [src/model.js](src/model.js):
`computeModel(inputs)` is a pure function, and the deck, exports and website only
render what it returns. Under every figure the equation is printed with the
current values substituted, for example `(3 - 2) * 500 * 48 * $100`. Division by
zero gives 0, value figures never go below 0, and nothing is ever NaN or Infinity
(the figure carries a flag saying why).

Inputs come in *today / with Portal* pairs, so each saving is a difference the
customer can check. Nothing is pre-filled. An empty input is **not** zero: a figure
that needs it is incomplete, is left out of the deck (never a $0 bar) and is left
out of the total, which adds only the figures that can be computed.

**Every number carries a source** (`input`, `assumption` or `suggestion`, plus its
origin). Only inputs count toward confidence. Editing a suggestion turns it into an
assumption. All of that is for you: the client deck, the website, the PowerPoint and
the one-pager show none of it, only the arithmetic. For you there is an **Internal
summary** export: every field with its state and origin, and the questions to confirm.

**Suggest values** (per field or for all empty ones) is the only place an AI model
is involved, and it only proposes values. The agent can always search the public web.
It can read only the **Connections** you allow (Claude, Gong, HubSpot, Slack, Clay, Lemlist;
the page sits under Projects in the sidebar and everything is off by default). Best
source first: a figure stated in allowed material (an input, with the quote), a
checkable public source (an input, with the link), a published benchmark (with its
publication) and a rule from another input. A connection that is off is never read,
and a gap says so. A suggestion is pinned with its origin and a timestamp and never
regenerates by itself. In this build each connection takes pasted or uploaded
material. The agent needs `ANTHROPIC_API_KEY`; without it the rule-based suggestions
still work and the field says the agent was unavailable.

`npm test` runs the model and deck tests. The plugin docs and skill text still
describe the old inputs and will be refreshed when the plugin work resumes.

## Where the content comes from

| Thing | Source |
|---|---|
| Input fields and benefit formulas | Chris's Q8: the baseline numbers he gathers and his "how we frame the value" table |
| Base formula | (hours saved x hourly cost) + costs avoided, minus subscription |
| Self-host comparison | Chris: build-it-in-house is the biggest competitor |
| Assumption / confirmed toggle | Chris, Toronto session |
| Stakeholder conflict framing | Chris, Toronto session |

The productivity formula reproduces Chris's worked example: 500 engineers at
$100/hr saving 1 hour a week over 48 weeks is $2.4M.

## What is ours and needs replacing

- **`STAKEHOLDERS` in `src/valueModel.js` is our guess.** The roles come from
  Chris's Q11 and Q12; what each needs to hear, the objection and the counter are
  starter copy. Replace it with his words, then rebuild the plugin.
- **The archetypes are placeholders.** They only bias which drivers lead.
- **The default numbers are generous** (an 8.6x return out of the box). Real cases
  narrow the gap between "today" and "with Portal". Say so before anyone reads the defaults as a claim.

## Structure

```
src/
  model.js             every figure: pure arithmetic, no AI, no async (the source of truth for numbers)
  model.test.js        tests for the arithmetic (npm test)
  valueModel.js        the content around it: inputs and pairs, pillars, stakeholders, archetypes
  format.js            number formatting
  caseFile.js          the shared .case.json format (app import/export, plugin)
  deck/                block model, token filling, resolving a deck for export, map layout
  export/              PowerPoint, one-pager, interactive website (with in-place editing), Export menu
  components/          Sidebar, Projects, Details, Map, People, Deck editor, Website view
server/ api/           people-finder + Vercel publishing (shared by the dev server and Vercel)
plugin/                the Claude plugin (skills, commands, agent, bundled script)
plugin-src/cli.mjs     source of the plugin's script
scripts/build-plugin.mjs   bundles it and regenerates the reference docs
.claude-plugin/        marketplace manifest so the repo itself is installable
```

## Known gaps

- Projects are stored in one browser; there is no sync between devices or people.
- The PowerPoint is generated, not tested in PowerPoint itself; text heights are estimated.
- The one-pager is built from the model and the selected stakeholder, not from edits made to deck text.
- No Spotify or Backstage trademark clearance has been sought for the logo use.
