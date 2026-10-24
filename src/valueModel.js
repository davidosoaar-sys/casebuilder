// The content around the model: what the inputs are, how they are grouped under
// Spotify's three pillars, who the stakeholders are, and how archetypes bias the
// case. The arithmetic itself lives in model.js; nothing here calculates a figure.
//
// Every formula comes from Chris's written answer to Q8 ("What inputs and KPIs
// do you use to calculate ROI?"). Every saving is a difference, so the inputs
// come in pairs: how it is today, and how it is with Portal.

import { fmtMoney, fmtHours, fmtMonths } from './format.js'

export { fmtMoney, fmtMoneyFull, fmtNum, fmtDec, fmtHours, fmtMonths } from './format.js'

export const WORKING_WEEKS = 48 // Chris's worked example uses about 48
export const HOURS_PER_YEAR = 2080

// ---------------------------------------------------------------------------
// Spotify's three pillars. Every value driver sits under one of them.
// ---------------------------------------------------------------------------

export const PILLARS = [
  { key: 'speed', label: 'Speed', blurb: 'Engineers spend their time building, not searching.', color: '#2fc7a8' },
  { key: 'chaos', label: 'Chaos-control', blurb: 'Fewer and shorter incidents, with clear owners.', color: '#e5399a' },
  { key: 'scale', label: 'Scale', blurb: 'The platform grows without growing the upkeep.', color: '#111111' }
]

export const DRIVERS = [
  { key: 'productivity', label: 'Engineer time recovered', short: 'Productivity', pillar: 'speed', figure: 'productivityValue' },
  { key: 'onboarding', label: 'Faster onboarding', short: 'Onboarding', pillar: 'speed', figure: 'onboardingValue' },
  { key: 'incidents', label: 'Shorter incidents', short: 'Incidents', pillar: 'chaos', figure: 'incidentValue' },
  { key: 'platform', label: 'Platform team maintenance avoided', short: 'Platform load', pillar: 'scale', figure: 'platformValue' },
  { key: 'tooling', label: 'Overlapping tooling retired', short: 'Tooling', pillar: 'scale', figure: 'toolingValue' }
].map(d => ({ ...d, color: PILLARS.find(p => p.key === d.pillar).color }))

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------
// `confirmed: false` means this is still an ASSUMPTION. It flips to true when the
// customer confirms it on a call. `structural` inputs (the calendar) are not
// claims about the customer, so they do not count toward confidence.

export const INPUT_GROUPS = ['Account', 'Scale', 'Speed', 'Chaos-control', 'Cost and alternative', 'Calendar']

export const INPUT_FIELDS = [
  // ---- Account
  { key: 'companyName', label: 'Company', group: 'Account', type: 'text', value: 'Northwind Retail', confirmed: true, help: 'Who the case is for.' },
  {
    key: 'archetype',
    label: 'Archetype',
    group: 'Account',
    type: 'select',
    options: ['Fast / AI-native', 'Scaling tech', 'Enterprise', 'Regulated enterprise'],
    value: 'Enterprise',
    confirmed: true,
    help: 'Sets which stakeholder tabs exist and which pillar leads the case.'
  },

  // ---- Scale
  { key: 'engineers', label: 'Engineers', group: 'Scale', type: 'number', value: 500, confirmed: true, help: 'Usually findable from LinkedIn before the first call.' },
  {
    key: 'platformShare',
    label: 'Share of engineering that is platform / DevEx',
    group: 'Scale',
    type: 'percent',
    value: 30,
    confirmed: false,
    help: "Chris's rule: roughly 30% of the engineering org is platform or DevEx. The platform headcount is worked out from this."
  },
  { key: 'hourlyCost', label: 'Fully loaded cost per engineer hour', group: 'Scale', type: 'number', value: 100, unit: '$/hr', confirmed: false, help: "Salary, benefits and overhead. Chris uses $100/hr in his worked example." },
  {
    key: 'maintPctToday', label: 'Platform team time spent maintaining the portal, today', group: 'Scale', type: 'number', value: 4, unit: '%', step: 0.5, confirmed: false, pair: 'maint', side: 'today',
    help: 'Share of the platform / DevEx team (not all engineers) kept busy upgrading, patching and running their current portal or wiki.'
  },
  { key: 'maintPctPortal', label: 'Platform team time spent maintaining the portal, with Portal', group: 'Scale', type: 'number', value: 2, unit: '%', step: 0.5, confirmed: false, pair: 'maint', side: 'portal' },
  { key: 'toolSpendToday', label: 'Overlapping tool spend, today', group: 'Scale', type: 'number', value: 180000, unit: '$/yr', step: 5000, confirmed: false, pair: 'tool', side: 'today', help: 'What they pay each year for tools Portal would replace or consolidate.' },
  { key: 'toolSpendPortal', label: 'Overlapping tool spend, with Portal', group: 'Scale', type: 'number', value: 90000, unit: '$/yr', step: 5000, confirmed: false, pair: 'tool', side: 'portal' },

  // ---- Speed
  {
    key: 'searchHoursToday', label: 'Time spent searching for docs, services and owners, today', group: 'Speed', type: 'number', value: 3, unit: 'hrs / eng / week', step: 0.5, confirmed: false, pair: 'search', side: 'today',
    help: 'Hours each engineer loses per week hunting. Industry estimates put tech debt at 2 to 5 days per engineer per month.'
  },
  {
    key: 'searchHoursPortal', label: 'Time spent searching, with Portal', group: 'Speed', type: 'number', value: 2, unit: 'hrs / eng / week', step: 0.5, confirmed: false, pair: 'search', side: 'portal',
    help: 'The conservatism dial. Chris: the hard part is getting the customer to agree the number is realistic for them.'
  },
  { key: 'rampDaysToday', label: 'Days for a new hire to first contribution, today', group: 'Speed', type: 'number', value: 14, unit: 'days', confirmed: false, pair: 'ramp', side: 'today' },
  { key: 'rampDaysPortal', label: 'Days to first contribution, with Portal', group: 'Speed', type: 'number', value: 10, unit: 'days', confirmed: false, pair: 'ramp', side: 'portal' },
  { key: 'newHiresPerYear', label: 'Engineers hired per year', group: 'Speed', type: 'number', value: 80, confirmed: false, help: 'From the hiring plan if you can get it.' },

  // ---- Chaos-control
  {
    key: 'incidentHoursToday', label: 'Hours each person spends on an incident, today', group: 'Chaos-control', type: 'number', value: 4, unit: 'hrs', step: 0.1, confirmed: false, pair: 'incident', side: 'today',
    help: 'Most of it is finding who owns the failing service.'
  },
  { key: 'incidentHoursPortal', label: 'Hours each person spends on an incident, with Portal', group: 'Chaos-control', type: 'number', value: 3.2, unit: 'hrs', step: 0.1, confirmed: false, pair: 'incident', side: 'portal' },
  { key: 'peoplePerIncident', label: 'People pulled into each incident', group: 'Chaos-control', type: 'number', value: 5, confirmed: false },
  { key: 'incidentsPerMonth', label: 'Incidents per month', group: 'Chaos-control', type: 'number', value: 12, confirmed: false },

  // ---- Cost and alternative
  { key: 'portalCost', label: 'Portal annual subscription', group: 'Cost and alternative', type: 'number', value: 400000, unit: '$/yr', step: 10000, confirmed: false, help: 'A placeholder until there is a quote.' },
  {
    key: 'selfHostEngineers', label: 'Engineers needed to self-host Backstage', group: 'Cost and alternative', type: 'number', value: 3, step: 0.5, confirmed: false,
    help: "The comparison that decides most deals. Spotify's own deck puts standing up Backstage at 2 to 5 developers. It should also roughly match the upkeep hours Portal saves."
  },
  { key: 'selfHostSalary', label: 'Fully loaded cost per self-host engineer', group: 'Cost and alternative', type: 'number', value: 210000, unit: '$/yr', step: 5000, confirmed: false },

  // ---- Calendar (structural: not claims about the customer)
  { key: 'weeksPerYear', label: 'Working weeks per year', group: 'Calendar', type: 'number', value: WORKING_WEEKS, confirmed: true, structural: true, help: "Chris's worked example uses about 48." },
  { key: 'hoursPerDay', label: 'Working hours per day', group: 'Calendar', type: 'number', value: 8, confirmed: true, structural: true },
  { key: 'hoursPerYear', label: 'Working hours per year', group: 'Calendar', type: 'number', value: HOURS_PER_YEAR, confirmed: true, structural: true }
]

// The today / with-Portal pairs. `valueFigure` is the model figure the saving is worth.
export const PAIRS = [
  { key: 'search', group: 'Speed', label: 'Time spent searching', unit: 'hrs / eng / week', today: 'searchHoursToday', portal: 'searchHoursPortal', saved: 'saved per engineer per week', valueFigure: 'productivityValue', driver: 'productivity' },
  { key: 'ramp', group: 'Speed', label: 'Days to first contribution', unit: 'days', today: 'rampDaysToday', portal: 'rampDaysPortal', saved: 'saved per new hire', valueFigure: 'onboardingValue', driver: 'onboarding' },
  { key: 'incident', group: 'Chaos-control', label: 'Hours per person per incident', unit: 'hrs', today: 'incidentHoursToday', portal: 'incidentHoursPortal', saved: 'saved per person per incident', valueFigure: 'incidentValue', driver: 'incidents' },
  { key: 'maint', group: 'Scale', label: 'Platform team time on upkeep', unit: '%', today: 'maintPctToday', portal: 'maintPctPortal', saved: 'of the platform team freed up', valueFigure: 'platformValue', driver: 'platform' },
  { key: 'tool', group: 'Scale', label: 'Overlapping tool spend', unit: '$/yr', today: 'toolSpendToday', portal: 'toolSpendPortal', saved: 'a year saved', valueFigure: 'toolingValue', driver: 'tooling', money: true }
]

const isClaim = f => (f.type === 'number' || f.type === 'percent') && !f.structural

// Share of the numbers that actually move the case that have been confirmed.
export function confidence(fields) {
  const material = fields.filter(isClaim)
  if (!material.length) return 0
  return Math.round((material.filter(f => f.confirmed).length / material.length) * 100)
}

export function unconfirmed(fields) {
  return fields.filter(f => !f.confirmed && isClaim(f))
}

// ---------------------------------------------------------------------------
// Stakeholder views
// ---------------------------------------------------------------------------
// REPLACE THE PLACEHOLDER COPY BELOW WITH CHRIS'S OWN WORDS. Headlines read the
// model: headline(model) where model = computeModel(inputs).

export const hoursBack = model =>
  model.figures.hoursSavedPerEngPerWeek.value * model.inputs.engineers * model.inputs.weeksPerYear

export const costsAvoided = model => model.figures.platformValue.value + model.figures.toolingValue.value

export const STAKEHOLDERS = [
  {
    key: 'champion',
    role: 'Director / VP Engineering',
    tag: 'Usually the champion',
    cares: 'Their team shipping instead of searching',
    lead: ['productivity', 'onboarding'],
    headline: m => `${fmtHours(hoursBack(m))} of engineering time back per year`,
    objection: 'My team already knows where things are.',
    counter: 'Ask how a new hire finds the owner of a service during an incident. The cost lands on the people who joined most recently.',
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
    headline: m => `${fmtMoney(costsAvoided(m))} of run cost avoided per year`,
    objection: 'Backstage is open source. Why are we paying for it?',
    counter: 'The licence is free, the operation is not. Self-hosting means a standing platform team for upgrades, patches and infrastructure, permanently.',
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
    headline: m => {
      const months = m.figures.paybackMonths.value
      return months > 0 ? `Payback in ${fmtMonths(months)}` : 'No payback on these figures'
    },
    objection: 'These savings are soft. Nobody gets laid off because of this.',
    counter: 'Present recovered capacity against hiring plans rather than as cash. The claim is avoided headcount, not reduced headcount.',
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
    counter: 'Bring them in during discovery rather than at contract. Chris lost weeks on a deal where procurement rules surfaced only after everyone had agreed.',
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
// An archetype decides who is in the room (the stakeholder tabs) and which pillar
// leads the case.

export const ARCHETYPES = {
  'Fast / AI-native': {
    stakeholders: ['champion', 'cto'],
    pillars: ['speed', 'chaos', 'scale'],
    note: 'Short cycle, few approvers. Lead with speed, not governance.',
    alternative: 'Build something lightweight in-house'
  },
  'Scaling tech': {
    stakeholders: ['champion', 'cto', 'finance'],
    pillars: ['scale', 'speed', 'chaos'],
    note: 'Informal systems are breaking as headcount grows.',
    alternative: 'Self-host open source Backstage'
  },
  Enterprise: {
    stakeholders: ['champion', 'cto', 'finance', 'security'],
    pillars: ['scale', 'speed', 'chaos'],
    note: 'Several approvers. Map the path early; procurement surfaces late.',
    alternative: 'Self-host open source Backstage with a funded platform team'
  },
  'Regulated enterprise': {
    stakeholders: ['champion', 'cto', 'finance', 'security'],
    pillars: ['chaos', 'scale', 'speed'],
    note: 'Long cycle, many layers. Compliance evidence is the lever.',
    alternative: 'Self-host, or defer to the next budget year'
  }
}

export const archetypePillars = name => (ARCHETYPES[name] || ARCHETYPES.Enterprise).pillars

// The stakeholders that should exist for an archetype: its built-in roles (keeping
// any edits or positions already made) plus every custom stakeholder the user added.
export function stakeholdersForArchetype(current, archetype) {
  const wanted = (ARCHETYPES[archetype] || ARCHETYPES.Enterprise).stakeholders
  const builtinKeys = STAKEHOLDERS.map(s => s.key)
  const kept = Object.fromEntries(current.filter(s => builtinKeys.includes(s.key)).map(s => [s.key, s]))
  const builtin = wanted.map(key => kept[key] || { key, builtin: true })
  const custom = current.filter(s => !builtinKeys.includes(s.key))
  return [...builtin, ...custom]
}

// ---------------------------------------------------------------------------
// The drivers, as the deck lays them out
// ---------------------------------------------------------------------------

export function allDrivers(model) {
  return DRIVERS.map(d => {
    const f = model.figures[d.figure]
    return { ...d, value: f.value, detail: f.equation, flag: f.flag }
  })
}

// Drivers grouped under the three pillars, in the archetype's order. The first
// pillar is the one that leads.
export function driversByPillar(model, archetype) {
  const drivers = allDrivers(model)
  return archetypePillars(archetype).map((key, i) => {
    const pillar = PILLARS.find(p => p.key === key)
    const items = drivers.filter(d => d.pillar === key)
    return { ...pillar, leads: i === 0, items, total: items.reduce((s, d) => s + d.value, 0) }
  })
}

// ---------------------------------------------------------------------------
// Projects saved before the inputs were pairs
// ---------------------------------------------------------------------------

export const OLD_INPUT_KEYS = new Set([
  'hoursLostPerWeek', 'captureRate', 'platformEngineers', 'pctTimeMaintaining', 'daysSavedOnboarding',
  'hoursPerIncident', 'incidentReduction', 'currentToolSpend', 'toolConsolidation'
])

const round1 = n => Math.round(n * 10) / 10

// Takes { key: { value, confirmed } } and returns the new-style keys derived from
// any old-style ones, so a case built the old way keeps its numbers. Existing
// new-style keys are never overwritten.
export function migrateOldInputs(saved) {
  const out = {}
  const has = k => saved[k] && saved[k].value != null
  const val = k => Number(saved[k].value)
  const ok = k => !!saved[k].confirmed

  if (has('hoursLostPerWeek') && !('searchHoursToday' in saved)) {
    const today = val('hoursLostPerWeek')
    const capture = has('captureRate') ? val('captureRate') : 33
    out.searchHoursToday = { value: today, confirmed: ok('hoursLostPerWeek') }
    out.searchHoursPortal = { value: round1(today * (1 - capture / 100)), confirmed: ok('hoursLostPerWeek') && has('captureRate') && ok('captureRate') }
  }
  if (has('daysSavedOnboarding') && !('rampDaysToday' in saved)) {
    const saving = val('daysSavedOnboarding')
    const today = Math.max(14, saving)
    out.rampDaysToday = { value: today, confirmed: false }
    out.rampDaysPortal = { value: today - saving, confirmed: false }
  }
  if (has('hoursPerIncident') && !('incidentHoursToday' in saved)) {
    const today = val('hoursPerIncident')
    const cut = has('incidentReduction') ? val('incidentReduction') : 20
    out.incidentHoursToday = { value: today, confirmed: ok('hoursPerIncident') }
    out.incidentHoursPortal = { value: round1(today * (1 - cut / 100)), confirmed: ok('hoursPerIncident') && has('incidentReduction') && ok('incidentReduction') }
  }
  if (has('currentToolSpend') && !('toolSpendToday' in saved)) {
    const today = val('currentToolSpend')
    const cut = has('toolConsolidation') ? val('toolConsolidation') : 50
    out.toolSpendToday = { value: today, confirmed: ok('currentToolSpend') }
    out.toolSpendPortal = { value: Math.round(today * (1 - cut / 100)), confirmed: ok('currentToolSpend') && has('toolConsolidation') && ok('toolConsolidation') }
  }
  if (has('pctTimeMaintaining') && !('maintPctToday' in saved)) {
    // The old model assumed Portal removed all of that upkeep.
    out.maintPctToday = { value: val('pctTimeMaintaining'), confirmed: false }
    out.maintPctPortal = { value: 0, confirmed: false }
    if (has('platformEngineers') && has('engineers') && val('engineers') > 0 && !('platformShare' in saved)) {
      out.platformShare = { value: Math.min(100, round1((val('platformEngineers') / val('engineers')) * 100)), confirmed: false }
    }
  }
  return out
}
