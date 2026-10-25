---
name: person-brief
description: Quickly brief one or several professional contacts from a name, email or LinkedIn URL, optionally in the context of a CaseBuilder company. Return sourced findings and stakeholder-role proposals without writing to the case.
---

# Brief the person before the call

Read `${CLAUDE_PLUGIN_ROOT}/framework/README.md` and
`${CLAUDE_PLUGIN_ROOT}/templates/people-findings.json`. Use the case's company
when available. Preserve the query on failure. A case file is optional.

1. Parse newline/semicolon-separated people, names with companies, literal email
   addresses or LinkedIn URLs. A supplied identifier is not proof of employment.
   Search only sources explicitly enabled and actually available in the host.
2. Resolve identity first. Several plausible common-name matches produce a candidate
   list and a disambiguation question, not a chosen biography or case mutation.
3. Return name, sourced current title/company and role match first, as each person
   resolves. Then add tenure, reporting relationships and relevant public signals
   only when individually supported. Missing fields say "not found"; never invent
   tenure, manager, reports, contact address or quote. Use only professional context.
4. Map title/responsibilities to the case's known stakeholder roles. Title evidence
   is verified; its mapping is an inference. Include `roleMatch: {role, confidence,
   why, sourceUrl, sourceType, state:"inferred"}`. An unfamiliar title still gets
   the nearest role at low confidence with a plain explanation. Likely concerns
   are labeled role-based inference with the title evidence, not a personal quote.
5. Put each sourced statement in `claims`; public signals use the same shape.
   Use source IDs such as `web`, `slack`, `gong`, `hubspot`, `claude`, `clay`,
   `lemlist` only when enabled. Record `sourcesUsed` and `sourcesSkipped` with a
   reason (`disabled`, `unavailable`, `no-results`). Example: "Slack is disabled,
   so no internal context was used." Do not cite a disabled source as web.
6. Validate findings with `workflow.mjs validate people --file findings.json`.
   Cache the validated result in this conversation/session, keyed by identity,
   company and enabled-source set. A toggle change invalidates cached access.
7. Return a brief even without a case; offer no case-write action then. With a
   case, offer Add to this deal. Only after selection use `CB person add` for the
   role, with real sources, and preserve the inferred mapping in the person's
   record. Restore/add the role if absent so the deck gains its framing. Validate
   afterward. Never write suggested model inputs without separate review.

In Claude, progressive output means concise updates as findings arrive; this
package does not implement a streaming HTTP service. If the host cannot update
progressively, state the limitation. A slow lookup must not claim completion.
