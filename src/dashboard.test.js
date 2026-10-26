import test from 'node:test'
import assert from 'node:assert/strict'
import { INPUT_FIELDS, valueRange } from './valueModel.js'
import { computeModel } from './model.js'
import { DEFAULT_BRAND } from './brand.js'
import {
  readiness, fmtRange, coverage, coverageLine, isDefaultBrand, nextAction, dealSummary, triage, pipelineLine,
  readSeen, writeSeen, changesSince, ago, sinceLabel, SEEN_KEY
} from './dashboard.js'

// Fields with values: { key: [value, state] }; everything else stays empty.
const fieldsWith = values => INPUT_FIELDS.map(f => values[f.key]
  ? { ...f, value: values[f.key][0], source: { state: values[f.key][1], origin: 'test', ...(values[f.key][2] ? { pinnedAt: values[f.key][2] } : {}) } }
  : f)
const inputsOf = fields => Object.fromEntries(fields.map(f => [f.key, f.value]))
const TOOLS = { toolSpendToday: [200000, 'input'], toolSpendPortal: [100000, 'input'] }
const SEARCH = { engineers: [500, 'input'], hourlyCost: [100, 'assumption'], searchHoursToday: [3, 'suggestion'], searchHoursPortal: [2, 'input'] }
const brand = { ...DEFAULT_BRAND, status: 'ready', logo: 'data:image/png;base64,iVBORw0KGgo=' }
const deal = (id, extra = {}) => ({ id, name: `Deal ${id}`, updatedAt: 0, fields: fieldsWith({}), stakeholders: [], people: {}, brand, ...extra })
const memStore = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) } }

test('readiness counts the case inputs by state and the widths add to 100', () => {
  const r = readiness(fieldsWith({ ...SEARCH, rampDaysToday: [30, 'suggestion'] }))
  assert.deepEqual(r.counts, { input: 2, assumption: 1, suggestion: 2, empty: r.total - 5 })
  assert.equal(r.total, 23) // numeric, non-calendar inputs only
  assert.ok(Math.abs(r.segments.reduce((a, s) => a + s.share, 0) - 100) < 1e-9)
  assert.equal(r.confirmedShare, 2 / 23)
  assert.deepEqual(r.segments.map(s => s.state), ['input', 'assumption', 'suggestion', 'empty'])
})

test('readiness of a deal with no inputs is one empty bar', () => {
  const r = readiness([])
  assert.equal(r.total, 0)
  assert.equal(r.segments.find(s => s.state === 'empty').share, 100)
  assert.equal(r.confirmedShare, 0)
})

test('valueRange: null when the model cannot compute a total', () => {
  assert.equal(valueRange(fieldsWith({})), null)
  assert.equal(valueRange(fieldsWith({ engineers: [500, 'input'] })), null)
})

test('valueRange: confirmed inputs only means no spread', () => {
  const r = valueRange(fieldsWith(TOOLS))
  assert.deepEqual(r, { low: 100000, mid: 100000, high: 100000 })
  assert.equal(fmtRange(r), '$100k a year')
})

test('valueRange: the middle is the deck figure and each unconfirmed input moves 20% the right way', () => {
  const fields = fieldsWith(SEARCH)
  const r = valueRange(fields)
  assert.equal(r.mid, computeModel(inputsOf(fields)).figures.totalValue.value)
  // (hours today - hours portal) * engineers * 48 weeks * hourly cost; today and cost move, portal and engineers are confirmed
  assert.equal(Math.round(r.low), Math.round((3 * 0.8 - 2) * 500 * 48 * 100 * 0.8))
  assert.equal(Math.round(r.high), Math.round((3 * 1.2 - 2) * 500 * 48 * 100 * 1.2))
  assert.ok(r.low < r.mid && r.mid < r.high)
})

test('valueRange: an input where lower is better moves the other way', () => {
  // the with-Portal hours are a suggestion: fewer hours with Portal is more value
  const fields = fieldsWith({ engineers: [500, 'input'], hourlyCost: [100, 'input'], searchHoursToday: [3, 'input'], searchHoursPortal: [2, 'suggestion'] })
  const r = valueRange(fields)
  assert.equal(Math.round(r.low), Math.round((3 - 2.4) * 500 * 48 * 100))
  assert.equal(Math.round(r.high), Math.round((3 - 1.6) * 500 * 48 * 100))
})

test('fmtRange reads as a yearly range', () => {
  assert.equal(fmtRange({ low: 1800000, high: 2400000 }), '$1.8M to $2.4M a year')
  assert.equal(fmtRange(null), null)
})

test('coverage: a role is covered by a found or a named person, and the first gap is named', () => {
  const d = deal('a', {
    stakeholders: [{ key: 'champion', builtin: true }, { key: 'cto', builtin: true }, { key: 'finance', builtin: true }, { key: 'legal', role: 'General Counsel' }],
    people: { champion: [{ name: 'Ana' }] }
  })
  d.stakeholders[1].namedPeople = [{ name: 'Bo' }]
  const c = coverage(d)
  assert.deepEqual(c, { covered: 2, total: 4, gap: { key: 'finance', name: 'finance lead' } })
  assert.equal(coverageLine(c), '2 of 4 roles have a person. No finance lead yet')
  assert.equal(coverageLine(coverage(deal('b'))), 'No stakeholders mapped yet')
  assert.equal(coverageLine({ covered: 1, total: 1, gap: null }), '1 of 1 role has a person')
  assert.equal(coverageLine({ covered: 1, total: 4, gap: { name: 'CTO' } }), '1 of 4 roles has a person. No CTO yet')
})

test('isDefaultBrand: the app look with no logo, not a scanned or edited brand', () => {
  assert.equal(isDefaultBrand({ ...DEFAULT_BRAND }), true)
  assert.equal(isDefaultBrand(undefined), true)
  assert.equal(isDefaultBrand(brand), false)
  assert.equal(isDefaultBrand({ ...DEFAULT_BRAND, primary: '#ff0000' }), false)
  assert.equal(isDefaultBrand({ ...DEFAULT_BRAND, status: 'scanning' }), false)
})

test('nextAction: suggestions, then unvalued inputs, then a missing person, then empties, brand, assumptions', () => {
  const people = { stakeholders: [{ key: 'cto', builtin: true }], people: { cto: [{ name: 'X' }] } }
  assert.equal(nextAction(deal('a', { fields: fieldsWith(SEARCH) })).label, 'Review 1 suggestion')
  assert.equal(nextAction(deal('a', { fields: fieldsWith({ engineers: [500, 'input'] }) })).label, 'Fill 22 inputs')
  const find = nextAction(deal('a', { name: 'Acme deal', fields: fieldsWith({ ...TOOLS, companyName: undefined }), stakeholders: [{ key: 'finance', builtin: true }] }))
  assert.equal(find.kind, 'find')
  assert.equal(find.label, 'Find the finance lead')
  assert.equal(find.prompt, 'Find the finance lead at Northwind Retail')
  assert.equal(nextAction(deal('a', { fields: fieldsWith(TOOLS), ...people })).label, 'Fill 21 inputs')
  const all = Object.fromEntries(INPUT_FIELDS.filter(f => f.source.state === 'empty').map(f => [f.key, [1, 'input']]))
  assert.equal(nextAction(deal('a', { fields: fieldsWith({ ...all, ...TOOLS }), ...people, brand: { ...DEFAULT_BRAND } })).label, 'Rescan branding')
  assert.equal(nextAction(deal('a', { fields: fieldsWith({ ...all, hourlyCost: [100, 'assumption'] }), ...people })).label, 'Confirm 1 input')
  assert.equal(nextAction(deal('a', { fields: fieldsWith(all), ...people })), null)
})

test('triage: least confirmed first, at most 5, deals with nothing to do go below', () => {
  const all = Object.fromEntries(INPUT_FIELDS.filter(f => f.source.state === 'empty').map(f => [f.key, [1, 'input']]))
  const people = { stakeholders: [{ key: 'cto', builtin: true }], people: { cto: [{ name: 'X' }] } }
  const deals = [
    deal('half', { fields: fieldsWith({ ...SEARCH, ...TOOLS }) }),
    deal('none', { fields: fieldsWith({}) }),
    deal('done', { fields: fieldsWith(all), ...people }),
    ...[1, 2, 3, 4].map(i => deal(`e${i}`, { fields: fieldsWith({ engineers: [5, 'input'] }), updatedAt: i }))
  ]
  const { attention, rest } = triage(deals.map(dealSummary))
  assert.equal(attention.length, 5)
  assert.equal(attention[0].deal.id, 'none')
  const shares = attention.map(s => s.readiness.confirmedShare)
  assert.deepEqual(shares, [...shares].sort((a, b) => a - b))
  assert.ok(rest.some(s => s.deal.id === 'done'))
  assert.equal(attention.length + rest.length, deals.length)
})

test('pipelineLine sums the ranges of the deals that can be valued', () => {
  const a = dealSummary(deal('a', { fields: fieldsWith(TOOLS) }))
  const b = dealSummary(deal('b', { fields: fieldsWith(SEARCH) }))
  const c = dealSummary(deal('c'))
  assert.equal(pipelineLine([]), 'No deals yet')
  assert.equal(pipelineLine([c]), '1 deal, none with enough inputs to value yet')
  assert.equal(pipelineLine([a]), '1 deal, $100k a year in total')
  // b: (2.4 - 2) * 500 * 48 * $80 = $768k low, (3.6 - 2) * 500 * 48 * $120 = $4.608M high
  assert.equal(pipelineLine([a, b]), '2 deals, $868k to $4.7M a year in total')
  assert.match(pipelineLine([a, b, c]), /in total from the 2 that can be valued$/)
})

test('seen is stored per account and defaults to a week back', () => {
  const s = memStore()
  const now = 1_800_000_000_000
  assert.equal(readSeen(s, 'u1', now), now - 7 * 24 * 3600 * 1000)
  writeSeen(s, 'u1', now - 5)
  writeSeen(s, 'u2', now - 9)
  assert.equal(readSeen(s, 'u1', now), now - 5)
  assert.equal(readSeen(s, 'u2', now), now - 9)
  assert.deepEqual(Object.keys(JSON.parse(s.getItem(SEEN_KEY))), ['u1', 'u2'])
  s.setItem(SEEN_KEY, 'not json')
  assert.equal(readSeen(s, 'u1', now), now - 7 * 24 * 3600 * 1000)
})

test('changesSince lists suggestions, files and agent changes after the last visit, newest first', () => {
  const seen = Date.parse('2026-10-20T00:00:00Z')
  const d1 = deal('d1', {
    fields: fieldsWith({ hourlyCost: [100, 'suggestion', '2026-10-21T10:00:00Z'], engineers: [5, 'suggestion', '2026-10-19T10:00:00Z'] }),
    documents: [{ name: 'Call notes', addedAt: '2026-10-22T09:00:00Z' }, { name: 'Old', addedAt: '2026-10-01T09:00:00Z' }],
    agentLog: {
      m1: { at: Date.parse('2026-10-23T09:00:00Z'), changes: [{}, {}], deckChanges: [{}] },
      m2: { at: Date.parse('2026-10-23T10:00:00Z'), changes: [{}], undone: true },
      m3: { at: Date.parse('2026-10-10T10:00:00Z'), changes: [{}] }
    }
  })
  const d2 = deal('d2')
  const files = [{ deal_id: 'd2', name: 'Deck.pdf', created_at: '2026-10-24T09:00:00Z' }, { deal_id: 'd2', name: 'RFP.pdf', created_at: '2026-10-24T08:00:00Z' }, { deal_id: 'd2', name: 'old.pdf', created_at: '2026-10-02T08:00:00Z' }]
  const items = changesSince([d1, d2], seen, files)
  assert.deepEqual(items.map(i => [i.dealId, i.kind, i.text]), [
    ['d2', 'files', '2 new files'],
    ['d1', 'agent', 'The agent changed 2 inputs and one thing in the case artifacts'],
    ['d1', 'files', 'New file: Call notes'],
    ['d1', 'suggestions', '1 suggestion waiting for review']
  ])
  assert.deepEqual(changesSince([d1, d2], Date.parse('2026-10-25T00:00:00Z'), files), [])
  assert.equal(changesSince([d1, d2], seen, files, 2).length, 2)
})

test('ago and sinceLabel: relative times and a 12-hour clock', () => {
  const now = new Date(2026, 9, 26, 15, 0).getTime()
  assert.equal(ago(now - 20e3, now), 'just now')
  assert.equal(ago(now - 5 * 60e3, now), '5 min ago')
  assert.equal(ago(now - 3 * 3600e3, now), '3 h ago')
  assert.equal(ago(now - 26 * 3600e3, now), 'yesterday')
  assert.equal(ago(now - 4 * 86400e3, now), '4 days ago')
  assert.equal(sinceLabel(new Date(2026, 9, 26, 9, 5).getTime(), now), '9:05 am today')
  assert.equal(sinceLabel(new Date(2026, 9, 25, 21, 30).getTime(), now), 'yesterday at 9:30 PM')
  assert.equal(sinceLabel(new Date(2026, 9, 19, 12, 0).getTime(), now), 'Oct 19 at 12:00 PM')
})
