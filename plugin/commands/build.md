---
description: Build the PowerPoint, one-pager and interactive website for a case
argument-hint: [case file] [stakeholder] [pptx|onepager|website|all]
---

Build the deliverables for a business case using the **business-case** skill (step 7).

Arguments: $ARGUMENTS

Use the single `*.case.json` in the working folder unless one is named. First run `validate`, then `calc --md` and mention the case confidence and anything still assumed. Build for the stakeholder named (or ask which one if the case has several and none was named; the website lets the viewer switch). Default format is `all`, with `--pdf` for the one-pager. Finish by listing the files that were written and who each is for.
