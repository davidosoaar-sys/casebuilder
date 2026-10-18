# CaseBuilder

A prototype for the TKS x Spotify challenge. It sits between Chris's input
sheet and his exec meeting: you enter the inputs, it produces a presentable
business case, and when an input changes the whole case updates instead of
being rebuilt.

Built against what Chris actually said, not what we guessed.

## Run it

```bash
npm install
npm run dev
```

Opens on http://localhost:5173. Node 18 or newer.

## What's on screen

**Left: the input sheet.** Every field starts as an *assumption* and flips to a
confirmed *input* when the customer says it on a call. That is Chris's own
mechanic, from the Toronto session: a tab of assumptions that becomes a tab of
inputs, and the more confirmed inputs you have, the stronger the case. The
confidence bar at the top shows how much of the case is still guesswork.

**Right: the deck.** Six slides, regenerated on every keystroke:

1. Title
2. The headline number, reframed per stakeholder
3. The five value drivers with the arithmetic shown under each bar
4. Portal against self-hosting open-source Backstage
5. What this specific stakeholder needs to see, their objection, the counter
6. An honesty slide listing what is still assumed

**"Framed for" tabs.** The same numbers, different argument. Chris's point from
Toronto was that a Director of Engineering wants productivity while the CTO
wants to cut spend, and the case has to serve both. Switching tabs changes the
headline, which drivers lead, and the stakeholder slide.

**Export PDF** uses the browser print dialog. Print styles switch the deck to a
light theme with one slide per page.

## Where the content comes from

| Thing | Source |
|---|---|
| Input fields | Chris's Q8: the baseline numbers he gathers from the customer |
| Benefit formulas | Chris's Q8 "how we frame the value" table |
| Base formula | (hours saved x hourly cost) + costs avoided, minus subscription |
| Self-host comparison | Chris: build-it-in-house is the biggest competitor |
| Assumption/input toggle | Chris, Toronto session |
| Stakeholder conflict framing | Chris, Toronto session |

The productivity formula reproduces Chris's own worked example exactly: 500
engineers at $100/hr saving 1 hour a week over 48 weeks is $2.4M. Set hours
lost to 1 and capture rate to 100% and you get that number back.

## What is ours and needs replacing

**`STAKEHOLDERS` in `src/valueModel.js` is our guess.** The roles are from
Chris's Q11 and Q12, but what each one needs to hear, the objection they raise
and the counter are written by us. This is the part of the tool nothing else
can produce and the part we have the least evidence for.

Ask Chris: *for the roles that come up most, what does each need to hear and
what objection do you usually get?* Then replace that block with his words.

**The archetypes are placeholders.** Four buckets, lightly used. Chris has not
confirmed how he groups deals, so they only bias which drivers lead.

**The default numbers are generous.** 7.7x return and a 2-month payback out of
the box. Real cases dial the capture rate down hard. Worth saying so before
anyone reads the defaults as a claim.

## Structure

```
src/
  valueModel.js            the whole model: inputs, formulas, stakeholders
  App.jsx                  state
  components/
    InputSheet.jsx         left panel
    Deck.jsx               right panel, all six slides
  styles.css               including print styles
```

`valueModel.js` is deliberately the only place content lives. Change a formula
or a stakeholder's objection there and every case produced from then on is
right. No slide hard-codes a number.

## Known gaps

- No persistence. Reloading resets to defaults.
- No real scraping. The agent half of the concept is not built here.
- No Spotify branding. We do not have their design system.
- Export is print-to-PDF, not .pptx.
