import Anthropic from '@anthropic-ai/sdk'
import {enrichPublicProfile} from './publicProfile.js'
import { agentPrompt } from './agent-commands/index.js'
import { AGENT_COMMANDS } from '../src/agentCommands.js'
import { SUGGESTIBLE, quoteSupportsValue } from './suggest.js'
import { anthropicFor } from './accountKey.js'
import { runWithSearch } from './agentSearch.js'

const CONNECTORS = ['claude', 'gong', 'hubspot', 'slack', 'clay', 'lemlist', 'granola', 'sheets', 'excel', 'figma', 'canva']
const CONNECTOR_DOMAINS = { gmail: ['mail.google.com', 'gmail.com'], claude: ['claude.ai'], gong: ['gong.io', 'gong.com'], hubspot: ['hubspot.com', 'hubspot.net'], slack: ['slack.com'], clay: ['clay.com'], lemlist: ['lemlist.com'], granola: ['granola.ai', 'granola.so'], sheets: ['docs.google.com'], excel: ['office.com', 'sharepoint.com', 'live.com'], figma: ['figma.com'], canva: ['canva.com'] }
const clean = (v, n = 800) => typeof v === 'string' ? v.trim().slice(0, n) : ''
const httpUrl = v => { try { const u = new URL(v); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : null } catch { return null } }
const hostedConnector = url => { const host = new URL(url).hostname; return CONNECTORS.find(key => CONNECTOR_DOMAINS[key].some(domain => host === domain || host.endsWith(`.${domain}`))) }

// Provider boundary: replacing this function is sufficient to swap services.
async function anthropicProvider({ phase, identity, input, documents, web, enabledSources, signal, client = new Anthropic() }) {
  const messages = [{ role: 'user', content: JSON.stringify({ phase, instruction: phase === 'identity' ? 'Resolve only name, title, company, tenure. Return sourced candidates if ambiguous. candidateUrl is the user-selected identity: verify it with allowed evidence before selecting. Do not research other fields yet.' : 'Enrich only this verified identity. This is a business case for Spotify Portal for Backstage versus self-hosted Backstage. Prioritize statements relevant to developer productivity, platform upkeep, audit, cost and the leadership priority in dealContext. Include only professional public signals and allowed linked documents. Label likely priorities as inferences.', identity, person: input, asOf: new Date().toISOString().slice(0, 10), documents, web, enabledSources, suggestedInputKeys: Object.keys(SUGGESTIBLE) }) }]
  const run = await runWithSearch({
    client, signal, web, model: process.env.RESEARCH_MODEL || 'claude-opus-5-5', maxTokens: phase === 'identity' ? 2200 : 6000,
    maxSearches: phase === 'identity' ? 3 : 5,
    blockedDomains: CONNECTORS.filter(key => !enabledSources.includes(key)).flatMap(key => CONNECTOR_DOMAINS[key]),
    system: agentPrompt(AGENT_COMMANDS.LOOKUP_PERSON),
    messages
  })
  const citations=run.citations
  const urls = run.urls
  const text = run.text
  let data = {}
  try { data = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) } catch { /* Unsupported output stays empty. */ }
  return { data, urls, citations }
}

function prepare(input) {
  if (!input || (!clean(input.name) && !clean(input.email) && !clean(input.linkedinUrl))) throw new TypeError('Enter a name, email address, or LinkedIn profile URL.')
  if (input.name !== undefined && (typeof input.name !== 'string' || input.name.trim().length > 120)) throw new TypeError('Use a person name under 120 characters.')
  if (input.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new TypeError('Enter a valid email address.')
  if (input.linkedinUrl !== undefined && (!httpUrl(input.linkedinUrl) || !/^https?:\/\/(?:[a-z]{2,3}\.|www\.)?linkedin\.com\/in\/[^\s/?#]+/i.test(input.linkedinUrl))) throw new TypeError('Enter a valid LinkedIn profile URL.')
  if (input.candidateUrl !== undefined && (typeof input.candidateUrl !== 'string' || !httpUrl(input.candidateUrl))) throw new TypeError('Choose a candidate with a valid HTTP or HTTPS source URL.')
  if (input.enabledSources !== undefined && (!Array.isArray(input.enabledSources) || input.enabledSources.some(s => typeof s !== 'string'))) throw new TypeError('enabledSources must be an array of source keys.')
  const enabled = new Set(input.enabledSources === undefined ? ['web'] : input.enabledSources)
  const permittedUrl = url => url && (!hostedConnector(url) || enabled.has(hostedConnector(url)))
  let budget = 150_000
  const documents = []
  for (const d of Array.isArray(input.documents) ? input.documents.slice(0, 100) : []) {
    if (!d || !CONNECTORS.includes(d.source) || !enabled.has(d.source) || !clean(d.text) || documents.length >= 20 || budget <= 0) continue
    const text = d.text.slice(0, Math.min(60_000, budget))
    const links = [...new Set([httpUrl(d.sourceUrl), ...(text.match(/https?:\/\/[^\s<>"']+/g) || []).map(httpUrl)].filter(permittedUrl))]
    if (!links.length) continue
    budget -= text.length
    documents.push({ id: `d${documents.length + 1}`, sourceType: d.source, sourceUrl: links[0], links, name: clean(d.name, 120), text })
  }
  const sourcesSkipped = CONNECTORS.flatMap(source => !enabled.has(source) ? [{ source, reason: 'disabled' }] : !documents.some(d => d.sourceType === source) ? [{ source, reason: 'enabled_no_linked_material' }] : [])
  if (!enabled.has('web')) sourcesSkipped.push({ source: 'web', reason: 'disabled' })
  for (const source of enabled) if (source !== 'web' && !CONNECTORS.includes(source)) sourcesSkipped.push({ source, reason: 'unknown_source' })
  return { input: { name: clean(input.name, 120), company: clean(input.company, 160), email: clean(input.email, 254), linkedinUrl: clean(input.linkedinUrl, 500), dealContext: { archetype: clean(input.dealContext?.archetype, 160), strategicPriority: clean(input.dealContext?.strategicPriority, 240) }, ...(input.candidateUrl ? { candidateUrl: httpUrl(input.candidateUrl) } : {}) }, documents, sourcesSkipped, web: enabled.has('web'), enabledSources: [...enabled] }
}

function validate(data, urls, documents, enabledSources) {
  const seen = new Set(urls.map(httpUrl).filter(Boolean))
  const evidence = c => {
    if (!c || typeof c !== 'object') return null
    const url = httpUrl(c.sourceUrl)
    if (!url || (hostedConnector(url) && !enabledSources.includes(hostedConnector(url)))) return null
    if (c.sourceType === 'web') return enabledSources.includes('web') && seen.has(url) ? { sourceUrl: url, sourceType: 'web' } : null
    const doc = documents.find(d => d.links.includes(url) && d.sourceType === c.sourceType)
    const quote = clean(c.quote, 2000)
    return doc && quote && doc.text.includes(quote) ? { sourceUrl: url, sourceType: doc.sourceType } : null
  }
  const claim = c => { const e = evidence(c); const value = clean(c?.value); return e && value ? { value, ...e } : null }
  const list = v => (Array.isArray(v) ? v.slice(0, 20) : []).map(claim).filter(Boolean)
  const person = p => ({ name: claim(p?.name), title: claim(p?.title), company: claim(p?.company) })
  const role = claim(data.roleMatch?.role), why = claim(data.roleMatch?.why), roleEvidence = evidence(data.roleMatch)
  return {
    ...person(data), tenure: claim(data.tenure), reportsTo: claim(data.reportsTo), reports: list(data.reports),
    roleMatch: role && why && roleEvidence ? { role, confidence: ['high', 'medium', 'low'].includes(data.roleMatch.confidence) ? data.roleMatch.confidence : 'low', why, ...roleEvidence } : null,
    publicSignals: (Array.isArray(data.publicSignals) ? data.publicSignals.slice(0, 20) : []).flatMap(c => { const e = evidence(c); return e?.sourceType === 'web' && clean(c.claim) ? [{ claim: clean(c.claim), ...e }] : [] }),
    likelyCares: claim(data.likelyCares),
    suggestedInputs: (Array.isArray(data.suggestedInputs) ? data.suggestedInputs.slice(0, 30) : []).flatMap(item => {
      const range = SUGGESTIBLE[item?.key], e = evidence(item)
      return range && e && typeof item.value === 'number' && Number.isFinite(item.value) && item.value >= range[0] && item.value <= range[1] && (e.sourceType === 'web' || quoteSupportsValue(item.quote, item.value)) ? [{ key: item.key, value: item.value, ...e }] : []
    }),
    candidates: (Array.isArray(data.candidates) ? data.candidates.slice(0, 10) : []).map(person).filter(p => p.name)
  }
}

// Snapshots are complete replacements, not deltas. No unsourced user hint is a fact.
// provider is an optional test seam; service-specific code lives only in this file.
export async function* searchPerson(input, { signal, provider = anthropicProvider, client, assetFetcher } = {}) {
  const prepared = prepare(input)
  let snapshot
  const urls = []
  for (const phase of ['identity', 'enriched']) {
    signal?.throwIfAborted()
    const result = await provider({ phase, identity: snapshot || null, input: prepared.input, documents: prepared.documents, web: prepared.web, enabledSources: prepared.enabledSources, signal, ...(client ? { client } : {}) })
    signal?.throwIfAborted()
    urls.push(...(Array.isArray(result.urls) ? result.urls : []))
    const checked = validate(result.data || {}, urls, prepared.documents, prepared.enabledSources)
    if (prepared.input.candidateUrl && checked.candidates.length) {
      const selected = checked.candidates.filter(c => c.name.sourceUrl === prepared.input.candidateUrl)
      if (selected.length === 1) Object.assign(checked, selected[0], { candidates: [] })
    }
    if (snapshot) {
      for (const key of ['name', 'title', 'company']) checked[key] ||= snapshot[key]
    }
    if (phase === 'identity') Object.assign(checked, { reportsTo: null, reports: [], roleMatch: null, publicSignals: [], likelyCares: null, suggestedInputs: [] })
    snapshot = { ...(snapshot || {}), ...checked, phase, sourcesUsed: [], sourcesSkipped: prepared.sourcesSkipped }
    if (snapshot.candidates.length > 1) {
      snapshot = { ...snapshot, name: null, title: null, company: null, tenure: null, reportsTo: null, reports: [], roleMatch: null, publicSignals: [], likelyCares: null, suggestedInputs: [] }
    }
    const used = new Set()
    const track = value => {
      if (!value || typeof value !== 'object') return
      if (value.sourceUrl && value.sourceType) used.add(value.sourceType)
      for (const child of Object.values(value)) if (child && typeof child === 'object') track(child)
    }
    track(snapshot)
    snapshot.sourcesUsed = [...used]
    yield snapshot
    if(phase==='enriched'&&snapshot.name&&!snapshot.candidates.length&&prepared.web&&result.data&&('photo' in result.data||'links' in result.data||'email' in result.data||'linkedin' in result.data)){
      const permitted=urls.filter(u=>{const safe=httpUrl(u);return safe&&(!hostedConnector(safe)||prepared.enabledSources.includes(hostedConnector(safe)))})
      const media=await enrichPublicProfile({...result.data,name:snapshot.name},{observedUrls:permitted,citations:result.citations||{},...(assetFetcher?{fetcher:assetFetcher}:{})})
      signal?.throwIfAborted()
      snapshot={...snapshot,photo:media.photo,links:media.links,email:media.email?{value:media.email,sourceUrl:media.emailSourceUrl,sourceType:'web'}:null,linkedin:media.linkedin?{value:media.linkedin,sourceUrl:media.linkedinSourceUrl,sourceType:'web'}:null}
      if((media.photo||media.links.length||media.email||media.linkedin)&&!snapshot.sourcesUsed.includes('web'))snapshot.sourcesUsed=[...snapshot.sourcesUsed,'web']
      yield snapshot
    }
    if (snapshot.candidates.length > 1 || !snapshot.name) return
  }
}

const MAX_BODY = 1_000_000
export async function servePerson(req, res, { provider, timeoutMs = 54_000, env = process.env } = {}) {
  const json = (status, error) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ error })) }
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(405, 'POST only') }
  // Who pays: the signed-in user's own key, else the server key behind the access code.
  let client
  if (!provider) {
    const codeWrong = h => !!env.RESEARCH_ACCESS_CODE && h?.['x-access-code'] !== env.RESEARCH_ACCESS_CODE
    const who = await anthropicFor(req.headers, { env, needsCode: codeWrong })
    if (who.error?.body?.error === 'account_keys_unavailable') return json(503, who.error.body.message)
    // A deployment must not hand out its shared key without an access code.
    if (who.source !== 'account' && env.VERCEL && !env.RESEARCH_ACCESS_CODE) return json(503, 'Person lookup needs a workspace access code configured on the server, or sign in and add your own API key.')
    if (who.error) return json(who.error.status, who.error.status === 401 ? 'Enter the correct workspace access code to look up a person.' : who.error.body.message || 'Person lookup needs an AI model key. Add one in Settings.')
    client = who.client
  } else if (env.RESEARCH_ACCESS_CODE && req.headers?.['x-access-code'] !== env.RESEARCH_ACCESS_CODE) return json(401, 'Enter the correct workspace access code to look up a person.')
  const controller = new AbortController()
  const abort = () => controller.abort(new Error('Client disconnected'))
  req.on('aborted', abort)
  res.on('close', abort)
  const timer = setTimeout(() => controller.abort(new Error('Person lookup timed out')), timeoutMs)
  const aborted = new Promise((_, reject) => controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true }))
  // Install the rejection handler immediately, including while reading the body.
  aborted.catch(() => {})
  let iterator
  try {
    let body = req.body
    if (body === undefined) {
      const read = async () => { const chunks = []; let size = 0; for await (const chunk of req) { size += Buffer.byteLength(chunk); if (size > MAX_BODY) { const e = new Error('Request too large'); e.status = 413; throw e } chunks.push(Buffer.from(chunk)) } return Buffer.concat(chunks).toString() }
      body = await Promise.race([read(), aborted])
    }
    if (typeof body === 'string' || Buffer.isBuffer(body)) {
      if (Buffer.byteLength(body) > MAX_BODY) return json(413, 'Request too large')
      try { body = JSON.parse(body.toString()) } catch { return json(400, 'Invalid JSON') }
    }
    if (Buffer.byteLength(JSON.stringify(body) || '') > MAX_BODY) return json(413, 'Request too large')
    prepare(body)
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders?.()
    iterator = searchPerson(body, { signal: controller.signal, provider, client })
    while (true) {
      const next = await Promise.race([iterator.next(), aborted])
      if (next.done) break
      if (res.destroyed) break
      res.write(JSON.stringify(next.value) + '\n')
    }
    if (!res.destroyed) res.end()
  } catch (err) {
    if (res.destroyed) return
    const error = controller.signal.aborted ? 'Person lookup timed out or was cancelled.' : err instanceof TypeError ? err.message : 'Person lookup failed. Try again.'
    if (res.headersSent) { res.write(JSON.stringify({ error }) + '\n'); res.end() }
    else json(err.status || (err instanceof TypeError ? 400 : controller.signal.aborted ? 504 : 502), error)
  } finally {
    clearTimeout(timer)
    req.off('aborted', abort)
    res.off('close', abort)
    controller.abort()
    // Do not block the HTTP response on an uncooperative provider.
    iterator?.return().catch(() => {})
  }
}

