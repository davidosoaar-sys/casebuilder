import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { searchPerson, servePerson } from './personAgent.js'

const url = 'https://example.com/team/alex'
const claim = value => ({ value, sourceUrl: url, sourceType: 'web' })
const identity = { name: claim('Alex Doe'), title: claim('VP Engineering'), company: claim('Acme') }
const collect = async gen => { const out = []; for await (const v of gen) out.push(v); return out }

test('Claude material reaches the agent only with its permission enabled',async()=>{
  for(const allowed of [false,true]){
    let received
    const snapshots=await collect(searchPerson({name:'Alex',enabledSources:allowed?['claude']:[],documents:[{source:'claude',text:'Alex is VP Engineering.',sourceUrl:url}]},{provider:async args=>{received=args;return {data:{},urls:[]}}}))
    assert.equal(received.documents.length,allowed?1:0)
    if(allowed)assert.equal(received.documents[0].sourceType,'claude')
    else assert.ok(snapshots[0].sourcesSkipped.some(s=>s.source==='claude'&&s.reason==='disabled'))
  }
})

test('streams identity before enrichment and rejects invented sources', async () => {
  const phases = []
  const snapshots = await collect(searchPerson({ name: 'Alex', enabledSources: ['web'] }, { provider: async ({ phase }) => {
    phases.push(phase)
    return { urls: [url], data: { ...identity, tenure: { ...claim('10 years'), sourceUrl: 'https://invented.test' }, likelyCares: claim('Inference: developer productivity'), publicSignals: [{ claim: 'Spoke about platforms', sourceUrl: url, sourceType: 'web' }, { claim: 'Invented', sourceUrl: 'https://invented.test', sourceType: 'web' }] } }
  } }))
  assert.deepEqual(phases, ['identity', 'enriched'])
  assert.equal(snapshots[0].phase, 'identity')
  assert.equal(snapshots[1].phase, 'enriched')
  assert.equal(snapshots[1].tenure, null)
  assert.equal(snapshots[1].publicSignals.length, 1)
  assert.deepEqual(snapshots[1].name, claim('Alex Doe'))
})

test('filters documents before provider and reports disabled versus missing', async () => {
  let received
  const [snapshot] = await collect(searchPerson({ name: 'Alex', enabledSources: ['gong', 'hubspot', 'bogus'], documents: [
    { source: 'slack', text: 'SECRET' }, { source: 'bogus', text: 'SECRET' }, { source: 'gong', sourceUrl: url, text: 'Alex is VP' }
  ] }, { provider: async args => { received = args; return { data: {}, urls: [] } } }))
  assert.equal(received.documents.length, 1)
  assert.equal(received.documents[0].sourceType, 'gong')
  assert.equal(JSON.stringify(received).includes('SECRET'), false)
  assert.ok(snapshot.sourcesSkipped.some(s => s.source === 'slack' && s.reason === 'disabled'))
  assert.ok(snapshot.sourcesSkipped.some(s => s.source === 'hubspot' && s.reason === 'enabled_no_linked_material'))
  assert.ok(snapshot.sourcesSkipped.some(s => s.source === 'bogus' && s.reason === 'unknown_source'))
})

test('uploaded claims require exact evidence and never become public signals', async () => {
  const [snapshot] = await collect(searchPerson({ name: 'Alex', enabledSources: ['gong'], documents: [{ source: 'gong', sourceUrl: url, text: 'Alex is VP' }] }, { provider: async ({ documents }) => {
    const evidence = { sourceUrl: documents[0].sourceUrl, sourceType: 'gong', quote: 'Alex is VP' }
    return { urls: [], data: { name: { value: 'Alex', ...evidence }, title: { value: 'CEO', ...evidence, quote: 'Alex is CEO' }, publicSignals: [{ claim: 'Alex is VP', ...evidence }] } }
  } }))
  assert.equal(snapshot.name.sourceType, 'gong')
  assert.equal(snapshot.title, null)
  assert.deepEqual(snapshot.publicSignals, [])
})

test('ambiguity returns candidates without choosing or enriching', async () => {
  let calls = 0
  const snapshots = await collect(searchPerson({ name: 'Alex' }, { provider: async () => { calls++; return { urls: [url], data: { ...identity, candidates: [identity, { name: claim('Alex Smith') }] } } } }))
  assert.equal(calls, 1)
  assert.equal(snapshots[0].name, null)
  assert.equal(snapshots[0].candidates.length, 2)
})

test('abort prevents provider call', async () => {
  const controller = new AbortController(); controller.abort()
  await assert.rejects(() => collect(searchPerson({ name: 'Alex' }, { signal: controller.signal, provider: () => assert.fail('called') })), { name: 'AbortError' })
})

async function endpoint(t, options) {
  const server = createServer((req, res) => servePerson(req, res, options))
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  t.after(() => { server.closeAllConnections(); server.close() })
  return `http://127.0.0.1:${server.address().port}`
}

test('HTTP gates method, deployment access code, credentials and JSON', async t => {
  const base = await endpoint(t, { env: { VERCEL: '1' } })
  assert.equal((await fetch(base)).status, 405)
  assert.equal((await fetch(base, { method: 'POST' })).status, 503)
  const gated = await endpoint(t, { env: { RESEARCH_ACCESS_CODE: 'secret' } })
  assert.equal((await fetch(gated, { method: 'POST' })).status, 401)
  assert.equal((await fetch(gated, { method: 'POST', headers: { 'x-access-code': 'secret' } })).status, 503)
  const configured = await endpoint(t, { env: {}, provider: async () => ({ data: {}, urls: [] }) })
  assert.equal((await fetch(configured, { method: 'POST', body: '{' })).status, 400)
  assert.equal((await fetch(configured, { method: 'POST', body: '{}' })).status, 400)
})

test('HTTP emits progressive NDJSON and bounded timeout error', async t => {
  const base = await endpoint(t, { env: {}, timeoutMs: 500, provider: async ({ phase }) => phase === 'identity' ? { data: identity, urls: [url] } : new Promise(() => {}) })
  const res = await fetch(base, { method: 'POST', body: JSON.stringify({ name: 'Alex' }) })
  assert.match(res.headers.get('content-type'), /application\/x-ndjson/)
  const reader = res.body.getReader()
  const first = await reader.read()
  assert.equal(JSON.parse(new TextDecoder().decode(first.value).trim()).phase, 'identity')
  let tail = ''
  while (true) { const chunk = await reader.read(); if (chunk.done) break; tail += new TextDecoder().decode(chunk.value) }
  assert.match(JSON.parse(tail).error, /timed out/)
})


test('accepts email-only and LinkedIn-only identity hints', async () => {
  for (const input of [{ email: 'alex@example.com' }, { linkedinUrl: 'https://www.linkedin.com/in/alex' }]) {
    let received
    await collect(searchPerson(input, { provider: async args => { received = args; return { data: {}, urls: [] } } }))
    assert.equal(received.web, true)
    for (const [key, value] of Object.entries(input)) assert.equal(received.input[key], value)
  }
  await assert.rejects(() => collect(searchPerson({ linkedinUrl: 'https://evil.test/in/alex' })), /LinkedIn/)
})

test('explicit candidate URL selects only a unique sourced candidate', async () => {
  const otherUrl = 'https://example.com/team/other'
  const candidates = [identity, { name: { ...claim('Alex Smith'), sourceUrl: otherUrl } }]
  let received
  const snapshots = await collect(searchPerson({ name: 'Alex', candidateUrl: url }, { provider: async args => {
    received = args
    return { data: { candidates }, urls: [url, otherUrl] }
  } }))
  assert.equal(received.input.candidateUrl, url)
  assert.equal(snapshots[0].name.value, 'Alex Doe')
  assert.deepEqual(snapshots[0].candidates, [])
  const [unverified] = await collect(searchPerson({ name: 'Alex', candidateUrl: 'https://invented.test/' }, { provider: async () => ({ data: { candidates }, urls: [url, otherUrl] }) }))
  assert.equal(unverified.name, null)
  assert.equal(unverified.candidates.length, 2)
  assert.deepEqual(unverified.candidates[0].name, claim('Alex Doe'))
  await assert.rejects(() => collect(searchPerson({ name: 'Alex', candidateUrl: 'javascript:alert(1)' })), /candidate/)
})

test('web toggle reaches provider and strips web claims; disabled connector URLs cannot masquerade as web', async () => {
  let received
  const [off] = await collect(searchPerson({ name: 'Alex', enabledSources: [] }, { provider: async args => { received = args; return { data: identity, urls: [url] } } }))
  assert.equal(received.web, false)
  assert.equal(off.name, null)
  assert.deepEqual(off.sourcesUsed, [])
  const slackUrl = 'https://workspace.slack.com/archives/123'
  const [blocked] = await collect(searchPerson({ name: 'Alex', enabledSources: ['web'] }, { provider: async () => ({ data: { name: { ...claim('Alex'), sourceUrl: slackUrl } }, urls: [slackUrl] }) }))
  assert.equal(blocked.name, null)
})

test('only linked documents are sent; linked text URLs support exact-quote claims', async () => {
  let received
  const [snapshot] = await collect(searchPerson({ email: 'alex@example.com', enabledSources: ['gong', 'hubspot', 'slack'], documents: [
    { source: 'gong', text: 'Unlinked private text' },
    { source: 'hubspot', sourceUrl: 'document://fake', text: 'No real link' },
    { source: 'slack', text: `Alex is VP. Source: ${url}` }
  ] }, { provider: async args => {
    received = args
    return { urls: [], data: { name: { value: 'Alex', sourceUrl: url, sourceType: 'slack', quote: 'Alex is VP.' } } }
  } }))
  assert.equal(received.documents.length, 1)
  assert.equal(received.documents[0].sourceUrl, url)
  assert.equal(snapshot.name.sourceType, 'slack')
  for (const source of ['gong', 'hubspot']) assert.ok(snapshot.sourcesSkipped.some(s => s.source === source && s.reason === 'enabled_no_linked_material'))
})

test('enrichment emits scalar likelyCares and numeric allowed suggested inputs', async () => {
  const snapshots = await collect(searchPerson({ name: 'Alex' }, { provider: async () => ({ urls: [url], data: {
    ...identity, likelyCares: claim('Inference: platform reliability'), suggestedInputs: [
      { key: 'engineers', value: 1200, sourceUrl: url, sourceType: 'web' },
      { key: 'engineers', value: '1200', sourceUrl: url, sourceType: 'web' },
      { key: 'madeUp', value: 1200, sourceUrl: url, sourceType: 'web' },
      { key: 'engineers', value: 1200, sourceUrl: 'https://invented.test', sourceType: 'web' }
    ]
  } }) }))
  assert.equal(snapshots[0].likelyCares, null)
  assert.deepEqual(snapshots[0].suggestedInputs, [])
  assert.deepEqual(snapshots[1].likelyCares, claim('Inference: platform reliability'))
  assert.deepEqual(snapshots[1].suggestedInputs, [{ key: 'engineers', value: 1200, sourceUrl: url, sourceType: 'web' }])
  const rawStrings = await collect(searchPerson({ name: 'Alex' }, { provider: async () => ({ urls: [url], data: { ...identity, likelyCares: 'Unsupported string' } }) }))
  assert.equal(rawStrings[1].likelyCares, null)
})

test('numeric document suggestions require the number in their exact quote', async () => {
  const snapshots = await collect(searchPerson({ name: 'Alex', enabledSources: ['gong'], documents: [{ source: 'gong', sourceUrl: url, text: 'Alex leads 500 engineers.' }] }, { provider: async () => {
    const e = { sourceUrl: url, sourceType: 'gong', quote: 'Alex leads 500 engineers.' }
    return { urls: [], data: { name: { value: 'Alex', ...e }, suggestedInputs: [{ key: 'engineers', value: 500, ...e }, { key: 'engineers', value: 1500, ...e }] } }
  } }))
  assert.deepEqual(snapshots[1].suggestedInputs, [{ key: 'engineers', value: 500, sourceUrl: url, sourceType: 'gong' }])
})

test('alternate connector domains obey the same disabled-source gate', async () => {
  for (const domain of ['gong.io', 'gong.com', 'hubspot.com', 'hubspot.net', 'slack.com', 'clay.com', 'lemlist.com']) {
    const sourceUrl = `https://app.${domain}/person/alex`
    const [snapshot] = await collect(searchPerson({ name: 'Alex', enabledSources: ['web'] }, { provider: async () => ({ urls: [sourceUrl], data: { name: { value: 'Alex', sourceUrl, sourceType: 'web' } } }) }))
    assert.equal(snapshot.name, null, domain)
    assert.deepEqual(snapshot.sourcesUsed, [], domain)
  }
})
