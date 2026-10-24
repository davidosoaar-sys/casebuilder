// The content around the model: what the inputs are, how they are grouped under
// Spotify's three pillars, who the stakeholders are, and how archetypes bias the
// case. The arithmetic itself lives in model.js; nothing here calculates a figure.
//
// Every formula comes from Chris's written answer to Q8 ("What inputs and KPIs
// do you use to calculate ROI?"). Every saving is a difference, so the inputs
// come in pairs: how it is today, and how it is with Portal.

import { fmtMoney, fmtHours, fmtMonths } from './format.js'
import { emptySource, stateOf, sourceFromLegacy, validSource, ORIGIN } from './source.js'

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
  { key: 'standards', label: 'Audit and compliance work avoided', short: 'Standards', pillar: 'chaos', figure: 'standardsValue' },
  { key: 'platform', label: 'Platform team maintenance avoided', short: 'Platform load', pillar: 'scale', figure: 'platformValue' },
  { key: 'tooling', label: 'Overlapping tooling retired', short: 'Tooling', pillar: 'scale', figure: 'toolingValue' }
].map(d => ({ ...d, color: PILLARS.find(p => p.key === d.pillar).color }))

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------
// Every answer starts empty and carries a `source` (see source.js): an input is
// something the customer said or a checkable public fact, an assumption is Chris's
// own read, a suggestion is something the tool proposed. `structural` inputs (the calendar) are not
// claims about the customer, so they do not count toward confidence.

export const STRATEGIC_PRIORITIES = ['Audit and compliance', 'AI initiative', 'Migration', 'Cost pressure']

// What leadership cares about this year decides which drivers lead the deck.
export const PRIORITY_DRIVERS = {
  'Audit and compliance': ['standards'],
  'AI initiative': ['productivity'],
  Migration: ['productivity'],
  'Cost pressure': ['platform', 'tooling']
}

export const INPUT_GROUPS = ['Account', 'Scale', 'Speed', 'Chaos-control', 'Standards and audit', 'Cost and alternative', 'Calendar']

const FIELD_DEFS = [
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

  {
    key: 'strategicPriority',
    label: 'What their leadership cares about this year',
    group: 'Account',
    type: 'select',
    options: STRATEGIC_PRIORITIES,
    value: 'Cost pressure',
    confirmed: true,
    help: 'Sets which driver leads the deck. Separate from the archetype: that is the shape of the company, this is what is happening to them this year.'
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
  { key: 'rampDaysToday', label: 'Days for a new hire to first contribution, today', group: 'Speed', type: 'number', value: 30, unit: 'days', confirmed: false, pair: 'ramp', side: 'today' },
  { key: 'rampDaysPortal', label: 'Days to first contribution, with Portal', group: 'Speed', type: 'number', value: 21, unit: 'days', confirmed: false, pair: 'ramp', side: 'portal' },
  { key: 'newHiresPerYear', label: 'Engineers hired per year', group: 'Speed', type: 'number', value: 80, confirmed: false, help: 'From the hiring plan if you can get it.' },

  // ---- Chaos-control
  {
    key: 'incidentHoursToday', label: 'Hours each person spends on an incident, today', group: 'Chaos-control', type: 'number', value: 4, unit: 'hrs', step: 0.1, confirmed: false, pair: 'incident', side: 'today',
    help: 'Most of it is finding who owns the failing service.'
  },
  { key: 'incidentHoursPortal', label: 'Hours each person spends on an incident, with Portal', group: 'Chaos-control', type: 'number', value: 3.2, unit: 'hrs', step: 0.1, confirmed: false, pair: 'incident', side: 'portal' },
  { key: 'peoplePerIncident', label: 'People pulled into each incident', group: 'Chaos-control', type: 'number', value: 5, confirmed: false },
  { key: 'incidentsPerMonth', label: 'Incidents per month', group: 'Chaos-control', type: 'number', value: 12, confirmed: false },

  // ---- Standards and audit
  {
    key: 'auditPrepDaysToday', label: 'Days spent preparing for an audit — today', group: 'Standards and audit', type: 'number', value: 10, unit: 'days', confirmed: false, pair: 'audit', side: 'today',
    help: 'Per person, per audit: gathering evidence for who owns what and which standards are met.'
  },
  { key: 'auditPrepDaysPortal', label: 'Days spent preparing for an audit — with Portal', group: 'Standards and audit', type: 'number', value: 5, unit: 'days', confirmed: false, pair: 'audit', side: 'portal' },
  { key: 'auditsPerYear', label: 'Audits or compliance reviews per year', group: 'Standards and audit', type: 'number', value: 4, confirmed: false, help: 'Zero if the customer has none: the audit driver then drops off the deck.' },
  { key: 'peoplePerAudit', label: 'People pulled into each audit', group: 'Standards and audit', type: 'number', value: 6, confirmed: false },

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

// A numeric input the customer has to answer: it starts blank and unconfirmed, and
// the deck fills in as soon as there is a value. The calendar (structural) keeps its
// constants. DEMO_VALUES are the old starting numbers, kept for tests and docs.
const isAnswer = f => (f.type === 'number' || f.type === 'percent') && !f.structural

export const DEMO_VALUES = Object.fromEntries(FIELD_DEFS.map(f => [f.key, f.value]))

export const INPUT_FIELDS = FIELD_DEFS.map(({ confirmed, ...f }) => {
  if (isAnswer(f)) return { ...f, value: '', source: emptySource() }
  if (f.structural) return { ...f, source: { state: 'input', origin: ORIGIN.calendar } }
  return { ...f, source: { state: 'input', origin: '' } }
})

// A saved field's source: the one it has, or one worked out from `confirmed`.
export function sourceOf(saved) {
  if (validSource(saved.source)) return saved.source
  return sourceFromLegacy(saved.value, saved.confirmed)
}

// The today / with-Portal pairs. `valueFigure` is the model figure the saving is worth.
export const PAIRS = [
  { key: 'search', group: 'Speed', label: 'Time spent searching', unit: 'hrs / eng / week', today: 'searchHoursToday', portal: 'searchHoursPortal', saved: 'saved per engineer per week', valueFigure: 'productivityValue', driver: 'productivity' },
  { key: 'ramp', group: 'Speed', label: 'Days to first contribution', unit: 'days', today: 'rampDaysToday', portal: 'rampDaysPortal', saved: 'saved per new hire', valueFigure: 'onboardingValue', driver: 'onboarding' },
  { key: 'incident', group: 'Chaos-control', label: 'Hours per person per incident', unit: 'hrs', today: 'incidentHoursToday', portal: 'incidentHoursPortal', saved: 'saved per person per incident', valueFigure: 'incidentValue', driver: 'incidents' },
  { key: 'audit', group: 'Standards and audit', label: 'Days preparing for an audit', unit: 'days', today: 'auditPrepDaysToday', portal: 'auditPrepDaysPortal', saved: 'saved per person per audit', valueFigure: 'standardsValue', driver: 'standards' },
  { key: 'maint', group: 'Scale', label: 'Platform team time on upkeep', unit: '%', today: 'maintPctToday', portal: 'maintPctPortal', saved: 'of the platform team freed up', valueFigure: 'platformValue', driver: 'platform' },
  { key: 'tool', group: 'Scale', label: 'Overlapping tool spend', unit: '$/yr', today: 'toolSpendToday', portal: 'toolSpendPortal', saved: 'a year saved', valueFigure: 'toolingValue', driver: 'tooling', money: true }
]

const isClaim = f => (f.type === 'number' || f.type === 'percent') && !f.structural

// Confidence counts INPUTS only: numbers the customer stated or a public source
// shows. Assumptions and suggestions do not count, and neither do blanks.
export function confidence(fields) {
  const material = fields.filter(isClaim)
  if (!material.length) return 0
  return Math.round((material.filter(f => stateOf(f) === 'input').length / material.length) * 100)
}

// Everything still to confirm: blank, assumed or only suggested.
export function unconfirmed(fields) {
  return fields.filter(f => isClaim(f) && stateOf(f) !== 'input')
}

// ---------------------------------------------------------------------------
// Stakeholder views
// ---------------------------------------------------------------------------
// REPLACE THE PLACEHOLDER COPY BELOW WITH CHRIS'S OWN WORDS. Headlines read the
// model: headline(model) where model = computeModel(inputs).

export const hoursBack = model =>
  model.figures.hoursSavedPerEngPerWeek.value * model.inputs.engineers * model.inputs.weeksPerYear

// What the CTO cares about: the run cost avoided, from whichever of the two can be computed.
export function costsAvoided(model) {
  const parts = ['platformValue', 'toolingValue'].map(k => model.figures[k]).filter(f => !f.incomplete)
  return parts.length ? parts.reduce((s, f) => s + f.value, 0) : null
}

export const STAKEHOLDERS = [
  {
    key: 'champion',
    role: 'Director / VP Engineering',
    tag: 'Usually the champion',
    cares: 'Their team shipping instead of searching',
    lead: ['productivity', 'onboarding'],
    headline: m =>
      m.figures.hoursSavedPerEngPerWeek.incomplete || m.blankInputs.includes('engineers')
        ? null
        : `${fmtHours(hoursBack(m))} of engineering time back per year`,
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
    headline: m => {
      const avoided = costsAvoided(m)
      return avoided == null ? null : `${fmtMoney(avoided)} of run cost avoided per year`
    },
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
      if (m.figures.paybackMonths.incomplete) return null
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
    lead: ['standards', 'incidents'],
    headline: m =>
      !m.figures.standardsValue.incomplete && m.figures.standardsValue.value > 0
        ? `${fmtMoney(m.figures.standardsValue.value)} of audit effort avoided per year`
        : 'Ownership and standards provable on demand',
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
  const custom = current.filter(s => !builtinKeys.includes(s.key) || (!wanted.includes(s.key) && s.namedPeople?.length))
  return [...builtin, ...custom]
}

// ---------------------------------------------------------------------------
// The drivers, as the deck lays them out
// ---------------------------------------------------------------------------

// A customer who says they have no audits has no audit driver: it is left off rather
// than shown empty. (A blank is different: that is a gap, not a zero.)
const hasDriver = (model, d) => !(d.key === 'standards' && model.inputs.auditsPerYear === 0 && !model.blankInputs.includes('auditsPerYear'))

// Every driver this customer has, with whether it can be computed yet.
export function allDrivers(model) {
  return DRIVERS.filter(d => hasDriver(model, d)).map(d => {
    const f = model.figures[d.figure]
    return { ...d, value: f.value, detail: f.equation, flag: f.flag, incomplete: f.incomplete, missing: f.missing }
  })
}

// Only the drivers that can be computed: what the deck is allowed to show.
export const computableDrivers = model => allDrivers(model).filter(d => !d.incomplete)

// Chris's view: how many drivers are done, and what each unfinished one is waiting on.
export function completeness(model) {
  const all = allDrivers(model)
  return {
    total: all.length,
    done: all.filter(d => !d.incomplete).length,
    waiting: all.filter(d => d.incomplete).map(d => ({ key: d.key, label: d.label, missing: d.missing }))
  }
}

// The drivers the strategic priority leads with (only those that can be shown).
export const priorityDrivers = (model, priority) =>
  (PRIORITY_DRIVERS[priority] || PRIORITY_DRIVERS['Cost pressure']).filter(k => computableDrivers(model).some(d => d.key === k))

// Drivers that can be computed, grouped under the three pillars. The pillar holding
// the priority driver leads (then the archetype's order), and priority drivers come
// first within it. A pillar with nothing to show is left out.
export function driversByPillar(model, archetype, priority) {
  const drivers = computableDrivers(model)
  const lead = priorityDrivers(model, priority)
  const order = [...archetypePillars(archetype)]
  const holds = key => drivers.some(d => d.pillar === key && lead.includes(d.key))
  order.sort((a, b) => Number(holds(b)) - Number(holds(a)))
  return order
    .map(key => {
      const pillar = PILLARS.find(p => p.key === key)
      const items = drivers
        .filter(d => d.pillar === key)
        .map(d => ({ ...d, priority: lead.includes(d.key) }))
        .sort((a, b) => Number(b.priority) - Number(a.priority))
      return { ...pillar, items, total: items.reduce((s, d) => s + d.value, 0) }
    })
    .filter(g => g.items.length)
    .map((g, i) => ({ ...g, leads: i === 0 }))
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
