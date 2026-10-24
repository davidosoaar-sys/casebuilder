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
  const I = {}
  for (const key of NUMERIC_INPUTS) {
    const given = rawInputs ? rawInputs[key] : undefined
    let v = given === '' || given == null ? NaN : Number(given)
    let bad = null
    if (!Number.isFinite(v)) {
      bad = 'not a number'
      v = 0
    } else if (v < 0) {
      bad = 'negative'
      v = 0
    } else if (PERCENT_INPUTS.has(key) && v > 100) {
      bad = 'over 100%'
      v = 100
    }
    if (bad && !(given === undefined)) invalidInputs.push({ key, problem: bad })
    I[key] = v
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
    F[key] = { value, raw: Number.isFinite(raw) && !divideByZero ? raw : 0, equation, flag }
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
  const drivers = ['productivityValue', 'onboardingValue', 'incidentValue', 'platformValue', 'toolingValue']
  const total = figure('totalValue', drivers.reduce((s, k) => s + F[k].value, 0), drivers.map(k => money(F[k].value)).join(' + '))
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

  return { inputs: I, figures: F, order: FIGURE_ORDER, warnings: consistencyWarnings(I, F), invalidInputs }
}

// The case has to agree with itself: the upkeep burden Portal removes
// (maintHoursSaved / hoursPerYear, in engineers) and the headcount that
// self-hosting needs describe the same thing from two directions.
function consistencyWarnings(I, F) {
  const warnings = []
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
  if (needed < SELF_HOST_RANGE[0] || needed > SELF_HOST_RANGE[1]) {
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
