---
description: Review and publish a case as a shareable interactive website
argument-hint: [case file or case ID]
---

Read `${CLAUDE_PLUGIN_ROOT}/skills/case-deliverables/SKILL.md`, especially its
shareable-link rules. Resolve $ARGUMENTS to the user's case. Build/review the HTML
and show a dry run first. Publishing exposes client-facing case information at a
public address; require explicit human approval of that case before invoking
`casebuilder_publish` with `approved:true` or `CB publish <case> --yes`.
Use only the host's authorized Vercel setup. Return the actual successful URL,
any access protection and the fact that later edits need republishing.
