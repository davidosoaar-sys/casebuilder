# Inputs

Generated from the value model. Every key below can be set with `casebuilder.mjs set <file> key=value`.
Numbers and percentages feed the model and count toward case confidence. "Starts as" is the status a new case begins with: **assumption** until the customer says the number on a call.

## Account

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `companyName` | Company. Who the case is for. | text | Northwind Retail | confirmed |
| `archetype` | Archetype. Sets which value drivers lead and which objection to expect. | select: Fast / AI-native / Scaling tech / Enterprise / Regulated enterprise | Enterprise | confirmed |

## Scale

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `engineers` | Engineers. Usually findable from LinkedIn before the first call. | number | 500 | confirmed |
| `hourlyCost` | Fully loaded cost per engineer hour. Salary, benefits and overhead. Chris uses $100/hr in his worked example. | number ($/hr) | 100 | assumption |

## Productivity

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `hoursLostPerWeek` | Hours lost per engineer per week. Hunting for docs, services and owners. Industry estimates put tech debt at 2 to 5 days per engineer per month. | number (hrs) | 3 | assumption |
| `captureRate` | Share of that time Portal recovers. The conservatism dial. Chris: the hard part is getting the customer to agree the number is realistic for them. | percent | 33 | assumption |

## Platform team

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `platformEngineers` | Platform team size. Drives both the maintenance saving and the self-host comparison. | number | 6 | confirmed |
| `pctTimeMaintaining` | Platform time spent maintaining Backstage. Upgrades, patches, infrastructure. Zero if they have not adopted OSS Backstage yet. | percent | 25 | assumption |

## Onboarding

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `newHiresPerYear` | Engineers hired per year. Often inferable from open roles plus headcount growth. | number | 80 | assumption |
| `daysSavedOnboarding` | Days saved to first contribution. How much sooner a new hire ships something real. | number (days) | 4 | assumption |

## Incidents

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `incidentsPerMonth` | Incidents per month | number | 12 | assumption |
| `hoursPerIncident` | Hours per incident | number (hrs) | 4 | assumption |
| `peoplePerIncident` | People pulled into each incident | number | 5 | assumption |
| `incidentReduction` | Incident time reduced by. Mostly from knowing who owns the broken service. | percent | 20 | assumption |

## Costs

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `currentToolSpend` | Current overlapping tool spend. Catalogues, docs portals, homegrown tooling Portal would replace. | number ($/yr) | 180000 | assumption |
| `toolConsolidation` | Share of that spend retired | percent | 50 | assumption |
| `portalCost` | Portal annual subscription. Pricing is quote-based, so this is a working figure until it is agreed. | number ($/yr) | 400000 | assumption |

## Alternative

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `selfHostEngineers` | Engineers needed to self-host Backstage. The build-it-ourselves alternative. Backstage is free; running it is not. | number | 3 | assumption |
| `selfHostSalary` | Fully loaded platform engineer salary | number ($/yr) | 210000 | assumption |
