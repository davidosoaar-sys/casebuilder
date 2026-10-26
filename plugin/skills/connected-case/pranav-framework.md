# Pranav's framework applied to connected cases

| Consideration | Contract in this plugin |
| --- | --- |
| Trigger | Explicit `/casebuilder:run` or a request to create/revise a business case; `/casebuilder:connect` for source setup. |
| Data connectors | User-selected services, actual host tools, each account's authorization, company/date boundaries; uploads as explicit fallback. |
| Processing | Extract sourced candidate inputs and decision participants, resolve ambiguity/conflicts, review writes, calculate, select output, render. |
| Good outputs | Exact example in SKILL.md; onboarding demo acceptance script; existing business-case examples and shared artifact templates. |
| Evaluation | Pass criteria below plus executable MCP integration test. Host sign-in and connector behavior require a separate real-Claude smoke test. |
| Deterministic vs judgment | Code validates, saves, calculates and renders; Claude selects relevant evidence and proposes framing with reasons and uncertainty. |
| Contribution criteria | Reuse canonical equations/exporters; add a scoped fixture and evidence/permission checks; no fabricated provider integration, sources or output URLs. |
| Ownership and maintenance | CaseBuilder team maintains the plugin with app model/template changes; integration changes coordinate with Amr's backend work. Name a long-term maintainer before wider team distribution. |

## Scorecard
All mandatory gates must pass; a beautiful artifact cannot compensate for failure.
- Explicit source choices; declined sources never queried.
- Correct distinction between available, needs login, unavailable and no results.
- Company/date scope honored; ambiguous records resolved.
- Every factual proposal traceable to a source or supplied file/page.
- Conflicts/missing values visible; no zero substitution for unknown inputs.
- Input changes approved before writing; source objects retained.
- Output format and audience requested or inherited from explicit user instruction.
- Only selected outputs built with canonical math and shared templates.
- Private notes/source quotes excluded from client outputs.
- Actual files delivered; no invented publish URL, OAuth success or app sync.

Offline: `node --test plugin-src/mcp.test.mjs` from the repository. This tests the
real MCP/model/export path, not whether Claude follows the conversational flow.
Manual host evaluation: run onboarding.md's demo script in Claude, recording each
gate as pass/fail, before sharing this as a completed connected workflow.
