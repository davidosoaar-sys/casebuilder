// The Dashboard answers one question: which deal needs me before my next
// meeting? Pure helpers, so every number on it is tested and matches the deck:
// readiness (inputs by source state), value as a range, stakeholders covered,
// what changed since the last visit, and the one next action per deal.
import { stateOf } from './source.js'
import { isClaim, valueRange, STAKEHOLDERS } from './valueModel.js'
import { DEFAULT_BRAND, safeAsset } from './brand.js'
import { fmtMoney } from './format.js'

export const SEEN_KEY = 'casebuilder.dashboard.seen'
export const MAX_ATTENTION = 5
export const MAX_FEED = 6
const WEEK = 7 * 24 * 3600 * 1000

// ---- readiness: the case inputs by state, one stacked bar per deal
export const READINESS = [
  { state: 'input', label: 'Confirmed' },
  { state: 'assumption', label: 'Assumption' },
  { state: 'suggestion', label: 'Suggestion' },
  { state: 'empty', label: 'Empty' }
]

// Counts the inputs the confidence score counts (numbers about the customer).
// Segment widths are exact shares, so they always add up to 100.
export function readiness(fields = []) {
  const claims = fields.filter(isClaim)
  const counts = { input: 0, assumption: 0, suggestion: 0, empty: 0 }
  for (const f of claims) counts[stateOf(f)]++
  const total = claims.length
  const segments = READINESS.map(r => ({ ...r, count: counts[r.state], share: total ? (counts[r.state] / total) * 100 : r.state === 'empty' ? 100 : 0 }))
  return { counts, total, confirmedShare: total ? counts.input / total : 0, segments }
}

// ---- value: a range, or null when the deck cannot show a total yet
export const fmtRange = r => {
  if (!r) return null
  const lo = fmtMoney(r.low)
  const hi = fmtMoney(r.high)
  return lo === hi ? `${lo} a year` : `${lo} to ${hi} a year`
}

// ---- stakeholders: a role is covered once someone is found or named for it
const SHORT_ROLE = { champion: 'VP of Engineering', cto: 'CTO', finance: 'finance lead', security: 'security lead' }

export function roleName(s) {
  if (s.builtin) return SHORT_ROLE[s.key] || STAKEHOLDERS.find(b => b.key === s.key)?.role || 'stakeholder'
  return (s.edit?.role || s.role || 'stakeholder').trim()
}

export function coverage(deal) {
  const roles = (deal.stakeholders || []).filter(s => s && (s.builtin ? STAKEHOLDERS.some(b => b.key === s.key) : s.role || s.edit?.role))
  const has = s => (deal.people?.[s.key] || []).length > 0 || (s.namedPeople || []).length > 0
  const gap = roles.find(s => !has(s))
  return { covered: roles.filter(has).length, total: roles.length, gap: gap ? { key: gap.key, name: roleName(gap) } : null }
}

export function coverageLine(c) {
  if (!c.total) return 'No stakeholders mapped yet'
  const head = `${c.covered} of ${c.total} ${c.total === 1 ? 'role' : 'roles'} ${c.covered === 1 ? 'has' : 'have'} a person`
  return c.gap ? `${head}. No ${c.gap.name} yet` : head
}

// ---- brand: still the app's own look, never scanned or set
export function isDefaultBrand(brand) {
  if (!brand) return true
  if (brand.status === 'scanning') return false
  if (safeAsset(brand.logo) || safeAsset(brand.icon)) return false
  return ['primary', 'background', 'surface', 'text'].every(k => !brand[k] || String(brand[k]).toLowerCase() === DEFAULT_BRAND[k])
}

export const companyOf = deal => {
  const v = deal.fields?.find(f => f.key === 'companyName')?.value
  return (typeof v === 'string' && v.trim()) || deal.name || 'this company'
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

// ---- the one next action: what to do first, in the order it unblocks the case
//   review   suggestions are waiting (the agent already did the work)
//   fill     the model cannot value the deal yet
//   find     a role has nobody
//   fill     inputs are still empty
//   rescan   the brand is still the app's default
//   confirm  only assumptions are left
export function nextAction(deal, r = readiness(deal.fields), c = coverage(deal), range = valueRange(deal.fields || [])) {
  const { suggestion, empty, assumption } = r.counts
  if (suggestion) return { kind: 'review', label: `Review ${plural(suggestion, 'suggestion')}` }
  if (!range && empty) return { kind: 'fill', label: `Fill ${plural(empty, 'input')}` }
  if (c.gap) return { kind: 'find', label: `Find the ${c.gap.name}`, prompt: `Find the ${c.gap.name} at ${companyOf(deal)}` }
  if (empty) return { kind: 'fill', label: `Fill ${plural(empty, 'input')}` }
  if (isDefaultBrand(deal.brand)) return { kind: 'rescan', label: 'Rescan branding' }
  if (assumption) return { kind: 'confirm', label: `Confirm ${plural(assumption, 'input')}` }
  return null
}

// Every deal with what the Dashboard shows for it.
export function dealSummary(deal) {
  const r = readiness(deal.fields)
  const c = coverage(deal)
  const range = valueRange(deal.fields || [])
  return { deal, readiness: r, coverage: c, range, action: nextAction(deal, r, c, range) }
}

// Needs attention: deals with a next action, least confirmed first (most
// empty next, then the most recently touched). The rest are listed below.
export function triage(summaries, max = MAX_ATTENTION) {
  const order = (a, b) => a.readiness.confirmedShare - b.readiness.confirmedShare
    || b.readiness.counts.empty - a.readiness.counts.empty
    || (b.deal.updatedAt || 0) - (a.deal.updatedAt || 0)
  const sorted = [...summaries].sort(order)
  const attention = sorted.filter(s => s.action).slice(0, max)
  return { attention, rest: sorted.filter(s => !attention.includes(s)) }
}

// One line for the header: "3 deals, $4.1M to $5.6M a year in total".
export function pipelineLine(summaries) {
  const n = summaries.length
  if (!n) return 'No deals yet'
  const valued = summaries.filter(s => s.range)
  const deals = plural(n, 'deal')
  if (!valued.length) return `${deals}, none with enough inputs to value yet`
  const sum = fmtRange({ low: valued.reduce((a, s) => a + s.range.low, 0), high: valued.reduce((a, s) => a + s.range.high, 0) })
  return valued.length === n ? `${deals}, ${sum} in total` : `${deals}, ${sum} in total from the ${valued.length} that can be valued`
}

// ---- since you last looked
// `seen` is stored per account: { [userId]: ms }. A first visit looks back a week.
export function readSeen(storage, userId, now = Date.now()) {
  try {
    const all = JSON.parse(storage.getItem(SEEN_KEY) || '{}')
    const t = Number(all?.[userId])
    return Number.isFinite(t) && t > 0 ? t : now - WEEK
  } catch { return now - WEEK }
}

export function writeSeen(storage, userId, now = Date.now()) {
  try {
    let all = {}
    try { all = JSON.parse(storage.getItem(SEEN_KEY) || '{}') || {} } catch {}
    storage.setItem(SEEN_KEY, JSON.stringify({ ...all, [userId]: now }))
  } catch {}
}

const ms = t => (typeof t === 'number' ? t : Date.parse(t))

// What happened on each deal after `seen`: suggestions waiting for review, new
// files (pasted documents, and uploaded project files passed in as `files`
// rows { deal_id, name, created_at }), and agent changes to the case that were
// not undone. One item per deal and kind, newest first.
export function changesSince(deals, seen, files = [], max = MAX_FEED) {
  const items = []
  for (const deal of deals) {
    const base = { dealId: deal.id, dealName: deal.name }
    const sugg = (deal.fields || []).filter(f => !f.deleted && stateOf(f) === 'suggestion' && ms(f.source?.pinnedAt) > seen)
    if (sugg.length) items.push({ ...base, kind: 'suggestions', count: sugg.length, at: Math.max(...sugg.map(f => ms(f.source.pinnedAt))), text: `${plural(sugg.length, 'suggestion')} waiting for review` })

    const docs = [
      ...(deal.documents || []).filter(d => ms(d.addedAt) > seen).map(d => ({ name: d.name, at: ms(d.addedAt) })),
      ...files.filter(f => f.deal_id === deal.id && ms(f.created_at) > seen).map(f => ({ name: f.name, at: ms(f.created_at) }))
    ]
    if (docs.length) items.push({ ...base, kind: 'files', count: docs.length, at: Math.max(...docs.map(d => d.at)), text: docs.length === 1 ? `New file: ${docs[0].name || 'untitled'}` : `${docs.length} new files` })

    const log = Object.values(deal.agentLog || {}).filter(e => e && !e.undone && ms(e.at) > seen)
    const inputs = log.reduce((a, e) => a + (e.changes?.length || 0), 0)
    const artifacts = log.reduce((a, e) => a + (e.deckChanges?.length || 0), 0)
    if (inputs || artifacts) {
      const parts = [inputs && plural(inputs, 'input'), artifacts && `${artifacts === 1 ? 'one thing' : `${artifacts} things`} in the case artifacts`].filter(Boolean)
      items.push({ ...base, kind: 'agent', count: inputs + artifacts, at: Math.max(...log.map(e => ms(e.at))), text: `The agent changed ${parts.join(' and ')}` })
    }
  }
  return items.sort((a, b) => b.at - a.at).slice(0, max)
}

// ---- times: relative for the feed, 12-hour clock for "since"
export function ago(t, now = Date.now()) {
  const s = Math.max(0, Math.round((now - t) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  const d = Math.round(s / 86400)
  return d === 1 ? 'yesterday' : `${d} days ago`
}

export function sinceLabel(t, now = Date.now()) {
  const d = new Date(t)
  const n = new Date(now)
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s+/g, ' ')
  const day = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((day(n) - day(d)) / 86400000)
  if (days === 0) return `${time} today`
  if (days === 1) return `yesterday at ${time}`
  const date = d.toLocaleDateString('en-US', d.getFullYear() === n.getFullYear() ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' })
  return `${date} at ${time}`
}
