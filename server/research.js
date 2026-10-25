import Anthropic from '@anthropic-ai/sdk'
import {enrichPublicProfile} from './publicProfile.js'
import { agentPrompt } from './agent-commands/index.js'
import { AGENT_COMMANDS } from '../src/agentCommands.js'

// The people-finder agent. One call researches one role at one company with
// Claude's web search tool, then every claim is checked against what the search
// actually returned before it reaches the UI. Nothing here guesses: a person
// without a source is dropped, an email that is not on a public page is dropped,
// and a LinkedIn link that never appeared in the results is dropped.

const MODEL = process.env.RESEARCH_MODEL || 'claude-opus-5-5'
const MAX_SEARCHES = 6


const norm = u =>
  String(u || '')
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')

const LINKEDIN = /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[^\s?#]+/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function research({ company, role }, client = new Anthropic(), {fetcher} = {}) {
  const messages = [
    {
      role: 'user',
      content: `Company: ${company}\nRole to find: ${role}\n\nFind who holds this role at ${company} right now.`
    }
  ]

  let message
  const blocks = [] // every content block across paused turns, so evidence is never lost
  for (let turn = 0; turn < 4; turn++) {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      system: agentPrompt(AGENT_COMMANDS.FIND_STAKEHOLDERS),
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: MAX_SEARCHES }],
      messages
    })
    message = await stream.finalMessage()
    blocks.push(...message.content)
    // The server-side search loop can pause long turns; resume where it left off.
    if (message.stop_reason !== 'pause_turn') break
    messages.push({ role: 'assistant', content: message.content })
  }

  if (message.stop_reason === 'refusal') {
    return { people: [], note: 'The model declined this request.' }
  }

  // Everything the search really returned: result URLs and the quoted text.
  const seen = new Set()
  let corpus = ''
  const observedUrls=[],citations={}
  for (const block of blocks) {
    if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
      for (const r of block.content) if (r.url) {seen.add(norm(r.url));observedUrls.push(r.url)}
    }
    if (block.type === 'text') {
      for (const c of block.citations || []) {
        if (c.url) {seen.add(norm(c.url));observedUrls.push(c.url);citations[c.url]=(citations[c.url]||'')+' '+(c.cited_text||'')}
        if (c.cited_text) corpus += `\n${c.cited_text}`
      }
    }
  }
  corpus = corpus.toLowerCase()

  const text = (message.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n')
  const parsed = extractJson(text)
  if (!parsed) return { people: [], note: 'The agent did not return a usable answer. Try again.' }

  const people = []
  for (const p of Array.isArray(parsed.people) ? parsed.people : []) {
    const name = clean(p.name, 120)
    if (!name) continue

    const sources = (Array.isArray(p.source_urls) ? p.source_urls : [])
      .filter(u => typeof u === 'string' && seen.has(norm(u)))
      .slice(0, 4)
    if (!sources.length) continue // no verifiable source: drop, do not show

    const linkedin =
      typeof p.linkedin === 'string' &&
      LINKEDIN.test(p.linkedin) &&
      (seen.has(norm(p.linkedin)) || corpus.includes(norm(p.linkedin)))
        ? p.linkedin.split(/[?#]/)[0]
        : null

    const email =
      typeof p.email === 'string' &&
      EMAIL.test(p.email.trim()) &&
      corpus.includes(p.email.trim().toLowerCase())
        ? p.email.trim()
        : null

    const media = ('photo' in p || 'links' in p || p.emailSourceUrl) ? await enrichPublicProfile(p,{observedUrls,citations,...(fetcher?{fetcher}:{})}) : null
    people.push({
      name,
      title: clean(p.title, 160),
      bio: clean(p.bio, 400),
      email: media ? media.email : email,
      linkedin: media?.linkedin || linkedin,
      emailSourceUrl: media ? media.emailSourceUrl : ((email ? Object.entries(citations).find(([,quote])=>quote.toLowerCase().includes(email.toLowerCase()))?.[0] : null) || null),
      linkedinSourceUrl: media?.linkedinSourceUrl || (linkedin ? linkedin : null),
      photo: media?.photo || null,
      links: media?.links || [],
      sources,
      confidence: ['high', 'medium', 'low'].includes(p.confidence) ? p.confidence : 'low'
    })
  }

  return { people: people.slice(0, 3), note: clean(parsed.note, 300) || null }
}

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function extractJson(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}
