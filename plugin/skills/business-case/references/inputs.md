# Inputs

Generated from the value model. Every key below can be set with `casebuilder.mjs set <file> key=value`.
Numbers and percentages feed the model and count toward case confidence. "Starts as" is the status a new case begins with: **assumption** until the customer says the number on a call.

## Account

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `companyName` | Company. Who the case is for. | text | Northwind Retail | confirmed |
| `archetype` | Archetype. Sets which stakeholder tabs exist and which pillar leads the case. | select: Fast / AI-native / Scaling tech / Enterprise / Regulated enterprise | Enterprise | confirmed |

## Scale

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `engineers` | Engineers. Usually findable from LinkedIn before the first call. | number | 500 | confirmed |
| `platformShare` | Share of engineering that is platform / DevEx. Chris's rule: roughly 30% of the engineering org is platform or DevEx. The platform headcount is worked out from this. | percent | 30 | assumption |
| `hourlyCost` | Fully loaded cost per engineer hour. Salary, benefits and overhead. Chris uses $100/hr in his worked example. | number ($/hr) | 100 | assumption |
| `maintPctToday` | Platform team time spent maintaining the portal, today. Share of the platform / DevEx team (not all engineers) kept busy upgrading, patching and running their current portal or wiki. | number (%) | 4 | assumption |
| `maintPctPortal` | Platform team time spent maintaining the portal, with Portal | number (%) | 2 | assumption |
| `toolSpendToday` | Overlapping tool spend, today. What they pay each year for tools Portal would replace or consolidate. | number ($/yr) | 180000 | assumption |
| `toolSpendPortal` | Overlapping tool spend, with Portal | number ($/yr) | 90000 | assumption |

## Speed

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `searchHoursToday` | Time spent searching for docs, services and owners, today. Hours each engineer loses per week hunting. Industry estimates put tech debt at 2 to 5 days per engineer per month. | number (hrs / eng / week) | 3 | assumption |
| `searchHoursPortal` | Time spent searching, with Portal. The conservatism dial. Chris: the hard part is getting the customer to agree the number is realistic for them. | number (hrs / eng / week) | 2 | assumption |
| `rampDaysToday` | Days for a new hire to first contribution, today | number (days) | 14 | assumption |
| `rampDaysPortal` | Days to first contribution, with Portal | number (days) | 10 | assumption |
| `newHiresPerYear` | Engineers hired per year. From the hiring plan if you can get it. | number | 80 | assumption |

## Chaos-control

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `incidentHoursToday` | Hours each person spends on an incident, today. Most of it is finding who owns the failing service. | number (hrs) | 4 | assumption |
| `incidentHoursPortal` | Hours each person spends on an incident, with Portal | number (hrs) | 3.2 | assumption |
| `peoplePerIncident` | People pulled into each incident | number | 5 | assumption |
| `incidentsPerMonth` | Incidents per month | number | 12 | assumption |

## Cost and alternative

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `portalCost` | Portal annual subscription. A placeholder until there is a quote. | number ($/yr) | 400000 | assumption |
| `selfHostEngineers` | Engineers needed to self-host Backstage. The comparison that decides most deals. Spotify's own deck puts standing up Backstage at 2 to 5 developers. It should also roughly match the upkeep hours Portal saves. | number | 3 | assumption |
| `selfHostSalary` | Fully loaded cost per self-host engineer | number ($/yr) | 210000 | assumption |

## Calendar

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `weeksPerYear` | Working weeks per year. Chris's worked example uses about 48. | number | 48 | confirmed |
| `hoursPerDay` | Working hours per day | number | 8 | confirmed |
| `hoursPerYear` | Working hours per year | number | 2080 | confirmed |
