# The value model

Use this when Node is unavailable and you must calculate by hand. Normally run `casebuilder.mjs calc` instead and never do the arithmetic yourself.

Base formula: **(hours saved × hourly cost) + costs avoided, minus the subscription.** Each driver is one line of the value-framing table.

## The five drivers

### Engineer time recovered (`productivity`)
`engineers × hoursLostPerWeek × (captureRate ÷ 100) × 48 working weeks × hourlyCost`
With the default inputs: 500 engineers x 3 hrs/week lost x 33% recovered x 48 weeks x $100/hr = **$2.4M**

### Platform team maintenance avoided (`platform`)
`platformEngineers × (pctTimeMaintaining ÷ 100) × 2,080 hours × hourlyCost`
With the default inputs: 6 platform engineers x 25% of their time x 2,080 hrs x $100/hr = **$312k**

### Faster onboarding (`onboarding`)
`newHiresPerYear × daysSavedOnboarding × 8 hours × hourlyCost`
With the default inputs: 80 new hires x 4 days saved x 8 hrs x $100/hr = **$256k**

### Shorter incidents (`incidents`)
`incidentsPerMonth × 12 × hoursPerIncident × peoplePerIncident × (incidentReduction ÷ 100) × hourlyCost`
With the default inputs: 12/month x 12 x 4 hrs x 5 people x 20% shorter x $100/hr = **$58k**

### Overlapping tooling retired (`tooling`)
`currentToolSpend × (toolConsolidation ÷ 100)`
With the default inputs: $180k/yr current spend x 50% retired = **$90k**

## Totals

- `annualValue` = sum of the five drivers (each floored at 0).
- `netYearOne` = annualValue − portalCost.
- `paybackMonths` = portalCost ÷ (annualValue ÷ 12), rounded, at least 1.
- `returnMultiple` = annualValue ÷ portalCost.
- `fiveYearNet` = netYearOne × 5.
- `costsAvoided` = platform + tooling drivers (what the CTO cares about).

## Against self-hosting

`selfHostCost` = selfHostEngineers × selfHostSalary per year. The comparison that decides most deals is Portal against self-hosting open-source Backstage, never Portal against doing nothing.
With the defaults: self-hosting $630k/yr vs Portal $400k/yr.

## Case confidence

The share of numeric and percent inputs that are **confirmed**. An input is confirmed only when the customer said it. Everything else is an assumption and is listed on the deck's honesty page as a question for the next call.

## Archetypes

- **Fast / AI-native**: stakeholders champion, cto. Short cycle, few approvers. Lead with speed, not governance. Likely alternative: Build something lightweight in-house.
- **Scaling tech**: stakeholders champion, cto, finance. Informal systems are breaking as headcount grows. Likely alternative: Self-host open source Backstage.
- **Enterprise**: stakeholders champion, cto, finance, security. Several approvers. Map the path early; procurement surfaces late. Likely alternative: Self-host open source Backstage with a funded platform team.
- **Regulated enterprise**: stakeholders champion, cto, finance, security. Long cycle, many layers. Compliance evidence is the lever. Likely alternative: Self-host, or defer to the next budget year.
