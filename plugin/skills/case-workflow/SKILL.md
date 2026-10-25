---
name: case-workflow
description: Coordinate a CaseBuilder case from a company name and supplied discovery material through brand research, stakeholder proposals, model calculation and requested deliverables. Use for an end-to-end case, not a standalone person lookup.
---

# Build the case, not a questionnaire

Read `${CLAUDE_PLUGIN_ROOT}/framework/README.md` and resolve `new-case` or
`run-case` using the planner. Use `${CLAUDE_PLUGIN_ROOT}/skills/business-case/scripts/casebuilder.mjs`
as `CB` below. Verify Node is available. Do not pretend execution if it is not.

1. Resolve the company/business unit and the intended case file. Ask only when
   multiple companies or files materially fit. A company name is enough to start:
   `CB init "Company" --out "company.case.json"`. Never use `--force` automatically.
2. Read supplied discovery files and extract candidate values with their exact
   quote, origin and location. A benchmark or seller estimate stays an assumption;
   only direct evidence supports input state. The `business-case` skill documents
   the CLI. Use its input keys and source-writing options, not invented keys.
   Missing inputs stay blank; do not fill example numbers to make charts appear.
3. If public web is enabled and available, run `brand-discovery` for the company.
   Initial discovery is part of a new-case request; preserve existing authored
   overrides on subsequent runs and propose replacements instead. If unavailable,
   continue with explicit brand fallbacks and report that limitation.
4. Resolve stakeholder roles from the archetype and supplied material. For a full
   case request, run `account-research` to propose names if source tools are
   enabled. Never add researched people without selection. Missing people do not
   block the case. Do not invent names or silently omit unfamiliar titles.
5. Run `CB validate`, then `CB calc`. Missing figures remain open questions.
   Lead with the supplied strategic priority; among relevant drivers, prioritize
   stronger evidence, larger canonical contribution and a clear stakeholder
   consequence. Do not invent a "highest-value pain point" unsupported by these.
6. For requested outputs, run `case-deliverables`. Keep the seven-beat story and
   the fixed one-pager arrangement. Do not redesign the app or formulas.
7. Return actual artifact paths and the workflow-report template. Identify what
   ran, what was skipped, which findings await selection, open questions and any
   unavailable tools. No publish or messaging step is part of this command.

Do routine work autonomously; ask only for company/person disambiguation,
required missing access, or a consequential action outside the requested scope.
Do not make the user manage every intermediate step.
