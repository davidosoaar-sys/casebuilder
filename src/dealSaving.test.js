import test from 'node:test'
import assert from 'node:assert/strict'
import { createDealStorage, createDealAutosaver, DEAL_PREFIX, LEGACY_KEY } from './dealStorage.js'
import { newProject, hydrate, duplicateProject } from './projects.js'
import { buildDealReport, cheatSheetBlocks, dealMarkdown, markdownFilename } from './dealReport.js'

function memory() {
  const map = new Map()
  return { get length() { return map.size }, key: i => [...map.keys()][i], getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: k => map.delete(k) }
}
const make = name => newProject(name, { web: true })

test('sample project seeds once without replacing other deals or returning after deletion', () => {
  const backend = memory(), store = createDealStorage(() => backend), original = make('Original')
  store.set(original)
  const seed = () => store.seedSample('spotify.v1', () => make('Spotify'), p => p.name === 'Spotify')
  seed(); seed()
  assert.equal(store.list().length, 2)
  const sample = store.list().find(p => p.name === 'Spotify')
  assert.ok(sample.projectLogo.startsWith('data:image/svg+xml;base64,'))
  assert.deepEqual(store.get(original.id), original)
  store.delete(sample.id); seed()
  assert.deepEqual(store.list(), [original])
})

test('complete deals restore exactly, including sources and custom work', () => {
  const backend = memory(), store = createDealStorage(() => backend), deal = make('Northwind')
  deal.fields[0].source = { state: 'input', origin: 'Interview', quote: 'Exact quote', link: 'https://example.com', pinnedAt: '2026-10-24', notes: ['Keep me'] }
  deal.customFigures = [{ equation: 'a * b', value: 12 }]
  deal.editedEquations = { x: 'a + b' }
  deal.scenario = { inputs: { engineers: 560 } }
  store.set(deal)
  assert.deepEqual(createDealStorage(() => backend).get(deal.id), deal)
  assert.deepEqual(hydrate(store.get(deal.id)).fields[0].source, deal.fields[0].source)
})

test('two deals and an independent duplicate never overwrite each other', () => {
  const store = createDealStorage(() => backend), backend = memory()
  const a = make('Same name'), b = make('Same name')
  store.set(a); store.set(b)
  const copy = duplicateProject(a)
  copy.stakeholders.push({ key: 'custom', role: 'Buyer' })
  store.set(copy)
  assert.equal(store.list().length, 3)
  assert.deepEqual(store.get(a.id), a)
  store.delete(b.id)
  assert.equal(store.list().length, 2)
})

test('corrupt records and legacy data are backed up without wiping valid deals', () => {
  const backend = memory(), store = createDealStorage(() => backend), deal = make('Safe')
  store.set(deal)
  backend.setItem(DEAL_PREFIX + 'bad', '{broken')
  backend.setItem(LEGACY_KEY, '[broken')
  store.migrateLegacy(hydrate)
  assert.deepEqual(store.list(), [deal])
  assert.equal(backend.getItem(DEAL_PREFIX + 'bad'), '{broken')
  assert.equal(backend.getItem('casebuilder.backup:' + DEAL_PREFIX + 'bad'), '{broken')
  assert.equal(backend.getItem('casebuilder.backup:' + LEGACY_KEY), '[broken')
})

test('partial writes and storage failure preserve the last complete copy', () => {
  const backend = memory(), store = createDealStorage(() => backend), deal = make('Safe')
  store.set(deal)
  assert.throws(() => store.set({ ...deal, fields: [] }), /incomplete/)
  const raw = backend.getItem(DEAL_PREFIX + deal.id)
  backend.setItem = () => { throw new Error('quota') }
  assert.throws(() => store.set({ ...deal, name: 'New' }), /quota/)
  assert.equal(backend.getItem(DEAL_PREFIX + deal.id), raw)
})

test('legacy migration preserves all records and deletion does not resurrect them', () => {
  const backend = memory(), store = createDealStorage(() => backend), a = make('A'), b = make('B')
  backend.setItem(LEGACY_KEY, JSON.stringify([a, b]))
  store.migrateLegacy(hydrate)
  assert.equal(store.list().length, 2)
  store.delete(a.id); store.migrateLegacy(hydrate)
  assert.equal(store.list().length, 1)
  assert.ok(backend.getItem(LEGACY_KEY))
})

test('debouncing keeps latest snapshots per deal and failed writes can retry', () => {
  const writes = [], scheduled = new Map(); let sequence = 0, fail = true
  const saver = createDealAutosaver({ set: d => { if (fail) throw new Error('quota'); writes.push(d) } }, { schedule: fn => { scheduled.set(++sequence, fn); return sequence }, cancel: id => scheduled.delete(id) })
  const a = make('A'), b = make('B')
  saver.queue(a); saver.queue({ ...a, name: 'Latest' }); saver.queue(b)
  assert.equal(scheduled.size, 1)
  assert.equal(saver.flush(), false)
  assert.ok(saver.hasPending())
  fail = false; saver.flush()
  assert.deepEqual(writes.map(d => d.name), ['Latest', 'B'])
  assert.equal(saver.hasPending(), false)
})

test('missing figures become open questions in both internal outputs, never zero figures', () => {
  const deal = make('Empty'), r = buildDealReport(deal)
  assert.equal(r.figures.length, 0)
  const blocks = cheatSheetBlocks(r)
  assert.match(blocks.find(b => b.title === 'Open questions').text, /waiting on/)
  assert.doesNotMatch(blocks.find(b => b.title === 'Drivers and arithmetic').text, /\$0/)
  const md = dealMarkdown(deal)
  assert.equal(md.split('## Figures\n')[1].split('## Portal')[0].trim(), '')
  assert.match(md.split('## Open questions')[1], /waiting on/)
})

test('markdown follows the supplied section order, includes arithmetic and full sources', () => {
  const deal = make('Acme & Co')
  const values = { engineers: 500, searchHoursToday: 3, searchHoursPortal: 1, hourlyCost: 100, weeksPerYear: 48 }
  deal.fields = deal.fields.map(f => f.key in values ? { ...f, value: values[f.key], source: { state: 'input', origin: 'Interview', quote: 'Confirmed', link: 'https://example.com', pinnedAt: '2026-10-24' } } : f)
  const md = dealMarkdown(deal, new Date(2026, 9, 24))
  assert.deepEqual([...md.matchAll(/^## (.+)$/gm)].map(m => m[1]), ['Context', 'Headline', 'Figures', 'Portal versus self-hosting', 'Inputs', 'Open questions', 'Stakeholders'])
  assert.match(md, /Equation: `/)
  assert.match(md, /With values: `/)
  assert.match(md, /Quote: Confirmed; Link: https:\/\/example.com; Pinned: 2026-10-24/)
  assert.equal(markdownFilename(deal, new Date(2026, 9, 24)), 'casebuilder-acme-co-2026-10-24.md')
})
