---
name: business-case
description: Maintain a CaseBuilder case file and run its canonical ROI calculations, input/source updates, stakeholder edits and exports. Use for numeric or case-file operations; use case-workflow for a complete company-to-deliverable workflow.
allowed-tools: Bash(node *casebuilder.mjs*) Read Write Edit
---

# Canonical case operations

`CB` means `node "${CLAUDE_PLUGIN_ROOT}/skills/business-case/scripts/casebuilder.mjs"`.
Requires Node 18+. All financial arithmetic comes from this script. If it cannot
run, report the blocker; never improvise a hand-calculated replacement.

## Commands

- `CB init "Company" --out company.case.json`: empty case; do not use `--force`
  without an explicit overwrite request.
- `CB info --md`: canonical keys and field definitions.
- `CB set file key=value --confirmed key --origin "evidence location"`: values
  directly supported by supplied evidence. For an estimate use `--assumed key`.
  Quotes and links belong in the input's full source object; after a direct JSON
  source edit, run `validate`. Never label a seller estimate as customer input.
- `CB custom file --key k --label L --value V`: custom figure, not a formula edit.
- `CB stakeholder add|remove|restore file ...`: edit roles on explicit request.
- `CB person add|remove file --stakeholder key --name "Name" --source URL ...`:
  apply a selected person, never as a side effect of a lookup. Title-based mapping
  is inferred. Emails/profile URLs require their own observed source evidence.
- `CB validate file`: validates the case before writing/exporting.
- `CB calc file [--stakeholder key] [--md]`: figures, completeness and arithmetic.
- `CB build file --format website|pptx|onepager|all [--out dir] [--pdf]`: explicit
  artifact creation. Follow case-deliverables for composition and output review.
- `CB publish file`: dry run only. `--yes` exposes data publicly and requires an
  explicit publish request and review of the concrete case to be published.

## Routing and invariants

For a whole case, read `../case-workflow/SKILL.md`. For branding read
`../brand-discovery/SKILL.md`; for named people read `../person-brief/SKILL.md`;
for roles read `../account-research/SKILL.md`; for outputs read
`../case-deliverables/SKILL.md`. Resolve these relative to this skill folder.

Missing numeric inputs start empty, never at illustrative defaults. Default
example values in references are worked examples only. Source state, origin,
quote, link and pinnedAt must survive case edits. Do not change equations.
Sourced public facts can be inputs; assumptions/suggestions remain distinct.
Internal confidence and provenance never enter client-facing deliverables.

The CLI manages local case files; it does not automatically synchronize Supabase
or attach to the app's current account. Do not promise an Import/Export case-file
button in the app: that UI was removed. `CB export` remains a local CLI operation.
If a file already exists in the output directory, choose a new revision name or
ask before replacing a file not explicitly requested for overwrite.

Read `references/inputs.md` for keys, `references/value-model.md` for model
semantics, `references/stakeholders.md` for starter framing, and
`references/case-file.md` for the full source/deck/brand format.
