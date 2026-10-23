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
npm install
npm run dev        # http://localhost:5173 (fails instead of switching ports if it is taken)
npm run build
```

Node 18 or newer. Projects live in the browser's local storage.

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
- **Export.** PDF (print), PowerPoint, a one-pager, and an interactive website
  (one offline `.html` where the viewer can switch stakeholder and drag sliders
  to watch every number update).
- **Import / export** a case file to move a case between the app and the plugin.

### The people-finder needs a key

The agent runs in a server function (`api/research.js`, also served by the dev
server). Copy `.env.example` to `.env.local` and set:

```
ANTHROPIC_API_KEY=...            # required
RESEARCH_ACCESS_CODE=...         # set this on any deployed copy, or anyone can spend your key
RESEARCH_MODEL=claude-sonnet-5-5 # optional; defaults to claude-opus-5-5
```

On Vercel add the same variables under Project Settings, then redeploy. Every
person it returns must cite a source it actually retrieved; unsourced people,
guessed emails and invented LinkedIn URLs are dropped on the server.

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

Then try `/casebuilder:new Northwind Retail`. Commands: `new`, `research`,
`build`, `whatif`. The same workflow also triggers from plain requests like
"build a business case for Acme". Needs **Node.js 18+** on the machine that runs
it. See [plugin/README.md](plugin/README.md).

After changing the value model, deck model or exporters, rebuild the plugin so it
ships the same code: `npm run build:plugin` (it regenerates the bundled script
and the reference docs from `src/valueModel.js`).

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
- **The default numbers are generous** (a 7.7x return out of the box). Real cases
  dial the capture rate down. Say so before anyone reads the defaults as a claim.

## Structure

```
src/
  valueModel.js        the whole model: inputs, formulas, stakeholders (the source of truth)
  caseFile.js          the shared .case.json format (app import/export, plugin)
  deck/                block model, token filling, resolving a deck for export, map layout
  export/              PowerPoint, one-pager, interactive website, Export menu
  components/          Sidebar, Projects, Details, Map, People, Deck editor
server/ api/           the people-finder (shared by the dev server and Vercel)
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
