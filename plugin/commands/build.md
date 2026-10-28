---
description: Build the PowerPoint, one-pager and interactive website for a case
argument-hint: [case file] [stakeholder] [pptx|google-slides|canva|onepager|website|all]
---

Build using `${CLAUDE_PLUGIN_ROOT}/skills/case-deliverables/SKILL.md`.

Arguments: $ARGUMENTS

Resolve the named case or the only case in the folder. Run `validate`, then
`calc`. Build requested formats; `all` is the default for an unqualified build
request. PDF is optional and requires tooling. Keep confidence/source details in
the internal report. The website uses the company story and stakeholder map;
slides/one-pager use the selected audience. Report actual files and QA limits.
