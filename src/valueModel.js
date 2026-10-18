// The value model.
//
// Every formula here comes from Chris's written answer to Q8 ("What inputs and
// KPIs do you use to calculate ROI?"). This file is the part a generic AI deck
// tool does not have: it encodes how Portal's economics actually work.
//
// Nothing here is generated. If a number is wrong, fix it here once and every
// deck the tool has ever produced is right from then on.

export const WORKING_WEEKS = 48 // Chris's worked example uses ~48
export const HOURS_PER_YEAR = 2080

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------
// `confirmed: false` means this is still an ASSUMPTION. It flips to true when
// the customer confirms it on a call. That is Chris's actual mechanic: a tab of
// assumptions that becomes a tab of inputs, and the more confirmed inputs you
// have, the stronger the case.

export const INPUT_FIELDS = [
  {
    key: 'companyName',
    label: 'Company',
    group: 'Account',
    type: 'text',
    value: 'Northwind Retail',
    confirmed: true,
    help: 'Who the case is for.'
  },
  {
    key: 'archetype',
    label: 'Archetype',
    group: 'Account',
    type: 'select',
    options: ['Fast / AI-native', 'Scaling tech', 'Enterprise', 'Regulated enterprise'],
    value: 'Enterprise',
    confirmed: true,
    help: 'Sets which value drivers lead and which objection to expect.'
  },
  {
    key: 'engineers',
    label: 'Engineers',
    group: 'Scale',
    type: 'number',
    value: 500,
    unit: '',
    confirmed: true,
    help: 'Usually findable from LinkedIn before the first call.'
  },
  {
    key: 'hourlyCost',
    label: 'Fully loaded cost per engineer hour',
    group: 'Scale',
    type: 'number',
    value: 100,
    unit: '$/hr',
    confirmed: false,
    help: 'Salary, benefits and overhead. Chris uses $100/hr in his worked example.'
  },
  {
    key: 'hoursLostPerWeek',
    label: 'Hours lost per engineer per week',
    group: 'Productivity',
    type: 'number',
    value: 3,
    unit: 'hrs',
    step: 0.5,
    confirmed: false,
    help: 'Hunting for docs, services and owners. Industry estimates put tech debt at 2 to 5 days per engineer per month.'
  },
  {
    key: 'captureRate',
    label: 'Share of that time Portal recovers',
    group: 'Productivity',
    type: 'percent',
    value: 33,
    confirmed: false,
    help: 'The conservatism dial. Chris: the hard part is getting the customer to agree the number is realistic for them.'
  },
  {
    key: 'platformEngineers',
    label: 'Platform team size',
    group: 'Platform team',
    type: 'number',
    value: 6,
    confirmed: true,
    help: 'Drives both the maintenance saving and the self-host comparison.'
  },
  {
    key: 'pctTimeMaintaining',
    label: 'Platform time spent maintaining Backstage',
    group: 'Platform team',
    type: 'percent',
    value: 25,
    confirmed: false,
    help: 'Upgrades, patches, infrastructure. Zero if they have not adopted OSS Backstage yet.'
  },
  {
    key: 'newHiresPerYear',
    label: 'Engineers hired per year',
    group: 'Onboarding',
    type: 'number',
    value: 80,
    confirmed: false,
    help: 'Often inferable from open roles plus headcount growth.'
  },
  {
    key: 'daysSavedOnboarding',
    label: 'Days saved to first contribution',
    group: 'Onboarding',
    type: 'number',
    value: 4,
    unit: 'days',
    step: 0.5,
    confirmed: false,
    help: 'How much sooner a new hire ships something real.'
  },
  {
    key: 'incidentsPerMonth',
    label: 'Incidents per month',
    group: 'Incidents',
    type: 'number',
    value: 12,
    confirmed: false
  },
  {
    key: 'hoursPerIncident',
    label: 'Hours per incident',
    group: 'Incidents',
    type: 'number',
    value: 4,
    unit: 'hrs',
    step: 0.5,
    confirmed: false
  },
  {
    key: 'peoplePerIncident',
    label: 'People pulled into each incident',
    group: 'Incidents',
    type: 'number',
    value: 5,
    confirmed: false
  },
  {
    key: 'incidentReduction',
    label: 'Incident time reduced by',
    group: 'Incidents',
    type: 'percent',
    value: 20,
    confirmed: false,
    help: 'Mostly from knowing who owns the broken service.'
  },
  {
    key: 'currentToolSpend',
    label: 'Current overlapping tool spend',
    group: 'Costs',
    type: 'number',
    value: 180000,
    unit: '$/yr',
    step: 10000,
    confirmed: false,
    help: 'Catalogues, docs portals, homegrown tooling Portal would replace.'
  },
  {
    key: 'toolConsolidation',
    label: 'Share of that spend retired',
    group: 'Costs',
    type: 'percent',
    value: 50,
    confirmed: false
  },
  {
    key: 'portalCost',
    label: 'Portal annual subscription',
    group: 'Costs',
    type: 'number',
    value: 400000,
    unit: '$/yr',
    step: 25000,
    confirmed: false,
    help: 'Pricing is quote-based, so this is a working figure until it is agreed.'
  },
  {
    key: 'selfHostEngineers',
    label: 'Engineers needed to self-host Backstage',
    group: 'Alternative',
    type: 'number',
    value: 3,
    step: 0.5,
    confirmed: false,
    help: 'The build-it-ourselves alternative. Backstage is free; running it is not.'
  },
  {
    key: 'selfHostSalary',
    label: 'Fully loaded platform engineer salary',
    group: 'Alternative',
    type: 'number',
    value: 210000,
    unit: '$/yr',
    step: 10000,
    confirmed: false
  }
]

// ---------------------------------------------------------------------------
// Benefit drivers
// ---------------------------------------------------------------------------
// Chris's base formula: (hours saved x hourly cost) + costs avoided, minus the
// subscription. Each driver below is one row of his "how we frame the value"
// table, turned into arithmetic.

export const DRIVERS = [
  {
    key: 'productivity',
    label: 'Engineer time recovered',
    short: 'Productivity',
    color: '#1db954',
    compute: i =>
      i.engineers *
      i.hoursLostPerWeek *
      (i.captureRate / 100) *
      WORKING_WEEKS *
      i.hourlyCost,
    explain: i =>
      `${fmtNum(i.engineers)} engineers x ${i.hoursLostPerWeek} hrs/week lost x ${i.captureRate}% recovered x ${WORKING_WEEKS} weeks x ${fmtMoney(i.hourlyCost)}/hr`
  },
  {
    key: 'platform',
    label: 'Platform team maintenance avoided',
    short: 'Platform load',
    color: '#2e77d0',
    compute: i =>
      i.platformEngineers *
      (i.pctTimeMaintaining / 100) *
      HOURS_PER_YEAR *
      i.hourlyCost,
    explain: i =>
      `${i.platformEngineers} platform engineers x ${i.pctTimeMaintaining}% of their time x ${fmtNum(HOURS_PER_YEAR)} hrs x ${fmtMoney(i.hourlyCost)}/hr`
  },
  {
    key: 'onboarding',
    label: 'Faster onboarding',
    short: 'Onboarding',
    color: '#f0a500',
    compute: i => i.newHiresPerYear * i.daysSavedOnboarding * 8 * i.hourlyCost,
    explain: i =>
      `${i.newHiresPerYear} new hires x ${i.daysSavedOnboarding} days saved x 8 hrs x ${fmtMoney(i.hourlyCost)}/hr`
  },
  {
    key: 'incidents',
    label: 'Shorter incidents',
    short: 'Incidents',
    color: '#e0533d',
    compute: i =>
      i.incidentsPerMonth *
      12 *
      i.hoursPerIncident *
      i.peoplePerIncident *
      (i.incidentReduction / 100) *
      i.hourlyCost,
    explain: i =>
      `${i.incidentsPerMonth}/month x 12 x ${i.hoursPerIncident} hrs x ${i.peoplePerIncident} people x ${i.incidentReduction}% shorter x ${fmtMoney(i.hourlyCost)}/hr`
  },
  {
    key: 'tooling',
    label: 'Overlapping tooling retired',
    short: 'Tooling',
    color: '#8e63d0',
    compute: i => i.currentToolSpend * (i.toolConsolidation / 100),
    explain: i =>
      `${fmtMoney(i.currentToolSpend)}/yr current spend x ${i.toolConsolidation}% retired`
  }
]

// ---------------------------------------------------------------------------
// Stakeholder views
// ---------------------------------------------------------------------------
// Q12: a real business case shows the VP of Engineering, finance and security
// each something different. In the Toronto session Chris went further: their
// goals actively conflict. A director wants productivity for their org, the CTO
// wants to cut a million in spend, and you arrive with a $500k tool.
//
// REPLACE THE PLACEHOLDER COPY BELOW WITH CHRIS'S OWN WORDS. This is the part
// of the tool nothing else can produce, and right now it is our guess at it.

export const STAKEHOLDERS = [
  {
    key: 'champion',
    role: 'Director / VP Engineering',
    tag: 'Usually the champion',
    cares: 'Their team shipping instead of searching',
    lead: ['productivity', 'onboarding'],
    headline: i =>
      `${fmtHours(driverHours(i, 'productivity'))} of engineering time back per year`,
    objection: 'My team already knows where things are.',
    counter:
      'Ask how a new hire finds the owner of a service during an incident. The cost lands on the people who joined most recently.',
    needsToSee: [
      'Time recovered per engineer, not just in aggregate',
      'Onboarding time for the hires they are about to make',
      'That it does not become another system their team has to maintain'
    ]
  },
  {
    key: 'cto',
    role: 'CTO',
    tag: 'Often has the opposite goal',
    cares: 'Cutting spend while the org keeps growing',
    lead: ['platform', 'tooling'],
    headline: i => `${fmtMoney(costsAvoided(i))} of run cost avoided per year`,
    objection: 'Backstage is open source. Why are we paying for it?',
    counter:
      'The licence is free, the operation is not. Self-hosting means a standing platform team for upgrades, patches and infrastructure, permanently.',
    needsToSee: [
      'Total cost of ownership against self-hosting, not against doing nothing',
      'What gets retired, not just what gets added',
      'That this is one line item replacing several'
    ]
  },
  {
    key: 'finance',
    role: 'Finance / Procurement',
    tag: 'Shows up late and can stall a done deal',
    cares: 'Payback, contract terms, and whether the numbers survive scrutiny',
    lead: ['productivity', 'tooling'],
    headline: i => `Payback in ${paybackMonths(i)} months`,
    objection: 'These savings are soft. Nobody gets laid off because of this.',
    counter:
      'Present recovered capacity against hiring plans rather than as cash. The claim is avoided headcount, not reduced headcount.',
    needsToSee: [
      'Payback period and five-year value',
      'Which inputs are confirmed and which are still assumptions',
      'A conservative case, not the best case'
    ]
  },
  {
    key: 'security',
    role: 'Security / Compliance',
    tag: 'The late arrival that kills timelines',
    cares: 'Proving which services meet which standards, on a date',
    lead: ['incidents', 'platform'],
    headline: () => 'Ownership and standards provable on demand',
    objection: 'This is another system holding our service metadata.',
    counter:
      'Bring them in during discovery rather than at contract. Chris lost weeks on a deal where procurement rules surfaced only after everyone had agreed.',
    needsToSee: [
      'Where the data lives and who can see it',
      'How standards are enforced and evidenced for an audit',
      'The review timeline, raised early enough to matter'
    ]
  }
]

// ---------------------------------------------------------------------------
// Archetype presets
// ---------------------------------------------------------------------------
// Small on purpose. These bias which drivers lead and flag the likely
// alternative. They are not the product.

export const ARCHETYPES = {
  'Fast / AI-native': {
    stakeholders: ['champion', 'cto'],
    note: 'Short cycle, few approvers. Lead with speed, not governance.',
    alternative: 'Build something lightweight in-house'
  },
  'Scaling tech': {
    stakeholders: ['champion', 'cto', 'finance'],
    note: 'Informal systems are breaking as headcount grows.',
    alternative: 'Self-host open source Backstage'
  },
  Enterprise: {
    stakeholders: ['champion', 'cto', 'finance', 'security'],
    note: 'Several approvers. Map the path early; procurement surfaces late.',
    alternative: 'Self-host open source Backstage with a funded platform team'
  },
  'Regulated enterprise': {
    stakeholders: ['champion', 'cto', 'finance', 'security'],
    note: 'Long cycle, many layers. Compliance evidence is the lever.',
    alternative: 'Self-host, or defer to the next budget year'
  }
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

export function driverValue(inputs, key) {
  const d = DRIVERS.find(x => x.key === key)
  return d ? Math.max(0, d.compute(inputs)) : 0
}

export function driverHours(inputs, key) {
  const v = driverValue(inputs, key)
  return inputs.hourlyCost > 0 ? v / inputs.hourlyCost : 0
}

export function allDrivers(inputs) {
  return DRIVERS.map(d => ({
    ...d,
    value: Math.max(0, d.compute(inputs)),
    detail: d.explain(inputs)
  })).sort((a, b) => b.value - a.value)
}

export function totalBenefit(inputs) {
  return DRIVERS.reduce((sum, d) => sum + Math.max(0, d.compute(inputs)), 0)
}

export function costsAvoided(inputs) {
  return driverValue(inputs, 'platform') + driverValue(inputs, 'tooling')
}

export function netValue(inputs) {
  return totalBenefit(inputs) - inputs.portalCost
}

export function paybackMonths(inputs) {
  const monthly = totalBenefit(inputs) / 12
  if (monthly <= 0) return '-'
  return Math.max(1, Math.round(inputs.portalCost / monthly))
}

export function roiMultiple(inputs) {
  if (inputs.portalCost <= 0) return 0
  return totalBenefit(inputs) / inputs.portalCost
}

export function fiveYearValue(inputs) {
  return netValue(inputs) * 5
}

// The self-host comparison. Chris's own framing: build-it-in-house is the
// biggest competitor, so the case is never Portal versus nothing.
export function selfHostCost(inputs) {
  return inputs.selfHostEngineers * inputs.selfHostSalary
}

export function versusSelfHost(inputs) {
  const self = selfHostCost(inputs)
  return {
    selfHost: self,
    portal: inputs.portalCost,
    delta: self - inputs.portalCost,
    cheaper: self > inputs.portalCost ? 'portal' : 'selfHost'
  }
}

// Confidence: what share of the inputs that actually move the number have been
// confirmed. This is the signal Chris described, surfaced instead of implied.
export function confidence(fields) {
  const material = fields.filter(f => f.type === 'number' || f.type === 'percent')
  if (!material.length) return 0
  return Math.round((material.filter(f => f.confirmed).length / material.length) * 100)
}

export function unconfirmed(fields) {
  return fields.filter(
    f => !f.confirmed && (f.type === 'number' || f.type === 'percent')
  )
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function fmtMoney(n) {
  if (n == null || isNaN(n)) return '-'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1_000) return `$${Math.round(n / 1000)}k`
  return `$${Math.round(n)}`
}

export function fmtMoneyFull(n) {
  if (n == null || isNaN(n)) return '-'
  return `$${Math.round(n).toLocaleString('en-US')}`
}

export function fmtNum(n) {
  if (n == null || isNaN(n)) return '-'
  return Math.round(n).toLocaleString('en-US')
}

export function fmtHours(n) {
  if (n == null || isNaN(n)) return '-'
  if (n >= 1000) return `${Math.round(n / 1000)}k hours`
  return `${Math.round(n)} hours`
}
