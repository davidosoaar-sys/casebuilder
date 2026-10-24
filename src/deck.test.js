import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import fs from 'node:fs'

import { computeModel } from './model.js'
import {
  INPUT_FIELDS,
  STAKEHOLDERS,
  ARCHETYPES,
  confidence,
  unconfirmed,
  stakeholdersForArchetype,
  migrateOldInputs,
  driversByPillar
} from './valueModel.js'
import { buildEnv, resolveSlides, defaultDeck } from './deck/model.js'
import { resolveStakeholder } from './deck/stakeholders.js'
import { stripModules } from './export/html.js'
import { sanitizeSuggestions } from '../server/suggest.js'

const inputsOf = (over = {}) => ({ ...Object.fromEntries(INPUT_FIELDS.map(f => [f.key, f.value])), ...over })
const fieldsOf = (over = {}) => INPUT_FIELDS.map(f => ({ ...f, ...(over[f.key] || {}) }))
const stake = key => resolveStakeholder({ key, builtin: true })

function render(inputs, key = 'champion') {
  const fields = fieldsOf()
  const env = buildEnv(inputs, fields, stake(key))
  return { env, slides: resolveSlides(defaultDeck(), env) }
}
const rowOf = (r, key) => find(r.slides, 'drivers').groups.flatMap(g => g.rows).find(x => x.key === key).value
const find = (slides, kind) => slides.flatMap(s => s.blocks).find(b => b.kind === kind)

test('the default deck has a today vs with Portal slide after the drivers slide', () => {
  const { slides } = render(inputsOf())
  const kinds = slides.map(s => s.blocks.map(b => b.kind).filter(k => ['drivers', 'pairs', 'versus', 'assumptions'].includes(k))[0])
  assert.deepEqual(kinds.filter(Boolean), ['drivers', 'pairs', 'versus', 'assumptions'])
})

test('drivers are grouped under Speed, Chaos-control, Scale with the equation under each bar', () => {
  const { slides } = render(inputsOf({ archetype: 'Fast / AI-native' }))
  const d = find(slides, 'drivers')
  assert.deepEqual(d.groups.map(g => g.label), ['Speed', 'Chaos-control', 'Scale'])
  assert.deepEqual(d.groups[0].rows.map(r => r.key), ['productivity', 'onboarding'])
  assert.deepEqual(d.groups[2].rows.map(r => r.key), ['platform', 'tooling'])
  assert.equal(d.groups[0].rows[0].detail, '(3 - 2) * 500 * 48 * $100')
  assert.equal(d.groups[0].rows[0].value, 2_400_000)
})

test('changing the archetype changes which pillar leads', () => {
  const lead = a => driversByPillar(computeModel(inputsOf()), a).find(g => g.leads).key
  assert.equal(lead('Fast / AI-native'), 'speed')
  assert.equal(lead('Scaling tech'), 'scale')
  assert.equal(lead('Regulated enterprise'), 'chaos')
})

test('changing the archetype changes which stakeholders exist, keeping edits and custom ones', () => {
  const current = [
    { key: 'champion', builtin: true, edit: { cares: 'mine' } },
    { key: 'cto', builtin: true },
    { key: 'finance', builtin: true },
    { key: 'security', builtin: true },
    { key: 'custom_1', role: 'Head of Data' }
  ]
  const fast = stakeholdersForArchetype(current, 'Fast / AI-native')
  assert.deepEqual(fast.map(s => s.key), ['champion', 'cto', 'custom_1'])
  assert.equal(fast[0].edit.cares, 'mine')
  const ent = stakeholdersForArchetype(fast, 'Enterprise')
  assert.deepEqual(ent.map(s => s.key), ['champion', 'cto', 'finance', 'security', 'custom_1'])
  assert.equal(ARCHETYPES['Scaling tech'].stakeholders.length, 3)
})

test('switching stakeholder changes the headline figure and the highlighted bars', () => {
  const inputs = inputsOf()
  const a = render(inputs, 'champion')
  const b = render(inputs, 'cto')
  assert.notEqual(a.env.ctx.headline, b.env.ctx.headline)
  assert.match(a.env.ctx.headline, /hours of engineering time/)
  assert.match(b.env.ctx.headline, /run cost avoided/)
  const leadKeys = r => find(r.slides, 'drivers').groups.flatMap(g => g.rows).filter(x => x.lead).map(x => x.key)
  assert.deepEqual(leadKeys(a), ['productivity', 'onboarding'])
  assert.deepEqual(leadKeys(b), ['platform', 'tooling'])
})

test('the deck holds no numbers of its own: changing an input changes the slides', () => {
  const before = render(inputsOf())
  const after = render(inputsOf({ searchHoursPortal: 1 }))
  assert.equal(rowOf(before, 'productivity'), 2_400_000)
  assert.equal(rowOf(after, 'productivity'), 4_800_000)
  // the pairs slide shows the new pair and difference
  const row = find(after.slides, 'pairs').rows.find(r => r.key === 'search')
  assert.equal(row.portal, '1')
  assert.equal(row.diff, '2')
})

test('stat blocks carry the equation and read the model', () => {
  const { slides } = render(inputsOf())
  const stats = find(slides, 'stats')
  const annual = stats.items.find(i => i.key === 'annual')
  const m = computeModel(inputsOf())
  assert.equal(annual.eq, m.figures.totalValue.equation)
})

test('the assumptions slide lists every unconfirmed input', () => {
  const fields = fieldsOf({ engineers: { confirmed: false } })
  const env = buildEnv(inputsOf(), fields, stake('champion'))
  const a = find(resolveSlides(defaultDeck(), env), 'assumptions')
  assert.equal(a.count, unconfirmed(fields).length)
  assert.ok(a.items.some(i => i.label === 'Engineers'))
  assert.ok(!a.items.some(i => i.label === 'Working weeks per year'))
})

test('case confidence = confirmed numeric inputs / numeric inputs, ignoring the calendar', () => {
  const numeric = INPUT_FIELDS.filter(f => (f.type === 'number' || f.type === 'percent') && !f.structural)
  const confirmed = numeric.filter(f => f.confirmed).length
  assert.equal(confidence(INPUT_FIELDS), Math.round((confirmed / numeric.length) * 100))
  const all = INPUT_FIELDS.map(f => ({ ...f, confirmed: true }))
  assert.equal(confidence(all), 100)
})

test('a case saved with the old inputs keeps its numbers', () => {
  const out = migrateOldInputs({
    hoursLostPerWeek: { value: 4, confirmed: true },
    captureRate: { value: 25, confirmed: true },
    currentToolSpend: { value: 200000, confirmed: false },
    toolConsolidation: { value: 50, confirmed: false },
    daysSavedOnboarding: { value: 3, confirmed: false },
    hoursPerIncident: { value: 5, confirmed: false },
    incidentReduction: { value: 20, confirmed: false }
  })
  assert.equal(out.searchHoursToday.value, 4)
  assert.equal(out.searchHoursPortal.value, 3)
  assert.equal(out.toolSpendPortal.value, 100000)
  assert.equal(out.incidentHoursPortal.value, 4)
  assert.equal(out.rampDaysToday.value - out.rampDaysPortal.value, 3)
})

test('the inlined website model computes exactly what the app computes', () => {
  const src = ['format.js', 'model.js', 'valueModel.js'].map(f => fs.readFileSync(new URL(`./${f}`, import.meta.url), 'utf8')).join('\n')
  const VM = vm.runInNewContext(
    `(function(){${stripModules(src)}\nreturn {computeModel:computeModel,STAKEHOLDERS:STAKEHOLDERS,driversByPillar:driversByPillar};})()`
  )
  for (const over of [{}, { engineers: 1234, hourlyCost: 87.5 }, { searchHoursPortal: 5 }, { portalCost: 0 }]) {
    const inputs = inputsOf(over)
    const app = computeModel(inputs)
    const site = VM.computeModel(inputs)
    for (const k of app.order) {
      assert.equal(site.figures[k].value, app.figures[k].value, k)
      assert.equal(site.figures[k].equation, app.figures[k].equation, k)
    }
  }
  assert.equal(VM.STAKEHOLDERS.length, STAKEHOLDERS.length)
})

test('suggested values are validated: only known inputs, clamped, never a negative saving', () => {
  const out = sanitizeSuggestions({
    searchHoursToday: 2,
    searchHoursPortal: 9, // above today: pulled down so it cannot be a negative saving
    hourlyCost: 99999, // clamped
    engineers: 5, // not suggestible
    portalCost: 'abc', // dropped
    selfHostEngineers: 1 // clamped up to 2
  })
  assert.equal(out.searchHoursPortal, 2)
  assert.equal(out.hourlyCost, 300)
  assert.equal(out.selfHostEngineers, 2)
  assert.ok(!('engineers' in out) && !('portalCost' in out))
  // only the requested keys come back
  assert.deepEqual(Object.keys(sanitizeSuggestions({ hourlyCost: 100, portalCost: 100000 }, ['hourlyCost'])), ['hourlyCost'])
})
