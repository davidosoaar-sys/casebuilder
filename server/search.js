// Web search as our own capability, not the model's.
//
// Why this exists: the people-finder and the value-suggester are only
// trustworthy because every claim is checked against what a search engine
// actually returned. That evidence used to come from Anthropic's server-side
// web_search tool, which chained the whole product to one vendor.
//
// Here we run the search ourselves and hand the model text we already hold.
// The verification rule is unchanged and now provider-independent: a URL the
// search never returned cannot become a source, whichever model is answering.
//
// A search backend returns: [{ url, title, snippet }]

export class SearchError extends Error {
  constructor(message, { status, code, backend } = {}) {
    super(message)
    this.name = 'SearchError'
    this.status = status
    this.code = code
    this.backend = backend
  }
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))
const str = (v, max = 400) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

// ------------------------------------------------------------------- Tavily
// Built for agents, returns clean snippets, 1,000 searches/month free.
export function tavilyBackend(env = process.env, fetchImpl = fetch) {
  const key = env.TAVILY_API_KEY || ''
  return {
    name: 'tavily',
    label: 'Tavily',
    keyName: 'TAVILY_API_KEY',
    configured: () => !!key,
    async search(query, { count = 5, blockedDomains = [] } = {}) {
      const res = await fetchImpl('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          api_key: key,
          query,
          max_results: clamp(count, 1, 20),
          search_depth: 'basic',
          ...(blockedDomains.length ? { exclude_domains: blockedDomains } : {})
        })
      })
      if (!res.ok) throw await searchError(res, 'tavily')
      const data = await res.json()
      return (data.results || []).map(r => ({
        url: str(r.url, 500), title: str(r.title, 300), snippet: str(r.content, 1200)
      }))
    }
  }
}

// -------------------------------------------------------------------- Brave
export function braveBackend(env = process.env, fetchImpl = fetch) {
  const key = env.BRAVE_SEARCH_API_KEY || ''
  return {
    name: 'brave',
    label: 'Brave Search',
    keyName: 'BRAVE_SEARCH_API_KEY',
    configured: () => !!key,
    async search(query, { count = 5 } = {}) {
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${clamp(count, 1, 20)}`
      const res = await fetchImpl(url, {
        headers: { accept: 'application/json', 'x-subscription-token': key }
      })
      if (!res.ok) throw await searchError(res, 'brave')
      const data = await res.json()
      return (data.web?.results || []).map(r => ({
        url: str(r.url, 500), title: str(r.title, 300), snippet: str(r.description, 1200)
      }))
    }
  }
}

// ------------------------------------------------- Google Programmable Search
// 100 queries/day free. Amr asked for Google specifically.
export function googleCseBackend(env = process.env, fetchImpl = fetch) {
  const key = env.GOOGLE_SEARCH_API_KEY || ''
  const cx = env.GOOGLE_SEARCH_CX || ''
  return {
    name: 'google',
    label: 'Google Programmable Search',
    keyName: 'GOOGLE_SEARCH_API_KEY',
    configured: () => !!key && !!cx,
    async search(query, { count = 5 } = {}) {
      const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&num=${clamp(count, 1, 10)}`
      const res = await fetchImpl(url)
      if (!res.ok) throw await searchError(res, 'google')
      const data = await res.json()
      return (data.items || []).map(r => ({
        url: str(r.link, 500), title: str(r.title, 300), snippet: str(r.snippet, 1200)
      }))
    }
  }
}

// ------------------------------------------------------------------- Serper
export function serperBackend(env = process.env, fetchImpl = fetch) {
  const key = env.SERPER_API_KEY || ''
  return {
    name: 'serper',
    label: 'Serper',
    keyName: 'SERPER_API_KEY',
    configured: () => !!key,
    async search(query, { count = 5 } = {}) {
      const res = await fetchImpl('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'X-API-KEY': key },
        body: JSON.stringify({ q: query, num: clamp(count, 1, 20) })
      })
      if (!res.ok) throw await searchError(res, 'serper')
      const data = await res.json()
      return (data.organic || []).map(r => ({
        url: str(r.link, 500), title: str(r.title, 300), snippet: str(r.snippet, 1200)
      }))
    }
  }
}

export const SEARCH_BACKENDS = {
  tavily: tavilyBackend,
  google: googleCseBackend,
  brave: braveBackend,
  serper: serperBackend
}

async function searchError(res, backend) {
  let detail = ''
  try { detail = (await res.text()).slice(0, 200) } catch {}
  const code = res.status === 401 || res.status === 403 ? 'auth' : res.status === 429 ? 'rate_limit' : 'upstream'
  const friendly =
    code === 'auth' ? 'The search API key was rejected.'
      : code === 'rate_limit' ? 'Search rate limit reached. Try again shortly.'
        : `The search service returned an error (${res.status}).`
  return new SearchError(detail ? `${friendly} ${detail}` : friendly, { status: res.status, code, backend })
}

export function selectSearch(env = process.env, fetchImpl = fetch) {
  const wanted = (env.SEARCH_BACKEND || '').trim().toLowerCase()
  if (wanted) {
    const make = SEARCH_BACKENDS[wanted]
    if (!make) throw new SearchError(`Unknown search backend "${wanted}". Choose one of: ${Object.keys(SEARCH_BACKENDS).join(', ')}.`, { code: 'config' })
    const b = make(env, fetchImpl)
    if (!b.configured()) throw new SearchError(`${b.label} is selected but ${b.keyName} is not set.`, { code: 'not_configured' })
    return b
  }
  for (const name of ['tavily', 'google', 'brave', 'serper']) {
    const b = SEARCH_BACKENDS[name](env, fetchImpl)
    if (b.configured()) return b
  }
  throw new SearchError('No search provider is configured. Add a Tavily, Google, Brave or Serper key.', { code: 'not_configured' })
}

export function searchStatus(env = process.env) {
  return Object.keys(SEARCH_BACKENDS).map(name => {
    const b = SEARCH_BACKENDS[name](env)
    return { name, label: b.label, keyName: b.keyName, configured: b.configured() }
  })
}

// Run several queries and return one deduped evidence set. This is the corpus
// the model is allowed to cite, and nothing outside it may become a source.
export async function gatherEvidence(queries, { backend, count = 5, blockedDomains = [], maxQueries = 6 } = {}) {
  const engine = backend || selectSearch()
  const byUrl = new Map()
  const blocked = blockedDomains.map(d => d.toLowerCase())
  for (const query of queries.slice(0, maxQueries)) {
    let results = []
    try {
      results = await engine.search(query, { count, blockedDomains })
    } catch (err) {
      if (err instanceof SearchError && err.code === 'rate_limit') break
      throw err
    }
    for (const r of results) {
      if (!r.url) continue
      let host = ''
      try { host = new URL(r.url).hostname.replace(/^www\./, '').toLowerCase() } catch { continue }
      // A disabled connector's domain must never enter the evidence set, so it
      // can never be cited as a source.
      if (blocked.some(b => host === b || host.endsWith(`.${b}`))) continue
      if (!byUrl.has(r.url)) byUrl.set(r.url, { ...r, host })
    }
  }
  return [...byUrl.values()]
}

// The exact text handed to the model, numbered so it can refer to a source
// without being able to invent one.
export function evidenceBlock(evidence) {
  return evidence
    .map((e, i) => `[${i + 1}] ${e.title}\nURL: ${e.url}\n${e.snippet}`)
    .join('\n\n')
}
