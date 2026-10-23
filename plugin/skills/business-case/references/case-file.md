# The case file

One JSON file per business case, usually `<company>.case.json`. The standalone CaseBuilder app imports and exports the same format. Always run `casebuilder.mjs validate <file>` after editing by hand. Prefer the commands (`set`, `stakeholder`, `person`) for everything except the deck.

```json
{
  "caseBuilder": 1,
  "company": "Northwind Retail",
  "inputs": {
    "engineers":   { "value": 1200, "confirmed": true },
    "hourlyCost":  { "value": 110,  "confirmed": true },
    "captureRate": { "value": 25,   "confirmed": false },
    "support_tickets": { "label": "Support tickets / month", "type": "number", "unit": "tickets", "value": 1200, "confirmed": false }
  },
  "stakeholders": [
    "champion",
    "cto",
    { "key": "custom_data", "role": "Head of Data", "tag": "Owns the data platform",
      "cares": "Data teams finding datasets", "objection": "We already have a data catalog.",
      "counter": "A catalog does not know who owns a service.", "needsToSee": ["Dataset ownership", "Lineage"] }
  ],
  "people": {
    "cto": [
      { "name": "Jane Doe", "title": "Chief Technology Officer", "email": "", "linkedin": "https://www.linkedin.com/in/jane-doe",
        "bio": "Joined in 2022 after leading platform engineering at a large retailer.",
        "sources": ["https://northwind.example/leadership"], "confidence": "high" }
    ]
  },
  "deck": []
}
```

- **`caseBuilder`** must be `1`. **`company`** is required.
- **`inputs`**: only the inputs you want to differ from the defaults need appearing. Built-in keys are listed in `inputs.md`. Percent inputs are 0 to 100, numbers are not negative. A key that is not built in needs `label` and `type` (`number`, `percent`, `text`) and is kept as a custom input (listed on the assumptions page, not part of the formulas).
- **`stakeholders`**: a built-in key (`champion`, `cto`, `finance`, `security`) or an object with a `role`. Leaving the list out means all four built-ins.
- **`people`**: keyed by stakeholder key. A researched person needs `sources` (URLs of the pages they were found on). Add `"found": false` for someone the user was simply told about. Never invent a person, an email or a LinkedIn URL.
- **`deck`**: optional. Leave it out to use the standard six pages. If present it replaces them.

## The deck

A deck is a list of slides; a slide is a list of blocks.

```json
"deck": [
  { "variant": "hero", "blocks": [
      { "type": "logo" },
      { "type": "text", "style": "eyebrow", "text": "Technology / Business case" },
      { "type": "text", "style": "hero", "text": "{company}" },
      { "type": "text", "style": "lede", "text": "Prepared for {role}" }
  ] },
  { "variant": "plain", "blocks": [
      { "type": "text", "style": "label", "text": "The number" },
      { "type": "text", "style": "headline", "text": "{headline}" },
      { "type": "stats", "items": ["annual", "net", "payback"] }
  ] },
  { "variant": "plain", "blocks": [
      { "type": "text", "style": "title", "text": "Why now at {company}" },
      { "type": "text", "style": "body", "text": "- The platform team is stretched\n- Onboarding takes weeks\n\nA closing paragraph." },
      { "type": "quote", "text": "Backstage is free. Running it is not." },
      { "type": "drivers" },
      { "type": "versus" }
  ] }
]
```

`ids` are optional. `variant` is `plain` or `hero` (gradient background).

### Block types

| `type` | Fields | Notes |
|---|---|---|
| `text` | `style`, `text` | Styles: `hero`, `headline`, `title`, `sub`, `lede`, `body`, `note`, `label`, `eyebrow`, `tag`, `forwhom`, `caption`. In `body`, lines starting `- ` are bullets and a blank line starts a new paragraph. |
| `quote` | `text` | A pull quote |
| `columns` | `left`, `right` | Two body-style columns |
| `image` | `src`, `caption` | `src` is a data URL, or a path to a png/jpg/gif/svg file relative to the case file |
| `stats` | `items` | Any of `annual`, `cost`, `net`, `payback`, `roi`, `five` (the "key numbers" tiles) |
| `drivers` | | Live bar chart of the five value drivers, with the selected stakeholder's lead drivers marked |
| `versus` | | Portal against self-hosting |
| `assumptions` | | What is confirmed and what is still assumed |
| `room` | | The selected stakeholder's needs, objection and counter |
| `logo`, `divider`, `spacer` | | |

### Tokens

Text can contain tokens that fill in from the case and follow the selected stakeholder: `{company}`, `{role}`, `{headline}`, `{cares}`, `{archetype}`, `{annual}`, `{net}`, `{payback}`, `{roi}`, `{five}`. Prefer tokens over typing numbers into text, so the deck stays correct when an input changes.

Live blocks (`stats`, `drivers`, `versus`, `assumptions`, `room`) always compute from the inputs. Do not type their numbers into text blocks.
