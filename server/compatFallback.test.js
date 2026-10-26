import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compatClient, ProviderAPIError } from './compatClient.js'

// Buttons ask for the best tier. A model the key cannot use steps down; a bad key does not.
const reply = { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'ok' }] } }] }
const client = (statuses, provider = 'google') => {
  const urls = []
  const c = compatClient(provider, provider === 'google' ? 'AQ.Ab-x' : 'sk-x', { env: {}, fetchImpl: async (url, init) => {
    urls.push(provider === 'google' ? url.match(/models\/([^:]+)/)[1] : JSON.parse(init.body).model)
    const s = statuses.shift()
    if (!s) return { ok: true, json: async () => (provider === 'google' ? reply : { choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] }) }
    return { ok: false, status: s, json: async () => ({ error: { message: `status ${s}` } }) }
  } })
  return { c, urls }
}

test('free Gemini key: Pro refused (429) -> Flash answers', async () => {
  const { c, urls } = client([429])
  const r = await c.messages.create({ model: 'claude-opus-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] })
  assert.deepEqual(urls, ['gemini-3.1-pro-preview', 'gemini-3.8-flash'])
  assert.equal(r.content[0].text, 'ok')
})

test('busy (503) twice -> fastest model', async () => {
  const { c, urls } = client([503, 503])
  await c.messages.stream({ model: 'claude-opus-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] }).finalMessage()
  assert.deepEqual(urls, ['gemini-3.1-pro-preview', 'gemini-3.8-flash', 'gemini-3.5-flash-lite'])
})

test('bad key (401/403/400) is not retried, for every provider', async () => {
  for (const provider of ['google', 'openai', 'openrouter']) {
    for (const s of [401, 403, 400]) {
      const { c, urls } = client([s], provider)
      await assert.rejects(c.messages.create({ model: 'claude-opus-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] }),
        e => e instanceof ProviderAPIError && e.status === s)
      assert.equal(urls.length, 1, `${provider} ${s}`)
    }
  }
})

test('OpenAI and OpenRouter step down too', async () => {
  const a = client([429], 'openai'); await a.c.messages.create({ model: 'claude-opus-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] })
  assert.deepEqual(a.urls, ['gpt-5.6-sol', 'gpt-5.6-terra'])
  const b = client([404], 'openrouter'); await b.c.messages.create({ model: 'claude-sonnet-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] })
  assert.deepEqual(b.urls, ['anthropic/claude-sonnet-5.5', 'anthropic/claude-haiku-5.5'])
})

test('quota on every tier: the last error surfaces', async () => {
  const { c, urls } = client([429, 429, 429])
  await assert.rejects(c.messages.create({ model: 'claude-opus-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] }), e => e.status === 429)
  assert.equal(urls.length, 3)
})

test('a model that hangs is cut off and the next tier answers; a user abort is not retried', async t => {
  // AbortSignal.timeout's timer does not keep Node running; in a test with nothing else
  // pending the loop could end mid-test. A real server always has the loop alive.
  const alive = setInterval(() => {}, 1000); t.after(() => clearInterval(alive))
  const urls = []
  const c = compatClient('google', 'AQ.Ab-x', { env: { PROVIDER_TIER_TIMEOUT_MS: '50' }, fetchImpl: (url, init) => {
    const m = url.match(/models\/([^:]+)/)[1]; urls.push(m)
    if (m === 'gemini-3.8-flash') return new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(init.signal.reason)))
    return Promise.resolve({ ok: true, json: async () => reply })
  } })
  const r = await c.messages.create({ model: 'claude-sonnet-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] })
  assert.deepEqual(urls, ['gemini-3.8-flash', 'gemini-3.5-flash-lite']); assert.equal(r.content[0].text, 'ok')
  urls.length = 0
  const user = new AbortController(); setTimeout(() => user.abort(), 10)
  await assert.rejects(c.messages.create({ model: 'claude-sonnet-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] }, { signal: user.signal }))
  assert.deepEqual(urls, ['gemini-3.8-flash'])
})
