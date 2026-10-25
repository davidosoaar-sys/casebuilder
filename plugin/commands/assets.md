---
description: Find a company's official logo, fonts and brand colors
argument-hint: <company or case file> [official website]
---

Arguments: $ARGUMENTS

Read `${CLAUDE_PLUGIN_ROOT}/skills/brand-discovery/SKILL.md`. Resolve the company
from the named case or the only case in the folder; ask if ambiguous. Return
sourced findings, local assets and explicit fallbacks. Preserve existing authored
branding unless replacements are selected. Planner action: `brand-assets`.
