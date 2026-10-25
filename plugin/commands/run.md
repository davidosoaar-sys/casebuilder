---
description: Run the company-to-business-case workflow from discovery material
argument-hint: <company> [case file or discovery files] [requested formats]
---

Arguments: $ARGUMENTS

Read `${CLAUDE_PLUGIN_ROOT}/skills/case-workflow/SKILL.md`. Planner action:
`run-case`. Create/reuse the case, extract sourced inputs, discover brand assets
when enabled, propose stakeholders, calculate with the CLI and build requested
outputs. Missing information becomes open questions. Do not stop at a plan when
execution was requested and tools are available. Research stays proposed until
selected; publishing is never part of this command.
