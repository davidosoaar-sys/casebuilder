# CaseBuilder for Claude

Build a customer-specific business case for **Spotify Portal for Backstage** with Claude: an ROI model from the customer's own numbers, framed for each stakeholder, with researched contacts, exported as a **PowerPoint**, a **one-pager** (HTML and PDF) and an **interactive website**.

## Install

**Claude Code**

```
/plugin marketplace add davidosoaar-sys/casebuilder
/plugin install casebuilder --marketplace davidosoaar-sys/casebuilder
```

From a local checkout instead: `claude --plugin-dir ./plugin`. After editing, `/reload-plugins`.

**Claude Cowork / Claude desktop**: in the repo run `npm run build:plugin -- --zip`, then *Customize > Plugins > Add > Upload plugin* and choose `dist-plugin/casebuilder-plugin.zip`.

**Requires Node.js 18 or newer** where Claude runs commands (check `node --version`). Nothing else: the script is a single self-contained file.

## Use it

| Command | |
|---|---|
| `/casebuilder:new <company>` | Start a case: archetype, inputs, stakeholders |
| `/casebuilder:research [file] [role]` | Find who holds each role, with sources |
| `/casebuilder:build [file] [stakeholder] [format]` | Build the PowerPoint, one-pager and website |
| `/casebuilder:whatif <file> <changes>` | Before/after if an assumption changes, without touching the case |

You can also just ask: *"Build a business case for Acme. They have about 800 engineers."*

## How it works

- A case lives in a `<company>.case.json` file in your working folder.
- **Skill `business-case`** runs the workflow and calls a bundled script for everything numeric, so the figures always come from the model. An input is *confirmed* only when the customer said it; everything else stays an assumption and is listed as a question for the next call.
- **Skill `account-research`** (and the **`account-researcher`** agent, one per role in parallel) searches the public web with Claude's own tools. No API key is needed. Every person must cite a source page; emails and LinkedIn URLs are recorded only if seen on a page, never guessed.
- **The script** (`skills/business-case/scripts/casebuilder.mjs`) is built from the same source as the CaseBuilder web app, so the PowerPoint, one-pager and website are identical to the app's.

## The case file and the app

`/casebuilder:build` is one way to finish a case. The other is the web app: `casebuilder.mjs export <file>` writes a complete case file, and the app's **Projects > Import** opens it for visual deck editing, the draggable stakeholder map, and more research. The app can export the same format back. The format is documented in `skills/business-case/references/case-file.md`.

## Files

```
.claude-plugin/plugin.json
skills/business-case/       SKILL.md, scripts/casebuilder.mjs, references/
skills/account-research/    SKILL.md
agents/account-researcher.md
commands/                   new, research, build, whatif
```

`scripts/casebuilder.mjs` and `references/inputs.md`, `value-model.md`, `stakeholders.md` are **generated**. Change `src/valueModel.js` (or the deck/export code) in the app repo and run `npm run build:plugin`.

## Notes

- The stakeholder copy (what each role needs to hear, their objection and the counter) is starter text. Replace it with your own words.
- Research uses public web pages and can be out of date. Check each person before you reach out.
