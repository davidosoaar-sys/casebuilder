# Interactive website framework

Every deal uses one semantic layout and design-token system. Brand colors, fonts
and logos populate the system; inputs supply the figures. No template contains
company-specific numbers or decorative third-party photography.

## 21st.dev references

- Animated Navigation Tabs by ln-dev7 (demo 575):
  https://21st.dev/@ln-dev7/components/animated-navigation-tabs
  Adapted active/hover states and the animated navigation indicator to native
  HTML/CSS so downloaded websites need no React or animation runtime.
- Bento Grid by designali-in (demo 4517):
  https://21st.dev/@designali-in/components/bento-grid
  Adapted the six-column responsive grid, semantic card slots, and optional
  title/description handling into the website metric and overview components.

## Layout contract

The earlier CoreShift reference informed the centered identity and section layout:
https://dribbble.com/shots/25869450-Sleek-Landing-Page-for-CoreShift
The current direction follows the user's Agent Stack reference for a persistent
diagram that changes as the reader scrolls: https://the-agent-stack.com/
Reference media is not embedded. The cover is the company logo and title on its
flat authored background, with no glowing tile, gradient or floating pill UI.
The removed Explore actions stay absent. Adjust the numbers replaces the global
perspective selector when valid scenario controls exist.
The main case is company-focused. Stakeholder framing stays within the map.
Numbered slide sections are not shown in website mode.

The current website story separates the cover (logo and title) from Overview,
then shows Business impact, Value drivers, What changes, The alternative and
Stakeholders. The original deck is not reordered. Original IDs remain attached
to copied text blocks so editing website copy still updates the correct deck
block. Missing figures show a waiting panel instead of dropping a section.
The final map uses the original radial layout and saved positions. Scrolling
through stakeholder stops moves the diagram left/right alongside each brief.
Named people already added to the deal appear on their role's node. Click/keyboard
controls reach the same stops; Full map and Escape return to the complete map.
Mobile keeps the map and tapped brief in normal flow. Reduced motion suppresses
transitions. No source or confidence metadata is shown.

- Cover: company logo followed by company name, with a quiet scroll hint.
- Overview: authored introduction, strategic context and an optional three-metric
  summary. Missing figures never become invented zeroes.
- Impact: cards expand to fill available space; arithmetic is disclosed on demand.
- Drivers, comparisons, alternative and stakeholder framing: distinct section
  types with stable navigation labels, flexible rows and readable line lengths.
- No usable sections: show a deliberate empty state, not a blank website.
- Brand contrast is checked against both page and card surfaces. Button text is
  checked against the primary color. Incompatible surfaces receive a neutral
  fallback in the same brightness family. Stored brand settings stay untouched.
- Explicit deck text/background overrides remain local to their blocks; text
  colors with insufficient contrast receive a readable website-only fallback.
  The original deck and stored brand settings are unchanged.
- Long words wrap, metric grids collapse, wide comparison rows scroll locally.
- Motion includes once-only scroll reveals, driver-bar reveals and the pinned
  stakeholder journey. Already-seen content stays visible through
  scenario updates. Reduced motion, unsupported observers, and print leave all
  content visible. No continuous background animation or external animation CDN.
- Scroll-reveal catalog metadata was reviewed on 21st.dev (cnippet-dev demo 18654);
  that source was not retrieved because the account's daily code quota was used.
  Scroll-reveal implementation is local; it is not claimed as imported code.

Preview, HTML download and publication all call `buildSiteHtml`. PDF and Slides
do not receive this framework. Business equations remain in the existing model.

## Typography fidelity

Company heading/body font choices remain authoritative in every output. Explicit
block fonts are retained in the deck-derived website, PDF, Slides and PPTX.
The One-pager uses the same company heading/body fonts for its rearranged content.
Uploaded web fonts are embedded in the HTML views; PDF printing waits for fonts.
PPTX preserves editable text and font names (including its theme); font files are
not embedded, so recipients need the selected fonts installed. Demo brands merge
their palette over the source project's full branding, rather than replacing its
font choices with defaults.

## Future design agent

The provider-neutral [DESIGN_CASE command](agents/design-case.md), its
[handoff guide](agents/README.md) and [reference study](design-reference-study.md)
specify how a future agent should plan distinct website and pitch-deck
compositions, including dark brands. This is an instruction/plan boundary, not
an implemented renderer adapter. It does not restyle existing client decks.
