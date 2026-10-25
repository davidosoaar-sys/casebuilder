// One search loop for every research command (Find people, Suggest values,
// Person lookup, brand website lookup).
//
// The model gets a `web_search` tool, but WE run the search (Tavily by default,
// see search.js), so:
//   - the team's search account is what gets used and billed, not Anthropic's
//     built-in search;
//   - the evidence set is exactly what our search returned. Callers verify
//     every URL and quote against it, so a source the search never returned
//     cannot reach the UI.
//
// If no search key is configured at all, it falls back to Anthropic's built-in
// web search so the app still works, and reports `search: 'anthropic'` so the
// fallback is visible rather than silent.
import { selectSearch, SearchError } from './search.js'

const SEARCH_TOOL = {
  name: 'web_search',
  description: 'Search the public web. Returns numbered results with URL, title and a text snippet. Cite only URLs returned here.',
  input_schema: {
    type: 'object',
    properties: { query: { type: 'string', description: 'The search query.' } },
    required: ['query']
  }
}

const host = u => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase() } catch { return '' } }

export function searchBackendOrNull(env = process.env) {
  try { return selectSearch(env) } catch (e) { if (e instanceof SearchError && e.code === 'not_configured') return null; throw e }
}

// Runs the model with search until it stops. Returns:
//   { message, blocks, evidence: [{url,title,snippet,host}], urls: [...], corpus, search }
export async function runWithSearch({
  client, model, system, messages, maxTokens = 6000, maxSearches = 5, blockedDomains = [],
  web = true, signal, backend, thinking = { type: 'adaptive' }, effort = 'low', count = 5
}) {
  const engine = web ? (backend === undefined ? searchBackendOrNull() : backend) : null
  const blocked = blockedDomains.map(d => d.toLowerCase())
  const evidence = new Map()
  const blocks = []
  const convo = [...messages]
  let searches = 0
  let message

  const base = { model, max_tokens: maxTokens, system, ...(thinking ? { thinking } : {}), ...(effort ? { output_config: { effort } } : {}) }

  if (web && !engine) {
    // No search key anywhere: Anthropic's own web search, clearly reported.
    for (let turn = 0; turn < 4; turn++) {
      signal?.throwIfAborted?.()
      message = await client.messages.stream({ ...base, tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: maxSearches, ...(blocked.length ? { blocked_domains: blocked } : {}) }], messages: convo }, signal ? { signal } : undefined).finalMessage()
      blocks.push(...message.content)
      if (message.stop_reason !== 'pause_turn') break
      convo.push({ role: 'assistant', content: message.content })
    }
    let corpus = ''
    for (const b of blocks) {
      if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) for (const r of b.content) if (r.url && !evidence.has(r.url)) evidence.set(r.url, { url: r.url, title: r.title || '', snippet: '', host: host(r.url) })
      if (b.type === 'text') for (const c of b.citations || []) { if (c.url && !evidence.has(c.url)) evidence.set(c.url, { url: c.url, title: c.title || '', snippet: '', host: host(c.url) }); if (c.cited_text) corpus += `\n${c.cited_text}` }
    }
    return finish(message, blocks, evidence, corpus, 'anthropic', searches)
  }

  for (let turn = 0; turn < maxSearches + 2; turn++) {
    signal?.throwIfAborted?.()
    // The tool list must stay the same on every turn: the model's thinking blocks are
    // bound to it, and changing it mid-conversation is rejected by the API ("Invalid
    // signature in thinking block ... tools list differs"). Past the search limit the
    // tool stays offered and a call just gets "Search limit reached".
    message = await client.messages.stream({ ...base, ...(engine ? { tools: [SEARCH_TOOL] } : {}), messages: convo }, signal ? { signal } : undefined).finalMessage()
    blocks.push(...message.content)
    const calls = message.content.filter(b => b.type === 'tool_use' && b.name === 'web_search')
    if (message.stop_reason !== 'tool_use' || !calls.length) break
    convo.push({ role: 'assistant', content: message.content })
    const results = []
    for (const call of calls) {
      const query = String(call.input?.query || '').slice(0, 300)
      if (searches >= maxSearches || !query) {
        results.push({ type: 'tool_result', tool_use_id: call.id, content: 'Search limit reached. Answer with what you have.' })
        continue
      }
      searches++
      let found = []
      try { found = await engine.search(query, { count, blockedDomains: blocked }) }
      catch (e) {
        results.push({ type: 'tool_result', tool_use_id: call.id, is_error: true, content: `Search failed: ${e.message}` })
        continue
      }
      const kept = []
      for (const r of found) {
        const h = host(r.url)
        if (!h || blocked.some(b => h === b || h.endsWith(`.${b}`))) continue
        if (!evidence.has(r.url)) evidence.set(r.url, { ...r, host: h })
        kept.push(r)
      }
      results.push({
        type: 'tool_result', tool_use_id: call.id,
        content: kept.length ? kept.map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`).join('\n\n') : 'No results.'
      })
    }
    convo.push({ role: 'user', content: results })
  }
  const corpus = [...evidence.values()].map(e => `${e.title}\n${e.snippet}`).join('\n')
  return finish(message, blocks, evidence, corpus, web ? engine.name : 'none', searches)
}

function finish(message, blocks, evidence, corpus, search, searches) {
  const text = (message?.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n')
  const citations=Object.fromEntries([...evidence.values()].map(e=>[e.url,e.snippet||'']))
  for(const block of blocks)if(block.type==='text')for(const c of block.citations||[])if(c.url&&c.cited_text)citations[c.url]=(citations[c.url]||'')+' '+c.cited_text
  return { message, blocks, text, citations, evidence: [...evidence.values()], urls: [...evidence.keys()], corpus, search, searches }
}
