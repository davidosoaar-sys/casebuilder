# Inputs

Generated from the value model. Every key below can be set with `casebuilder.mjs set <file> key=value`.
Numbers and percentages feed the model and count toward case confidence. "Starts as" is the status a new case begins with: **assumption** until the customer says the number on a call.

## Account

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `companyName` | Company. Who the case is for. | text | Northwind Retail | assumption |
| `archetype` | Archetype. Sets which stakeholder tabs exist and which pillar leads the case. | select: Fast / AI-native / Scaling tech / Enterprise / Regulated enterprise | Enterprise | assumption |
| `strategicPriority` | What their leadership cares about this year. Sets which driver leads the deck. Separate from the archetype: that is the shape of the company, this is what is happening to them this year. | select: Audit and compliance / AI initiative / Migration / Cost pressure | Cost pressure | assumption |

## Scale

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `engineers` | Engineers. Usually findable from LinkedIn before the first call. | number |  | assumption |
| `platformShare` | Share of engineering that is platform / DevEx. Chris's rule: roughly 30% of the engineering org is platform or DevEx. The platform headcount is worked out from this. | percent |  | assumption |
| `hourlyCost` | Fully loaded cost per engineer hour. Salary, benefits and overhead. Chris uses $100/hr in his worked example. | number ($/hr) |  | assumption |
| `maintPctToday` | Platform team time spent maintaining the portal, today. Share of the platform / DevEx team (not all engineers) kept busy upgrading, patching and running their current portal or wiki. | number (%) |  | assumption |
| `maintPctPortal` | Platform team time spent maintaining the portal, with Portal | number (%) |  | assumption |
| `toolSpendToday` | Overlapping tool spend, today. What they pay each year for tools Portal would replace or consolidate. | number ($/yr) |  | assumption |
| `toolSpendPortal` | Overlapping tool spend, with Portal | number ($/yr) |  | assumption |

## Speed

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `searchHoursToday` | Time spent searching for docs, services and owners, today. Hours each engineer loses per week hunting. Industry estimates put tech debt at 2 to 5 days per engineer per month. | number (hrs / eng / week) |  | assumption |
| `searchHoursPortal` | Time spent searching, with Portal. The conservatism dial. Chris: the hard part is getting the customer to agree the number is realistic for them. | number (hrs / eng / week) |  | assumption |
| `rampDaysToday` | Days for a new hire to first contribution, today | number (days) |  | assumption |
| `rampDaysPortal` | Days to first contribution, with Portal | number (days) |  | assumption |
| `newHiresPerYear` | Engineers hired per year. From the hiring plan if you can get it. | number |  | assumption |

## Chaos-control

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `incidentHoursToday` | Hours each person spends on an incident, today. Most of it is finding who owns the failing service. | number (hrs) |  | assumption |
| `incidentHoursPortal` | Hours each person spends on an incident, with Portal | number (hrs) |  | assumption |
| `peoplePerIncident` | People pulled into each incident | number |  | assumption |
| `incidentsPerMonth` | Incidents per month | number |  | assumption |

## Standards and audit

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `auditPrepDaysToday` | Days spent preparing for an audit — today. Per person, per audit: gathering evidence for who owns what and which standards are met. | number (days) |  | assumption |
| `auditPrepDaysPortal` | Days spent preparing for an audit — with Portal | number (days) |  | assumption |
| `auditsPerYear` | Audits or compliance reviews per year. Zero if the customer has none: the audit driver then drops off the deck. | number |  | assumption |
| `peoplePerAudit` | People pulled into each audit | number |  | assumption |

## Cost and alternative

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `portalCost` | Portal annual subscription. A placeholder until there is a quote. | number ($/yr) |  | assumption |
| `selfHostEngineers` | Engineers needed to self-host Backstage. The comparison that decides most deals. Spotify's own deck puts standing up Backstage at 2 to 5 developers. It should also roughly match the upkeep hours Portal saves. | number |  | assumption |
| `selfHostSalary` | Fully loaded cost per self-host engineer | number ($/yr) |  | assumption |

## Calendar

| Key | What it is | Type | Default | Starts as |
|---|---|---|---|---|
| `weeksPerYear` | Working weeks per year. Chris's worked example uses about 48. | number | 48 | assumption |
| `hoursPerDay` | Working hours per day | number | 8 | assumption |
| `hoursPerYear` | Working hours per year | number | 2080 | assumption |
