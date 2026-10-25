---
description: Find who holds each stakeholder role at the company, with sources
argument-hint: [case file] [role or stakeholder key]
---

Research with `${CLAUDE_PLUGIN_ROOT}/skills/account-research/SKILL.md`.

Arguments: $ARGUMENTS

This is an alias for `/casebuilder:stakeholders`. Resolve company/case and role,
return sourced candidates and inferred mappings, then ask which to add. Research
alone does not write to the case. Never invent contacts, emails or profile URLs.
