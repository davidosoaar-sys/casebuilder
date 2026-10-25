---
name: case-deliverables
description: Turn an existing CaseBuilder case into branded website, editable slides and a one-page brief using fixed evidence-based templates and the canonical calculation CLI. Use for build/view/export commands after case inputs are available.
---

# Compose from the case

Use `CB` at `${CLAUDE_PLUGIN_ROOT}/skills/business-case/scripts/casebuilder.mjs`.
Read the case and run `validate` and `calc` first. Do not change equations or fill
missing values for design purposes. The case's brand and authored overrides win.

For website/deck design, read this skill's `references/design-case.md` and
`references/design-reference-study.md`. They define the seven-beat story, real
website precedents, brand fidelity and visual QA. The structured plan is an agent
planning artifact: the current renderer does not consume it automatically. Apply
only compatible authored deck content/design fields; label unsupported layout
ideas as proposals rather than claiming the renderer implements them.

For one-pagers, read `references/one-pager.md`. It organizes existing inputs into
one static A4 page: identity, overview, impact, drivers, changes, alternative,
stakeholders. It is not a fresh model or a website shrunk onto paper. Report any
gap between that specification and the current renderer; do not pretend to have
changed its structure just by reading the instructions.

Build only requested formats with `CB build <case> --format website|pptx|onepager|all`.
Use an explicit audience for slides/one-pager; preserve the company-wide website
and stakeholder map. Choose filenames/output directory that do not overwrite an
earlier artifact silently. Previewing in the app does not download; this CLI build
creates files by explicit request. PDF is optional and requires a supported browser.

Check actual output before declaring success: logo visibility/aspect ratio,
font availability, contrast, clipping, matching figures and no source/confidence
metadata in client content. Node/PPTX may require a supplied PNG/JPEG logo fallback;
report this instead of silently using Backstage's logo for another company.
Keep unknown values visible as missing and research metadata in the internal
report. Never publish or message a customer as part of building outputs.
