// Untrusted agent findings become view data here, before any claim is rendered.
import { CONNECTORS } from './connectors.js'
import { INPUT_FIELDS, STAKEHOLDERS } from './valueModel.js'
import { uid } from './uid.js'

const publicTypes = new Set(['web', 'linkedin', 'github', 'blog', 'conference', 'podcast', 'earnings', 'public'])
const connectorDomains = { claude: ['claude.ai'], gong: ['gong.io', 'gong.com'], hubspot: ['hubspot.com', 'hubspot.net'], slack: ['slack.com'], clay: ['clay.com'], lemlist: ['lemlist.com'] }
export function sourceFor(item, enabledSources = []) {
  if (!item || typeof item.sourceUrl !== 'string') return null
  try {
    const url = new URL(item.sourceUrl)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null
    let type = String(item.sourceType || 'web').toLowerCase()
    const hosted = Object.entries(connectorDomains).find(([, domains]) => domains.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`)))
    if (hosted) type = hosted[0]
    if (!publicTypes.has(type) && !enabledSources.includes(type)) return null
    if (publicTypes.has(type) && !enabledSources.includes('web')) return null
    return { sourceUrl: url.href, sourceType: type }
  } catch { return null }
}
const text = v => typeof v === 'string' ? v.trim().slice(0, 6000) : ''
export function sourcedClaim(item, enabledSources) {
  const source = sourceFor(item, enabledSources)
  const value = text(item?.value ?? item?.claim)
  return source && value ? { value, ...source } : null
}

// Inference is deliberately explicit. Unfamiliar titles still get a framing.
export function matchPersonRole(title) {
  const t = String(title || '').toLowerCase()
  let key = 'champion', confidence = 'low', why = 'The title does not match a known role. Engineering leadership is the nearest working framing; confirm it with this person.'
  if (/security|compliance|ciso|risk|audit/.test(t)) { key = 'security'; confidence = 'high'; why = 'The title names security, risk or compliance responsibilities.' }
  else if (/finance|financial|procurement|purchasing|cfo/.test(t)) { key = 'finance'; confidence = 'high'; why = 'The title names finance or purchasing responsibilities.' }
  else if (/\bcto\b|chief technology|chief technical/.test(t)) { key = 'cto'; confidence = 'high'; why = 'The title identifies technology leadership.' }
  else if (/engineering|engineer|platform|devex|developer experience|infrastructure|\bsre\b/.test(t)) { confidence = /director|head|\bvp\b|vice president/.test(t) ? 'high' : 'medium'; why = 'The title indicates engineering or platform work; the engineering-leadership framing is inferred, not confirmed.' }
  else if (/chief|president|executive/.test(t)) { key = 'cto'; why = 'An executive title is closest to the CTO framing, but the responsibilities are unclear. This is a low-confidence guess.' }
  const role = STAKEHOLDERS.find(s => s.key === key).role
  return { key, role, confidence, why }
}

export function sanitizePerson(raw = {}, enabledSources = ['web']) {
  const out = {}
  for (const key of ['name', 'title', 'company', 'tenure', 'reportsTo', 'likelyCares']) out[key] = sourcedClaim(raw[key], enabledSources)
  out.reports = (Array.isArray(raw.reports) ? raw.reports : []).map(x => sourcedClaim(x, enabledSources)).filter(Boolean)
  out.publicSignals = (Array.isArray(raw.publicSignals) ? raw.publicSignals : []).map(x => sourcedClaim(x, enabledSources)).filter(c => c && publicTypes.has(c.sourceType))
  // A title is required as evidence for an inferred role. Do not display an
  // agent's unsupported explanation or high confidence for an unfamiliar title.
  out.roleMatch = out.title ? { ...matchPersonRole(out.title.value), sourceUrl: out.title.sourceUrl, sourceType: out.title.sourceType } : null
  out.sourcesUsed = [...new Set([out.name, out.title, out.company, out.tenure, out.reportsTo, out.likelyCares, ...out.reports, ...out.publicSignals].filter(Boolean).map(x => publicTypes.has(x.sourceType) ? 'web' : x.sourceType))]
  const skipped = Array.isArray(raw.sourcesSkipped) ? raw.sourcesSkipped : []
  out.sourcesSkipped = CONNECTORS.map(c => {
    const reason = skipped.find(x => (x.source || x.key) === c.key)?.reason
    return { source: c.key, label: c.label, reason: !enabledSources.includes(c.key) ? 'disabled' : reason === 'enabled_no_linked_material' ? 'no linked material was supplied' : reason === 'enabled_no_material' ? 'no material was supplied' : 'no sourced context was found' }
  }).filter(s => s.reason === 'disabled' || !out.sourcesUsed.includes(s.source))
  out.suggestedInputs = (Array.isArray(raw.suggestedInputs) ? raw.suggestedInputs : []).flatMap(item => {
    const field = INPUT_FIELDS.find(f => f.key === item.key && ['number', 'percent'].includes(f.type) && !f.structural)
    const source = sourceFor(item, enabledSources)
    return field && source && typeof item.value === 'number' && Number.isFinite(item.value) && item.value >= 0 && (field.type !== 'percent' || item.value <= 100)
      ? [{ key: item.key, label: field.label, value: item.value, ...source }] : []
  })
  out.candidates = (Array.isArray(raw.candidates) ? raw.candidates : []).map(c => {
    const candidate = {}
    for (const key of ['name', 'title', 'company']) candidate[key] = sourcedClaim(c[key], enabledSources)
    return candidate
  }).filter(c => c.name)
  return out
}

export function parsePersonList(value, company = '') {
  return String(value).split(/[\n;]+/).map(line => line.trim()).filter(Boolean).slice(0, 20).map(line => {
    const email = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]
    if (email) return { name: line.replace(email, '').replace(/[<>"(),]/g, '').trim(), email, ...(company ? { company } : {}) }
    if (/^https?:\/\/(www\.)?linkedin\.com\/in\//i.test(line)) return { name: '', linkedinUrl: line, ...(company ? { company } : {}) }
    const [name, ...rest] = line.split(/\s+(?:at|@)\s+|,\s*/i)
    const employer = rest.join(', ').trim() || company
    return { name: name.trim(), ...(employer ? { company: employer } : {}) }
  })
}

export function addPersonToDeal(deal, person, now = Date.now()) {
  if (!deal || !person.name || !person.title || !person.roleMatch || person.candidates?.length) return deal
  const match = person.roleMatch
  const id = person.name.value.toLowerCase() + '|' + (person.company?.value || '').toLowerCase()
  if ((deal.stakeholders || []).some(s => s.namedPeople?.some(p => p.lookupId === id))) return deal
  const existing = deal.stakeholders.find(s => s.key === match.key || s.mappedRoleKey === match.key)
  const key = existing?.key || match.key
  const named = { id: uid(), lookupId: id, name: person.name.value, title: person.title.value, company: person.company?.value || '', found: true, confidence: match.confidence, sources: [...new Set([person.name.sourceUrl, person.title.sourceUrl])], mapping: { ...match, state: 'inferred', origin: 'Inferred from title, not confirmed' }, brief: person }
  const stakeholder = existing || { key, builtin: true }
  const updated = { ...stakeholder, namedPeople: [...(stakeholder.namedPeople || []), named] }
  return { ...deal, updatedAt: now, stakeholders: existing ? deal.stakeholders.map(s => s.key === key ? updated : s) : [...deal.stakeholders, updated], people: { ...deal.people, [key]: [...(deal.people?.[key] || []), named] } }
}

export function acceptPersonInput(deal, suggestion, now = Date.now()) {
  if (!deal) return deal
  return { ...deal, updatedAt: now, fields: deal.fields.map(f => f.key === suggestion.key && !f.deleted ? { ...f, value: suggestion.value, source: { state: 'suggestion', origin: 'Person lookup — offered by the agent', link: suggestion.sourceUrl, pinnedAt: new Date(now).toISOString(), confidence: 'low' } } : f) }
}
