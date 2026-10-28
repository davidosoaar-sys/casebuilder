---
name: brand-discovery
description: Find and verify a company's official logo variants, website fonts and colors for a CaseBuilder case. Use when a company is entered or brand assets are requested; return sourced findings and explicit fallbacks, not a generic redesign.
---

# Discover the correct identity

Prefer `casebuilder_discover_assets` when the local MCP is available. It uses the app’s official-site extraction and saves embedded asset bytes. Pass `webEnabled:true` only for authorized web access and `approved:true` only for authorized initial discovery or replacement. Verify unknown company domains with host search first. Inspect `logoFound`, `fontFiles` and `coverImageFound`; use authorized host research/download tools and `casebuilder_apply_brand` for missing assets. Saving names or research prose alone does not embed assets.

Read `${CLAUDE_PLUGIN_ROOT}/framework/README.md` and
`${CLAUDE_PLUGIN_ROOT}/templates/brand-findings.json`. Company name and optional
official URL/case file come from the action request. Use only enabled, available
sources. If `web` is disabled, do not visit the supplied URL or fetch its assets.

1. Resolve the actual entity and business unit from official pages. Ask when
   ambiguous. Distinguish Nike, a reseller, music Spotify, Backstage.io and
   Spotify for Backstage. Do not assume a company has a dark surface by name.
2. Prefer the official brand kit; otherwise inspect the rendered official page,
   its logo, CSS font declarations and observed font requests. Record every
   asset's public source URL, inspected date, light/dark suitability and variant.
3. Find heading/body fonts, weights and the actual file URLs if available. Download
   only required static assets into a case-specific assets directory using the
   host's tools. Never execute downloaded scripts. Preserve original logo colors,
   aspect ratio and clear space. A system stack is not a supplied font file.
4. Record canvas, surface, text and primary colors supported by the selected
   official surface. Do not invent a palette and label it extracted. If a font,
   variant or color is unavailable, put it under `notFound` and describe a proposed
   fallback separately. Rendering contrast corrections are design decisions, not
   research findings; keep them out of extracted brand facts.
5. Each entry in `claims` has its own `sourceUrl` and `sourceType`. Use keys such
   as `company`, `website`, `logo`, `headingFont`, `bodyFont`, `background`, `primary`.
   Asset entries can also name a local file. Record used/skipped source lists.
   Validate with `workflow.mjs validate brand --file findings.json`.
6. Present a compact preview of findings/fallbacks. For an authorized new case,
   populate its `brand` with verified values and embedded safe image/font data,
   retaining URLs in `brand.sources`. Use `normalizeBrand`'s documented data URL
   limits (logo <1.2 MB, font <900 KB); unsupported/missing assets remain fallbacks.
   If editing an existing authored brand, require selection before replacement.
   Run `CB validate` after applying; never touch case inputs/equations.

Do not claim a font was embedded just because its name was saved. Validate actual
font loading and logo visibility during deliverable QA. If an export cannot use
an asset, explain the format-specific fallback. Research success is not design QA.

For the deck cover, also find a clear product, campaign, packaging or company
environment photograph on official public pages. Prefer a large image suitable
for cropping into the right half of a landscape slide. Shoes and other products
are valid imagery; logo tiles, screenshots and precomposed deck covers are not.
Save the verified embedded PNG/JPEG/WebP as `brand.heroImage`, an accurate
description as `heroAlt` and its public provenance as `heroSource`. Safe SVG logos now convert locally to PNG for PPTX while HTML retains the original. Never generate substitute brand assets. Missing official photography stays a disclosed typographic fallback.
