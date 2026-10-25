---
description: Start a business case for a company (inputs, stakeholders, ROI, deck)
argument-hint: <company name>
---

Start a new case using `${CLAUDE_PLUGIN_ROOT}/skills/case-workflow/SKILL.md`.

Company: $ARGUMENTS

If no company was given, ask for it. A company name is enough to create an empty
case and begin official brand discovery when web is enabled. Extract supplied
material before asking questions. Leave unknown inputs empty and keep researched
stakeholders proposed until selected. Planner action: `new-case`.
