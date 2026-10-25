---
name: account-research
description: Find sourced candidates for the decision-maker roles in a CaseBuilder company, including current titles and explicit inferred role mappings. Use for Find stakeholders or role research; use person-brief for a specific invitee.
---

# Find the people behind the roles

Read `${CLAUDE_PLUGIN_ROOT}/framework/README.md` and
`${CLAUDE_PLUGIN_ROOT}/skills/person-brief/SKILL.md` for the evidence contract.
Read the case's stakeholder list or resolve roles from the supplied context.
With no case, return a company report; do not invent a case-write action.

1. Establish the company/business unit, roles and enabled/available sources.
2. Search official leadership pages, relevant company posts, recent talks and
   professional profiles. Use only enabled sources. Do not log in to or scrape
   LinkedIn. Never construct an email or profile URL from a naming convention.
3. Return up to three evidenced candidates per role. Every claim has its own
   source URL/type. Check current employment and explain stale/conflicting pages.
   No source means not found. Public signals must bear on this business case.
4. A common name with several plausible matches needs candidate selection.
   Title evidence and role inference are different: label mapping inferred,
   explain why, and give unfamiliar titles the nearest role at low confidence.
5. If subagents are available, use one account-researcher per role. They return
   findings only; the coordinator owns case writes, avoiding concurrent file edits.
6. Validate the combined people-findings JSON with workflow.mjs. Show candidates,
   gaps and source settings. The user chooses which people to add. Then follow
   person-brief's Add to this deal procedure and run CB validate. Input suggestions
   are separate reviews; research never silently fills a numeric field.

Use professional information only. Do not collect personal/home details. Research
is draft evidence, not permission to contact anyone. No message is sent by this skill.
