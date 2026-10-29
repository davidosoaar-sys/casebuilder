import { apiHeaders } from './apiAuth.js'
import { NUMERIC_INPUTS } from './model.js'
import { AGENT_COMMANDS } from './agentCommands.js'
import { PAIRS, fmtDec, fmtMoneyFull } from './valueModel.js'
import { CONNECTORS, enabledLabels } from './connectors.js'
import { isBlank, withSuggestion, withGap } from './source.js'

// The suggestion engine. It proposes values for EMPTY inputs, nothing else. It never
// computes a figure: whatever it returns is written into an input, and the
// deterministic model does all the arithmetic.
//
// Where a suggestion can come from, best first:
//   1  a figure stated in material Chris allowed the agent to read (a call, a CRM
//      export, a thread)                                           -> an input, origin is the quote
//   2  a checkable public source the agent found (headcount, roles) -> an input, origin is the link
//   3  an industry benchmark the agent found                        -> a suggestion, origin names the publication
//   4  derived from another input                                   -> a suggestion, origin states the rule
//
// The agent can always search the public web. It can only read the connections Chris
// has switched on; one that is off is never read and never named as an origin, and
// when that leaves a gap, the field says so.

export const RANK = { transcript: 1, public: 2, benchmark: 3, derived: 4 }

const WHAT = {
  claude: 'conversation notes',
  gong: 'call figures',
  hubspot: 'CRM records',
  slack: 'internal threads',
  clay: 'enrichment data',
  lemlist: 'outreach data',
  granola: 'meeting notes',
  sheets: 'finance figures',
  excel: 'finance figures',
  figma: 'design notes',
  canva: 'design material',
  fireflies: 'meeting transcripts',
  googledrive: 'documents'
}

const WHOLE = new Set(['newHiresPerYear', 'incidentsPerMonth', 'peoplePerIncident', 'peoplePerAudit', 'auditsPerYear', 'toolSpendToday', 'toolSpendPortal', 'portalCost', 'selfHostSalary', 'engineers'])
const tidy = (key, v) => (WHOLE.has(key) ? Math.round(v) : Math.round(v * 100) / 100)

export const valuesOf = fields => Object.fromEntries(fields.filter(f => NUMERIC_INPUTS.includes(f.key)).map(f => [f.key, f.value]))

// ------------------------------------------------------------ 4: derived from other inputs

export function derivedSuggestions({ model, keys }) {
  const out = {}
  const I = model.inputs
  const blank = new Set(model.blankInputs)
  const F = model.figures
  if (keys.includes('selfHostEngineers') && !F.maintHoursSaved.incomplete && I.hoursPerYear > 0 && F.maintHoursSaved.value > 0) {
    const v = Math.round((F.maintHoursSaved.value / I.hoursPerYear) * 10) / 10
    out.selfHostEngineers = {
      value: v,
      state: 'suggestion',
      kind: 'derived',
      confidence: 'medium',
      origin: `Rule: the upkeep Portal removes (${fmtDec(F.maintHoursSaved.value, 0)} hours a year) ÷ ${fmtDec(I.hoursPerYear, 0)} hours per engineer-year, since self-hosting needs that same effort`
    }
  }
  if (keys.includes('hourlyCost') && !blank.has('selfHostSalary') && I.hoursPerYear > 0 && I.selfHostSalary > 0) {
    out.hourlyCost = {
      value: tidy('hourlyCost', I.selfHostSalary / I.hoursPerYear),
      state: 'suggestion',
      kind: 'derived',
      confidence: 'medium',
      origin: `Rule: self-host engineer cost ${fmtMoneyFull(I.selfHostSalary)} ÷ ${fmtDec(I.hoursPerYear, 0)} hours a year`
    }
  }
  if (keys.includes('selfHostSalary') && !blank.has('hourlyCost') && I.hourlyCost > 0) {
    out.selfHostSalary = {
      value: tidy('selfHostSalary', I.hourlyCost * I.hoursPerYear),
      state: 'suggestion',
      kind: 'derived',
      confidence: 'medium',
      origin: `Rule: cost per engineer hour ${fmtMoneyFull(I.hourlyCost)} × ${fmtDec(I.hoursPerYear, 0)} hours a year`
    }
  }
  return out
}

// ----------------------------------------------------------------------- the notes

const list = a => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a[0])

// Why a field looks thin or empty, said as a setting rather than as a weakness. Every
// connection could have supplied a figure stated in the material, so when the field
// was filled from anything lower (or not at all) the ones that are off are named.
function notesFor({ connectors, documents, agentState, beatenBy }) {
  const notes = []
  const relevant = beatenBy > RANK.transcript ? CONNECTORS : []
  const off = relevant.filter(c => !connectors[c.key])
  // one sentence for everything that is switched off, so a gap reads as a setting
  // With eleven connectors, naming every one in every gap is noise: when all are off, say so once.
  if (off.length && off.length === relevant.length) notes.push('Every connection is off, so no uploaded material was used.')
  else if (off.length === 1) notes.push(`${off[0].label} is disabled, so no ${WHAT[off[0].key]} were used.`)
  else if (off.length > 1) notes.push(`${list(off.map(c => c.label))} are disabled, so no ${list([...new Set(off.map(c => WHAT[c.key]))])} were used.`)
  for (const c of relevant.filter(c => connectors[c.key])) {
    if (!documents.some(d => d.source === c.key)) notes.push(`${c.label} is allowed but nothing has been uploaded.`)
  }
  if (agentState === 'unavailable') notes.push('The agent is unavailable, so uploaded material and the public web were not read.')
  return notes
}

// ------------------------------------------------------------------ the orchestrator

// agent: async ({ company, filled, documents, web, only }) => { suggestions: [...] }
//   given only the connections that are allowed; it can always search the web itself.
export async function suggestValues({ company, fields, keys, connectors, documents = [], model, agent }) {
  const values = valuesOf(fields)
  const want = keys.filter(k => fields.some(f => f.key === k && !f.deleted && NUMERIC_INPUTS.includes(k) && isBlank(f.value)))
  if (!want.length) return { suggestions: {}, gaps: {}, enabled: enabledLabels(connectors), agent: 'ok' }
  const candidates = {} // key -> [suggestion]
  const add = (key, s) => (candidates[key] || (candidates[key] = [])).push(s)

  // 1, 2 and 3: the agent reads only the connections that are allowed
  const docs = documents.filter(d => connectors[d.source])
  let agentState = 'ok'
  if (agent) {
    try {
      const filled = Object.fromEntries(Object.entries(values).filter(([, v]) => !isBlank(v)))
      const res = await agent({ company, filled, documents: docs, web: true, only: want })
      for (const s of res.suggestions || []) if (want.includes(s.key)) add(s.key, s)
    } catch {
      agentState = 'unavailable'
    }
  } else agentState = 'unavailable'

  // 4
  for (const [k, s] of Object.entries(derivedSuggestions({ model, keys: want }))) add(k, s)

  // best source wins
  const chosen = {}
  for (const key of want) {
    const best = (candidates[key] || []).sort((a, b) => RANK[a.kind] - RANK[b.kind])[0]
    if (best) chosen[key] = best
  }

  // a with-Portal figure above its "today" would be a negative saving: drop it
  const dropped = {}
  for (const p of PAIRS) {
    const val = k => (chosen[k] ? chosen[k].value : isBlank(values[k]) ? null : Number(values[k]))
    const t = val(p.today)
    const q = val(p.portal)
    if (t != null && q != null && q > t) {
      const victim = chosen[p.portal] ? p.portal : chosen[p.today] ? p.today : null
      if (victim) {
        delete chosen[victim]
        dropped[victim] = 'A suggestion was dropped because "with Portal" would have been higher than "today".'
      }
    }
  }

  const suggestions = {}
  const gaps = {}
  for (const key of want) {
    const s = chosen[key]
    const notes = notesFor({ connectors, documents, agentState, beatenBy: s ? RANK[s.kind] : 99 })
    if (dropped[key]) notes.unshift(dropped[key])
    if (s) suggestions[key] = { ...s, notes }
    else gaps[key] = notes
  }
  return { suggestions, gaps, enabled: enabledLabels(connectors), agent: agentState }
}

// Write a result into the fields. Only the keys asked for; each is pinned with its
// origin, the time and which connections were on, and is never regenerated by itself.
export function applySuggestions(fields, result, { keys, now }) {
  const ctx = { now, enabled: result.enabled }
  return fields.map(f => {
    if (f.deleted || !keys.includes(f.key) || !isBlank(f.value)) return f
    const s = result.suggestions[f.key]
    if (s) return withSuggestion(f, s, ctx)
    const notes = result.gaps[f.key]
    return notes ? withGap(f, notes, ctx) : f
  })
}

// The fields a "Suggest values" for everything should fill: the empty ones.
export const emptyKeys = fields => fields.filter(f => !f.deleted && NUMERIC_INPUTS.includes(f.key) && isBlank(f.value)).map(f => f.key)

// ------------------------------------------------------------------ the server call

export async function fetchAgent(payload, { code, signal, fetchImpl = fetch } = {}) {
  const res = await fetchImpl('/api/suggest', {
    method: 'POST',
    signal,
    headers: await apiHeaders(code ? { 'x-access-code': code } : {}),
    body: JSON.stringify({...payload,command:AGENT_COMMANDS.SUGGEST_INPUTS})
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || 'The agent is unavailable.'), { status: res.status })
  return data
}
