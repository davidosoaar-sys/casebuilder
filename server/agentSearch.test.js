import test from 'node:test'
import assert from 'node:assert/strict'
import { runWithSearch } from './agentSearch.js'

// A fake Anthropic client: replays scripted turns and records what it was sent.
function fakeClient(turns) {
  const sent = []
  return {
    sent,
    messages: {
      stream(req) {
        sent.push(JSON.parse(JSON.stringify(req)))
        const msg = turns[Math.min(sent.length - 1, turns.length - 1)]
        return { finalMessage: async () => msg }
      }
    }
  }
}
const toolTurn = (...queries) => ({
  stop_reason: 'tool_use',
  content: queries.map((q, i) => ({ type: 'tool_use', id: `t${i}`, name: 'web_search', input: { query: q } }))
})
const answer = text => ({ stop_reason: 'end_turn', content: [{ type: 'text', text }] })
const backend = results => {
  const queries = []
  return { name: 'tavily', queries, search: async (q, opts) => { queries.push({ q, opts }); return results } }
}

test('searches run through our backend, not Anthropic built-in search', async () => {
  const client = fakeClient([toolTurn('Spotify VP Engineering'), answer('{"people":[]}')])
  const be = backend([{ url: 'https://example.com/a', title: 'A', snippet: 'Jane Doe is VP Engineering' }])
  const run = await runWithSearch({ client, model: 'm', system: 's', messages: [{ role: 'user', content: 'x' }], backend: be })
  assert.equal(run.search, 'tavily')
  assert.deepEqual(be.queries.map(q => q.q), ['Spotify VP Engineering'])
  assert.equal(client.sent[0].tools[0].name, 'web_search')
  assert.equal(client.sent[0].tools[0].type, undefined, 'a custom tool, not web_search_20260209')
  assert.deepEqual(run.urls, ['https://example.com/a'])
  assert.match(run.corpus, /Jane Doe/)
  assert.equal(run.text, '{"people":[]}')
  // the results were handed back to the model as a tool_result
  const back = client.sent[1].messages.at(-1)
  assert.equal(back.content[0].type, 'tool_result')
  assert.match(back.content[0].content, /URL: https:\/\/example.com\/a/)
})

test('blocked domains never enter the evidence, and are passed to the backend', async () => {
  const client = fakeClient([toolTurn('q'), answer('ok')])
  const be = backend([
    { url: 'https://app.hubspot.com/x', title: 'H', snippet: 'secret' },
    { url: 'https://news.example.org/y', title: 'N', snippet: 'fine' }
  ])
  const run = await runWithSearch({ client, model: 'm', system: 's', messages: [], backend: be, blockedDomains: ['hubspot.com'] })
  assert.deepEqual(run.urls, ['https://news.example.org/y'])
  assert.deepEqual(be.queries[0].opts.blockedDomains, ['hubspot.com'])
})

test('the search count is capped', async () => {
  const client = fakeClient([toolTurn('a', 'b', 'c'), toolTurn('d'), answer('done')])
  const be = backend([])
  const run = await runWithSearch({ client, model: 'm', system: 's', messages: [], backend: be, maxSearches: 2 })
  assert.equal(be.queries.length, 2)
  assert.equal(run.searches, 2)
  assert.equal(run.text, 'done')
})

test('a failed search is reported to the model, not crashed on', async () => {
  const client = fakeClient([toolTurn('q'), answer('nothing found')])
  const be = { name: 'tavily', search: async () => { throw new Error('rate limited') } }
  const run = await runWithSearch({ client, model: 'm', system: 's', messages: [], backend: be })
  assert.equal(client.sent[1].messages.at(-1).content[0].is_error, true)
  assert.deepEqual(run.urls, [])
})

test('with web off, no tool is offered at all', async () => {
  const client = fakeClient([answer('from documents')])
  const run = await runWithSearch({ client, model: 'm', system: 's', messages: [], web: false })
  assert.equal(client.sent[0].tools, undefined)
  assert.equal(run.search, 'none')
})

test('with no search key anywhere it falls back to Anthropic search and says so', async () => {
  const client = fakeClient([{ stop_reason: 'end_turn', content: [
    { type: 'web_search_tool_result', content: [{ url: 'https://x.com/p', title: 'P' }] },
    { type: 'text', text: 'ok', citations: [{ url: 'https://x.com/p', cited_text: 'quoted' }] }
  ] }])
  const run = await runWithSearch({ client, model: 'm', system: 's', messages: [], backend: null })
  assert.equal(run.search, 'anthropic')
  assert.equal(client.sent[0].tools[0].type, 'web_search_20260209')
  assert.deepEqual(run.urls, ['https://x.com/p'])
  assert.match(run.corpus, /quoted/)
})
