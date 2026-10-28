# Existing design system and artifact direction

Application: preserve the current Backstage-inspired sidebar, restrained light/
dark tokens, compact controls and established navigation composition. Labels
become Case Inputs, Case Artifacts and Live Room; internal route keys need not change.

Client artifacts: inherit the selected company’s logo, heading/body fonts and
palette. The Live Room is an editorial, interactive case, not stacked slide cards.
Use a company image only when supplied or sourced and approved; retain a deliberate
logo/type composition when no image exists. Never assign an unrelated stock photo.
Use actual value-driver charts and before/after comparisons as visual evidence.

One-pager: one A4 executive document, impact and decision visible first, a compact
comparison/driver diagram, scoped workflow context and explicitly recorded
stakeholder requirements. Keep sources and internal sales strategy private.

Motion: preserve the existing moving stakeholder map; use reduced-motion support
and visible defaults. No decorative moving background. Status boxes in client
outputs are a read-only snapshot, not a pretend shared task database.

These choices extend the incumbent implementation; they do not rebrand the app.

Deck-cover reference: https://casebuilder-site-omega.vercel.app/ — small customer
mark, large company name and concise pitch at left; cropped brand photography at
right with a soft fade in browser/PDF views. Preserve selected theme colors and
company fonts. Export actual editable text and a separate image, never a screenshot
of a composed marketing slide. Retain a typographic fallback when no image is found.

Onboarding starts with a short welcome/name step. Use anchored callouts with an
arrow, a dark scrim and a clear spotlight around the action; unrelated pointer
and keyboard navigation is blocked while the guide is open. Clicking the actual
action progresses its tip. Broad section tips use Continue; Skip tour is always
available. Position cards within the viewport and avoid whole-page outlines.
