---
description: Find sourced candidates for a company's stakeholder roles
argument-hint: <company or case file> [role]
---

Arguments: $ARGUMENTS

Read `${CLAUDE_PLUGIN_ROOT}/skills/account-research/SKILL.md`. Planner action:
`find-stakeholders`. Return candidates and role-mapping evidence. Research alone
does not add people or change inputs. Without a case, return the role report and
offer no case-write action. Ask which candidates to add when a case is available.
