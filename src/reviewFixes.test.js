// v0.16.0 review fixes (Codex review): one test per finding.
import test from 'node:test'
import assert from 'node:assert/strict'
import zlib from 'node:zlib'
import { applyDeckOps, applyAgentReply, undoAgentReply, redoAgentReply, agentRedoConflicts, FIGURE } from './agentDeckEdits.js'
import { defaultDeck } from './deck/model.js'
import { DEFAULT_BRAND } from './brand.js'
import { pngInk } from '../server/logoFit.js'

const NOW = '2026-10-26T12:00:00.000Z'
const hero = d => d[0].blocks.find(b => b.style === 'hero')
const deal = () => ({ id: 'd1', deck: defaultDeck(), brand: { ...DEFAULT_BRAND }, fields: [], agentLog: {} })

test('agent cannot type figures; plain words, counts, years and tokens are fine', () => {
  for (const bad of ['Annual savings: $10 million', 'Save 30% a year', 'Worth 4.2M', '3 million users', '12,000 seats', '€5 back'])
    assert.ok(FIGURE.test(bad), bad)
  for (const ok of ['Rollout plan', '3 steps to launch', 'Q3 2026', 'Saves {annualSavings} a year', 'Phase 2'])
    assert.ok(!FIGURE.test(ok.replace(/\{\w+\}/g, '')), ok)
  const d = defaultDeck()
  const r = applyDeckOps(d, DEFAULT_BRAND, [{ op: 'set_text', slide_id: d[0].id, block_id: hero(d).id, value: 'Annual savings: $10 million' }], { now: NOW })
  assert.equal(r.changes.length, 0)
  assert.match(r.refused.join(' '), /cannot type figures/)
  assert.equal(hero(r.deck).text, hero(d).text)
})

test('an agent edit does not overwrite text the user changed while it worked', () => {
  const d = defaultDeck()
  const seen = hero(d).text
  hero(d).text = 'My own title'
  const r = applyDeckOps(d, DEFAULT_BRAND, [{ op: 'set_text', slide_id: d[0].id, block_id: hero(d).id, value: 'Agent title', expect: seen }], { now: NOW })
  assert.equal(r.changes.length, 0)
  assert.equal(hero(r.deck).text, 'My own title')
  assert.match(r.refused.join(' '), /while the agent was working, so yours was kept/)
  // Unchanged since the agent read it: applies.
  const d2 = defaultDeck()
  const ok = applyDeckOps(d2, DEFAULT_BRAND, [{ op: 'set_text', slide_id: d2[0].id, block_id: hero(d2).id, value: 'Agent title', expect: hero(d2).text }], { now: NOW })
  assert.equal(hero(ok.deck).text, 'Agent title')
})

test('Redo asks first when the user edited the same thing after the undo', () => {
  let p = deal()
  const op = { op: 'set_text', slide_id: p.deck[0].id, block_id: hero(p.deck).id, value: 'Agent title' }
  p = { ...p, ...applyAgentReply(p, 'm1', { deckOps: [op] }, { now: NOW }) }
  p = { ...p, ...undoAgentReply(p, 'm1', { force: true }) }
  assert.deepEqual(agentRedoConflicts(p, 'm1'), [])
  p = { ...p, deck: p.deck.map((s, i) => i ? s : { ...s, blocks: s.blocks.map(b => b.style === 'hero' ? { ...b, text: 'Mine after undo' } : b) }) }
  assert.deepEqual(agentRedoConflicts(p, 'm1'), ['page 1'])
  // Forced redo still works.
  p = { ...p, ...redoAgentReply(p, 'm1') }
  assert.equal(hero(p.deck).text, 'Agent title')
})

test('a PNG that inflates past its declared size is refused, not decompressed', () => {
  const chunk = (kind, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    return Buffer.concat([len, Buffer.from(kind, 'ascii'), data, Buffer.alloc(4)])
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(10, 0); ihdr.writeUInt32BE(10, 4); ihdr[8] = 8; ihdr[9] = 6
  const bomb = zlib.deflateSync(Buffer.alloc(50_000_000))
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', bomb), chunk('IEND', Buffer.alloc(0))])
  const t = Date.now()
  assert.equal(pngInk(png), '')
  assert.ok(Date.now() - t < 1000, 'returned quickly')
})
