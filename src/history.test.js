import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyHistory, diffParts, pushStep, undoStep, redoStep, actionLabel, LIMIT } from './useHistory.js'
import { applyAgentReply, undoAgentReply, redoAgentReply, agentReplyConflicts, agentStepLabel } from './agentDeckEdits.js'
import { defaultDeck } from './deck/model.js'
import { DEFAULT_BRAND } from './brand.js'
import { INPUT_FIELDS } from './valueModel.js'

const state = () => ({ deck: [{ id: 's1', blocks: [] }], brand: { primary: '#000000' }, fields: [], stakeholders: [] })
const step = (prev, next, label, key) => ({ ...diffParts(prev, next), label, key })

test('diffParts keeps only the tracked parts that changed', () => {
  const a = state()
  const b = { ...a, deck: [...a.deck, { id: 's2', blocks: [] }], agentLog: { x: 1 } }
  const d = diffParts(a, b)
  assert.deepEqual(Object.keys(d.before), ['deck'])
  assert.equal(d.after.deck, b.deck)
  assert.equal(diffParts(a, { ...a, agentLog: {} }), null)
})

test('undo puts back the step before it, redo applies it again', () => {
  const a = state()
  const b = { ...a, deck: [] }
  let h = pushStep(emptyHistory(), step(a, b, 'Deleted page 1'), { now: 1 })
  assert.equal(h.past.length, 1)
  const u = undoStep(h)
  assert.equal(u.step.label, 'Deleted page 1')
  assert.equal(u.step.before.deck, a.deck)
  assert.equal(u.history.past.length, 0)
  assert.equal(u.history.future.length, 1)
  const r = redoStep(u.history)
  assert.equal(r.step.after.deck, b.deck)
  assert.equal(r.history.past.length, 1)
  assert.equal(r.history.future.length, 0)
  assert.equal(undoStep(emptyHistory()).step, null)
  assert.equal(redoStep(emptyHistory()).step, null)
})

test('a new change clears redo', () => {
  const a = state()
  const b = { ...a, deck: [] }
  const c = { ...a, brand: { primary: '#ffffff' } }
  let h = pushStep(emptyHistory(), step(a, b, 'Deleted page 1'), { now: 1 })
  h = undoStep(h).history
  assert.equal(h.future.length, 1)
  h = pushStep(h, step(a, c, 'Changed background colour'), { now: 2 })
  assert.equal(h.future.length, 0)
  assert.deepEqual(h.past.map(s => s.label), ['Changed background colour'])
})

test('typing into the same block within a second is one step', () => {
  const s0 = state()
  const s1 = { ...s0, deck: [{ id: 's1', blocks: [{ id: 'b', text: 'H' }] }] }
  const s2 = { ...s0, deck: [{ id: 's1', blocks: [{ id: 'b', text: 'Hi' }] }] }
  const s3 = { ...s0, deck: [{ id: 's1', blocks: [{ id: 'b', text: 'Hi!' }] }] }
  let h = pushStep(emptyHistory(), step(s0, s1, 'Edited text on page 1', 'text:b'), { now: 1000 })
  h = pushStep(h, step(s1, s2, 'Edited text on page 1', 'text:b'), { now: 1600 })
  h = pushStep(h, step(s2, s3, 'Edited text on page 1', 'text:b'), { now: 2400 })
  assert.equal(h.past.length, 1)
  assert.equal(h.past[0].before.deck, s0.deck)
  assert.equal(h.past[0].after.deck, s3.deck)
  // a pause longer than a second starts a new step
  h = pushStep(h, step(s3, s0, 'Edited text on page 1', 'text:b'), { now: 3600 })
  assert.equal(h.past.length, 2)
  // a different block is a new step even when quick
  h = pushStep(h, step(s0, s1, 'Edited text on page 1', 'text:c'), { now: 3700 })
  assert.equal(h.past.length, 3)
})

test('a merged step keeps every part either change touched', () => {
  const a = state()
  const b = { ...a, deck: [] }
  const c = { ...b, brand: { primary: '#ffffff' } }
  let h = pushStep(emptyHistory(), step(a, b, 'Edit', 'k'), { now: 1 })
  h = pushStep(h, step(b, c, 'Edit', 'k'), { now: 2 })
  assert.equal(h.past.length, 1)
  assert.equal(h.past[0].before.deck, a.deck)
  assert.equal(h.past[0].before.brand, a.brand)
  assert.equal(h.past[0].after.brand, c.brand)
})

test('history is capped at 100 steps, oldest dropped first', () => {
  let h = emptyHistory()
  for (let i = 0; i < LIMIT + 20; i++) h = pushStep(h, { before: { deck: [i] }, after: { deck: [i + 1] }, label: `Step ${i}` }, { now: i * 5000 })
  assert.equal(h.past.length, LIMIT)
  assert.equal(h.past[0].label, 'Step 20')
})

test('tooltips read "Undo: deleted page 3"', () => {
  assert.equal(actionLabel('Undo', { label: 'Deleted page 3' }), 'Undo: deleted page 3')
  assert.equal(actionLabel('Redo', null), 'Nothing to redo')
})

// ---- agent changes: Undo always undoes, after asking when the user edited since

const NOW = '2026-10-26T12:00:00.000Z'
const project = () => ({ deck: defaultDeck(), brand: { ...DEFAULT_BRAND }, fields: INPUT_FIELDS.map(f => ({ ...f })), agentLog: {} })
const hero = d => d[0].blocks.find(b => b.style === 'hero')

test('a clean agent undo has no conflicts', () => {
  let p = project()
  p = { ...p, ...applyAgentReply(p, 'm1', { deckOps: [{ op: 'set_text', slide_id: p.deck[0].id, block_id: hero(p.deck).id, field: 'text', value: 'Agent title' }] }, { now: NOW }) }
  assert.deepEqual(agentReplyConflicts(p, 'm1'), [])
  assert.match(agentStepLabel(p.agentLog.m1), /^Agent: changed the hero title on page 1$/)
})

test('a user edit since is named, and Undo anyway puts the agent change back', () => {
  let p = project()
  const original = hero(p.deck).text
  p = { ...p, ...applyAgentReply(p, 'm1', { deckOps: [{ op: 'set_text', slide_id: p.deck[0].id, block_id: hero(p.deck).id, field: 'text', value: 'Agent title' }] }, { now: NOW }) }
  // the user edits the same text afterwards
  p = { ...p, deck: p.deck.map((s, i) => (i ? s : { ...s, blocks: s.blocks.map(b => (b.style === 'hero' ? { ...b, text: 'My title' } : b)) })) }
  assert.deepEqual(agentReplyConflicts(p, 'm1'), ['page 1'])
  // plain undo keeps the user's text (old rule) ...
  const kept = { ...p, ...undoAgentReply(p, 'm1') }
  assert.equal(hero(kept.deck).text, 'My title')
  // ... "Undo anyway" really undoes
  const forced = { ...p, ...undoAgentReply(p, 'm1', { force: true }) }
  assert.equal(hero(forced.deck).text, original)
  assert.equal(forced.agentLog.m1.undone, true)
  assert.deepEqual(forced.agentLog.m1.deckSkipped, [])
})

test('field edits from the agent follow the same rule', () => {
  let p = project()
  const f = p.fields.find(x => x.type === 'number' && !x.structural && !x.custom)
  p = { ...p, ...applyAgentReply(p, 'm1', { edits: [{ key: f.key, value: 123 }] }, { now: NOW }) }
  p = { ...p, fields: p.fields.map(x => (x.key === f.key ? { ...x, value: 456 } : x)) }
  assert.deepEqual(agentReplyConflicts(p, 'm1'), [f.label])
  const forced = { ...p, ...undoAgentReply(p, 'm1', { force: true }) }
  assert.equal(forced.fields.find(x => x.key === f.key).value, f.value)
})

test('redo brings an undone agent reply back', () => {
  let p = project()
  const pages = p.deck.length
  p = { ...p, ...applyAgentReply(p, 'm1', { deckOps: [
    { op: 'add_slide', template: 'bullets', after_slide_id: p.deck[0].id },
    { op: 'set_brand', background: '#ffffff' }
  ] }, { now: NOW }) }
  const added = p.deck[1].id
  p = { ...p, ...undoAgentReply(p, 'm1') }
  assert.equal(p.deck.length, pages)
  assert.equal(p.brand.background, DEFAULT_BRAND.background)
  p = { ...p, ...redoAgentReply(p, 'm1') }
  assert.equal(p.deck.length, pages + 1)
  assert.equal(p.deck[1].id, added)
  assert.equal(p.brand.background, '#ffffff')
  assert.equal(p.agentLog.m1.undone, false)
  assert.deepEqual(redoAgentReply(p, 'm1'), {})
})
