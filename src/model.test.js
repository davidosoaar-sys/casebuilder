// Run with: npm test   (uses Node's built-in test runner; no extra packages)

import test from 'node:test'
import assert from 'node:assert/strict'
import { computeModel, FIGURE_ORDER, NUMERIC_INPUTS, figureValues, SELF_HOST_RANGE } from './model.js'

// A realistic case with every figure comfortably above zero.
const BASE = {
  engineers: 500,
  platformShare: 30,
  hourlyCost: 100,
  searchHoursToday: 3,
  searchHoursPortal: 2,
  rampDaysToday: 14,
  rampDaysPortal: 10,
  newHiresPerYear: 80,
  incidentHoursToday: 4,
  incidentHoursPortal: 3.2,
  peoplePerIncident: 5,
  incidentsPerMonth: 12,
  maintPctToday: 4,
  maintPctPortal: 2,
  toolSpendToday: 180000,
  toolSpendPortal: 90000,
  portalCost: 400000,
  selfHostEngineers: 3,
  selfHostSalary: 210000,
  weeksPerYear: 48,
  hoursPerDay: 8,
  hoursPerYear: 2080
}

const run = over => computeModel({ ...BASE, ...over })
const value = (m, k) => m.figures[k].value

// ---------------------------------------------------------------- the formulas

test("productivityValue: 500 engineers, 1 hour saved, 48 weeks, $100/hr = 2,400,000 (Chris's worked example)", () => {
  const m = run({ engineers: 500, searchHoursToday: 3, searchHoursPortal: 2, weeksPerYear: 48, hourlyCost: 100 })
  assert.equal(value(m, 'productivityValue'), 2_400_000)
  assert.equal(m.figures.productivityValue.equation, '(3 - 2) * 500 * 48 * $100')
  assert.equal(m.figures.productivityValue.flag, null)
})

test('every figure follows the spec, in order', () => {
  const m = run({})
  const v = k => value(m, k)
  assert.deepEqual(m.order, FIGURE_ORDER)
  assert.equal(v('platformEngineers'), 150) // 500 * 30%
  assert.equal(v('hoursSavedPerEngPerWeek'), 1)
  assert.equal(v('rampDaysSaved'), 4)
  assert.equal(v('onboardingValue'), 4 * 80 * 8 * 100) // 256,000
  assert.ok(Math.abs(v('incidentHoursSaved') - 0.8 * 5 * 12 * 12) < 1e-9) // 576
  assert.ok(Math.abs(v('incidentValue') - 576 * 100) < 1e-6)
  assert.equal(v('maintHoursSaved'), 150 * 0.02 * 2080) // 6,240
  assert.equal(v('platformValue'), 6240 * 100)
  assert.equal(v('toolingValue'), 90_000)
  const total = v('productivityValue') + v('onboardingValue') + v('incidentValue') + v('platformValue') + v('toolingValue')
  assert.ok(Math.abs(v('totalValue') - total) < 1e-6)
  assert.ok(Math.abs(v('netValue') - (total - 400000)) < 1e-6)
  assert.ok(Math.abs(v('paybackMonths') - 400000 / (total / 12)) < 1e-9)
  assert.ok(Math.abs(v('roiMultiple') - total / 400000) < 1e-9)
  assert.ok(Math.abs(v('fiveYearValue') - (total - 400000) * 5) < 1e-6)
  assert.equal(v('selfHostCost'), 630_000)
  assert.equal(v('versusSelfHost'), 230_000)
})

test('equations print the formula with the current values substituted', () => {
  const m = run({})
  const eq = k => m.figures[k].equation
  assert.equal(eq('platformEngineers'), '500 * 30%')
  assert.equal(eq('onboardingValue'), '(14 - 10) * 80 * 8 * $100')
  assert.equal(eq('incidentHoursSaved'), '(4 - 3.2) * 5 * 12 * 12')
  assert.equal(eq('platformValue'), '6,240 * $100')
  assert.equal(eq('toolingValue'), '$180,000 - $90,000')
  assert.equal(eq('netValue'), `$${Math.round(value(m, 'totalValue')).toLocaleString('en-US')} - $400,000`)
  assert.equal(eq('selfHostCost'), '3 * $210,000')
  assert.equal(eq('versusSelfHost'), '$630,000 - $400,000')
  // change an input and the printed equation changes with it
  assert.equal(run({ engineers: 750 }).figures.productivityValue.equation, '(3 - 2) * 750 * 48 * $100')
})

test('later figures read earlier ones: the roll-up is the sum of the five drivers', () => {
  const m = run({})
  const drivers = ['productivityValue', 'onboardingValue', 'incidentValue', 'platformValue', 'toolingValue']
  assert.ok(Math.abs(value(m, 'totalValue') - drivers.reduce((s, k) => s + value(m, k), 0)) < 1e-6)
})

// ----------------------------------------------------- division by zero, and friends

test('every division by zero returns 0 (flagged), never NaN or Infinity', () => {
  // payback: totalValue is 0, so the divisor (totalValue / 12) is 0
  const flat = run({ searchHoursToday: 2, searchHoursPortal: 2, rampDaysToday: 4, rampDaysPortal: 4, incidentHoursToday: 3, incidentHoursPortal: 3, maintPctToday: 2, maintPctPortal: 2, toolSpendToday: 90000, toolSpendPortal: 90000 })
  assert.equal(value(flat, 'totalValue'), 0)
  assert.equal(value(flat, 'paybackMonths'), 0)
  assert.equal(flat.figures.paybackMonths.flag, 'divide-by-zero')

  // roi: portalCost is 0
  const free = run({ portalCost: 0 })
  assert.equal(value(free, 'roiMultiple'), 0)
  assert.equal(free.figures.roiMultiple.flag, 'divide-by-zero')
  assert.equal(value(free, 'paybackMonths'), 0) // 0 / (total / 12) is a real 0, not an error
  assert.equal(free.figures.paybackMonths.flag, null)

  // everything zero at once
  const zero = computeModel(Object.fromEntries(NUMERIC_INPUTS.map(k => [k, 0])))
  for (const k of FIGURE_ORDER) {
    assert.equal(value(zero, k), 0, k)
    assert.ok(Number.isFinite(zero.figures[k].value) && Number.isFinite(zero.figures[k].raw), k)
  }
  // hoursPerYear 0 must not break the consistency check (it divides by it)
  const noYear = run({ hoursPerYear: 0 })
  assert.equal(value(noYear, 'maintHoursSaved'), 0)
  for (const w of noYear.warnings) assert.ok(typeof w.message === 'string' && !/NaN|Infinity/.test(w.message))
})

test('a result that would be NaN or Infinity becomes 0 with a flag', () => {
  const m = run({ engineers: 1e308, hourlyCost: 1e308 })
  assert.equal(m.figures.productivityValue.value, 0)
  assert.equal(m.figures.productivityValue.flag, 'not-finite')
  for (const k of FIGURE_ORDER) assert.ok(Number.isFinite(m.figures[k].value), k)
})

test('a negative result is shown as 0 and flagged, with the raw number kept', () => {
  const m = run({ searchHoursToday: 2, searchHoursPortal: 3 }) // "with Portal" worse than today
  assert.equal(value(m, 'hoursSavedPerEngPerWeek'), 0)
  assert.equal(m.figures.hoursSavedPerEngPerWeek.flag, 'clamped')
  assert.equal(m.figures.hoursSavedPerEngPerWeek.raw, -1)
  assert.equal(value(m, 'productivityValue'), 0)

  const pricey = run({ portalCost: 50_000_000 }) // costs far more than it returns
  assert.equal(value(pricey, 'netValue'), 0)
  assert.equal(pricey.figures.netValue.flag, 'clamped')
  assert.ok(pricey.figures.netValue.raw < 0)
  assert.equal(value(pricey, 'fiveYearValue'), 0)

  const cheapHost = run({ selfHostEngineers: 1 }) // self-hosting cheaper than Portal
  assert.equal(value(cheapHost, 'versusSelfHost'), 0)
  assert.equal(cheapHost.figures.versusSelfHost.flag, 'clamped')
  assert.ok(cheapHost.figures.versusSelfHost.raw < 0)
})

test('negative inputs cannot multiply into positive nonsense', () => {
  const m = run({ engineers: -500, hourlyCost: -100 })
  assert.equal(value(m, 'productivityValue'), 0)
  assert.deepEqual(m.invalidInputs.map(i => i.key).sort(), ['engineers', 'hourlyCost'])
})

// ------------------------------------------------- change one input, change its dependents

// each figure's direct dependencies: other figures, or inputs
const DEPENDS = {
  platformEngineers: ['engineers', 'platformShare'],
  hoursSavedPerEngPerWeek: ['searchHoursToday', 'searchHoursPortal'],
  productivityValue: ['hoursSavedPerEngPerWeek', 'engineers', 'weeksPerYear', 'hourlyCost'],
  rampDaysSaved: ['rampDaysToday', 'rampDaysPortal'],
  onboardingValue: ['rampDaysSaved', 'newHiresPerYear', 'hoursPerDay', 'hourlyCost'],
  incidentHoursSaved: ['incidentHoursToday', 'incidentHoursPortal', 'peoplePerIncident', 'incidentsPerMonth'],
  incidentValue: ['incidentHoursSaved', 'hourlyCost'],
  maintHoursSaved: ['platformEngineers', 'maintPctToday', 'maintPctPortal', 'hoursPerYear'],
  platformValue: ['maintHoursSaved', 'hourlyCost'],
  toolingValue: ['toolSpendToday', 'toolSpendPortal'],
  totalValue: ['productivityValue', 'onboardingValue', 'incidentValue', 'platformValue', 'toolingValue'],
  netValue: ['totalValue', 'portalCost'],
  paybackMonths: ['portalCost', 'totalValue'],
  roiMultiple: ['portalCost', 'totalValue'],
  fiveYearValue: ['netValue'],
  selfHostCost: ['selfHostEngineers', 'selfHostSalary'],
  versusSelfHost: ['selfHostCost', 'portalCost']
}

// every figure that depends, directly or through other figures, on one input
function dependents(input) {
  const hit = new Set()
  let grew = true
  while (grew) {
    grew = false
    for (const [fig, deps] of Object.entries(DEPENDS)) {
      if (!hit.has(fig) && deps.some(d => d === input || hit.has(d))) {
        hit.add(fig)
        grew = true
      }
    }
  }
  return hit
}

test('the dependency table covers every figure and every input', () => {
  assert.deepEqual(Object.keys(DEPENDS), FIGURE_ORDER)
  for (const input of NUMERIC_INPUTS) assert.ok(dependents(input).size > 0, `${input} feeds nothing`)
})

for (const input of NUMERIC_INPUTS) {
  test(`changing ${input} changes exactly the figures that depend on it`, () => {
    const before = figureValues(run({}))
    const after = figureValues(run({ [input]: BASE[input] * 1.1 }))
    const changed = new Set(FIGURE_ORDER.filter(k => before[k] !== after[k]))
    assert.deepEqual([...changed].sort(), [...dependents(input)].sort())
  })
}

// ---------------------------------------------------------------- no bad numbers, ever

test('no figure is ever NaN, Infinity or negative, whatever the inputs', () => {
  // a small deterministic generator so a failure can be reproduced
  let seed = 123456789
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)
  const nasty = [0, 1e-9, 1, 2, 3, 7.5, 50, 100, 101, 480, 2080, 1e6, 1e12, 1e308, -1, -5, -1e12, NaN, Infinity, -Infinity, '', 'abc', null, undefined, '12', ' 7 ']
  const pick = () => (rand() < 0.5 ? nasty[Math.floor(rand() * nasty.length)] : Math.round(rand() * 5000) / 10)
  const FLAGS = new Set([null, 'clamped', 'divide-by-zero', 'not-finite'])

  for (let i = 0; i < 4000; i++) {
    const inputs = {}
    for (const k of NUMERIC_INPUTS) if (rand() > 0.05) inputs[k] = pick()
    const m = computeModel(inputs)
    for (const k of FIGURE_ORDER) {
      const f = m.figures[k]
      assert.ok(Number.isFinite(f.value) && f.value >= 0, `${k} = ${f.value} for ${JSON.stringify(inputs)}`)
      assert.ok(Number.isFinite(f.raw), `${k}.raw = ${f.raw}`)
      assert.ok(FLAGS.has(f.flag), `${k} flag ${f.flag}`)
      assert.equal(typeof f.equation, 'string')
      assert.ok(!/NaN|Infinity|undefined/.test(f.equation), `${k}: ${f.equation}`)
    }
    for (const w of m.warnings) assert.ok(!/NaN|Infinity|undefined/.test(w.message), w.message)
  }
  assert.doesNotThrow(() => computeModel())
  assert.doesNotThrow(() => computeModel(null))
  assert.doesNotThrow(() => computeModel({}))
})

test('computeModel is pure: same inputs, same answer, inputs untouched', () => {
  const inputs = { ...BASE }
  const frozen = Object.freeze({ ...BASE })
  const a = computeModel(frozen)
  const b = computeModel(frozen)
  assert.deepEqual(a, b)
  assert.deepEqual(inputs, BASE)
})

// ------------------------------------------------------------- the sanity checks

test('the default case is internally consistent and in range', () => {
  assert.deepEqual(run({}).warnings, [])
})

test('maintenance saved versus self-host headcount: warns beyond 50%', () => {
  // removed upkeep = 150 * 2% * 2080 / 2080 = 3 engineers
  assert.equal(run({ selfHostEngineers: 2 }).warnings.length, 0) // exactly 50% apart: not "more than"
  const apart = run({ selfHostEngineers: 5 }) // 3 vs 5: 40%: fine
  assert.equal(apart.warnings.filter(w => w.key === 'consistency').length, 0)
  const far = run({ maintPctToday: 10, maintPctPortal: 2 }) // removes 12 engineers vs 3
  const w = far.warnings.find(x => x.key === 'consistency')
  assert.ok(w, 'expected a consistency warning')
  assert.match(w.message, /not internally consistent/)
  assert.match(w.message, /12 engineers/)
  assert.ok(w.inputs.includes('selfHostEngineers'))
})

test("self-host headcount outside Spotify's 2 to 5 developers warns", () => {
  const [lo, hi] = SELF_HOST_RANGE
  for (const n of [lo, 3, hi]) assert.equal(run({ selfHostEngineers: n }).warnings.filter(w => w.key === 'selfHostRange').length, 0, String(n))
  for (const n of [0, 1, 6, 12]) {
    const w = run({ selfHostEngineers: n }).warnings.find(x => x.key === 'selfHostRange')
    assert.ok(w, `${n} should warn`)
    assert.match(w.message, /2 to 5 developers/)
  }
})
