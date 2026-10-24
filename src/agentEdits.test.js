import test from 'node:test'
import assert from 'node:assert/strict'
import { applyAgentEdits, undoAgentEdits, checkEdit, isAgentEditable, describeValue } from './agentEdits.js'
import { INPUT_FIELDS } from './valueModel.js'
import { computeModel } from './model.js'
import { withValue } from './source.js'

const fields = () => INPUT_FIELDS.map(f => f.key === 'engineers' ? { ...f, value: 500, source: { state: 'input', origin: 'Confirmed by the customer' } } : f)
const NOW = '2026-10-25T12:00:00.000Z'
const field = (fs, k) => fs.find(f => f.key === k)

test('a figure the user stated becomes an assumption, applied straight away', () => {
  const { fields: next, changes, refused } = applyAgentEdits(fields(), [{ key: 'engineers', value: 1200, from_user: true, reason: 'You said 1,200.' }], { now: NOW })
  assert.equal(field(next, 'engineers').value, 1200)
  assert.equal(field(next, 'engineers').source.state, 'assumption')
  assert.equal(field(next, 'engineers').source.origin, 'You said it in chat')
  assert.equal(changes.length, 1)
  assert.equal(changes[0].before.value, 500)
  assert.deepEqual(refused, [])
})

test('a figure the agent proposed is only a suggestion, with its reason as origin', () => {
  const { fields: next } = applyAgentEdits(fields(), [{ key: 'hourlyCost', value: 95, from_user: false, reason: 'Glassdoor average for the region' }], { now: NOW })
  const f = field(next, 'hourlyCost')
  assert.equal(f.source.state, 'suggestion')
  assert.match(f.source.origin, /Glassdoor/)
})

test('the deck figures recalculate from the edited inputs', () => {
  const before = computeModel(Object.fromEntries(fields().map(f => [f.key, f.value]))).inputs.engineers
  const { fields: next } = applyAgentEdits(fields(), [{ key: 'engineers', value: 1200, from_user: true }], { now: NOW })
  const after = computeModel(Object.fromEntries(next.map(f => [f.key, f.value]))).inputs.engineers
  assert.equal(before, 500)
  assert.equal(after, 1200)
})

test('structural, text, unknown, negative and out-of-range edits are refused', () => {
  const { fields: next, changes, refused } = applyAgentEdits(fields(), [
    { key: 'weeksPerYear', value: 50 },
    { key: 'companyName', value: 'Evil Corp' },
    { key: 'nope', value: 1 },
    { key: 'engineers', value: -3 },
    { key: 'platformShare', value: 140 },
    { key: 'archetype', value: 'Startup' }
  ], { now: NOW })
  assert.equal(changes.length, 0)
  assert.equal(refused.length, 6)
  assert.deepEqual(next, fields())
})

test('select edits must match an option', () => {
  assert.equal(checkEdit(field(fields(), 'archetype'), { value: 'Scaling tech' }).value, 'Scaling tech')
  assert.ok(checkEdit(field(fields(), 'archetype'), { value: 'Scaling' }).error)
})

test('number strings are cleaned', () => {
  assert.equal(checkEdit(field(fields(), 'toolSpendToday'), { value: '$180,000' }).value, 180000)
})

test('undo puts back the exact value and source', () => {
  const start = fields()
  const { fields: next, changes } = applyAgentEdits(start, [{ key: 'engineers', value: 1200, from_user: true }, { key: 'hourlyCost', value: 95 }], { now: NOW })
  const { fields: back, restored, skipped } = undoAgentEdits(next, changes)
  assert.equal(restored, 2)
  assert.deepEqual(skipped, [])
  assert.deepEqual(back, start)
})

test('undo skips a field Chris has edited since, his number wins', () => {
  const { fields: next, changes } = applyAgentEdits(fields(), [{ key: 'engineers', value: 1200, from_user: true }, { key: 'hourlyCost', value: 95 }], { now: NOW })
  const edited = next.map(f => f.key === 'engineers' ? withValue(f, 900) : f)
  const { fields: back, restored, skipped } = undoAgentEdits(edited, changes)
  assert.equal(restored, 1)
  assert.equal(field(back, 'engineers').value, 900)
  assert.deepEqual(skipped, ['Engineers'])
})

test('a no-op edit is not recorded', () => {
  const { changes } = applyAgentEdits(fields(), [{ key: 'engineers', value: 500 }], { now: NOW })
  assert.equal(changes.length, 0)
})

test('editable: numbers, percents and the two account selects only', () => {
  const keys = INPUT_FIELDS.filter(isAgentEditable).map(f => f.key)
  assert.ok(keys.includes('engineers') && keys.includes('archetype') && keys.includes('platformShare'))
  assert.ok(!keys.includes('companyName') && !keys.includes('weeksPerYear'))
})

test('values read naturally in the change card', () => {
  assert.equal(describeValue(1200, ''), '1,200')
  assert.equal(describeValue(180000, '$/yr'), '$180,000/yr')
  assert.equal(describeValue('', ''), 'blank')
})

test('an input Chris removed cannot be changed by the agent', () => {
  const fs = fields().map(f => f.key === 'hourlyCost' ? { ...f, deleted: true, value: '' } : f)
  const { changes, refused } = applyAgentEdits(fs, [{ key: 'hourlyCost', value: 95 }], { now: NOW })
  assert.equal(changes.length, 0)
  assert.equal(refused.length, 1)
})
