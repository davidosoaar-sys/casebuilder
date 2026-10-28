---
name: deck-design
description: Design a decision-focused editable CaseBuilder deck from reviewed inputs and verified company branding. Use before building or revising slide decks.
---

## Trigger and inputs
Run when an editable deck is requested. Read the current case, selected audience,
canonical calculator output and verified brand findings. Read case-deliverables/
references/design-case.md and design-reference-study.md relative to the skills
directory. Research is limited to user-enabled sources. No new financial claims.

## Story and composition

Use the same cover template as the app, referenced by the examples at
https://casebuilder-site-omega.vercel.app/: small customer × green Backstage mark,
large company name and short pitch at left; cropped, sourced company product or
campaign photography at right. Keep text editable and preserve the selected
company/Backstage theme and fonts. New cases already use
`design.coverLayout: "split"` on the title slide. For an existing case, offer this
layout before changing authored content. The renderer uses `brand.heroImage`,
`heroAlt` and `heroSource`; no usable image means a clean typographic fallback.
Do not use a complete landing-page slide screenshot as the photo. Do not add
decorative images to financial slides or alter equations to fit the layout.
Storyboard before rendering: customer × Backstage identity; customer problem and
decision; modeled business impact; value drivers; what changes; alternative;
stakeholder requirements and next decision. Adapt to evidence and audience rather
than forcing seven slides or rewriting authored slides without permission.
Each slide has one takeaway headline and one primary visual or concise message.
Alternate supported layouts: title, big number, editable driver chart, before/after,
comparison and stakeholder requirements. Avoid repeated walls of bullets, generic
stock imagery, decorative dashboards and unexplained numbers. Use whitespace and
a consistent alignment/grid; minimum readable body size, short lines and strong
contrast. Use the existing renderer's supported layouts, not imaginary components.

## Brand fidelity
Use the discovered logo variants, heading/body fonts, canvas, primary and text
colors. Preserve logo aspect ratio and customer × Backstage identity. Do not
assume Stripe is dark or Nike is white without observing the selected surface.
Use purposeful official imagery only when verified; typography and charts are a
valid fallback. Font availability in PowerPoint depends on the viewer's installed
fonts; naming a font is not embedding it. PPTX currently needs a raster company
logo, so obtain an official PNG/JPEG or clearly disclose an omitted logo.

## Apply and build
The MCP builder renders the saved case; reading this skill does not change slides.
For custom composition, use the existing CLI case-file/deck contract to apply
supported authored text and style fields, preserving IDs, inputs and source data.
Never change equations. If host file tools are unavailable, build the supported
template and state its design limits. Do not claim bespoke layouts were applied.
Use canonical build tools for the selected audience/output. Keep charts/editable
text editable. Unknown figures are open questions, not zero or invented results.

## Default pitch flow
New decks start as 11 pages: title; business impact (decision and key numbers);
where engineering time goes today; value breakdown chart; value drivers; today vs
with Portal; payback chart; against self-hosting; this room; assumptions
(confidence chart: confirmed vs assumption); the decision and next steps.
One takeaway headline per page. At most 5 bullets of 12 words. Figures only from
live blocks and tokens, never typed. Use chart blocks (payback, breakdown,
confidence) for numeric stories. Capacity value is not cash savings. When asked to
build or improve a deck, propose the missing flow pages with add_slide/add_block.

## Example and evaluation
Good: "Platform ownership is the decision bottleneck" above a two-column current/
proposed workflow; a later chart shows only computed drivers and clear units.
Bad: seven dense bullet slides with a swapped logo and invented ROI headline.
Inspect the actual PPTX or render slide previews if the host supports it. Check
title hierarchy, logo fidelity, consistent type, overflow, chart labels/units,
matching calculations and absence of private quotes/objection prep. Repair flaws
before delivery. Report explicitly when rendering/visual QA could not be run.

## Judgment and ownership
Code owns calculations/export; Claude chooses evidence-based emphasis and visual
hierarchy. CaseBuilder team maintains these rules alongside app templates. A new
layout needs a real renderer implementation and an export fixture, not prompt-only
claims. No publishing, emailing or account changes as part of this skill.
