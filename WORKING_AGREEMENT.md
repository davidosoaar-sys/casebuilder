# How we work

## Start with the product
Read PRODUCT.md, AGENTS.md, DESIGN.md and the relevant code. State the intended
user outcome and scope. Keep product truth current as work changes; do not add
features just because another product has them. Distinguish working behavior,
prototypes, planned features and unresolved dependencies.

## Git and shared work
Before every new logical change, inspect status, branch and upstream, then run
git pull --ff-only. Preserve all local changes. Never reset, discard or auto-stash
someone else’s work. Report overlapping edits and reconcile with an authorized
local checkpoint/merge. Check what the other contributor changed before editing.
Do not push, tag or deploy without authorization. Never commit secrets or .env files.

## Versions and patch notes
Start projects at an appropriate initial version such as v0.1.0; never restart
an existing project’s version. Use vMAJOR.MINOR.PATCH: PATCH for fixes/design/docs,
MINOR for features, MAJOR under that project’s release policy. Local work stays
under Unreleased. A version identifies a pushed release, not each edit or WIP.
At release, synchronize package.json and both root package-lock.json versions
(JSON omits v), add a dated CHANGELOG.md heading, commit, annotate the version tag,
and push only the intended branch/tag. Check deployment status before claiming live.

## Design and artifacts
Use the established design system and relevant Impeccable guidance. Preserve
approved fonts, assets, colors and application chrome. Research authoritative
references when necessary; use libraries such as 21st.dev as component references,
not a substitute for product-specific design. Never invent logos or font names.
Make assets purposeful: brand photography where sourced/approved, diagrams for
processes, charts for actual computed quantities. No meaningless visual filler.
Preview in the actual renderer at desktop/mobile and light/dark where applicable.
Check contrast, loading/empty/error states, text wrapping and reduced motion.

For CaseBuilder use Ritika’s communication structure: lead with a supported
business impact/decision, explain the customer workflow and what changes, show
the supporting value drivers, and close with overall impact/next decision. Keep
capacity value distinct from cash savings. Do not force favorable results.

## Agent commands
Specify trigger, allowed inputs/connectors, processing, good-output examples,
evaluation, and deterministic versus judgment boundaries. Code owns equations,
validation, permissions and saving; agents propose sourced findings. Unknown is
valid. Show assumptions; do not invent facts or silently overwrite user input.

## Validation and handoff
Run checks appropriate to the change. Separate offline tests from live provider
checks; disclose failed or unavailable API checks. Use isolated fictional demos,
never overwrite real deals. Maintain concise patch notes and PRODUCT.md. Report
what changed, validation, remaining limitations and release/deployment status.
Coordinate backend ownership and preserve authored content. Do not claim live
sync, collaboration or automatic publishing merely because the UI says Live Room.

## Reuse in another project
Copy this process, adapting PRODUCT.md and DESIGN.md to that project’s own user,
purpose and existing stack. Keep CaseBuilder-specific equations, copy, brand
assets and sales-domain features out of unrelated projects.
