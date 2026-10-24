import test from 'node:test'
import assert from 'node:assert/strict'
import { removeInput, restoreInput, editInput } from './inputEditing.js'
import { newProject, hydrate } from './projects.js'
import { assertCompleteDeal } from './dealStorage.js'
import { computeModel } from './model.js'
import { emptyKeys, applySuggestions } from './suggest.js'
import { confidence } from './valueModel.js'
import { blockDesign } from './brand.js'

test('removing a built-in input persists and stops its figures without deleting other inputs', () => {
  const deal = newProject('Test', {})
  deal.fields = deal.fields.map(f => f.key === 'engineers' ? { ...f, value: 500, source: { state: 'input', origin: 'Call', quote: '500 engineers', link: 'https://example.com', pinnedAt: '2026-10-24' } } : f)
  const original = deal.fields.find(f => f.key === 'engineers')
  deal.fields = removeInput(deal.fields, 'engineers')
  assert.doesNotThrow(() => assertCompleteDeal(deal))
  const reloaded = hydrate(JSON.parse(JSON.stringify(deal)))
  const removed = reloaded.fields.find(f => f.key === 'engineers')
  assert.equal(removed.deleted, true)
  assert.equal(removed.value, '')
  const model = computeModel(Object.fromEntries(reloaded.fields.map(f => [f.key, f.value])))
  assert.equal(model.figures.productivityValue.incomplete, true)
  assert.equal(emptyKeys(reloaded.fields).includes('engineers'), false)
  assert.equal(confidence(reloaded.fields), 0)
  const restored = restoreInput(reloaded.fields, 'engineers').find(f => f.key === 'engineers')
  assert.deepEqual(restored, original)
})

test('editing names and units preserves equation keys, values and full source objects', () => {
  const fields = newProject('Test', {}).fields
  const before = fields.find(f => f.key === 'hourlyCost')
  const next = editInput(fields, 'hourlyCost', { label: 'Engineer cost', unit: '$/hour', help: 'Use the loaded cost' })
  const after = hydrate({ ...newProject('Test', {}), fields: next }).fields.find(f => f.key === 'hourlyCost')
  assert.equal(after.label, 'Engineer cost')
  assert.equal(after.unit, '$/hour')
  assert.equal(after.key, before.key)
  assert.equal(after.value, before.value)
  assert.deepEqual(after.source, before.source)
})

test('late agent suggestions cannot repopulate a deleted input', () => {
  const fields = removeInput(newProject('Test', {}).fields, 'engineers')
  const next = applySuggestions(fields, { suggestions: { engineers: { value: 900, origin: 'Web' } }, gaps: {}, enabled: ['web'] }, { keys: ['engineers'], now: '2026-10-24' })
  assert.deepEqual(next, fields)
})

test('transparent block and badge backgrounds are supported while arbitrary CSS is rejected', () => {
  assert.deepEqual(blockDesign({ background: 'transparent', badgeBackground: 'transparent' }), { backgroundColor: 'transparent', '--badge-background': 'transparent' })
  assert.deepEqual(blockDesign({ background: 'transparent;position:fixed', badgeBackground: 'url(secret)' }), {})
})
