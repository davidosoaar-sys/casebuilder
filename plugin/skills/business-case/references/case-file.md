# Case file reference

The plugin works on a local `<company>.case.json` file. It does not automatically
sync an authenticated cloud deal, and the app has no case-import/export button.
Use `CB init`, `info`, `set`, `stakeholder`, `person`, `validate`, `calc` and `build`
for operations; do not substitute model keys from old examples.

```json
{
  "caseBuilder": 1,
  "company": "Northwind Example",
  "inputs": {
    "engineers": {
      "value": 500,
      "confirmed": true,
      "source": {"state":"input","origin":"Fictional discovery transcript, line 4","quote":"We have 500 engineers.","link":"","pinnedAt":""}
    },
    "searchHoursPortal": {
      "value": 2,
      "confirmed": false,
      "source": {"state":"assumption","origin":"Seller estimate","quote":"","link":"","pinnedAt":""}
    }
  },
  "stakeholders": ["champion", "cto", "finance", "security"],
  "people": {},
  "brand": {"headingFont":"Arial","bodyFont":"Arial","primary":"#224488","background":"#FFFFFF","text":"#111111"}
}
```

This is a fictional example, not research. Empty values are `""`; they are not
zero. Every numeric field retains its full source object. The legacy `confirmed`
boolean is compatibility data; source state is authoritative. Custom input keys
need a label/type and do not alter equations. Reference tables are generated from
the current model at package build time.

`brand` stores selected colors, heading/body font names and optional embedded
assets: `logo` is a base64 PNG/JPEG/WebP/SVG data URL under 1.2 MB; `fontData` is a
base64 WOFF/WOFF2/TTF/OTF data URL under 900 KB and requires `fontName`. Official
asset URLs go in `brand.sources`; retain detailed per-asset evidence in a separate
brand-findings report. Downloaded asset files are data, never executable code.

`people` is keyed by stakeholder key. Each person has name, title, optional
observed email/LinkedIn URL, source URLs, and optional title-inference `mapping`.
Keep mapping `state: inferred` and an explanation; it is not a verified claim
about the person's preferences. Built-in stakeholder objects can retain named
people and saved positions. Only selected people are added to the case.

`deck` is an optional ordered list of slides, each with `variant` and `blocks`.
Text blocks use `type: text`, a supported style and text; live blocks include
stats, drivers, pairs and versus. Use the existing model's supported block types.
Fonts, colors and sizing belong in each block's `design`. Preserve authored
content/IDs when editing. Validate after any direct JSON edit. Instructions for
composing exports live in `skills/case-deliverables/`.
