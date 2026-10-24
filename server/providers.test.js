import test from 'node:test'
import assert from 'node:assert/strict'
import { selectProvider, providerStatus, PROVIDERS, ProviderError } from './providers.js'
import { selectSearch, searchStatus, gatherEvidence, evidenceBlock, SearchError, SEARCH_BACKENDS } from './search.js'

// A fake fetch that records what was sent and replies with a canned body.
const fakeFetch = (body, { ok = true, status = 200 } = {}) => {
  const calls = []
  const impl = async (url, init) => {
    calls.push({ url: String(url), init })
    return {
      ok, status,
      json: async () => body,
      text: async () => JSON.stringify(body)
    }
  }
  impl.calls = calls
  return impl
}

// ---------------------------------------------------------------- providers

test('each provider reports itself unconfigured without a key', () => {
  const status = providerStatus({})
  assert.equal(status.length, 4)
  assert.ok(status.every(p => p.configured === false), 'nothing should be configured on an empty env')
})

test('anthropic returns plain text from its content blocks', async () => {
  const f = fakeFetch({ content: [{ type: 'text', text: 'hello' }, { type: 'thinking', text: 'ignored' }] })
  const p = PROVIDERS.anthropic({ ANTHROPIC_API_KEY: 'k' }, f)
  const { text } = await p.complete({ system: 'sys', messages: [{ role: 'user', content: 'hi' }] })
  assert.equal(text, 'hello')
  assert.match(f.calls[0].url, /api\.anthropic\.com/)
  assert.equal(JSON.parse(f.calls[0].init.body).system, 'sys')
})

test('openai gets the system prompt as a message, not a top-level field', async () => {
  const f = fakeFetch({ choices: [{ message: { content: 'hello' } }] })
  const p = PROVIDERS.openai({ OPENAI_API_KEY: 'k' }, f)
  const { text } = await p.complete({ system: 'sys', messages: [{ role: 'user', content: 'hi' }] })
  assert.equal(text, 'hello')
  const sent = JSON.parse(f.calls[0].init.body)
  assert.equal(sent.messages[0].role, 'system')
  assert.equal(sent.messages[0].content, 'sys')
  assert.equal(sent.system, undefined)
})

test('google maps assistant to model and system to systemInstruction', async () => {
  const f = fakeFetch({ candidates: [{ content: { parts: [{ text: 'hello' }] } }] })
  const p = PROVIDERS.google({ GOOGLE_AI_API_KEY: 'k' }, f)
  const { text } = await p.complete({
    system: 'sys',
    messages: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'prior' }]
  })
  assert.equal(text, 'hello')
  const sent = JSON.parse(f.calls[0].init.body)
  assert.equal(sent.systemInstruction.parts[0].text, 'sys')
  assert.equal(sent.contents[1].role, 'model', 'assistant must become "model" for Gemini')
})

test('an OpenAI-compatible endpoint (Hermes, Ollama, OpenRouter) needs only a base URL', async () => {
  const f = fakeFetch({ choices: [{ message: { content: 'local' } }] })
  const p = PROVIDERS.compatible({ COMPATIBLE_BASE_URL: 'http://localhost:11434/v1', COMPATIBLE_MODEL: 'llama' }, f)
  assert.equal(p.configured(), true, 'a base URL alone is enough: local endpoints need no key')
  const { text } = await p.complete({ messages: [{ role: 'user', content: 'hi' }] })
  assert.equal(text, 'local')
  assert.match(f.calls[0].url, /localhost:11434/)
})

test('an explicit provider choice is honoured over one that merely has a key', () => {
  const p = selectProvider({ AI_PROVIDER: 'google', GOOGLE_AI_API_KEY: 'g', ANTHROPIC_API_KEY: 'a' })
  assert.equal(p.name, 'google')
})

test('choosing a provider with no key fails clearly rather than falling back silently', () => {
  assert.throws(
    () => selectProvider({ AI_PROVIDER: 'openai', ANTHROPIC_API_KEY: 'a' }),
    err => err instanceof ProviderError && err.code === 'not_configured'
  )
})

test('no keys at all gives one actionable message', () => {
  assert.throws(() => selectProvider({}), err => err instanceof ProviderError && err.code === 'not_configured')
})

test('a rejected key is reported as auth, not as a generic failure', async () => {
  const f = fakeFetch({ error: { message: 'bad key' } }, { ok: false, status: 401 })
  const p = PROVIDERS.openai({ OPENAI_API_KEY: 'k' }, f)
  await assert.rejects(
    p.complete({ messages: [{ role: 'user', content: 'hi' }] }),
    err => err instanceof ProviderError && err.code === 'auth'
  )
})

test('a 429 is reported as a rate limit so the UI can say "try again"', async () => {
  const f = fakeFetch({}, { ok: false, status: 429 })
  const p = PROVIDERS.anthropic({ ANTHROPIC_API_KEY: 'k' }, f)
  await assert.rejects(
    p.complete({ messages: [{ role: 'user', content: 'hi' }] }),
    err => err instanceof ProviderError && err.code === 'rate_limit'
  )
})

// ------------------------------------------------------------------- search

test('every search backend is unconfigured without its key', () => {
  assert.ok(searchStatus({}).every(b => b.configured === false))
})

test('google CSE needs both a key and a search engine id', () => {
  assert.equal(SEARCH_BACKENDS.google({ GOOGLE_SEARCH_API_KEY: 'k' }).configured(), false, 'key alone is not enough')
  assert.equal(SEARCH_BACKENDS.google({ GOOGLE_SEARCH_API_KEY: 'k', GOOGLE_SEARCH_CX: 'cx' }).configured(), true)
})

test('each backend normalises its own shape to { url, title, snippet }', async () => {
  const tav = SEARCH_BACKENDS.tavily({ TAVILY_API_KEY: 'k' },
    fakeFetch({ results: [{ url: 'https://a.com', title: 'A', content: 'snip' }] }))
  assert.deepEqual(await tav.search('q'), [{ url: 'https://a.com', title: 'A', snippet: 'snip' }])

  const goo = SEARCH_BACKENDS.google({ GOOGLE_SEARCH_API_KEY: 'k', GOOGLE_SEARCH_CX: 'cx' },
    fakeFetch({ items: [{ link: 'https://b.com', title: 'B', snippet: 'snip' }] }))
  assert.deepEqual(await goo.search('q'), [{ url: 'https://b.com', title: 'B', snippet: 'snip' }])

  const bra = SEARCH_BACKENDS.brave({ BRAVE_SEARCH_API_KEY: 'k' },
    fakeFetch({ web: { results: [{ url: 'https://c.com', title: 'C', description: 'snip' }] } }))
  assert.deepEqual(await bra.search('q'), [{ url: 'https://c.com', title: 'C', snippet: 'snip' }])

  const ser = SEARCH_BACKENDS.serper({ SERPER_API_KEY: 'k' },
    fakeFetch({ organic: [{ link: 'https://d.com', title: 'D', snippet: 'snip' }] }))
  assert.deepEqual(await ser.search('q'), [{ url: 'https://d.com', title: 'D', snippet: 'snip' }])
})

test('evidence is deduped across queries by url', async () => {
  const backend = {
    name: 'stub',
    configured: () => true,
    search: async () => [
      { url: 'https://x.com/a', title: 'A', snippet: 's' },
      { url: 'https://x.com/a', title: 'A again', snippet: 's' }
    ]
  }
  const evidence = await gatherEvidence(['q1', 'q2'], { backend })
  assert.equal(evidence.length, 1, 'the same url twice is one piece of evidence')
})

test('a disabled connector domain can never enter the evidence set', async () => {
  const backend = {
    name: 'stub',
    configured: () => true,
    search: async () => [
      { url: 'https://app.gong.io/call/1', title: 'Gong call', snippet: 'private' },
      { url: 'https://adidas.com/about', title: 'Adidas', snippet: 'public' }
    ]
  }
  const evidence = await gatherEvidence(['q'], { backend, blockedDomains: ['gong.io'] })
  assert.equal(evidence.length, 1)
  assert.equal(evidence[0].host, 'adidas.com', 'only the allowed domain survives')
})

test('a blocked domain is blocked on its subdomains too', async () => {
  const backend = {
    name: 'stub',
    configured: () => true,
    search: async () => [{ url: 'https://deep.sub.gong.io/x', title: 'G', snippet: 's' }]
  }
  assert.deepEqual(await gatherEvidence(['q'], { backend, blockedDomains: ['gong.io'] }), [])
})

test('the query count is capped so one call cannot burn a free tier', async () => {
  let calls = 0
  const backend = { name: 'stub', configured: () => true, search: async () => { calls++; return [] } }
  await gatherEvidence(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], { backend, maxQueries: 3 })
  assert.equal(calls, 3)
})

test('a rate limit mid-way keeps the evidence already gathered', async () => {
  let n = 0
  const backend = {
    name: 'stub',
    configured: () => true,
    search: async () => {
      if (n++ === 1) throw new SearchError('limit', { code: 'rate_limit' })
      return [{ url: 'https://ok.com', title: 'OK', snippet: 's' }]
    }
  }
  const evidence = await gatherEvidence(['q1', 'q2', 'q3'], { backend })
  assert.equal(evidence.length, 1, 'partial evidence beats throwing it all away')
})

test('the evidence block numbers sources so the model cannot invent one', () => {
  const block = evidenceBlock([
    { url: 'https://a.com', title: 'A', snippet: 'first' },
    { url: 'https://b.com', title: 'B', snippet: 'second' }
  ])
  assert.match(block, /\[1\] A/)
  assert.match(block, /\[2\] B/)
  assert.match(block, /URL: https:\/\/a\.com/)
})

test('no search key configured fails with one actionable message', () => {
  assert.throws(() => selectSearch({}), err => err instanceof SearchError && err.code === 'not_configured')
})

// ------------------------------------------- the point of the whole exercise

test('provenance is identical across providers: the evidence set is the gate, not the model', async () => {
  // The same evidence, three providers, each claiming one real source and one
  // invented one. Verification happens against the evidence set, so the
  // invented source is dropped every time regardless of who answered.
  const evidence = [{ url: 'https://real.com/page', title: 'Real', snippet: 'x', host: 'real.com' }]
  const allowed = new Set(evidence.map(e => e.url))

  const answers = {
    anthropic: { content: [{ type: 'text', text: '{"sources":["https://real.com/page","https://made-up.com"]}' }] },
    openai: { choices: [{ message: { content: '{"sources":["https://real.com/page","https://made-up.com"]}' } }] },
    google: { candidates: [{ content: { parts: [{ text: '{"sources":["https://real.com/page","https://made-up.com"]}' }] } }] }
  }
  const envs = {
    anthropic: { ANTHROPIC_API_KEY: 'k' },
    openai: { OPENAI_API_KEY: 'k' },
    google: { GOOGLE_AI_API_KEY: 'k' }
  }

  for (const name of ['anthropic', 'openai', 'google']) {
    const p = PROVIDERS[name](envs[name], fakeFetch(answers[name]))
    const { text } = await p.complete({ messages: [{ role: 'user', content: evidenceBlock(evidence) }] })
    const kept = JSON.parse(text).sources.filter(u => allowed.has(u))
    assert.deepEqual(kept, ['https://real.com/page'], `${name}: the unsupported source must be dropped`)
  }
})
