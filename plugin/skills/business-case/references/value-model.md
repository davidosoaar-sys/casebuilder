# The value model

Every figure is plain arithmetic in `src/model.js`; nothing is generated. Normally run `casebuilder.mjs calc` instead and never do the arithmetic yourself. Each saving is a difference between a "today" input and a "with Portal" input.

## Figures, in order, with illustrative inputs (not the initial case state)

| Figure | Working | Value |
|---|---|---|
| `platformEngineers` | 500 * 30% | 150 |
| `hoursSavedPerEngPerWeek` | 3 - 2 | 1 |
| `productivityValue` | (3 - 2) * 500 * 48 * $100 | 2400000 |
| `rampDaysSaved` | 30 - 21 | 9 |
| `onboardingValue` | (30 - 21) * 80 * 8 * $100 | 576000 |
| `incidentHoursSaved` | (4 - 3.2) * 5 * 12 * 12 | 575.9999999999998 |
| `incidentValue` | 576 * $100 | 57599.99999999998 |
| `auditDaysSaved` | 10 - 5 | 5 |
| `standardsValue` | (10 - 5) * 4 * 6 * 8 * $100 | 96000 |
| `maintHoursSaved` | 150 * (4 - 2) / 100 * 2,080 | 6240 |
| `platformValue` | 6,240 * $100 | 624000 |
| `toolingValue` | $180,000 - $90,000 | 90000 |
| `totalValue` | $2,400,000 + $576,000 + $57,600 + $96,000 + $624,000 + $90,000 | 3843600 |
| `netValue` | $3,843,600 - $400,000 | 3443600 |
| `paybackMonths` | $400,000 / ($3,843,600 / 12) | 1.248829222603809 |
| `roiMultiple` | $3,843,600 / $400,000 | 9.609 |
| `fiveYearValue` | $3,443,600 * 5 | 17218000 |
| `selfHostCost` | 3 * $210,000 | 630000 |
| `versusSelfHost` | $630,000 - $400,000 | 230000 |

Completeness and zero/negative handling come from the canonical model. Do not present an incomplete figure as zero. Preserve signed net/cost differences; do not recompute figures in the agent.

## Against self-hosting

The comparison that decides most deals is Portal against self-hosting open-source Backstage, never Portal against doing nothing.

## Case confidence

Internal confidence is the share of active numeric inputs supported as inputs, excluding calendar constants. Keep confidence and source metadata out of client outputs. Review incomplete or unconfirmed fields as internal follow-up questions.

## Archetypes

- **Fast / AI-native**: stakeholders champion, cto; leads with speed. Short cycle, few approvers. Lead with speed, not governance. Likely alternative: Build something lightweight in-house.
- **Scaling tech**: stakeholders champion, cto, finance; leads with scale. Informal systems are breaking as headcount grows. Likely alternative: Self-host open source Backstage.
- **Enterprise**: stakeholders champion, cto, finance, security; leads with scale. Several approvers. Map the path early; procurement surfaces late. Likely alternative: Self-host open source Backstage with a funded platform team.
- **Regulated enterprise**: stakeholders champion, cto, finance, security; leads with chaos. Long cycle, many layers. Compliance evidence is the lever. Likely alternative: Self-host, or defer to the next budget year.
