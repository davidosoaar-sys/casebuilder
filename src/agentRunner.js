import {verifyBrandForDisplay} from './verifyBrand.js'
// Runs the commands the chat agent asks for, through the SAME client code the
// buttons use (so the same server routes, the same key, the same evidence
// checks). Results are proposals: the chat shows them as cards and nothing
// touches the deal until the user picks.
import { AGENT_COMMANDS as C } from './agentCommands.js'
import { apiHeaders } from './apiAuth.js'
import { resolveStakeholder } from './deck/stakeholders.js'
import { suggestValues, fetchAgent } from './suggest.js'
import { searchPerson } from './personAgent.js'
import { sanitizePerson } from './personLookup.js'
import { CONNECTORS } from './connectors.js'
import { NUMERIC_INPUTS } from './model.js'
import { isBlank } from './source.js'
import { uid } from './projects.js'

const readCode = () => { try { return localStorage.getItem('casebuilder.access') || '' } catch { return '' } }

export const COMMAND_LABEL = {
  [C.FIND_STAKEHOLDERS]: 'Find people',
  [C.SUGGEST_INPUTS]: 'Suggest values',
  [C.LOOKUP_PERSON]: 'Person lookup',
  [C.DISCOVER_BRAND]: 'Find branding'
}

export function describeCommand(cmd, project) {
  if (cmd.command === C.FIND_STAKEHOLDERS) {
    if (cmd.role_key === 'all') return `Find people for every role at ${project.name}`
    const role = resolveStakeholder((project.stakeholders || []).find(s => s.key === cmd.role_key) || { key: cmd.role_key, builtin: true })
    return `Find the ${role?.role || cmd.role_key} at ${project.name}`
  }
  if (cmd.command === C.SUGGEST_INPUTS) return cmd.keys?.length ? `Suggest values for ${cmd.keys.length} input${cmd.keys.length === 1 ? '' : 's'}` : 'Suggest values for every blank input'
  if (cmd.command === C.LOOKUP_PERSON) return `Look up ${cmd.name || cmd.linkedin || cmd.email}`
  if (cmd.command === C.DISCOVER_BRAND) return `Find ${project.name}'s logo, colours and fonts`
  return cmd.command
}

async function post(path, body) {
  const code = readCode()
  const res = await fetch(path, { method: 'POST', headers: await apiHeaders(code ? { 'x-access-code': code } : {}), body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.error === 'no_key' ? 'Add your Anthropic API key in Settings first.'
      : data.error === 'not_configured' ? 'The AI agent is not set up on this server.'
      : data.error === 'access_code' ? 'This needs the workspace access code.'
      : data.error || `The command failed (${res.status}).`
    throw new Error(msg)
  }
  return data
}

async function findPeople(cmd, project) {
  const roles = (project.stakeholders || []).filter(s => cmd.role_key === 'all' || s.key === cmd.role_key)
  const list = roles.length ? roles : [{ key: cmd.role_key, builtin: true }]
  const out = []
  for (const s of list) {
    const role = resolveStakeholder(s)
    if (!role) continue
    try {
      const data = await post('/api/research', { command: C.FIND_STAKEHOLDERS, company: project.name, role: role.role })
      out.push({ roleKey: s.key, role: role.role, people: (data.people || []).map(p => ({ ...p, id: uid(), found: true })), note: data.note || null })
    } catch (e) {
      out.push({ roleKey: s.key, role: role.role, people: [], error: e.message })
    }
  }
  return { kind: 'people', groups: out }
}

async function suggestInputs(cmd, project, ctx) {
  const blank = project.fields.filter(f => !f.deleted && NUMERIC_INPUTS.includes(f.key) && isBlank(f.value)).map(f => f.key)
  const keys = (cmd.keys?.length ? cmd.keys.filter(k => blank.includes(k)) : blank)
  if (!keys.length) return { kind: 'values', suggestions: [], gaps: [], note: 'Every input already has a value.' }
  const labels = Object.fromEntries(project.fields.map(f => [f.key, `${f.label}${f.unit ? ` (${f.unit})` : ''}`]))
  const result = await suggestValues({
    company: project.name, fields: project.fields, keys, connectors: ctx.connections || {}, documents: project.documents || [], model: ctx.model,
    agent: payload => fetchAgent({ ...payload, labels }, { code: readCode() })
  })
  const label = k => project.fields.find(f => f.key === k)?.label || k
  return {
    kind: 'values',
    enabled: result.enabled,
    agent: result.agent,
    suggestions: Object.entries(result.suggestions).map(([key, s]) => ({ key, label: label(key), unit: project.fields.find(f => f.key === key)?.unit || '', ...s })),
    gaps: Object.keys(result.gaps).map(key => ({ key, label: label(key), notes: result.gaps[key] }))
  }
}

async function lookupPerson(cmd, project, ctx) {
  const enabledSources = ['web', ...CONNECTORS.filter(c => ctx.connections?.[c.key]).map(c => c.key)]
  const documents = (project.documents || []).filter(d => enabledSources.includes(d.source))
  const dealContext = Object.fromEntries(project.fields.filter(f => ['archetype', 'strategicPriority'].includes(f.key)).map(f => [f.key, f.value]))
  let last = null
  const request = { name: cmd.name || '', company: cmd.company || project.name || '', ...(cmd.linkedin ? { linkedinUrl: cmd.linkedin } : {}), ...(cmd.email ? { email: cmd.email } : {}) }
  for await (const update of searchPerson({ ...request, enabledSources, documents, dealContext }, { signal: AbortSignal.timeout(90000) })) last = update
  const person = last ? sanitizePerson(last, enabledSources) : null
  return { kind: 'person', person }
}

async function discoverBrand(cmd, project) {
  const website = cmd.website && !/^https:\/\//i.test(cmd.website) ? `https://${cmd.website}` : cmd.website
  const brand = await post('/api/brand', { command: C.DISCOVER_BRAND, company: project.name, website })
  return { kind: 'brand', brand: await verifyBrandForDisplay(brand) }
}

export async function runCommand(cmd, project, ctx = {}) {
  if (cmd.command === C.FIND_STAKEHOLDERS) return findPeople(cmd, project)
  if (cmd.command === C.SUGGEST_INPUTS) return suggestInputs(cmd, project, ctx)
  if (cmd.command === C.LOOKUP_PERSON) return lookupPerson(cmd, project, ctx)
  if (cmd.command === C.DISCOVER_BRAND) return discoverBrand(cmd, project)
  throw new Error(`Unknown command ${cmd.command}`)
}
