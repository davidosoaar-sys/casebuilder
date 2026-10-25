# From a user request to a branded CaseBuilder case

This is the process behind the manually refined samples, translated into a repeatable agent workflow. It is not a promise that every website exposes its fonts/assets or that a prompt alone produces a good design.

## 1. Translate intent into an output brief

Read the company, audience, requested formats and explicit visual choices. Translate “Spotify black, Nike white, logo first, good scrolling” into: correct company identity; evidence-based canvas; original logo/type/palette; seven content beats; readable diagrams; useful motion; saved branding reused across formats. Preserve authored choices and existing equations. Do not replace the application/sidebar design.

## 2. Research the visual identity

Resolve the exact company and business unit. Start with the official homepage and linked brand/media pages. Check the verified public company LinkedIn page for secondary logo evidence; do not treat LinkedIn’s own typography and colors as the company's identity. Never guess domains, social slugs, logo URLs or fonts. Never bypass login-only pages. Follow HTML base paths, CSS URLs and font declarations rather than grabbing the first image with “logo” in its name.

Collect candidates with provenance: official wordmark/mark variants, actual heading and body declarations, downloadable font files, semantic CSS colors and the observed canvas. A font name is not a downloaded file. A popular CSS color is not necessarily the primary brand color.

## 3. Make the designer's selection

Use source authority, then intended role, then visual coherence:

- Choose the official full mark appropriate to the canvas, not a partner logo, product illustration or favicon when a real logo is available.
- Retain the original mark and aspect ratio. Choose another sourced light/dark variant when needed. If none is legible on the canvas, give the mark a bounded neutral field rather than recoloring it or changing the whole company’s identity.
- Keep the fonts actually used for headings and body. Ignore icon faces and reset stacks as brand-font evidence. Download both role families when available; label named-only fonts/fallbacks plainly.
- Decide canvas, panel, text, secondary text and accent separately. Use explicit page/token roles ahead of raw frequency. Brand accent should support a decision or diagram, not paint every surface.
- Preserve the brand's observed light/dark character. Do not impose a dark SaaS treatment on a light identity or a bland white report on a dark identity.

The live asset-selection phase receives a bounded catalog and returns candidate IDs only. It cannot invent another URL, font, logo or hex color. Code rejects unsupported IDs, screens files, checks contrast and records fallback/readability decisions. A failed or unavailable selection pass is labeled as an extracted fallback, not successful AI curation.

## 4. Fit the content to the maintained templates

Use the existing sequence: logo/company identity, overview, business impact, value drivers, what changes, alternative, stakeholders. The saved brand snapshot feeds website, deck, one-pager and PDF/slides previews. Financial figures stay in the canonical model. Do not invent a value for an empty field, recalculate ROI in the model, or insert internal source/confidence metadata into client outputs.

Choose charts for meaningful supplied quantities and maps for actual relationships. Keep scales and units honest. Motion should help reveal or compare the information, respect reduced motion and keep the site usable without animation. The current renderer implements these templates; a free-form AI layout plan is not a live redesign command.

## 5. Render, inspect and correct

Look at the actual output: cover first, then dense figures, comparison and stakeholder sections. Check the original mark's visibility, loaded font families, line breaks, text density, chart labels and mobile overflow. Check other formats preserve the same company identity. Fix the weakest section rather than adding decoration everywhere.

The sample work included human visual inspection and iteration. The server currently checks sources, candidate validity and contrast; it does not run a browser or certify visual quality. The app’s brand preview and “Brand decisions and checks” section expose the selected values and limitations. A human still reviews the actual preview. Do not claim a screenshot/font/layout check ran unless it did.

## 6. Definition of a good result

The case is recognizably that company before reading the numbers. Every brand asset has an actual source. Headline and body fonts retain their roles. Main and secondary text are readable. Missing assets remain explicit. Original business content/equations are preserved. The website feels like a website, the one-pager reads as one page, and the slide deck remains legible as slides. No automatic publishing or silent overwrite of authored choices.

## Reference decisions from the samples

These describe design decisions, not an official reusable brand-asset library or current company data:

| Sample direction | Decision to learn | What not to copy blindly |
| --- | --- | --- |
| Nike | Light canvas, dark original mark, restrained hierarchy | Do not force every brand into black-and-white minimalism |
| Spotify | Dark canvas, appropriate logo variant, green used selectively | Do not make every dark company's accent Spotify green |
| Lovable | Warm light identity, supplied company font, clear editorial rhythm | Do not invent a purple gradient because it is an AI company |
| Fortnite | Expressive supplied accent with readable dark surfaces | Do not invent the licensed display font; its missing download was an explicit sample limitation |

## Where this runs

- `server/brand.js`: identity/source extraction, real logo/font retrieval.
- `server/brandSelection.js`: candidate catalog, bounded model selection, validation and review report.
- `server/agent-commands/brandSelectionPrompt.js`: trusted instructions for the selection phase.
- `src/brand.js`: one portable brand snapshot, font-face definitions and export identity.
- Existing website/deck/one-pager renderers: compose the saved deal with that snapshot.
- `docs/agents/design-case.md`: future full layout-planning contract; it is not an active free-form renderer.

Use the command scorecard plus actual render review. Offline fixtures demonstrate guards and reproducibility; they do not prove a live model has good taste or that a source is semantically correct.
