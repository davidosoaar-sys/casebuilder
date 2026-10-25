import test from 'node:test'
import assert from 'node:assert/strict'
import { compatClient, toOpenAI, fromOpenAI, modelFor } from './compatClient.js'
import { runWithSearch } from './agentSearch.js'

const SEARCH_TOOL = { name: 'web_search', description: 'search', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } }

test('model tiers: a Claude tier maps to the same tier on each provider', () => {
  assert.equal(modelFor('openai', 'claude-opus-5-5', {}), 'gpt-5.6-sol')
  assert.equal(modelFor('google', 'claude-sonnet-5-5', {}), 'gemini-3.8-flash')
  assert.equal(modelFor('openrouter', 'claude-haiku-5-5', {}), 'anthropic/claude-haiku-5.5')
  assert.equal(modelFor('openai', 'claude-opus-5-5', { OPENAI_MODEL_BEST: 'gpt-x' }), 'gpt-x')
})

test('request: system, tool calls and tool results translate to chat completions', () => {
  const body = toOpenAI({
    model: 'claude-sonnet-5-5', max_tokens: 500, system: 'Be exact.', tools: [SEARCH_TOOL], thinking: { type: 'adaptive' },
    messages: [
      { role: 'user', content: 'Who is the CTO of Acme?' },
      { role: 'assistant', content: [{ type: 'thinking', thinking: 'x' }, { type: 'text', text: 'Searching.' }, { type: 'tool_use', id: 't1', name: 'web_search', input: { query: 'Acme CTO' } }] },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: '[1] Dana Ruiz, CTO' }] }
    ]
  }, 'openrouter', {})
  assert.equal(body.model, 'anthropic/claude-sonnet-5.5')
  assert.equal(body.max_tokens, 500)
  assert.equal(body.thinking, undefined)
  assert.deepEqual(body.messages[0], { role: 'system', content: 'Be exact.' })
  assert.deepEqual(body.messages[2].tool_calls, [{ id: 't1', type: 'function', function: { name: 'web_search', arguments: '{"query":"Acme CTO"}' } }])
  assert.equal(body.messages[2].content, 'Searching.')
  assert.deepEqual(body.messages[3], { role: 'tool', tool_call_id: 't1', content: '[1] Dana Ruiz, CTO' })
  assert.equal(body.tools[0].function.name, 'web_search')
  assert.equal(toOpenAI({ model: 'x', max_tokens: 9, messages: [] }, 'openai', {}).max_completion_tokens, 9)
})

test('request: Anthropic built-in web search is refused with a clear message', () => {
  assert.throws(() => toOpenAI({ model: 'x', max_tokens: 9, tools: [{ type: 'web_search_20260209', name: 'web_search' }], messages: [] }, 'google', {}), /TAVILY_API_KEY/)
})

test('response: text, tool calls and stop reasons come back in Anthropic shape', () => {
  const m = fromOpenAI({ choices: [{ finish_reason: 'tool_calls', message: { content: null, tool_calls: [{ id: 'c1', function: { name: 'web_search', arguments: '{"query":"q"}' } }] } }] }, 'gpt')
  assert.equal(m.stop_reason, 'tool_use')
  assert.deepEqual(m.content, [{ type: 'tool_use', id: 'c1', name: 'web_search', input: { query: 'q' } }])
  const t = fromOpenAI({ choices: [{ finish_reason: 'stop', message: { content: '{"people":[]}' } }] }, 'gpt')
  assert.equal(t.stop_reason, 'end_turn'); assert.equal(t.content[0].text, '{"people":[]}')
  assert.equal(fromOpenAI({ choices: [{ finish_reason: 'length', message: { content: 'cut' } }] }).stop_reason, 'max_tokens')
})

test('the shared search loop runs on an OpenAI-compatible model with our own search', async () => {
  const sent = []
  let turn = 0
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body); sent.push({ url, body, auth: init.headers.authorization })
    turn++
    const msg = turn === 1
      ? { content: null, tool_calls: [{ id: 'c1', type: 'function', function: { name: 'web_search', arguments: '{"query":"Acme CTO"}' } }] }
      : { content: '{"people":[{"name":"Dana Ruiz","source_urls":["https://acme.example/team"]}]}' }
    return { ok: true, json: async () => ({ choices: [{ finish_reason: turn === 1 ? 'tool_calls' : 'stop', message: msg }] }) }
  }
  const client = compatClient('openai', 'sk-proj-test', { env: {}, fetchImpl })
  const backend = { name: 'tavily', search: async () => [{ url: 'https://acme.example/team', title: 'Team', snippet: 'Dana Ruiz, CTO of Acme' }] }
  const run = await runWithSearch({ client, model: 'claude-opus-5-5', system: 's', messages: [{ role: 'user', content: 'find' }], backend, maxSearches: 2 })
  assert.equal(sent[0].url, 'https://api.openai.com/v1/chat/completions')
  assert.equal(sent[0].auth, 'Bearer sk-proj-test')
  assert.equal(sent[0].body.model, 'gpt-5.6-sol')
  assert.equal(sent[1].body.messages.at(-1).role, 'tool')
  assert.match(run.text, /Dana Ruiz/)
  assert.deepEqual(run.urls, ['https://acme.example/team'])
  assert.equal(run.search, 'tavily')
})

test('a provider error surfaces its status and message', async () => {
  const client = compatClient('google', 'AIzaBAD', { env: {}, fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'API key not valid' } }) }) })
  await assert.rejects(client.messages.create({ model: 'x', max_tokens: 5, messages: [] }), e => e.status === 401 && /Google Gemini returned 401: API key not valid/.test(e.message))
})
