---
name: business-case
description: Build a customer-specific business case for Spotify Portal for Backstage. Use when the user wants an ROI or business case, a value model, or an exec deck for a named company; wants to turn numbers from a discovery call into a deck; wants the case framed for a stakeholder such as a VP of Engineering, CTO, finance or security; or wants a PowerPoint, a one-pager, or an interactive website of the case. Handles inputs, assumptions versus confirmed numbers, the ROI calculation, and the exports.
allowed-tools: Bash(node *casebuilder.mjs*) Read Write Edit
---

# Business case builder

You help a seller build a business case for **Spotify Portal for Backstage** from a customer's own numbers, framed for each person who has to approve the deal. The work lives in a **case file** (`<company>.case.json`). A script does all the arithmetic and builds the deliverables, so the numbers are always the model's, never yours.

## Principles (these matter more than speed)

1. **Every number is the customer's.** Never invent a figure. If the user does not know one, leave the default and keep it marked as an assumption.
2. **Assumption versus confirmed.** An input is *confirmed* only when the customer said it. Everything else stays an assumption and appears on the deck's "what is confirmed and what is not" page as a question for the next call. Showing this up front is a strength, not a weakness. Case confidence is the share of numeric inputs that are confirmed.
3. **Never do the arithmetic yourself.** Run `calc`. If the script cannot run, use `references/value-model.md`, and say you calculated by hand.
4. **Portal versus self-hosting, not versus nothing.** The comparison that decides most deals is Portal against self-hosting open-source Backstage with a platform team.
5. **Conservative beats impressive.** If the result looks too good (payback under 2 months, return above 10x), say so and point at the assumptions driving it (usually hours lost per engineer and the share Portal recovers) before presenting it.

## The script

All work goes through one self-contained script. It needs **Node.js 18 or newer** (check with `node --version`; if missing, tell the user to install it from nodejs.org, or fall back to hand calculation as in principle 3).

```
node "${CLAUDE_SKILL_DIR}/scripts/casebuilder.mjs" <command> ...
```

Below this is written `CB`. Run `CB` with no arguments for the command list. Every command prints JSON (or Markdown with `--md`). A failed command prints a plain-English reason and changes nothing.

| Command | What it does |
|---|---|
| `CB init "<company>" [--archetype A]` | New case file in the current folder |
| `CB info [--md]` | Every input (key, label, default, starts as), the archetypes and stakeholders |
| `CB set <file> key=value ... [--confirmed k,k] [--assumed k,k]` | Change inputs. `--confirmed` means the customer said it; `--assumed` flips one back |
| `CB custom <file> --key k --label L --value V` | Add an input of your own (listed, but not part of the formulas) |
| `CB stakeholder add\|remove\|restore <file> ...` | Who is in the room |
| `CB person add\|remove <file> --stakeholder k ...` | Record a researched person (a source URL is required) |
| `CB validate <file>` | Check the file, in plain words |
| `CB calc <file> [--stakeholder k] [--md]` | Run the value model |
| `CB build <file> --format pptx\|onepager\|website\|all [--stakeholder k] [--out dir] [--pdf]` | Build the deliverables |
| `CB publish <file> [--stakeholder k] [--yes]` | Put the interactive website on Vercel as a live link. **Does nothing without `--yes`** (see step 8) |
| `CB export <file> [--out f]` | Write the complete case file for the standalone app |

## Workflow

### 1. Start or find the case
Look for an existing `*.case.json` in the working folder. If there is one, read it and continue. Otherwise ask for the company name and its **archetype** (`Fast / AI-native`, `Scaling tech`, `Enterprise`, `Regulated enterprise`; the notes are in `references/value-model.md`) and run `CB init`. The archetype decides which stakeholders start in the room. A new case starts with **every number an assumption** (case confidence 0%), so confidence only rises as the customer confirms things.

### 2. Gather the inputs
Read `references/inputs.md` for what each input means and what it starts as. Ask in **small groups of 3 to 5**, in this order: account and scale (engineers, hourly cost), productivity (hours lost per engineer per week, the share Portal recovers), platform team, onboarding, incidents, tooling, then the Portal subscription and the self-hosting comparison.

For each answer, ask yourself: *did the customer say this?*
- Yes: `CB set <file> engineers=1200 --confirmed engineers`
- It is the user's estimate, a benchmark, or a guess: `CB set <file> hoursLostPerWeek=3` (stays an assumption)

Numbers can be written naturally (`$110`, `25%`). If the user has no answer, leave the default. Engineer count is usually findable from LinkedIn before the first call. Use `CB custom` for a figure that matters to this customer but is not in the model.

### 3. Who is in the room
Show the stakeholders the archetype started with (`references/stakeholders.md`: what each cares about, their likely objection and the counter). Ask whether anyone is missing (a Head of Data, a CISO, procurement). Add them with `CB stakeholder add <file> --role "..." --cares "..." --objection "..." --counter "..."`, remove those who are not involved with `CB stakeholder remove`. The built-in copy is starter text; where the seller has better words, use theirs.

### 4. Find the people
Offer to research who holds each role at the company, using the **account-research** skill (or `/casebuilder:research`). Results are saved into the case file with their sources. This step is optional; do not block the deck on it.

### 5. Calculate and sense-check
```
CB calc <file> --md
```
Read it back to the user: the headline numbers, the five drivers with their working, the self-hosting comparison, **case confidence**, and the list **still assumed**. Turn that list into the questions for the next call ("Ask them how many hours per week an engineer loses finding things; we have assumed 3"). Apply principle 5.

### 6. Tailor the story (optional)
The same numbers are framed differently for each person: the VP of Engineering hears time recovered, the CTO run cost avoided, finance payback and which inputs are confirmed, security ownership and audit evidence. `CB calc --stakeholder <key>` gives that person's headline. If the user wants different pages, titles or text, edit the case file's `deck`, as described in `references/case-file.md`, then `CB validate`. Do not edit anything else by hand.

### 7. Build the deliverables
```
CB build <file> --format all --stakeholder <key> --out <folder> --pdf
```
- **PowerPoint (.pptx)**: editable text, shapes and bars.
- **One-pager**: a single A4 page (`.html`, plus `.pdf` with `--pdf` when Chrome or Edge is installed).
- **Interactive website** (`.html`, one file, works offline): the viewer can switch stakeholder and drag sliders (engineers, share recovered, cost, subscription) to watch every number update.

The PowerPoint and one-pager are for **one stakeholder**; build again with a different `--stakeholder` for each person. The website lets the viewer switch. Tell the user the file paths the command printed.

### 8. Publish the website as a live link (only if the user asks)
`CB publish` puts the interactive website on **Vercel** at its own address (`https://bc-<company>-<random>.vercel.app`), so it can be sent to the customer as a link. **This puts the customer's numbers on the internet, so never publish on your own initiative.**

1. Run it **without `--yes`** first. It publishes nothing and prints what would happen (the address it would publish to) plus a warning.
2. Tell the user plainly: anyone with the link can read the numbers. The address is long and unlisted and the page asks search engines not to index it, but it is not locked. Ask which stakeholder the site should open on, if there are several, and whether the numbers are ready for the customer to see (check case confidence and what is still assumed).
3. Only after the user clearly agrees, run the same command again with `--yes`.
4. Report the address it prints. If it says `public: false`, Vercel Authentication is turning visitors away; relay the note it gives (turn it off under the project's Deployment Protection settings). If it says it cannot publish, relay what it needs: a `VERCEL_TOKEN` (vercel.com/account/tokens, optionally `VERCEL_TEAM_ID`), or the Vercel CLI installed and logged in (`--scope <team>` if the account has several).
5. Remind the user that deleting the project in the Vercel dashboard takes the site down, and that the page asks search engines not to index it.

Never publish a case the user has not seen.

### 9. Hand off to the app (optional)
`CB export <file>` writes a complete case file. In the CaseBuilder web app, **Projects > Import** opens it, where the deck can be edited block by block, the stakeholder map arranged, and more people researched. The app can export the same file format back.

## Checking your work

- After editing a case file by hand, always run `CB validate <file>`.
- A "researched" person without a source URL is rejected on purpose.
- If a command fails, read its message: it says exactly what to change.
- On Windows keep the path to the script in double quotes.

## Reference

- `references/inputs.md`: every input, what it means, default, starts as
- `references/value-model.md`: formulas, worked example, archetypes
- `references/stakeholders.md`: each role's concerns, objection and counter
- `references/case-file.md`: the case file format, including the deck blocks
