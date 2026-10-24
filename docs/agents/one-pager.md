# ORGANIZE_ONE_PAGER — reusable one-page template

Instruction version: 1.0.0 · 2026-10-24

This is a provider-neutral instruction for organizing an existing CaseBuilder
case. It specifies a template, not a new model or an installed chatbot command.
It does not change the current one-pager renderer.

## Command

> ORGANIZE_ONE_PAGER: Arrange this deal into the fixed executive-brief template
> below. Use the supplied company logo, fonts, colors, context, stakeholder
> framing and canonical model results. Preserve calculations and facts. Return
> the populated template and identify missing information without inventing it.

## Input boundary

The host supplies a complete, read-only case snapshot: company, archetype,
strategic priority, authored context, brand assets, model figures with
completeness and arithmetic, existing before/after input pairs and stakeholders.
Read source objects internally to understand uncertainty. Never confirm an
assumption, discover people, alter equations, add benefits or write back inputs.
No source objects or confidence percentages enter the client-facing brief.
Keep missing-data and asset-fallback diagnostics in a separate internal report.

## Fixed arrangement

One A4 portrait page. A single reading order, top to bottom; two columns only
in the middle evidence area. Preserve this arrangement for every company.
Company branding populates the template; it does not trigger a new page design.

```text
┌─────────────────────────────────────────────────────┐
│ Company logo                                        │
│ Company name                                        │
│ Business case · date                                │
├─────────────────────────────────────────────────────┤
│ OVERVIEW                                            │
│ What is being evaluated, the priority and scope.     │
├─────────────────────────────────────────────────────┤
│ BUSINESS IMPACT                                     │
│ Annual value · annual spend · net year one           │
│ Payback · return                                    │
├──────────────────────────────┬──────────────────────┤
│ VALUE DRIVERS                │ WHAT CHANGES         │
│ Driver · annual contribution │ Measure · now → next │
│ Compact supporting arithmetic│ Units stay visible   │
├──────────────────────────────┴──────────────────────┤
│ THE ALTERNATIVE                                     │
│ Annual self-host cost vs Portal cost · difference   │
├─────────────────────────────────────────────────────┤
│ STAKEHOLDERS                                        │
│ Role/person · decision concern · what they need      │
└─────────────────────────────────────────────────────┘
```

### Identity

Logo first, then company name, then a small business-case/date line. Preserve
logo aspect ratio and the company's heading/body fonts. Use a suitable supplied
logo variant for the canvas; never invent or recolor one. If the exact font or
logo is unavailable, report it internally and use an explicit readable fallback.

### Overview

Two short sentences at most: the evaluation and supplied strategic priority.
Include archetype/scope only when provided and relevant. Do not turn a priority
such as migration into a claim that a particular migration is underway.

### Business impact

Use the existing annual value, annual Portal cost, net year one, payback and
return, with their canonical labels and formatting. Annual value is the main
figure; the rest support it. Never call recovered engineering capacity revenue
or guaranteed cash savings. Five-year results are optional only when requested
and space permits; do not replace the core measures with a new headline model.

### Value drivers

Use a compact, labeled table: driver, computed annual value and its existing
substituted arithmetic. Order by the deal's priority, then existing model order.
Use a bar only if it adds information and labels fit. Do not invent percentages,
new totals or a driver merely to fill the area. If showing only a subset, label
it as selected drivers; never imply it is the complete breakdown.

### What changes

Use the existing before/after pairs: measure, current value, modeled Portal
value, unit. Keep hours, days, percentages and money distinct. Select the pairs
corresponding to the displayed drivers. No separate scale or decorative chart
is needed when a short table communicates the comparison more clearly.

### The alternative

Show self-hosting annual cost, Portal annual cost and the existing difference.
Preserve the sign, scope and engineers × salary arithmetic. Do not claim Portal
is cheaper when the model says otherwise. If incomplete, show a concise
missing-input statement instead of a cost bar or guessed comparison.

### Stakeholders

Compact rows: added person's name when present, role, primary concern and what
they need to see. Use only saved stakeholder framing. Prefer concise rows to a
radial map at this size. If one audience is selected, include its objection and
counter in this space. A company-wide brief must not silently reduce the case
to one selected audience. Report any omitted people internally.

## Population and fit rules

- Same seven sections for every company; preserve the section when inputs are
  missing, using one short "Required inputs not yet supplied" message.
- Missing is never zero. A valid computed zero or negative result stays visible.
- Do not duplicate the headline as another paragraph or repeat the same numbers
  throughout the page. Keep raw inputs in the input sheet; this brief organizes
  their relevant results, not the entire storage record.
- Preserve meaning and arithmetic when shortening wording. Do not generate a
  factual executive summary unsupported by the supplied context.
- Fit content by removing repetition, tightening sentences and using the table
  slots. Target 10–11 pt body text; never shrink below 9 pt or clip overflow to
  claim it fits. Maintain comfortable page margins and a clear reading order.
- If the required evidence/people cannot fit legibly, mark the one-page layout
  as failed and ask which content can be summarized. Do not silently omit it,
  create a second page or scale the entire document into unreadable text.
- Keep the chosen company canvas consistent, including dark brands. Verify
  foreground contrast and chart labels on that actual background. A light print
  variant is a separate explicit output choice, not a silent branding change.
- No website navigation, animation, scroll behavior, Explore controls or cards
  that consume space without helping comparison. This is a static brief.

## Output and review

First return the populated sections in reading order. If the host provides the
one-pager renderer, render an actual A4 preview. Inspect the PDF/page image to
check one page, readability, font loading, logo, clipping and arithmetic. Preview
must not automatically download. The website and deck are separate artifacts.

Return a short internal report covering missing inputs, fallback assets, any
selected/omitted driver or stakeholder, and checks actually performed. Do not
claim a render or export was verified if only the text template was produced.
Never commit, push, publish or deploy as part of this command.
