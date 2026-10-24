import test from 'node:test'
import assert from 'node:assert/strict'

import { computeModel } from './model.js'
import { INPUT_FIELDS, DEMO_VALUES, confidence } from './valueModel.js'
import { stateOf, withValue, withState, withOrigin, withSuggestion, withGap, ORIGIN } from './source.js'
import { suggestValues, applySuggestions, derivedSuggestions, emptyKeys } from './suggest.js'
import { defaultConnectors } from './connectors.js'
import { hydrate, newProject } from './projects.js'
import { projectToCaseFile, caseFileToProject, checkCaseFile } from './caseFile.js'
import { prepareInternal } from './export/prepare.js'
import { buildInternalSummary, buildOnePager } from './export/html.js'
import { prepareOnePager } from './export/prepare.js'
import { validateAgentItems, quoteSupportsValue } from '../server/suggest.js'

const fieldsWith = (values = {}, sources = {}) =>
  INPUT_FIELDS.map(f => (f.key in values ? { ...f, value: values[f.key], source: sources[f.key] || { state: 'assumption', origin: 'x' } } : f))
const get = (fields, key) => fields.find(f => f.key === key)
const valuesOf = fields => Object.fromEntries(fields.map(f => [f.key, f.value]))
const NOW = '2026-05-01T10:00:00.000Z'

// ------------------------------------------------------------------ states and editing

test('every numeric input starts empty with no source', () => {
  for (const f of INPUT_FIELDS.filter(f => (f.type === 'number' || f.type === 'percent') && !f.structural)) {
    assert.equal(f.value, '', f.key)
    assert.equal(stateOf(f), 'empty', f.key)
    assert.equal('confirmed' in f, false, `${f.key} still has a confirmed flag`)
  }
})

test('editing a suggestion turns it into an assumption: he owns the number now', () => {
  const sug = withSuggestion(get(fieldsWith(), 'engineers'), { value: 400, state: 'suggestion', origin: 'Based on 2 similar deals (A, B)' }, { now: NOW, enabled: ['Past deals'] })
  assert.equal(stateOf(sug), 'suggestion')
  const edited = withValue(sug, 450)
  assert.equal(edited.value, 450)
  assert.equal(stateOf(edited), 'assumption')
  assert.equal(edited.source.origin, ORIGIN.edited)
  assert.equal(edited.source.pinnedAt, undefined)
  // typing into an empty field is also his own read
  assert.equal(stateOf(withValue(get(fieldsWith(), 'engineers'), 10)), 'assumption')
  // clearing it makes it empty again
  assert.equal(stateOf(withValue(edited, '')), 'empty')
})

test('Chris can mark a number as an input (the customer said it) and write its origin', () => {
  const f = withValue(get(fieldsWith(), 'engineers'), 500)
  const input = withOrigin(withState(f, 'input'), 'Said on the 12 May call')
  assert.equal(stateOf(input), 'input')
  assert.equal(input.source.origin, 'Said on the 12 May call')
  assert.equal(stateOf(withState(input, 'assumption')), 'assumption')
  // a blank cannot be an input
  assert.equal(stateOf(withState(get(fieldsWith(), 'engineers'), 'input')), 'empty')
})

test('confidence counts inputs only', () => {
  const state = (s, n) =>
    fieldsWith(
      Object.fromEntries(['engineers', 'hourlyCost', 'portalCost', 'auditsPerYear'].slice(0, n).map(k => [k, 1])),
      Object.fromEntries(['engineers', 'hourlyCost', 'portalCost', 'auditsPerYear'].map(k => [k, { state: s, origin: 'x' }]))
    )
  assert.equal(confidence(state('assumption', 4)), 0)
  assert.equal(confidence(state('suggestion', 4)), 0)
  assert.ok(confidence(state('input', 4)) > 0)
  assert.ok(confidence(state('input', 4)) > confidence(state('input', 2)))
})

// ------------------------------------------------------------------------- pinning

test('a pinned suggestion does not change on reload, on re-render or on unrelated edits', () => {
  let fields = fieldsWith({ engineers: 500 })
  const result = {
    suggestions: { hourlyCost: { value: 95, state: 'suggestion', origin: 'Benchmark: State of DevEx 2025 (https://example.com/r)', link: 'https://example.com/r', confidence: 'high', kind: 'benchmark' } },
    gaps: {},
    enabled: ['Gong']
  }
  fields = applySuggestions(fields, result, { keys: ['hourlyCost'], now: NOW })
  const pinned = get(fields, 'hourlyCost')
  assert.equal(pinned.source.pinnedAt, NOW)
  assert.deepEqual(pinned.source.enabled, ['Gong'])

  // reload: saved to storage and read back
  const project = { ...newProject('Acme'), fields }
  const reloaded = hydrate(JSON.parse(JSON.stringify(project)))
  assert.deepEqual(get(reloaded.fields, 'hourlyCost'), pinned)

  // unrelated edits and re-renders never touch it
  let edited = reloaded.fields.map(f => (f.key === 'engineers' ? withValue(f, 900) : f))
  edited = edited.map(f => (f.key === 'portalCost' ? withValue(f, 123456) : f))
  computeModel(valuesOf(edited))
  assert.deepEqual(get(edited, 'hourlyCost'), pinned)

  // applying a result only writes the keys that were asked for
  const again = applySuggestions(edited, { ...result, suggestions: { hourlyCost: { ...result.suggestions.hourlyCost, value: 1 } } }, { keys: ['portalCost'], now: NOW })
  assert.deepEqual(get(again, 'hourlyCost'), pinned)
})

test('opening the same project on another day shows the same numbers: nothing regenerates on its own', async () => {
  const fields = fieldsWith({ engineers: 500, maintPctToday: 4, maintPctPortal: 2, platformShare: 30 })
  let calls = 0
  const run = () => suggestValues({ company: 'Acme', fields, keys: ['selfHostEngineers'], connectors: defaultConnectors(), model: computeModel(valuesOf(fields)), agent: async () => (calls++, { suggestions: [] }) })
  const first = applySuggestions(fields, await run(), { keys: ['selfHostEngineers'], now: '2026-05-01T00:00:00Z' })
  const callsAfterAsking = calls
  const later = hydrate(JSON.parse(JSON.stringify({ ...newProject('Acme'), fields: first })))
  assert.deepEqual(get(later.fields, 'selfHostEngineers'), get(first, 'selfHostEngineers'))
  assert.equal(calls, callsAfterAsking) // reopening asked nobody
})

// ----------------------------------------------------------------------- connections

const model0 = fields => computeModel(valuesOf(fields))
const ALL_OFF = defaultConnectors()

test('all five connections start off, and Lemlist is one of them', () => {
  assert.deepEqual(Object.keys(ALL_OFF), ['gong', 'hubspot', 'slack', 'clay', 'lemlist'])
  assert.ok(Object.values(ALL_OFF).every(v => v === false))
})

test('a connection that is off is never read: its material is never sent to the agent', async () => {
  const fields = fieldsWith({ engineers: 500 })
  const documents = [
    { id: 'g', source: 'gong', name: 'Call 1', text: 'We lose about 3 hours a week searching.' },
    { id: 'h', source: 'hubspot', name: 'Deal export', text: 'engineers,500' },
    { id: 'l', source: 'lemlist', name: 'Replies', text: 'We hire about 60 engineers a year.' }
  ]
  const seen = []
  const agent = async p => (seen.push(p), { suggestions: [] })
  // everything off: the agent can still search the web, but is given no material at all
  await suggestValues({ company: 'Acme', fields, keys: ['searchHoursToday'], connectors: ALL_OFF, documents, model: model0(fields), agent })
  assert.equal(seen.length, 1)
  assert.deepEqual(seen[0].documents, [])
  assert.equal(seen[0].web, true)
  // only HubSpot and Lemlist allowed: exactly those, never Gong
  await suggestValues({ company: 'Acme', fields, keys: ['searchHoursToday'], connectors: { ...ALL_OFF, hubspot: true, lemlist: true }, documents, model: model0(fields), agent })
  assert.deepEqual(seen[1].documents.map(d => d.source).sort(), ['hubspot', 'lemlist'])
})

test('a gap says which connection is off, as a setting, and the origin never names a disabled one', async () => {
  const fields = fieldsWith({ engineers: 500, maintPctToday: 4, maintPctPortal: 2, platformShare: 30 })
  const none = async () => ({ suggestions: [] })
  const r = await suggestValues({ company: 'Acme', fields, keys: ['searchHoursToday', 'selfHostEngineers'], connectors: ALL_OFF, documents: [], model: model0(fields), agent: none })
  // selfHostEngineers is derived from a rule; the connections that are off are named, but not in its origin
  const s = r.suggestions.selfHostEngineers
  assert.deepEqual(s.notes, ['Gong, HubSpot, Slack, Clay and Lemlist are disabled, so no call figures, CRM records, internal threads, enrichment data and outreach data were used.'])
  assert.ok(!/Gong|HubSpot|Slack|Clay|Lemlist/.test(s.origin), s.origin)
  // searchHoursToday has no source at all: the field reads as a setting
  assert.equal(r.gaps.searchHoursToday[0], s.notes[0])
  const written = applySuggestions(fields, r, { keys: ['searchHoursToday', 'selfHostEngineers'], now: NOW })
  assert.equal(get(written, 'searchHoursToday').value, '')
  assert.deepEqual(get(written, 'searchHoursToday').source.notes, r.gaps.searchHoursToday)
  assert.deepEqual(get(written, 'selfHostEngineers').source.enabled, [])
  // with only Gong off, the note names just Gong
  const one = await suggestValues({ company: 'A', fields, keys: ['searchHoursToday'], connectors: { ...ALL_OFF, hubspot: true, slack: true, clay: true, lemlist: true }, documents: [], model: model0(fields), agent: none })
  assert.ok(one.gaps.searchHoursToday.includes('Gong is disabled, so no call figures were used.'))
})

test('an allowed connection with nothing uploaded says so', async () => {
  const fields = fieldsWith({ engineers: 500 })
  const r = await suggestValues({ company: 'Acme', fields, keys: ['searchHoursToday'], connectors: { ...ALL_OFF, gong: true }, documents: [], model: model0(fields), agent: async () => ({ suggestions: [] }) })
  assert.ok(r.gaps.searchHoursToday.includes('Gong is allowed but nothing has been uploaded.'))
})

// ------------------------------------------------------------------------ derived

test('derived values state their rule', () => {
  const fields = fieldsWith({ engineers: 500, platformShare: 30, maintPctToday: 4, maintPctPortal: 2, selfHostSalary: 208000 })
  const out = derivedSuggestions({ model: model0(fields), keys: ['selfHostEngineers', 'hourlyCost', 'selfHostSalary'] })
  assert.equal(out.selfHostEngineers.value, 3)
  assert.match(out.selfHostEngineers.origin, /^Rule:/)
  assert.equal(out.hourlyCost.value, 100)
  assert.match(out.hourlyCost.origin, /^Rule: self-host engineer cost \$208,000 ÷ 2,080 hours a year/)
  assert.equal(out.selfHostSalary, undefined) // hourlyCost is blank in this case
})

// -------------------------------------------------------------------- the ranking

test('a figure stated on a call is an input with the quote as its origin, and beats a benchmark', async () => {
  const fields = fieldsWith({ engineers: 500 })
  const documents = [{ id: 'g', source: 'gong', name: 'Discovery call', text: 'We spend about 3 hours a week searching.' }]
  const agent = async () => ({
    suggestions: [
      { key: 'searchHoursToday', value: 6, state: 'suggestion', kind: 'benchmark', origin: 'Benchmark: Some report (https://x.example/r)', link: 'https://x.example/r', confidence: 'low' },
      { key: 'searchHoursToday', value: 3, state: 'input', kind: 'transcript', quote: 'We spend about 3 hours a week searching.', origin: '“We spend about 3 hours a week searching.” — Gong: Discovery call', confidence: 'high' }
    ]
  })
  const r = await suggestValues({ company: 'Acme', fields, keys: ['searchHoursToday'], connectors: { ...ALL_OFF, gong: true }, documents, model: model0(fields), agent })
  assert.equal(r.suggestions.searchHoursToday.value, 3)
  const written = get(applySuggestions(fields, r, { keys: ['searchHoursToday'], now: NOW }), 'searchHoursToday')
  assert.equal(stateOf(written), 'input')
  assert.equal(written.source.quote, 'We spend about 3 hours a week searching.')
  assert.match(written.source.origin, /^“We spend about 3 hours/)
})

test('if the agent is unavailable the rule-based suggestions still work and the model still computes', async () => {
  const fields = fieldsWith({ engineers: 500, platformShare: 30, maintPctToday: 4, maintPctPortal: 2 })
  const r = await suggestValues({
    company: 'Acme',
    fields,
    keys: ['selfHostEngineers', 'searchHoursToday'],
    connectors: ALL_OFF,
    documents: [],
    model: model0(fields),
    agent: async () => {
      throw new Error('down')
    }
  })
  assert.equal(r.agent, 'unavailable')
  assert.equal(r.suggestions.selfHostEngineers.value, 3)
  assert.ok(r.suggestions.selfHostEngineers.notes.some(n => /agent is unavailable/.test(n)))
  assert.ok(r.gaps.searchHoursToday.some(n => /agent is unavailable/.test(n)))
  const filled = applySuggestions(fields, r, { keys: ['selfHostEngineers'], now: NOW })
  assert.equal(computeModel(valuesOf(filled)).figures.selfHostCost.incomplete, true) // still waiting on its own other input
})

test('a with-Portal suggestion above its today value is dropped, never written', async () => {
  const fields = fieldsWith({ searchHoursToday: 2 })
  const agent = async () => ({ suggestions: [{ key: 'searchHoursPortal', value: 4, state: 'suggestion', kind: 'benchmark', origin: 'Benchmark: X (https://x.example)', confidence: 'low' }] })
  const r = await suggestValues({ company: 'A', fields, keys: ['searchHoursPortal'], connectors: ALL_OFF, documents: [], model: model0(fields), agent })
  assert.equal(r.suggestions.searchHoursPortal, undefined)
  assert.ok(r.gaps.searchHoursPortal[0].includes('dropped'))
})

test('only empty fields are suggested by default', () => {
  assert.deepEqual(emptyKeys(fieldsWith({ engineers: 10 })).includes('engineers'), false)
  assert.ok(emptyKeys(fieldsWith({ engineers: 10 })).includes('hourlyCost'))
})

// ----------------------------------------------------- the agent's output is checked

test('a quote must be in the document and the number must be in the quote', () => {
  const documents = [{ id: 'd1', source: 'gong', name: 'Call', text: 'Honestly we have around 1,200 engineers\nand about 3 hours lost.' }]
  const ok = validateAgentItems({ suggestions: [{ key: 'engineers', value: 1200, quote: 'we have around 1,200 engineers', document: 'd1', confidence: 'high' }] }, { documents, seen: new Set(), only: ['engineers'] })
  assert.equal(ok.length, 1)
  assert.equal(ok[0].state, 'input')
  assert.match(ok[0].origin, /^“we have around 1,200 engineers” — Gong: Call$/)
  // invented quote, wrong number, wrong document, not asked for, out of range
  const bad = validateAgentItems(
    {
      suggestions: [
        { key: 'engineers', value: 1200, quote: 'we have 1,200 engineers', document: 'd1' },
        { key: 'engineers', value: 900, quote: 'we have around 1,200 engineers', document: 'd1' },
        { key: 'engineers', value: 1200, quote: 'we have around 1,200 engineers', document: 'd9' },
        { key: 'hourlyCost', value: 100, quote: 'about 3 hours lost', document: 'd1' },
        { key: 'engineers', value: 0, quote: 'around 1,200 engineers', document: 'd1' },
        { key: 'engineers', value: 1200 } // a guess with no source
      ]
    },
    { documents, seen: new Set(), only: ['engineers'] }
  )
  assert.deepEqual(bad, [])
  assert.ok(quoteSupportsValue('budget of $250k a year', 250000))
  assert.ok(!quoteSupportsValue('about 3 hours', 4))
})

test('a link must have come from the search; headcount is an input, a benchmark is a suggestion', () => {
  const seen = new Set(['example.com/careers', 'example.com/report'])
  const out = validateAgentItems(
    {
      suggestions: [
        { key: 'newHiresPerYear', value: 60, link: 'https://www.example.com/careers', confidence: 'medium' },
        { key: 'searchHoursToday', value: 3, link: 'https://example.com/report', publication: 'State of DevEx 2025' },
        { key: 'engineers', value: 500, link: 'https://example.com/made-up' },
        { key: 'hourlyCost', value: 100, link: 'https://example.com/report' } // a link with no publication for a non-fact
      ]
    },
    { documents: [], seen, only: ['newHiresPerYear', 'searchHoursToday', 'engineers', 'hourlyCost'] }
  )
  const byKey = Object.fromEntries(out.map(s => [s.key, s]))
  assert.equal(byKey.newHiresPerYear.state, 'input')
  assert.equal(byKey.newHiresPerYear.origin, 'Public source: https://www.example.com/careers')
  assert.equal(byKey.searchHoursToday.state, 'suggestion')
  assert.match(byKey.searchHoursToday.origin, /^Benchmark: State of DevEx 2025/)
  assert.equal(byKey.engineers, undefined)
  assert.equal(byKey.hourlyCost, undefined)
})

// ------------------------------------------------------------- old data and case files

test('fields saved before sources existed keep their numbers, with an honest origin', () => {
  const saved = { ...newProject('Old Co'), fields: [{ key: 'engineers', value: 500, confirmed: true }, { key: 'hourlyCost', value: 100, confirmed: false }, { key: 'portalCost', value: '', confirmed: false }] }
  const p = hydrate(saved)
  assert.equal(stateOf(get(p.fields, 'engineers')), 'input')
  assert.equal(stateOf(get(p.fields, 'hourlyCost')), 'assumption')
  assert.equal(stateOf(get(p.fields, 'portalCost')), 'empty')
  assert.match(get(p.fields, 'hourlyCost').source.origin, /earlier version/)
})

test('a case file keeps every source through export and import', () => {
  let fields = fieldsWith({ engineers: 500 })
  fields = applySuggestions(fields, { suggestions: { hourlyCost: { value: 95, state: 'suggestion', origin: 'Based on 1 similar deal (A)', confidence: 'low', kind: 'pastDeals' } }, gaps: { searchHoursToday: ['Gong is disabled, so no call figures were used.'] }, enabled: ['Past deals'] }, { keys: ['hourlyCost', 'searchHoursToday'], now: NOW })
  const file = projectToCaseFile({ ...newProject('Acme'), fields })
  assert.deepEqual(checkCaseFile(JSON.parse(JSON.stringify(file))).errors, [])
  const back = caseFileToProject(JSON.parse(JSON.stringify(file)))
  assert.deepEqual(get(back.fields, 'hourlyCost').source, get(fields, 'hourlyCost').source)
  assert.equal(stateOf(get(back.fields, 'engineers')), 'assumption')
  assert.equal(stateOf(get(back.fields, 'searchHoursToday')), 'empty')
  // an older file with only `confirmed` still loads
  const legacy = caseFileToProject({ caseBuilder: 1, company: 'Old', inputs: { engineers: { value: 10, confirmed: true } } })
  assert.equal(stateOf(get(legacy.fields, 'engineers')), 'input')
})

// ----------------------------------------------------- Chris's page versus the client's

test('the internal summary lists every field, its state and origin, and the open questions', () => {
  let fields = fieldsWith({ engineers: 500, hourlyCost: 100 }, { engineers: { state: 'input', origin: 'Said on the 3 May call' }, hourlyCost: { state: 'assumption', origin: 'Typical for the region' } })
  fields = applySuggestions(fields, { suggestions: {}, gaps: { portalCost: ['Gong is disabled, so no call figures were used.'] }, enabled: [] }, { keys: ['portalCost'], now: NOW })
  const inputs = valuesOf(fields)
  const facts = prepareInternal({ company: 'Acme', fields, inputs, connectors: { ...defaultConnectors(), gong: true } })
  const html = buildInternalSummary({ facts, logoSvg: '<svg></svg>', faviconSvg: '' })
  assert.equal(facts.confidence, confidence(fields))
  assert.deepEqual(facts.connections, ['Gong'])
  assert.ok(html.includes('Said on the 3 May call') && html.includes('Typical for the region'))
  assert.ok(html.includes('Gong is disabled, so no call figures were used.'))
  assert.ok(html.includes('Questions to confirm'))
  assert.ok(html.includes('Engineers') && html.includes('Audits or compliance reviews per year'))
  assert.ok(facts.waiting.length > 0)
  // it is built for Chris: the one-pager for the client never carries any of it
  const who = { key: 'champion', role: 'Director', lead: [], cares: 'x', tag: '', headline: () => null, objection: '', counter: '', needsToSee: [] }
  const client = buildOnePager({ facts: prepareOnePager({ inputs: { ...DEMO_VALUES }, fields, who }), logoSvg: '<svg></svg>', faviconSvg: '' })
  for (const leak of ['Said on the 3 May call', 'Typical for the region', 'Questions to confirm', 'still to confirm', 'Assumption', 'Suggestion', 'confidence']) {
    assert.ok(!client.includes(leak), `the one-pager leaked "${leak}"`)
  }
})
