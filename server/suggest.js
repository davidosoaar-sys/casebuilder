import Anthropic from '@anthropic-ai/sdk'
import { runWithSearch } from './agentSearch.js'
import { agentPrompt } from './agent-commands/index.js'
import { AGENT_COMMANDS } from '../src/agentCommands.js'

// The suggestion agent. It READS material Chris switched on and proposes values for
// empty inputs. It never computes a figure, and it never invents one: every item it
// returns must be backed by something checkable, and anything that is not is dropped
// here, before it can reach the app.
//
//   a quote       must appear, word for word, in a document it was given, and the
//                 number must be in that quote            -> an input
//   a public link must have appeared in the web search results; for headcount and
//                 open roles that is an input                -> an input
//   a benchmark   a publication and a link from the search   -> a suggestion
//
// A guess with no source is not returned.

const MODEL = process.env.RESEARCH_MODEL || 'claude-opus-5-5'
const MAX_SEARCHES = 5
const MAX_DOC_CHARS = 60_000
const MAX_TOTAL_CHARS = 150_000

// key -> [min, max]. Only these inputs can be suggested.
export const SUGGESTIBLE = {
  engineers: [1, 1_000_000],
  platformShare: [5, 60],
  hourlyCost: [40, 300],
  searchHoursToday: [0.5, 10],
  searchHoursPortal: [0, 10],
  rampDaysToday: [3, 120],
  rampDaysPortal: [1, 120],
  newHiresPerYear: [0, 20_000],
  incidentHoursToday: [0.5, 24],
  incidentHoursPortal: [0.25, 24],
  peoplePerIncident: [1, 30],
  incidentsPerMonth: [0, 500],
  auditPrepDaysToday: [1, 90],
  auditPrepDaysPortal: [0, 90],
  auditsPerYear: [0, 50],
  peoplePerAudit: [1, 60],
  maintPctToday: [0, 100],
  maintPctPortal: [0, 100],
  toolSpendToday: [0, 50_000_000],
  toolSpendPortal: [0, 50_000_000],
  portalCost: [20_000, 10_000_000],
  selfHostEngineers: [0.5, 20],
  selfHostSalary: [60_000, 600_000]
}

// Headcount and open roles are facts anyone can check on a public page.
export const PUBLIC_FACTS = ['engineers', 'newHiresPerYear']

const SOURCE_LABEL = { claude: 'Claude', gong: 'Gong', hubspot: 'HubSpot', slack: 'Slack', clay: 'Clay', lemlist: 'Lemlist' }


const norm = u =>
  String(u || '')
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')

const squash = t => String(t || '').toLowerCase().replace(/[\s ]+/g, ' ').trim()

// The number is in the quote: as written, or as thousands or millions ("$250k", "1.2M").
export function quoteSupportsValue(quote, value) {
  const tokens = String(quote).match(/\d[\d,]*(?:\.\d+)?\s?(?:k|m|million|thousand)?/gi) || []
  for (const t of tokens) {
    const n = parseFloat(t.replace(/,/g, ''))
    if (!Number.isFinite(n)) continue
    const unit = (t.match(/(k|m|million|thousand)\s*$/i) || [])[1]?.toLowerCase()
    const scaled = unit === 'k' || unit === 'thousand' ? n * 1e3 : unit === 'm' || unit === 'million' ? n * 1e6 : n
    if (Math.abs(scaled - value) < 1e-6 || Math.abs(n - value) < 1e-6) return true
  }
  return false
}

export function publicMetricEvidence(key,evidence,value){
  if(/\b(?:vacanc\w*|open (?:roles|jobs|positions)|r&d employees|research and development employees|approximately|roughly|estimated|up to|more than|at least)\b/i.test(evidence))return false
  const numeric='\\d[\\d,]*(?:\\.\\d+)?\\s*(?:million|thousand|k|m)?'
  const phrases=evidence.match(new RegExp('(?:'+numeric+'\\s+engineers?\\b|engineering (?:team|headcount|staff|workforce)(?:\\s+(?:of|is|has|includes|totals|comprises|stands|at|was|currently|now))*\\s+'+numeric+')','gi'))||[]
  if(!phrases.some(phrase=>quoteSupportsValue(phrase,value)))return false
  return key==='engineers'||(/\b(?:hired|hires)\b/i.test(evidence)&&/\b(?:20\d{2}|annual|year|12 months)\b/i.test(evidence))
}

// Turn what the agent said into suggestions we are willing to show. Everything that
// cannot be checked is dropped.
export function validateAgentItems(parsed, { documents, seen, only, publicOnly=false, citations={} }) {
  const out = []
  const docs = documents.map(d => ({ ...d, flat: squash(d.text) }))
  for (const it of Array.isArray(parsed && parsed.suggestions) ? parsed.suggestions : []) {
    const range = SUGGESTIBLE[it.key]
    if (!range || (only && !only.includes(it.key))) continue
    if(publicOnly&&!PUBLIC_FACTS.includes(it.key))continue
    const value = Number(it.value)
    if (!Number.isFinite(value) || value < range[0] || value > range[1]) continue
    const confidence = ['high', 'medium', 'low'].includes(it.confidence) ? it.confidence : 'low'

    if (!publicOnly && typeof it.quote === 'string' && it.quote.trim().length >= 4) {
      const quote = it.quote.trim().slice(0, 400)
      const flat = squash(quote)
      const doc = docs.find(d => (it.document ? d.id === it.document : true) && d.flat.includes(flat))
      if (doc && quoteSupportsValue(quote, value)) {
        out.push({
          key: it.key,
          value,
          state: 'input',
          kind: 'transcript',
          quote,
          confidence,
          origin: `“${quote}” — ${SOURCE_LABEL[doc.source] || 'Document'}: ${doc.name}`
        })
      }
      continue // a quote that does not check out is dropped, not downgraded
    }

    if (typeof it.link === 'string' && /^https?:\/\//i.test(it.link) && seen.has(norm(it.link))) {
      const link = it.link.trim().split('#')[0]
      if(publicOnly){
        const evidence=typeof it.evidence==='string'?it.evidence.trim().slice(0,600):''
        if(it.publication||!publicMetricEvidence(it.key,evidence,value))continue
        const observed=Object.entries(citations).filter(([url])=>norm(url)===norm(link)).map(([,excerpt])=>squash(excerpt)).join(' ')
        if(!observed.includes(squash(evidence)))continue
        out.push({key:it.key,value,state:'suggestion',kind:'public',link,quote:evidence,confidence,origin:`Public source — review needed: ${link}`})
        continue
      }
      if (PUBLIC_FACTS.includes(it.key) && !(typeof it.publication === 'string' && it.publication.trim())) {
        out.push({ key: it.key, value, state: 'input', kind: 'public', link, confidence, origin: `Public source: ${link}` })
      } else if (typeof it.publication === 'string' && it.publication.trim()) {
        const publication = it.publication.trim().slice(0, 160)
        out.push({ key: it.key, value, state: 'suggestion', kind: 'benchmark', link, confidence, origin: `Benchmark: ${publication} (${link})` })
      }
    }
  }
  // one suggestion per key: the best source wins
  const rank = { transcript: 1, public: 2, benchmark: 4 }
  return Object.values(
    out.reduce((acc, s) => {
      if (!acc[s.key] || rank[s.kind] < rank[acc[s.key].kind]) acc[s.key] = s
      return acc
    }, {})
  )
}

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

// body: { company, filled: {key: value}, documents: [{source, name, text}], web: bool, only: [key], labels: {key: label} }
export async function suggest({ company, filled, documents, web, only, labels, publicOnly=false }, client = new Anthropic()) {
  // Filled keys are outside the research scope, even for a direct API request.
  only = only.filter(key => !Object.prototype.hasOwnProperty.call(filled, key))
  if (!only.length) return { suggestions: [] }
  // trim what is sent, and give each document an id the agent can cite
  let budget = MAX_TOTAL_CHARS
  const docs = []
  for (const [i, d] of documents.entries()) {
    const text = String(d.text || '').slice(0, Math.min(MAX_DOC_CHARS, budget))
    if (!text) continue
    budget -= text.length
    docs.push({ id: `d${i + 1}`, source: d.source, name: String(d.name || 'Untitled').slice(0, 120), text })
  }
  // nothing enabled that needs the agent: do not call it at all
  if (!docs.length && !web) return { suggestions: [] }

  const wanted = only.map(k => `- ${k}: ${labels && labels[k] ? labels[k] : k}`).join('\n')
  const known = Object.entries(filled)
    .map(([k, v]) => `- ${k} = ${v}`)
    .join('\n')
  const material = docs.map(d => `<document id="${d.id}" source="${d.source}" name="${d.name}">\n${d.text}\n</document>`).join('\n\n')
  const messages = [
    {
      role: 'user',
      content: `Company: ${company}\n\nAlready filled in:\n${known || '(nothing yet)'}\n\nFind these inputs if the material supports them:\n${wanted}\n\n${material}${web ? '\n\nYou may use web search.' : '\n\nWeb search is not available.'}`
    }
  ]

  const run = await runWithSearch({
    client, model: MODEL, maxTokens: 6000, maxSearches: MAX_SEARCHES, web,
    system: agentPrompt(AGENT_COMMANDS.SUGGEST_INPUTS)+(publicOnly?'\nAutomatic public-input pass: use public web only. Return only directly stated company engineering headcount or engineering hires over a stated year. Each item MUST include evidence: an exact source excerpt containing the value, metric and reporting period where relevant. Do not report total employees, R&D headcount, open vacancies, estimates or benchmarks. No documents, arithmetic or Portal assumptions. All results remain unconfirmed suggestions.':'') ,
    messages
  })
  const message = run.message
  if (message.stop_reason === 'refusal') return { suggestions: [] }
  const seen = new Set(run.urls.map(norm))
  const parsed = extractJson(run.text)
  return { suggestions: validateAgentItems(parsed, { documents: docs, seen, only, publicOnly, citations:run.citations }), search: run.search }
}
