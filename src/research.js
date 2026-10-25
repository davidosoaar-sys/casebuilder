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
