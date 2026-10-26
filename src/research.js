// General research: a question goes to the account's own agent on the worker
// (job kind 'research'); the answer, its sources and the tool trace come back
// on the job row. History is the account's own research jobs, so no extra
// table is needed.

export const RESEARCH_LIMIT = 30
export const MAX_QUESTION = 2000

const SELECT = 'id, deal_id, payload, status, result, error, created_at'

export async function listResearch(client, userId) {
  const { data, error } = await client.from('jobs').select(SELECT)
    .eq('owner_id', userId).eq('kind', 'research')
    .order('created_at', { ascending: false }).limit(RESEARCH_LIMIT)
  if (error) throw error
  return data || []
}

export async function getResearch(client, id) {
  const { data, error } = await client.from('jobs').select(SELECT).eq('id', id).single()
  if (error) throw error
  return data
}

export async function startResearch(client, { userId, question, dealId, model }) {
  const q = String(question || '').trim().slice(0, MAX_QUESTION)
  if (!q) throw new Error('Type a question first.')
  const payload = { question: q, ...(model ? { model } : {}) }
  const { data, error } = await client.from('jobs')
    .insert({ owner_id: userId, deal_id: dealId || null, kind: 'research', payload }).select(SELECT).single()
  if (error) throw new Error(/rate|limit/i.test(error.message) ? 'Too many requests just now. Wait a minute and try again.' : error.message)
  return data
}

export const isRunning = job => job && (job.status === 'queued' || job.status === 'running')

// What to call a job in the history list.
export const researchTitle = job => {
  const q = String(job?.payload?.question || '').replace(/\s+/g, ' ').trim()
  return q.length > 80 ? q.slice(0, 78) + '…' : q || 'Untitled research'
}

// ---------------------------------------------------------------------------
// A small, safe Markdown subset for answers: headings, paragraphs, bullet and
// numbered lists, **bold**, *italic*, `code`, links, and [n] citations. It
// returns a plain structure; the component turns it into React elements, so
// no HTML from the model is ever injected.
// ---------------------------------------------------------------------------

// Inline: [{t:'text'|'b'|'i'|'code'|'link'|'cite', v, href?, n?}]
export function parseInline(text) {
  const out = []
  const re = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(\[(\d{1,2}(?:\s*,\s*\d{1,2})*)\])|(\*([^*\s][^*]*)\*)/g
  let last = 0, m
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: 'text', v: text.slice(last, m.index) })
    if (m[1]) out.push({ t: 'b', v: m[2] })
    else if (m[3]) out.push({ t: 'code', v: m[4] })
    else if (m[5]) out.push({ t: 'link', v: m[6], href: m[7] })
    else if (m[8]) for (const n of m[9].split(',')) out.push({ t: 'cite', n: Number(n.trim()) })
    else if (m[10]) out.push({ t: 'i', v: m[11] })
    last = re.lastIndex
  }
  if (last < text.length) out.push({ t: 'text', v: text.slice(last) })
  return out
}

// Blocks: [{type:'h'|'p'|'ul'|'ol', level?, text?, items?}]
export function parseMarkdown(md) {
  const blocks = []
  let para = [], list = null
  const flushPara = () => { if (para.length) blocks.push({ type: 'p', text: para.join(' ') }); para = [] }
  const flushList = () => { if (list) blocks.push(list); list = null }
  for (const raw of String(md || '').replace(/\r/g, '').split('\n')) {
    const line = raw.trim()
    let m
    if (!line) { flushPara(); flushList(); continue }
    if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) { flushPara(); flushList(); blocks.push({ type: 'h', level: m[1].length, text: m[2] }); continue }
    if ((m = /^[-*•]\s+(.*)$/.exec(line))) { flushPara(); if (list?.type !== 'ul') { flushList(); list = { type: 'ul', items: [] } } list.items.push(m[1]); continue }
    if ((m = /^\d+[.)]\s+(.*)$/.exec(line))) { flushPara(); if (list?.type !== 'ol') { flushList(); list = { type: 'ol', items: [] } } list.items.push(m[1]); continue }
    if (list && /^\s{2,}\S/.test(raw)) { list.items[list.items.length - 1] += ' ' + line; continue }
    flushList(); para.push(line)
  }
  flushPara(); flushList()
  return blocks
}

// Agent chat replies carry their sources as plain text: "[1] https://..." lines
// (often under "Sources:") and bare URLs in the prose. extractSources lifts
// them out so the reply renders them as numbered chips instead of raw URLs.
// Returns { text, sources: [{ n, url, title }] }; every bare URL left in the
// text becomes a [n] citation (an existing number when it is already listed).
// Markdown links [label](url) are left alone.
const SOURCES_HEAD = /^[\s*_#>]*(sources|references|links)[\s*_:]*$/i
const LISTED = /^\s*(?:[-*•]\s*)?\[(\d{1,2})\]:?\s+(.+)$/
const NUMBERED = /^\s*(?:[-*•]\s*)?(\d{1,2})[.)]\s+(.+)$/
const BARE = /(\[[^\]]*\]\(https?:\/\/[^\s)]+\))|<?(https?:\/\/[^\s<>\]"']+)>?/g

// The rest of a source line: "[Title](url)", "Title: url" or "url - Title".
function sourceLine(rest) {
  const s = rest.trim()
  let m
  if ((m = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)[\s.]*$/.exec(s))) return { title: m[1], url: m[2] }
  if ((m = /^(.*?)[\s:–-]*<?(https?:\/\/[^\s>]+?)>?$/.exec(s))) return { title: m[1], url: m[2] }
  if ((m = /^<?(https?:\/\/[^\s>]+)>?\s+[:–-]\s*(.+)$/.exec(s))) return { title: m[2], url: m[1] }
  return null
}

// Trailing punctuation belongs to the sentence, not the URL; a ")" stays only
// when the URL opened one (Wikipedia-style paths).
export function trimUrl(url) {
  let u = url.replace(/[.,;:!?'"*_]+$/, '')
  while (u.endsWith(')') && (u.match(/\(/g) || []).length < (u.match(/\)/g) || []).length) u = u.slice(0, -1).replace(/[.,;:!?'"*_]+$/, '')
  return u
}
const cleanTitle = t => String(t || '').replace(/^[\s"“*_]+|[\s"”*_:–-]+$/g, '').trim()

export function extractSources(md) {
  const sources = []
  const byUrl = new Map()
  const add = (n, url, title = '') => {
    url = trimUrl(url)
    if (byUrl.has(url)) return byUrl.get(url)
    if (n == null || sources.some(s => s.n === n)) n = Math.max(0, ...sources.map(s => s.n)) + 1
    sources.push({ n, url, title: cleanTitle(title) })
    byUrl.set(url, n)
    return n
  }
  // 1. Source lines: "[n] ..." anywhere; "n. ..." only inside a Sources section.
  const kept = []
  let inSources = false
  for (const line of String(md || '').replace(/\r/g, '').split('\n')) {
    if (SOURCES_HEAD.test(line)) { inSources = true; kept.push({ line, head: true }); continue }
    const m = LISTED.exec(line) || (inSources && NUMBERED.exec(line))
    const src = m && sourceLine(m[2])
    if (src) { add(Number(m[1]), src.url, src.title); continue }
    if (line.trim() && inSources) inSources = false
    kept.push({ line })
  }
  // A "Sources:" heading whose list was lifted out is dropped too.
  const lines = kept.filter((k, i) => !k.head || !!kept[i + 1]?.line.trim())
  // 2. Bare URLs in the prose become citations.
  const text = lines.map(k => k.line).join('\n').replace(BARE, (all, link, url) => {
    if (link) return link
    const clean = trimUrl(url)
    const tail = url.slice(clean.length)
    return `[${add(null, clean)}]${tail.replace(/>$/, '')}`
  }).replace(/\n{3,}/g, '\n\n').trim()
  return { text, sources: sources.sort((a, b) => a.n - b.n) }
}
