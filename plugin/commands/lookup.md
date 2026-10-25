---
description: Quickly brief names, email addresses or LinkedIn profiles with sources
argument-hint: <name, names, email or LinkedIn URL> [company or case file]
---

Arguments: $ARGUMENTS

Read `${CLAUDE_PLUGIN_ROOT}/skills/person-brief/SKILL.md`. Planner action:
`person-lookup`. A case is optional. Return a sourced identity/title and inferred
stakeholder match first. Disambiguate common names. Lookup never changes a case.
Offer Add to this deal only with a case; require selection before adding anyone.
