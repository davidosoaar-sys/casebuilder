# The value model

Every figure is plain arithmetic in `src/model.js`; nothing is generated. Normally run `casebuilder.mjs calc` instead and never do the arithmetic yourself. Each saving is a difference between a "today" input and a "with Portal" input.

## Figures, in order, with the default inputs

| Figure | Working | Value |
|---|---|---|
| `platformEngineers` | 500 * 30% | 150 |
| `hoursSavedPerEngPerWeek` | 3 - 2 | 1 |
| `productivityValue` | (3 - 2) * 500 * 48 * $100 | 2400000 |
| `rampDaysSaved` | 14 - 10 | 4 |
| `onboardingValue` | (14 - 10) * 80 * 8 * $100 | 256000 |
| `incidentHoursSaved` | (4 - 3.2) * 5 * 12 * 12 | 575.9999999999998 |
| `incidentValue` | 576 * $100 | 57599.99999999998 |
| `maintHoursSaved` | 150 * (4 - 2) / 100 * 2,080 | 6240 |
| `platformValue` | 6,240 * $100 | 624000 |
| `toolingValue` | $180,000 - $90,000 | 90000 |
| `totalValue` | $2,400,000 + $256,000 + $57,600 + $624,000 + $90,000 | 3427600 |
| `netValue` | $3,427,600 - $400,000 | 3027600 |
| `paybackMonths` | $400,000 / ($3,427,600 / 12) | 1.4003967790874081 |
| `roiMultiple` | $3,427,600 / $400,000 | 8.569 |
| `fiveYearValue` | $3,027,600 * 5 | 15138000 |
| `selfHostCost` | 3 * $210,000 | 630000 |
| `versusSelfHost` | $630,000 - $400,000 | 230000 |

Division by zero gives 0, every value figure is floored at 0, and no figure is ever NaN or Infinity.

## Against self-hosting

The comparison that decides most deals is Portal against self-hosting open-source Backstage, never Portal against doing nothing.

## Case confidence

The share of numeric and percent inputs (excluding the calendar) that are **confirmed**. An input is confirmed only when the customer said it. Everything else is an assumption and is listed on the deck's honesty page as a question for the next call.

## Archetypes

- **Fast / AI-native**: stakeholders champion, cto; leads with speed. Short cycle, few approvers. Lead with speed, not governance. Likely alternative: Build something lightweight in-house.
- **Scaling tech**: stakeholders champion, cto, finance; leads with scale. Informal systems are breaking as headcount grows. Likely alternative: Self-host open source Backstage.
- **Enterprise**: stakeholders champion, cto, finance, security; leads with scale. Several approvers. Map the path early; procurement surfaces late. Likely alternative: Self-host open source Backstage with a funded platform team.
- **Regulated enterprise**: stakeholders champion, cto, finance, security; leads with chaos. Long cycle, many layers. Compliance evidence is the lever. Likely alternative: Self-host, or defer to the next budget year.
