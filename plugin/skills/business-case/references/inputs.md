# Inputs

Generated from the value model. Every key below can be set with `casebuilder.mjs set <file> key=value`.
Numeric inputs start empty. Example numbers are illustrative only and are never inserted into a new case. Calendar constants are structural. Source state distinguishes verified inputs, assumptions, suggestions and empty fields.

## Account

| Key | What it is | Type | Initial value | Example only |
|---|---|---|---|---|
| `companyName` | Company. Who the case is for. | text | Northwind Retail | Northwind Retail |
| `archetype` | Archetype. Sets which stakeholder tabs exist and which pillar leads the case. | select: Fast / AI-native / Scaling tech / Enterprise / Regulated enterprise | Enterprise | Enterprise |
| `strategicPriority` | What their leadership cares about this year. Sets which driver leads the deck. Separate from the archetype: that is the shape of the company, this is what is happening to them this year. | select: Audit and compliance / AI initiative / Migration / Cost pressure | Cost pressure | Cost pressure |

## Scale

| Key | What it is | Type | Initial value | Example only |
|---|---|---|---|---|
| `engineers` | Engineers. Usually findable from LinkedIn before the first call. | number | empty | 500 |
| `platformShare` | Share of engineering that is platform / DevEx. Chris's rule: roughly 30% of the engineering org is platform or DevEx. The platform headcount is worked out from this. | percent | empty | 30 |
| `hourlyCost` | Fully loaded cost per engineer hour. Salary, benefits and overhead. Chris uses $100/hr in his worked example. | number ($/hr) | empty | 100 |
| `maintPctToday` | Platform team time spent maintaining the portal, today. Share of the platform / DevEx team (not all engineers) kept busy upgrading, patching and running their current portal or wiki. | number (%) | empty | 4 |
| `maintPctPortal` | Platform team time spent maintaining the portal, with Portal | number (%) | empty | 2 |
| `toolSpendToday` | Overlapping tool spend, today. What they pay each year for tools Portal would replace or consolidate. | number ($/yr) | empty | 180000 |
| `toolSpendPortal` | Overlapping tool spend, with Portal | number ($/yr) | empty | 90000 |

## Speed

| Key | What it is | Type | Initial value | Example only |
|---|---|---|---|---|
| `searchHoursToday` | Time spent searching for docs, services and owners, today. Hours each engineer loses per week hunting. Industry estimates put tech debt at 2 to 5 days per engineer per month. | number (hrs / eng / week) | empty | 3 |
| `searchHoursPortal` | Time spent searching, with Portal. The conservatism dial. Chris: the hard part is getting the customer to agree the number is realistic for them. | number (hrs / eng / week) | empty | 2 |
| `rampDaysToday` | Days for a new hire to first contribution, today | number (days) | empty | 30 |
| `rampDaysPortal` | Days to first contribution, with Portal | number (days) | empty | 21 |
| `newHiresPerYear` | Engineers hired per year. From the hiring plan if you can get it. | number | empty | 80 |

## Chaos-control

| Key | What it is | Type | Initial value | Example only |
|---|---|---|---|---|
| `incidentHoursToday` | Hours each person spends on an incident, today. Most of it is finding who owns the failing service. | number (hrs) | empty | 4 |
| `incidentHoursPortal` | Hours each person spends on an incident, with Portal | number (hrs) | empty | 3.2 |
| `peoplePerIncident` | People pulled into each incident | number | empty | 5 |
| `incidentsPerMonth` | Incidents per month | number | empty | 12 |

## Standards and audit

| Key | What it is | Type | Initial value | Example only |
|---|---|---|---|---|
| `auditPrepDaysToday` | Days spent preparing for an audit — today. Per person, per audit: gathering evidence for who owns what and which standards are met. | number (days) | empty | 10 |
| `auditPrepDaysPortal` | Days spent preparing for an audit — with Portal | number (days) | empty | 5 |
| `auditsPerYear` | Audits or compliance reviews per year. Zero if the customer has none: the audit driver then drops off the deck. | number | empty | 4 |
| `peoplePerAudit` | People pulled into each audit | number | empty | 6 |

## Cost and alternative

| Key | What it is | Type | Initial value | Example only |
|---|---|---|---|---|
| `portalCost` | Portal annual subscription. A placeholder until there is a quote. | number ($/yr) | empty | 400000 |
| `selfHostEngineers` | Engineers needed to self-host Backstage. The comparison that decides most deals. Spotify's own deck puts standing up Backstage at 2 to 5 developers. It should also roughly match the upkeep hours Portal saves. | number | empty | 3 |
| `selfHostSalary` | Fully loaded cost per self-host engineer | number ($/yr) | empty | 210000 |

## Calendar

| Key | What it is | Type | Initial value | Example only |
|---|---|---|---|---|
| `weeksPerYear` | Working weeks per year. Chris's worked example uses about 48. | number | 48 | 48 |
| `hoursPerDay` | Working hours per day | number | 8 | 8 |
| `hoursPerYear` | Working hours per year | number | 2080 | 2080 |
