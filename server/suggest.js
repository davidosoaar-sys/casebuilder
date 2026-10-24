import Anthropic from '@anthropic-ai/sdk'

// The only place a model touches the numbers, and it only ever proposes starting
// values for inputs. Nothing returned here is a figure: the client writes these
// into unconfirmed inputs as assumptions and the deterministic model does the
// arithmetic. Every value is validated and clamped before it leaves the server.

const MODEL = process.env.RESEARCH_MODEL || 'claude-opus-5-5'

// key -> [min, max]. Only these inputs can be suggested.
export const SUGGESTIBLE = {
  platformShare: [5, 60],
  hourlyCost: [40, 300],
  searchHoursToday: [0.5, 10],
  searchHoursPortal: [0, 10],
  rampDaysToday: [3, 90],
  rampDaysPortal: [1, 90],
  newHiresPerYear: [0, 5000],
  incidentHoursToday: [0.5, 24],
  incidentHoursPortal: [0.25, 24],
  peoplePerIncident: [1, 30],
  incidentsPerMonth: [0, 200],
  maintPctToday: [0, 100],
  maintPctPortal: [0, 100],
  toolSpendToday: [0, 20_000_000],
  toolSpendPortal: [0, 20_000_000],
  portalCost: [20_000, 5_000_000],
  selfHostEngineers: [2, 5],
  selfHostSalary: [80_000, 500_000]
}

const SYSTEM = `You propose conservative STARTING VALUES for a business case about Spotify Portal for Backstage (a developer portal). A salesperson will review every number and confirm it with the customer, so these are assumptions, not claims.

Given a company name and its engineer count, reply with a single JSON object of numbers keyed by exactly these names, and nothing else:
${Object.keys(SUGGESTIBLE).join(', ')}

Guidance: platformShare is the percent of engineering that is platform or DevEx (about 30 is typical). hourlyCost is a fully loaded cost per engineer hour in USD for the company's likely location. For each today/Portal pair, the Portal value must be less than or equal to the today value, and the improvement should be modest and defensible. selfHostEngineers is between 2 and 5. Scale newHiresPerYear, incidentsPerMonth, toolSpendToday and portalCost to the company's size. Never return text outside the JSON.`

export function sanitizeSuggestions(raw, only) {
  const out = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [key, [lo, hi]] of Object.entries(SUGGESTIBLE)) {
    if (only && !only.includes(key)) continue
    const v = Number(raw[key])
    if (raw[key] == null || raw[key] === '' || !Number.isFinite(v)) continue
    out[key] = Math.round(Math.min(hi, Math.max(lo, v)) * 100) / 100
  }
  // a Portal value above its "today" would be a negative saving
  for (const [today, portal] of [
    ['searchHoursToday', 'searchHoursPortal'],
    ['rampDaysToday', 'rampDaysPortal'],
    ['incidentHoursToday', 'incidentHoursPortal'],
    ['maintPctToday', 'maintPctPortal'],
    ['toolSpendToday', 'toolSpendPortal']
  ]) {
    if (portal in out && today in out && out[portal] > out[today]) out[portal] = out[today]
  }
  return out
}

export async function suggest({ company, engineers, only }, client = new Anthropic()) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: SYSTEM,
    messages: [{ role: 'user', content: `Company: ${company}\nEngineers: ${engineers}\n\nPropose starting values.` }]
  })
  const text = message.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
  const match = text.match(/\{[\s\S]*\}/)
  let parsed = null
  try {
    parsed = match ? JSON.parse(match[0]) : null
  } catch {
    parsed = null
  }
  return { values: sanitizeSuggestions(parsed, only) }
}
