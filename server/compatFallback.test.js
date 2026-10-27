import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compatClient, ProviderAPIError, resetExhausted, tierOrder, GEMINI_QUOTA_MESSAGE } from './compatClient.js'

// Buttons ask for the best tier. A model the key cannot use steps down; a bad key does not.
const reply = { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'ok' }] } }] }
const client = (statuses, provider = 'google', env = {}) => {
  resetExhausted()
  const urls = []
  const c = compatClient(provider, provider === 'google' ? 'AQ.Ab-x' : 'sk-x', { env, fetchImpl: async (url, init) => {
    urls.push(provider === 'google' ? url.match(/models\/([^:]+)/)[1] : JSON.parse(init.body).model)
    const s = statuses.shift()
    if (!s) return { ok: true, json: async () => (provider === 'google' ? reply : { choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] }) }
    return { ok: false, status: s, json: async () => ({ error: { message: `status ${s}` } }) }
  } })
  return { c, urls }
}

test('free Gemini key: buttons asking for best start at flash-lite, 429 -> Flash answers', async () => {
  const { c, urls } = client([429])
  const r = await c.messages.create({ model: 'claude-opus-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] })
  assert.deepEqual(urls, ['gemini-3.5-flash-lite', 'gemini-3.8-flash'])
  assert.equal(r.content[0].text, 'ok')
})

test('busy (503) twice -> fastest model', async () => {
  const { c, urls } = client([503, 503], 'google', { GOOGLE_ALLOW_PRO: '1' })
  await c.messages.stream({ model: 'claude-opus-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] }).finalMessage()
  assert.deepEqual(urls, ['gemini-3.1-pro-preview', 'gemini-3.8-flash', 'gemini-3.5-flash-lite'])
})

test('Gemini order: cheapest first, Pro only when best is asked for', () => {
  assert.deepEqual(tierOrder('google', 'claude-sonnet-5-5'), ['fast', 'balanced'])
  assert.deepEqual(tierOrder('google', 'claude-haiku-5-5'), ['fast', 'balanced'])
  assert.deepEqual(tierOrder('google', 'claude-opus-5-5', {}), ['fast', 'balanced'])
  assert.deepEqual(tierOrder('google', 'claude-opus-5-5', { GOOGLE_ALLOW_PRO: '1' }), ['best', 'balanced', 'fast'])
  assert.deepEqual(tierOrder('openai', 'claude-opus-5-5'), ['best', 'balanced', 'fast'])
})

test('Gemini balanced: first call goes to flash-lite, Pro is never tried', async () => {
  const { c, urls } = client([])
  await c.messages.create({ model: 'claude-sonnet-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] })
  assert.deepEqual(urls, ['gemini-3.5-flash-lite'])
})

test('a model that answered 429 is skipped on the next call for the same key', async () => {
  const { c, urls } = client([429])
  await c.messages.create({ model: 'claude-opus-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] })
  assert.deepEqual(urls, ['gemini-3.5-flash-lite', 'gemini-3.8-flash'])
  urls.length = 0
  await c.messages.create({ model: 'claude-opus-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] })
  assert.deepEqual(urls, ['gemini-3.8-flash'])
  // another key is not affected
  const other = compatClient('google', 'other-test-key', { env: {}, fetchImpl: async url => { urls.push(url.match(/models\/([^:]+)/)[1]); return { ok: true, json: async () => reply } } })
  urls.length = 0
  await other.messages.create({ model: 'claude-opus-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] })
  assert.deepEqual(urls, ['gemini-3.5-flash-lite'])
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

test('Gemini quota on every tier: a clear free-limit message, then one cheap retry only', async () => {
  const { c, urls } = client([429, 429, 429, 429], 'google', { GOOGLE_ALLOW_PRO: '1' })
  await assert.rejects(c.messages.create({ model: 'claude-opus-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] }),
    e => e.status === 429 && e.quota === true && e.message === GEMINI_QUOTA_MESSAGE)
  assert.equal(urls.length, 3)
  urls.length = 0
  await assert.rejects(c.messages.create({ model: 'claude-opus-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] }), e => e.message === GEMINI_QUOTA_MESSAGE)
  assert.deepEqual(urls, ['gemini-3.5-flash-lite'])
})

test('OpenAI quota on every tier: the last error surfaces unchanged', async () => {
  const { c } = client([429, 429, 429], 'openai')
  await assert.rejects(c.messages.create({ model: 'claude-opus-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] }), e => e.status === 429 && !e.quota)
})

test('a model that hangs is cut off and the next tier answers; a user abort is not retried', async t => {
  // AbortSignal.timeout's timer does not keep Node running; in a test with nothing else
  // pending the loop could end mid-test. A real server always has the loop alive.
  const alive = setInterval(() => {}, 1000); t.after(() => clearInterval(alive))
  resetExhausted()
  const urls = []
  const c = compatClient('google', 'AQ.Ab-x', { env: { PROVIDER_TIER_TIMEOUT_MS: '50' }, fetchImpl: (url, init) => {
    const m = url.match(/models\/([^:]+)/)[1]; urls.push(m)
    if (m === 'gemini-3.5-flash-lite') return new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(init.signal.reason)))
    return Promise.resolve({ ok: true, json: async () => reply })
  } })
  const r = await c.messages.create({ model: 'claude-sonnet-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] })
  assert.deepEqual(urls, ['gemini-3.5-flash-lite', 'gemini-3.8-flash']); assert.equal(r.content[0].text, 'ok')
  urls.length = 0
  const user = new AbortController(); setTimeout(() => user.abort(), 10)
  await assert.rejects(c.messages.create({ model: 'claude-sonnet-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] }, { signal: user.signal }))
  assert.deepEqual(urls, ['gemini-3.5-flash-lite'])
})
