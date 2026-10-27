import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import fs from 'node:fs'

import { computeModel } from './model.js'
import {
  INPUT_FIELDS,
  DEMO_VALUES,
  STAKEHOLDERS,
  ARCHETYPES,
  confidence,
  unconfirmed,
  stakeholdersForArchetype,
  migrateOldInputs,
  driversByPillar
} from './valueModel.js'
import { buildEnv, resolveSlides, defaultDeck, hiddenPages } from './deck/model.js'
import { resolveStakeholder } from './deck/stakeholders.js'
import { stripModules } from './export/html.js'
import { migrateDeck } from './deck/model.js'
import { stateOf } from './source.js'

const inputsOf = (over = {}) => ({ ...DEMO_VALUES, ...over })
// the starting fields, with chosen ones made inputs (what the customer said)
const asInput = { state: 'input', origin: 'Said on the call' }
const fieldsOf = (inputKeys = []) => INPUT_FIELDS.map(f => (inputKeys.includes(f.key) ? { ...f, value: DEMO_VALUES[f.key], source: asInput } : f))
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
  assert.deepEqual(kinds.filter(Boolean), ['drivers', 'pairs', 'versus'])
})

test('drivers are grouped under Speed, Chaos-control, Scale with the equation under each bar', () => {
  const { slides } = render(inputsOf({ archetype: 'Fast / AI-native', strategicPriority: 'AI initiative' }))
  const d = find(slides, 'drivers')
  assert.deepEqual(d.groups.map(g => g.label), ['Speed', 'Chaos-control', 'Scale'])
  assert.deepEqual(d.groups[0].rows.map(r => r.key), ['productivity', 'onboarding'])
  assert.deepEqual(d.groups[1].rows.map(r => r.key), ['incidents', 'standards'])
  assert.deepEqual(d.groups[2].rows.map(r => r.key), ['platform', 'tooling'])
  assert.equal(d.groups[0].rows[0].detail, '(3 - 2) * 500 * 48 * $100')
  assert.equal(d.groups[0].rows[0].value, 2_400_000)
})

test('the strategic priority decides which pillar and driver lead', () => {
  const lead = p => driversByPillar(computeModel(inputsOf()), 'Enterprise', p)
  assert.equal(lead('AI initiative')[0].key, 'speed')
  assert.equal(lead('Migration')[0].key, 'speed')
  assert.equal(lead('Cost pressure')[0].key, 'scale')
  assert.equal(lead('Audit and compliance')[0].key, 'chaos')
  assert.equal(lead('Audit and compliance')[0].items[0].key, 'standards')
  assert.ok(lead('Audit and compliance')[0].items[0].priority)
})

test('the archetype orders the remaining pillars', () => {
  const order = a => driversByPillar(computeModel(inputsOf()), a, 'Audit and compliance').map(g => g.key)
  assert.deepEqual(order('Fast / AI-native'), ['chaos', 'speed', 'scale'])
  assert.deepEqual(order('Regulated enterprise'), ['chaos', 'scale', 'speed'])
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
  const leadKeys = r => find(r.slides, 'drivers').groups.flatMap(g => g.rows).filter(x => x.lead).map(x => x.key).sort()
  // the default priority (cost pressure) leads with platform and tooling for everyone
  assert.deepEqual(leadKeys(a), ['onboarding', 'platform', 'productivity', 'tooling'])
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

test('the client deck has no assumptions page, and old decks lose theirs', () => {
  assert.ok(!defaultDeck().some(s => s.blocks.some(b => b.type === 'assumptions')))
  const old = [
    { id: 'a', variant: 'plain', blocks: [{ id: 'b1', type: 'text', style: 'title', text: 'Keep me' }] },
    { id: 'c', variant: 'plain', blocks: [{ id: 'b2', type: 'text', style: 'title', text: 'Honesty' }, { id: 'b3', type: 'assumptions' }] }
  ]
  assert.deepEqual(migrateDeck(old).map(s => s.id), ['a'])
  // even if one is added by hand, the client output never carries it
  const env = buildEnv(inputsOf(), fieldsOf(), stake('champion'))
  assert.ok(!JSON.stringify(resolveSlides(old, env)).includes('assumptions'))
})

test('case confidence counts INPUTS only, never assumptions, suggestions or blanks', () => {
  const numeric = INPUT_FIELDS.filter(f => (f.type === 'number' || f.type === 'percent') && !f.structural)
  assert.equal(confidence(INPUT_FIELDS), 0)
  const mark = (state, n) => INPUT_FIELDS.map(f => (numeric.slice(0, n).some(x => x.key === f.key) ? { ...f, value: 1, source: { state, origin: 'x' } } : f))
  assert.equal(confidence(mark('assumption', 10)), 0)
  assert.equal(confidence(mark('suggestion', 10)), 0)
  assert.equal(confidence(mark('input', 10)), Math.round((10 / numeric.length) * 100))
  assert.equal(confidence(mark('input', numeric.length)), 100)
  // an input whose value was cleared is empty again, so it does not count
  assert.equal(confidence(INPUT_FIELDS.map(f => (f.key === 'engineers' ? { ...f, value: '', source: { state: 'input', origin: 'x' } } : f))), 0)
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
  const src = ['format.js', 'model.js', 'source.js', 'valueModel.js'].map(f => fs.readFileSync(new URL(`./${f}`, import.meta.url), 'utf8')).join('\n')
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

// ------------------------------------------------------- standards driver on the deck

test('the audit driver is a bar with its arithmetic, a pair with its difference, and the compliance headline', () => {
  const { env, slides } = render(inputsOf(), 'security')
  const d = find(slides, 'drivers')
  const bar = d.groups.flatMap(g => g.rows).find(r => r.key === 'standards')
  assert.equal(bar.value, 96_000)
  assert.equal(bar.detail, '(10 - 5) * 4 * 6 * 8 * $100')
  const pair = find(slides, 'pairs').rows.find(r => r.key === 'audit')
  assert.equal(pair.today, '10')
  assert.equal(pair.portal, '5')
  assert.equal(pair.diff, '5')
  assert.match(env.ctx.headline, /^\$96k of audit effort avoided/)
  assert.match(d.totalEq, /\$96,000/)
})

test('the strategic priority moves the highlight without changing a single number', () => {
  const rows = p => find(render(inputsOf({ strategicPriority: p }), 'security').slides, 'drivers').groups.flatMap(g => g.rows)
  const lead = p => rows(p).filter(r => r.lead && !['standards', 'incidents'].includes(r.key)).map(r => r.key).sort()
  const val = p => Object.fromEntries(rows(p).map(r => [r.key, r.value]))
  assert.deepEqual(lead('AI initiative'), ['productivity'])
  assert.deepEqual(lead('Cost pressure'), ['platform', 'tooling'])
  assert.ok(rows('Audit and compliance').find(r => r.key === 'standards').lead)
  assert.deepEqual(val('AI initiative'), val('Cost pressure'))
})

test('entering an audit input changes the bar, the total, net, payback and ROI in the same render', () => {
  const a = render(inputsOf())
  const b = render(inputsOf({ auditsPerYear: 8 }))
  const bar = r => find(r.slides, 'drivers').groups.flatMap(g => g.rows).find(x => x.key === 'standards').value
  assert.equal(bar(b), bar(a) * 2)
  assert.notEqual(find(a.slides, 'drivers').total, find(b.slides, 'drivers').total)
  const stat = (r, k) => find(r.slides, 'stats').items.find(i => i.key === k).value
  for (const k of ['annual', 'net', 'payback', 'roi', 'five']) assert.notEqual(stat(a, k), stat(b, k), k)
})

test('no audits: the driver and its pair leave the deck instead of showing an empty bar', () => {
  const { slides } = render(inputsOf({ auditsPerYear: 0 }), 'security')
  const keys = find(slides, 'drivers').groups.flatMap(g => g.rows).map(r => r.key)
  assert.ok(!keys.includes('standards'))
  assert.ok(!find(slides, 'pairs').rows.some(r => r.key === 'audit'))
  assert.ok(!/NaN|Infinity/.test(JSON.stringify(slides)))
  assert.equal(render(inputsOf({ auditsPerYear: 0 }), 'security').env.ctx.headline, 'Ownership and standards provable on demand')
  // and a priority of audit and compliance does not highlight a driver that is not there
  const p = find(render(inputsOf({ auditsPerYear: 0, strategicPriority: 'Audit and compliance' }), 'champion').slides, 'drivers')
  assert.ok(p.groups.flatMap(g => g.rows).every(r => r.key !== 'standards'))
})

test('the new inputs start empty and unconfirmed, and only an input counts toward confidence', () => {
  const fields = fieldsOf()
  const open = unconfirmed(fields).map(f => f.key)
  for (const k of ['auditPrepDaysToday', 'auditPrepDaysPortal', 'auditsPerYear', 'peoplePerAudit']) assert.ok(open.includes(k), k)
  assert.ok(!open.includes('strategicPriority'))
  const before = confidence(fields)
  const withInput = fieldsOf(['auditsPerYear'])
  assert.ok(confidence(withInput) > before)
  assert.ok(!unconfirmed(withInput).some(f => f.key === 'auditsPerYear'))
})

test('a new case starts blank: nothing is pre-filled and the client deck shows no figures', () => {
  const blank = Object.fromEntries(INPUT_FIELDS.map(f => [f.key, f.value]))
  const numeric = INPUT_FIELDS.filter(f => (f.type === 'number' || f.type === 'percent') && !f.structural)
  assert.ok(numeric.every(f => f.value === '' && stateOf(f) === 'empty'), 'every answer starts empty')
  assert.equal(blank.strategicPriority, 'Cost pressure')
  assert.equal(blank.weeksPerYear, 48)
  const empty = render(blank)
  const text = JSON.stringify(empty.slides)
  assert.ok(!/NaN|Infinity|\$0\b/.test(text), 'no $0 and no NaN anywhere')
  assert.equal(find(empty.slides, 'drivers'), undefined)
  assert.equal(find(empty.slides, 'stats'), undefined)
  assert.equal(find(empty.slides, 'pairs'), undefined)
  assert.equal(find(empty.slides, 'versus'), undefined)
  assert.equal(computeModel(blank).invalidInputs.length, 0)
})

test('as values are entered the figures appear, and only the ones that can be computed', () => {
  const blank = Object.fromEntries(INPUT_FIELDS.map(f => [f.key, f.value]))
  const some = render({ ...blank, engineers: 500, hourlyCost: 100, searchHoursToday: 3, searchHoursPortal: 2 })
  const rows = find(some.slides, 'drivers').groups.flatMap(g => g.rows)
  assert.deepEqual(rows.map(r => r.key), ['productivity']) // nothing else has its inputs yet
  assert.equal(rows[0].value, 2_400_000)
  assert.equal(find(some.slides, 'drivers').total, '$2,400,000')
  // net, payback and ROI wait for the subscription cost, so they are not on the slide
  const stat = find(some.slides, 'stats')
  assert.deepEqual(stat.items.map(i => i.key), ['annual'])
  const more = render({ ...blank, engineers: 500, hourlyCost: 100, searchHoursToday: 3, searchHoursPortal: 2, portalCost: 400000 })
  assert.deepEqual(find(more.slides, 'stats').items.map(i => i.key), ['annual', 'cost', 'net', 'payback', 'roi', 'five'])
})

test('an unfinished driver is absent, not a $0 bar, and does not drag the total down', () => {
  const full = render(inputsOf())
  const part = render(inputsOf({ toolSpendPortal: '' }))
  const keys = r => find(r.slides, 'drivers').groups.flatMap(g => g.rows).map(x => x.key)
  assert.ok(keys(full).includes('tooling'))
  assert.ok(!keys(part).includes('tooling'))
  const num = r => Number(find(r.slides, 'drivers').total.replace(/[^0-9]/g, ''))
  assert.equal(num(part), num(full) - 90_000)
  assert.ok(!find(part.slides, 'drivers').totalEq.includes('$0'))
})

test('a slide whose figures are all missing is dropped from the client deck', () => {
  const blank = Object.fromEntries(INPUT_FIELDS.map(f => [f.key, f.value]))
  const env = buildEnv(blank, fieldsOf(), stake('champion'))
  const kept = resolveSlides(defaultDeck(), env)
  // pages with no live figure (title, problem, stakeholder, next steps) stay; chart pages may show their waiting state
  assert.ok(kept.length >= 2 && kept.length < defaultDeck().length)
  assert.ok(kept.every(s => s.blocks.every(b => !['drivers', 'pairs', 'stats', 'versus'].includes(b.kind))))
  // with data, every page comes back
  assert.equal(resolveSlides(defaultDeck(), buildEnv(inputsOf(), fieldsOf(), stake('champion'))).length, 11)
})

test('hiddenPages counts the dropped pages and names the inputs that bring them back', () => {
  const blank = Object.fromEntries(INPUT_FIELDS.map(f => [f.key, f.value]))
  const env = buildEnv(blank, fieldsOf(), stake('champion'))
  const hidden = hiddenPages(defaultDeck(), env)
  assert.equal(hidden.count, defaultDeck().length - resolveSlides(defaultDeck(), env).length)
  assert.ok(hidden.count > 0)
  assert.ok(hidden.missing.length > 0)
  const labels = new Set(INPUT_FIELDS.map(f => f.label))
  assert.ok(hidden.missing.every(m => labels.has(m)), hidden.missing.join(', '))
  assert.equal(new Set(hidden.missing).size, hidden.missing.length)
  assert.deepEqual(hiddenPages(defaultDeck(), buildEnv(inputsOf(), fieldsOf(), stake('champion'))), { count: 0, missing: [] })
})

test('the client deck carries no state, origin, source or confidence metadata', () => {
  const fields = INPUT_FIELDS.map(f =>
    DEMO_VALUES[f.key] !== undefined && f.type === 'number' && !f.structural
      ? { ...f, value: DEMO_VALUES[f.key], source: { state: 'suggestion', origin: 'Based on 3 similar deals (Acme)', quote: 'we have 500 engineers', link: 'https://example.com/x', pinnedAt: '2026-01-01', confidence: 'high', enabled: ['Gong'] } }
      : f
  )
  const env = buildEnv(inputsOf(), fields, stake('security'))
  const slides = resolveSlides(defaultDeck(), env)
  const text = JSON.stringify(slides)
  // per-input sources never reach the client deck
  for (const leak of ['Based on 3 similar deals', 'we have 500 engineers', 'example.com', 'pinnedAt', 'origin', 'Gong', 'unconfirmed']) {
    assert.ok(!text.toLowerCase().includes(leak.toLowerCase()), `the deck leaked "${leak}"`)
  }
  // only the assumptions page (an aggregate confidence chart, counts only) talks about input states
  const rest = JSON.stringify(slides.filter(s => !s.blocks.some(b => b.kind === 'chart' && b.chart === 'confidence')))
  for (const leak of ['suggestion', 'assumption', 'confidence']) {
    assert.ok(!rest.toLowerCase().includes(leak), `a non-assumptions page leaked "${leak}"`)
  }
  // the arithmetic stays: that is the customer checking the math
  assert.ok(text.includes('(3 - 2) * 500 * 48 * $100'))
})

test('the default deck is the 11-page pitch flow and resolves for a full and an empty case', () => {
  const d = defaultDeck()
  assert.equal(d.length, 11)
  const sig = s => {
    const chart = s.blocks.find(b => b.type === 'chart')
    if (chart) return `chart:${chart.kind}`
    const live = s.blocks.find(b => ['logo', 'stats', 'drivers', 'pairs', 'versus', 'room'].includes(b.type))
    return live ? live.type : s.blocks.find(b => b.style === 'title').text
  }
  assert.deepEqual(d.map(sig), ['logo', 'stats', 'Where engineering time goes today at {company}', 'chart:breakdown', 'drivers', 'pairs',
    'chart:payback', 'versus', 'room', 'chart:confidence', 'The decision and next steps'])
  const blank = Object.fromEntries(INPUT_FIELDS.map(f => [f.key, f.value]))
  for (const inputs of [inputsOf(), blank, {}]) {
    for (const key of ['champion', 'security']) {
      assert.doesNotThrow(() => resolveSlides(defaultDeck(), buildEnv(inputs, fieldsOf(), stake(key))))
    }
  }
  assert.notEqual(defaultDeck()[0].id, d[0].id)
})
