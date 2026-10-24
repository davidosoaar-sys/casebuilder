// The model. Every figure on the deck comes from here, by plain arithmetic.
//
// computeModel(inputs) is a pure function: no async, no fetch, no model call, no
// side effects. Given the same inputs it returns the same figures. The deck, the
// exports and the website are renders of what it returns, and none of them holds
// a number of its own.
//
// Each figure is { value, raw, equation, flag }
//   value     the number to show: finite and never below zero
//   raw       the same number before clamping (still finite), so a case where
//             Portal costs more than it returns can still be told apart from zero
//   equation  the formula with the current values substituted, so anyone can check it
//   flag      null, or why the value is not simply the arithmetic:
//               'clamped'          the result was below zero and is shown as 0
//               'divide-by-zero'   the divisor was 0, so the figure is 0
//               'not-finite'       the result was NaN or Infinity, so the figure is 0
//
// An input left blank is NOT zero. A figure that needs a blank input is `incomplete`
// (figure.incomplete, with figure.missing naming the inputs). Its value is 0 so the
// numbers stay finite, but nothing should show it: the deck leaves it out, and the
// total only adds the figures that can actually be computed.
//
// Inputs are read as numbers; anything missing, non-numeric or negative is read
// as 0 (and listed in `invalidInputs`), and percentages are held to 0 to 100.

import { fmtMoneyFull, fmtDec } from './format.js'

export const FIGURE_ORDER = [
  'platformEngineers',
  // speed
  'hoursSavedPerEngPerWeek',
  'productivityValue',
  'rampDaysSaved',
  'onboardingValue',
  // chaos-control
  'incidentHoursSaved',
  'incidentValue',
  // standards and audit
  'auditDaysSaved',
  'standardsValue',
  // scale
  'maintHoursSaved',
  'platformValue',
  'toolingValue',
  // roll-ups
  'totalValue',
  'netValue',
  'paybackMonths',
  'roiMultiple',
  'fiveYearValue',
  // alternative
  'selfHostCost',
  'versusSelfHost'
]

export const NUMERIC_INPUTS = [
  'engineers',
  'platformShare',
  'hourlyCost',
  'searchHoursToday',
  'searchHoursPortal',
  'rampDaysToday',
  'rampDaysPortal',
  'newHiresPerYear',
  'incidentHoursToday',
  'incidentHoursPortal',
  'peoplePerIncident',
  'incidentsPerMonth',
  'auditPrepDaysToday',
  'auditPrepDaysPortal',
  'auditsPerYear',
  'peoplePerAudit',
  'maintPctToday',
  'maintPctPortal',
  'toolSpendToday',
  'toolSpendPortal',
  'portalCost',
  'selfHostEngineers',
  'selfHostSalary',
  'weeksPerYear',
  'hoursPerDay',
  'hoursPerYear'
]

// What each figure is computed from: inputs or other figures. totalValue is special:
// it adds whichever drivers are complete, so it is incomplete only when none are.
export const DRIVER_FIGURES = ['productivityValue', 'onboardingValue', 'incidentValue', 'standardsValue', 'platformValue', 'toolingValue']
export const FIGURE_DEPS = {
  platformEngineers: ['engineers', 'platformShare'],
  hoursSavedPerEngPerWeek: ['searchHoursToday', 'searchHoursPortal'],
  productivityValue: ['hoursSavedPerEngPerWeek', 'engineers', 'weeksPerYear', 'hourlyCost'],
  rampDaysSaved: ['rampDaysToday', 'rampDaysPortal'],
  onboardingValue: ['rampDaysSaved', 'newHiresPerYear', 'hoursPerDay', 'hourlyCost'],
  incidentHoursSaved: ['incidentHoursToday', 'incidentHoursPortal', 'peoplePerIncident', 'incidentsPerMonth'],
  incidentValue: ['incidentHoursSaved', 'hourlyCost'],
  auditDaysSaved: ['auditPrepDaysToday', 'auditPrepDaysPortal'],
  standardsValue: ['auditDaysSaved', 'auditsPerYear', 'peoplePerAudit', 'hoursPerDay', 'hourlyCost'],
  maintHoursSaved: ['platformEngineers', 'maintPctToday', 'maintPctPortal', 'hoursPerYear'],
  platformValue: ['maintHoursSaved', 'hourlyCost'],
  toolingValue: ['toolSpendToday', 'toolSpendPortal'],
  totalValue: DRIVER_FIGURES,
  netValue: ['totalValue', 'portalCost'],
  paybackMonths: ['portalCost', 'totalValue'],
  roiMultiple: ['portalCost', 'totalValue'],
  fiveYearValue: ['netValue'],
  selfHostCost: ['selfHostEngineers', 'selfHostSalary'],
  versusSelfHost: ['selfHostCost', 'portalCost']
}

const PERCENT_INPUTS = new Set(['platformShare', 'maintPctToday', 'maintPctPortal'])

// Spotify's own deck puts standing up Backstage at 2 to 5 developers.
export const SELF_HOST_RANGE = [2, 5]
// Upkeep Portal removes and headcount self-hosting needs describe the same
// thing, so they should land within this share of each other.
export const CONSISTENCY_TOLERANCE = 0.5

const money = n => fmtMoneyFull(n)
const num = n => fmtDec(n, 2)

export function computeModel(rawInputs = {}) {
  // ---- read the inputs as safe numbers
  const invalidInputs = []
  const blank = new Set()
  const I = {}
  for (const key of NUMERIC_INPUTS) {
    const given = rawInputs ? rawInputs[key] : undefined
    const isBlank = given === '' || given == null
    let v = isBlank ? 0 : Number(given)
    let bad = null
    if (isBlank) {
      // not entered yet: no complaint, but anything that needs it is incomplete
      blank.add(key)
    } else if (!Number.isFinite(v)) {
      bad = 'not a number'
      v = 0
    } else if (v < 0) {
      bad = 'negative'
      v = 0
    } else if (PERCENT_INPUTS.has(key) && v > 100) {
      bad = 'over 100%'
      v = 100
    }
    if (bad) invalidInputs.push({ key, problem: bad })
    I[key] = v
  }

  // ---- which inputs each figure is still waiting on
  const memo = {}
  const missingOf = key => {
    if (key in memo) return memo[key]
    let out
    if (!(key in FIGURE_DEPS)) out = blank.has(key) ? [key] : []
    else if (key === 'totalValue') {
      const per = DRIVER_FIGURES.map(missingOf)
      out = per.some(m => m.length === 0) ? [] : [...new Set(per.flat())]
    } else out = [...new Set(FIGURE_DEPS[key].flatMap(missingOf))]
    return (memo[key] = out)
  }

  // ---- one figure
  const F = {}
  const figure = (key, raw, equation, divideByZero = false) => {
    let flag = null
    let value = raw
    if (divideByZero) {
      value = 0
      flag = 'divide-by-zero'
    } else if (!Number.isFinite(value)) {
      value = 0
      flag = 'not-finite'
    } else if (value < 0) {
      value = 0
      flag = 'clamped'
    }
    const missing = missingOf(key)
    F[key] = { value, raw: Number.isFinite(raw) && !divideByZero ? raw : 0, equation, flag, incomplete: missing.length > 0, missing }
    return F[key]
  }
  // a difference that was clamped prints as 0, not as a negative that was not used
  const diff = (f, a, b, fmt = num) => (f.flag === 'clamped' ? '0' : `(${fmt(a)} - ${fmt(b)})`)

  // ---- platform engineers are derived, not asked for
  figure('platformEngineers', I.engineers * (I.platformShare / 100), `${num(I.engineers)} * ${num(I.platformShare)}%`)

  // ---- SPEED
  const hs = figure('hoursSavedPerEngPerWeek', I.searchHoursToday - I.searchHoursPortal, `${num(I.searchHoursToday)} - ${num(I.searchHoursPortal)}`)
  figure(
    'productivityValue',
    hs.value * I.engineers * I.weeksPerYear * I.hourlyCost,
    `${diff(hs, I.searchHoursToday, I.searchHoursPortal)} * ${num(I.engineers)} * ${num(I.weeksPerYear)} * ${money(I.hourlyCost)}`
  )
  const rd = figure('rampDaysSaved', I.rampDaysToday - I.rampDaysPortal, `${num(I.rampDaysToday)} - ${num(I.rampDaysPortal)}`)
  figure(
    'onboardingValue',
    rd.value * I.newHiresPerYear * I.hoursPerDay * I.hourlyCost,
    `${diff(rd, I.rampDaysToday, I.rampDaysPortal)} * ${num(I.newHiresPerYear)} * ${num(I.hoursPerDay)} * ${money(I.hourlyCost)}`
  )

  // ---- CHAOS-CONTROL
  const ihDiff = I.incidentHoursToday - I.incidentHoursPortal
  const ih = figure(
    'incidentHoursSaved',
    Math.max(0, ihDiff) * I.peoplePerIncident * I.incidentsPerMonth * 12,
    `${ihDiff < 0 ? '0' : `(${num(I.incidentHoursToday)} - ${num(I.incidentHoursPortal)})`} * ${num(I.peoplePerIncident)} * ${num(I.incidentsPerMonth)} * 12`
  )
  // a negative saving is clamped at the difference, not by multiplying negatives together
  if (ihDiff < 0) F.incidentHoursSaved.flag = 'clamped'
  figure('incidentValue', ih.value * I.hourlyCost, `${num(ih.value)} * ${money(I.hourlyCost)}`)

  // ---- STANDARDS AND AUDIT
  const ad = figure('auditDaysSaved', I.auditPrepDaysToday - I.auditPrepDaysPortal, `${num(I.auditPrepDaysToday)} - ${num(I.auditPrepDaysPortal)}`)
  figure(
    'standardsValue',
    ad.value * I.auditsPerYear * I.peoplePerAudit * I.hoursPerDay * I.hourlyCost,
    `${diff(ad, I.auditPrepDaysToday, I.auditPrepDaysPortal)} * ${num(I.auditsPerYear)} * ${num(I.peoplePerAudit)} * ${num(I.hoursPerDay)} * ${money(I.hourlyCost)}`
  )

  // ---- SCALE
  const pe = F.platformEngineers.value
  const mDiff = I.maintPctToday - I.maintPctPortal
  const mh = figure(
    'maintHoursSaved',
    pe * (Math.max(0, mDiff) / 100) * I.hoursPerYear,
    `${num(pe)} * ${mDiff < 0 ? '0' : `(${num(I.maintPctToday)} - ${num(I.maintPctPortal)})`} / 100 * ${num(I.hoursPerYear)}`
  )
  if (mDiff < 0) F.maintHoursSaved.flag = 'clamped'
  figure('platformValue', mh.value * I.hourlyCost, `${num(mh.value)} * ${money(I.hourlyCost)}`)
  figure('toolingValue', I.toolSpendToday - I.toolSpendPortal, `${money(I.toolSpendToday)} - ${money(I.toolSpendPortal)}`)

  // ---- ROLL-UPS
  // the total adds only the drivers that can be computed; an unfinished one is left out, not counted as 0
  const done = DRIVER_FIGURES.filter(k => !F[k].incomplete)
  const total = figure('totalValue', done.reduce((sum, k) => sum + F[k].value, 0), done.length ? done.map(k => money(F[k].value)).join(' + ') : '0')
  const net = figure('netValue', total.value - I.portalCost, `${money(total.value)} - ${money(I.portalCost)}`)
  const monthly = total.value / 12
  figure(
    'paybackMonths',
    monthly === 0 ? 0 : I.portalCost / monthly,
    `${money(I.portalCost)} / (${money(total.value)} / 12)`,
    monthly === 0
  )
  figure('roiMultiple', I.portalCost === 0 ? 0 : total.value / I.portalCost, `${money(total.value)} / ${money(I.portalCost)}`, I.portalCost === 0)
  figure('fiveYearValue', net.raw * 5, `${money(net.raw)} * 5`)

  // ---- ALTERNATIVE
  const sh = figure('selfHostCost', I.selfHostEngineers * I.selfHostSalary, `${num(I.selfHostEngineers)} * ${money(I.selfHostSalary)}`)
  figure('versusSelfHost', sh.value - I.portalCost, `${money(sh.value)} - ${money(I.portalCost)}`)

  return { inputs: I, figures: F, order: FIGURE_ORDER, warnings: consistencyWarnings(I, F, blank), invalidInputs, blankInputs: [...blank] }
}

// The case has to agree with itself: the upkeep burden Portal removes
// (maintHoursSaved / hoursPerYear, in engineers) and the headcount that
// self-hosting needs describe the same thing from two directions.
function consistencyWarnings(I, F, blank) {
  const warnings = []
  // nothing to compare until both sides have been entered
  if (F.maintHoursSaved.incomplete || blank.has('selfHostEngineers')) return warnings
  const removed = I.hoursPerYear > 0 ? F.maintHoursSaved.value / I.hoursPerYear : 0
  const needed = I.selfHostEngineers

  const apart = needed === 0 ? removed > 0 : Math.abs(removed - needed) / needed > CONSISTENCY_TOLERANCE
  if (apart) {
    warnings.push({
      key: 'consistency',
      severity: 'warning',
      inputs: ['maintPctToday', 'maintPctPortal', 'platformShare', 'selfHostEngineers'],
      message: `The case is not internally consistent. The upkeep Portal removes equals about ${num(removed)} engineers, but self-hosting is set to need ${num(needed)}. These describe the same thing, so they should be within ${Math.round(CONSISTENCY_TOLERANCE * 100)}% of each other.`
    })
  }
  if ((needed < SELF_HOST_RANGE[0] || needed > SELF_HOST_RANGE[1])) {
    warnings.push({
      key: 'selfHostRange',
      severity: 'warning',
      inputs: ['selfHostEngineers'],
      message: `Spotify's own deck puts standing up Backstage at ${SELF_HOST_RANGE[0]} to ${SELF_HOST_RANGE[1]} developers. ${num(needed)} is outside that range, so expect the customer to question it.`
    })
  }
  return warnings
}

// A plain { figureKey: value } view of a model.
export function figureValues(model) {
  return Object.fromEntries(FIGURE_ORDER.map(k => [k, model.figures[k].value]))
}
