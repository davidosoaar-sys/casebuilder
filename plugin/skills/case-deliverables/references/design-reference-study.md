# CaseBuilder design reference study

Reviewed 2026-10-24. These are observations and proposed translations into
CaseBuilder, not claims that a reference's assets or code were imported.
The local samples use illustrative figures, not researched company business cases.

| Reference | Evidence reviewed | Transfer into CaseBuilder | Do not copy |
| --- | --- | --- | --- |
| [Stripe](https://stripe.com/) | Live homepage, browser screenshot and page structure: a large editorial statement, bright/light canvas, colorful hero artwork and product-specific diagrams. | Strong hierarchy and diagrams that explain the subject; use surface choices from the actual company page instead of a company-name-to-dark lookup. | Its hero gradient, customer logos, statistics or entire payment UI. The user pinned a flat company-identity cover. |
| [Linear](https://linear.app/) | Live homepage and browser screenshot: near-black canvas, bright large type, quieter secondary text and a bounded product artifact. | Dark hierarchy comes from readable type, differentiated surfaces and a purposeful visual focus. | Tiny low-contrast text, decorative app windows or Linear's product screenshots in a customer business case. |
| [Spotify for Backstage](https://backstage.spotify.com/) | Live page structure and browser preview: a specific developer-product identity and sections grouped around actual capabilities. | Verify the business unit and use its identity; group evidence by the question it answers. | Confusing music Spotify, Backstage.io and Spotify for Backstage; software-catalog UI or continuous moving labels rejected by the user. |
| [Nike](https://www.nike.com/) | Official page content and public logo/font assets; local Nike sample rendered. | Brand typography and clear monochrome contrast can carry a restrained design. Let the diagrams carry business evidence. | Athletic slogans as unsupported business claims or unrelated campaign photography. |
| [Lovable](https://lovable.dev/) | Official page content; logo and Camera Plain Variable inspected in the rendered DOM in the preceding sample pass; local sample rendered. | Preserve its mark and typography while maintaining readable body text and a measured content rhythm. | Recreating its chat box or placing a decorative gradient on every business-case section. |

## What the local samples reveal

The logo, palette and font are already reliable inputs for Nike and Lovable.
However, changing those tokens leaves much of the same document skeleton. The
samples are useful stress cases, not evidence that the current design is finished.

The next agent needs explicit composition decisions: how dense each beat is,
which diagram explains its evidence, what dominates, how secondary information
is revealed and how that beat becomes a still slide. More animation alone will
not resolve repetitive layouts or weak visual hierarchy.

For dark companies, a single black canvas with equally bright labels makes every
element compete. Use a deliberate hierarchy of ink, supporting text, diagram
surfaces and selected accents. Do not assume every dark case needs light sections;
the user may pin the same dark background throughout.

For mixed brands, inspect the current selected surface. Stripe's homepage in this
review is not a black page. If the user asks for a dark Stripe treatment, treat
that as an explicit design constraint and derive accessible tokens without
claiming that the homepage is dark.

## Durable direction

- Fixed seven-beat narrative, flexible evidence-driven compositions.
- Flat identity opening: correct logo, company name, approved background.
- Fonts, source data and model equations remain authoritative.
- One shared semantic design plan, separate website and 16:9 deck compositions.
- Readable dark and light treatments; no generic glow/glass treatment.
- Actual visual QA is required; a successful asset scan is not design approval.

The actionable future-agent prompt is [DESIGN_CASE](design-case.md).
This study and prompt do not change the current website/deck renderer or install
a chatbot command. The host must load the prompt, provide a snapshot and tools,
validate the plan, and render only after authorization.
