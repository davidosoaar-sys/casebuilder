# CaseBuilder working agreement

## Before each new change

1. Check `git status`, the current branch, and its upstream.
2. Run `git pull --ff-only` before editing. Do not skip this on later tasks.
3. Preserve existing uncommitted changes. Never discard, reset, or automatically
   stash someone else's work to make a pull succeed. If the pull cannot complete,
   report the actual blocker and preserve the working tree.

## Change notes and versions

- Every completed logical change needs a concise note in `CHANGELOG.md`.
  Keep local work under an unversioned `Unreleased` heading. A version identifies
  the release actually pushed to `main`, not each local edit or WIP snapshot.
  Assign its dated heading when preparing the push, for example
  `## v0.5.0 (2026-10-24)`.
- Use `vMAJOR.MINOR.PATCH`, with no dot after the `v`.
- Use PATCH for fixes, styling refinements, and documentation; MINOR for new
  features; follow the existing release policy for MAJOR versions.
- Update release versions only when preparing a release push. Keep the version
  in `package.json` and both root version fields in
  `package-lock.json` consistent. JSON versions omit the `v` prefix.
- Record the final user-visible change and relevant validation. Do not claim a
  working-tree change has been released or deployed.
- Run checks appropriate to the change. Include the version and a short change
  note in the final response.
- Commit, tag, push, and deploy only within the user's authorized scope. A request
  to maintain notes and version numbers is not itself a release instruction.

## Product and design scope

Read PRODUCT.md, DESIGN.md and WORKING_AGREEMENT.md before new work. Update the product brief when a completed change alters scope or product truth. Use its core workflow as the feature filter. Share the process with other projects only when the user authorizes it; adapt their product facts rather than copying CaseBuilder features.
