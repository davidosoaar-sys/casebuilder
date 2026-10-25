import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { MODEL_PROVIDERS, activeKey } from './modelProviders.js'
import { modelFor } from '../server/compatClient.js'

test('every provider in the app is one the worker and the database accept', () => {
  const worker = readFileSync(new URL('../worker/worker.py', import.meta.url), 'utf8')
  const sql = readFileSync(new URL('../supabase/migrations/0009_any_provider_keys.sql', import.meta.url), 'utf8')
  for (const p of MODEL_PROVIDERS) {
    assert.match(worker, new RegExp(`"${p.id}":\\s*\\{"hermes"`), `worker.py PROVIDERS lacks ${p.id}`)
    assert.ok(sql.includes(`'${p.id}'`), `migration 0009 lacks ${p.id}`)
  }
})

test('the model names shown match the model the server and worker actually call', () => {
  const worker = readFileSync(new URL('../worker/worker.py', import.meta.url), 'utf8')
  const slug = n => n.toLowerCase().replace(/^claude /, 'claude-').replace(/ /g, '-').replace(/\./g, '[.-]')
  for (const p of MODEL_PROVIDERS.filter(p => p.id !== 'anthropic')) {
    for (const tier of ['fast', 'balanced', 'best']) {
      const id = modelFor(p.id, { fast: 'claude-haiku', balanced: 'claude-sonnet', best: 'claude-opus' }[tier], {})
      assert.match(id, new RegExp(slug(p.models[tier]).replace('gemini-3[.-]1-pro', 'gemini-3[.-]1-pro'), 'i'), `${p.id} ${tier}: shown "${p.models[tier]}" vs called "${id}"`)
      assert.ok(worker.includes(`"${tier}": "${id}"`), `worker ${p.id} ${tier} should call ${id}`)
    }
  }
})

test('activeKey: preferred first, else newest, null when none', () => {
  assert.equal(activeKey([]), null)
  assert.equal(activeKey([{ provider: 'openai', updated_at: '2026-01-01' }, { provider: 'google', updated_at: '2026-02-01' }]).provider, 'google')
  assert.equal(activeKey([{ provider: 'openai', preferred: true, updated_at: '2026-01-01' }, { provider: 'google', updated_at: '2026-02-01' }]).provider, 'openai')
})
