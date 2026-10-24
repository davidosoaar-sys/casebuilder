# CaseBuilder working agreement

## Before each new change

1. Check `git status`, the current branch, and its upstream.
2. Run `git pull --ff-only` before editing. Do not skip this on later tasks.
3. Preserve existing uncommitted changes. Never discard, reset, or automatically
   stash someone else's work to make a pull succeed. If the pull cannot complete,
   report the actual blocker and preserve the working tree.

## Change notes and versions

- Every completed logical change needs a concise change note in `CHANGELOG.md`,
  under a dated version heading, for example `## v0.2.1 (2026-10-24)`.
- Use `vMAJOR.MINOR.PATCH`, with no dot after the `v`.
- Use PATCH for fixes, styling refinements, and documentation; MINOR for new
  features; follow the existing release policy for MAJOR versions.
- Keep the version in `package.json` and both root version fields in
  `package-lock.json` consistent. JSON versions omit the `v` prefix.
- Record the final user-visible change and relevant validation. Do not claim a
  working-tree change has been released or deployed.
- Run checks appropriate to the change. Include the version and a short change
  note in the final response.
- Commit, tag, push, and deploy only within the user's authorized scope. A request
  to maintain notes and version numbers is not itself a release instruction.
