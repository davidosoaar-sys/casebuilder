import { INPUT_FIELDS, STAKEHOLDERS, OLD_INPUT_KEYS, migrateOldInputs } from './valueModel.js'
import { defaultFields, defaultStakeholders } from './projects.js'
import { defaultDeck, migrateDeck, TEXT_STYLES } from './deck/model.js'
import { uid } from './uid.js'

// The case file: a small, readable JSON file that holds one business case. The
// standalone app imports and exports it, and the Claude plugin reads and writes
// it, so a case can start in a conversation and finish in the app (or the other
// way round).
//
// {
//   "caseBuilder": 1,
//   "company": "Northwind Retail",
//   "inputs": { "engineers": { "value": 500, "confirmed": true }, ... },
//   "stakeholders": [ "champion", "cto", { "role": "Head of Data", ... } ],
//   "people": { "cto": [ { "name": "...", "title": "...", "sources": ["https://..."] } ] },
//   "deck": [ ...slides... ]        // optional; the standard deck when left out
// }

export const CASE_VERSION = 1

const BUILTIN_KEYS = STAKEHOLDERS.map(s => s.key)
const FIELD_BY_KEY = Object.fromEntries(INPUT_FIELDS.map(f => [f.key, f]))
const BLOCK_TYPES = [
  'text', 'quote', 'columns', 'image', 'stats', 'drivers', 'pairs', 'versus', 'assumptions', 'room', 'logo', 'divider', 'spacer'
]
const LINKEDIN = /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[^\s?#]+/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ------------------------------------------------------------ project -> file

export function projectToCaseFile(project) {
  const inputs = {}
  for (const f of project.fields) {
    inputs[f.key] = f.custom
      ? { label: f.label, type: f.type, unit: f.unit || '', value: f.value, confirmed: !!f.confirmed }
      : { value: f.value, confirmed: !!f.confirmed }
  }
  return {
    caseBuilder: CASE_VERSION,
    company: project.name,
    exportedAt: new Date().toISOString(),
    inputs,
    stakeholders: project.stakeholders.map(s => (s.builtin && !s.edit && !s.pos ? s.key : s)),
    people: project.people || {},
    deck: project.deck
  }
}

// ------------------------------------------------------------ file -> project

// Everything wrong with a case file, as readable messages. `errors` stop it
// loading; `warnings` are worth fixing but harmless.
export function checkCaseFile(file) {
  const errors = []
  const warnings = []
  const err = m => errors.push(m)
  const warn = m => warnings.push(m)

  if (!file || typeof file !== 'object' || Array.isArray(file)) return { errors: ['The file is not a JSON object.'], warnings }
  if (file.caseBuilder !== CASE_VERSION) err(`"caseBuilder" must be ${CASE_VERSION} (this is how the file is recognised).`)
  if (typeof file.company !== 'string' || !file.company.trim()) err('"company" must be the customer name.')

  const inputs = file.inputs ?? {}
  if (typeof inputs !== 'object' || Array.isArray(inputs)) err('"inputs" must be an object of { key: { value, confirmed } }.')
  else {
    for (const [key, v] of Object.entries(inputs)) {
      if (!v || typeof v !== 'object' || !('value' in v)) {
        err(`inputs.${key} must look like { "value": ..., "confirmed": true|false }.`)
        continue
      }
      const base = FIELD_BY_KEY[key]
      const old = OLD_INPUT_KEYS.has(key)
      const type = base ? base.type : old ? 'number' : v.type
      if (!base && !old && !['number', 'percent', 'text'].includes(v.type)) warn(`inputs.${key} is not a known input; give it "label" and "type" (number, percent or text) to keep it as a custom input.`)
      if (type === 'number' || type === 'percent') {
        if (typeof v.value !== 'number' || !Number.isFinite(v.value)) err(`inputs.${key}.value must be a number.`)
        else if (type === 'percent' && (v.value < 0 || v.value > 100)) err(`inputs.${key}.value is a percent, so it must be between 0 and 100.`)
        else if (v.value < 0) err(`inputs.${key}.value cannot be negative.`)
      }
      if (type === 'select' && base && !base.options.includes(v.value)) err(`inputs.${key}.value must be one of: ${base.options.join(', ')}.`)
      if ('confirmed' in v && typeof v.confirmed !== 'boolean') err(`inputs.${key}.confirmed must be true or false.`)
    }
  }

  if (file.stakeholders != null) {
    if (!Array.isArray(file.stakeholders)) err('"stakeholders" must be a list.')
    else {
      file.stakeholders.forEach((s, i) => {
        if (typeof s === 'string') {
          if (!BUILTIN_KEYS.includes(s)) err(`stakeholders[${i}] "${s}" is not a built-in stakeholder (${BUILTIN_KEYS.join(', ')}). For a new role, use an object with a "role".`)
        } else if (s && typeof s === 'object') {
          const builtin = BUILTIN_KEYS.includes(s.key)
          if (!builtin && (typeof s.role !== 'string' || !s.role.trim())) err(`stakeholders[${i}] needs a "role".`)
        } else err(`stakeholders[${i}] must be a key or an object.`)
      })
    }
  }

  const known = new Set([
    ...(Array.isArray(file.stakeholders) ? file.stakeholders.map(s => (typeof s === 'string' ? s : s?.key)).filter(Boolean) : BUILTIN_KEYS)
  ])
  if (file.people != null) {
    if (typeof file.people !== 'object' || Array.isArray(file.people)) err('"people" must be an object keyed by stakeholder.')
    else {
      for (const [key, list] of Object.entries(file.people)) {
        if (!Array.isArray(list)) {
          err(`people.${key} must be a list.`)
          continue
        }
        list.forEach((p, i) => {
          const at = `people.${key}[${i}]`
          if (!p || typeof p.name !== 'string' || !p.name.trim()) return err(`${at} needs a "name".`)
          if (p.linkedin && !LINKEDIN.test(p.linkedin)) err(`${at}.linkedin must be a linkedin.com/in/ profile URL.`)
          if (p.email && !EMAIL.test(p.email)) err(`${at}.email is not a valid address.`)
          const found = p.found !== false
          if (found && (!Array.isArray(p.sources) || !p.sources.some(u => /^https?:\/\//.test(u)))) warn(`${at} (${p.name}) has no source URL. Researched people should always cite where they were found.`)
        })
        if (!known.has(key)) warn(`people.${key} does not match any stakeholder in this case.`)
      }
    }
  }

  if (file.deck != null) {
    if (!Array.isArray(file.deck)) err('"deck" must be a list of slides.')
    else {
      const styles = TEXT_STYLES.map(([k]) => k)
      file.deck.forEach((s, i) => {
        if (!s || !Array.isArray(s.blocks)) {
          if (s && s.type) return // a pre-block slide: migrated on load
          return err(`deck[${i}] needs a "blocks" list.`)
        }
        s.blocks.forEach((b, j) => {
          if (!b || !BLOCK_TYPES.includes(b.type)) err(`deck[${i}].blocks[${j}] has an unknown type "${b?.type}". Use one of: ${BLOCK_TYPES.join(', ')}.`)
          else if (b.type === 'text' && !styles.includes(b.style)) err(`deck[${i}].blocks[${j}].style "${b.style}" is not a text style. Use one of: ${styles.join(', ')}.`)
        })
      })
    }
  }

  return { errors, warnings }
}

export function caseFileToProject(file, { id } = {}) {
  const { errors } = checkCaseFile(file)
  if (errors.length) {
    const e = new Error(`This case file has problems:\n- ${errors.join('\n- ')}`)
    e.problems = errors
    throw e
  }

  // inputs: start from the defaults, apply what the file says, keep custom ones
  const fields = defaultFields()
  const byKey = Object.fromEntries(fields.map(f => [f.key, f]))
  for (const [key, v] of Object.entries(file.inputs || {})) {
    const f = byKey[key]
    if (OLD_INPUT_KEYS.has(key)) continue
    if (f) {
      f.value = v.value
      if ('confirmed' in v) f.confirmed = v.confirmed
    } else {
      fields.push({
        key,
        label: v.label || key,
        type: ['number', 'percent', 'text'].includes(v.type) ? v.type : 'number',
        unit: v.unit || '',
        group: 'Custom',
        custom: true,
        value: v.value,
        confirmed: !!v.confirmed
      })
    }
  }
  // a case file written before the inputs became pairs: carry its numbers over
  const legacy = migrateOldInputs(file.inputs || {})
  for (const [key, v] of Object.entries(legacy)) {
    if (byKey[key] && !(file.inputs && key in file.inputs)) {
      byKey[key].value = v.value
      byKey[key].confirmed = v.confirmed
    }
  }
  // the company name field always follows the file's company unless set explicitly
  const company = byKey.companyName
  if (company && !(file.inputs && 'companyName' in file.inputs)) company.value = file.company

  const stakeholders = (file.stakeholders ?? null)
    ? file.stakeholders.map(s => {
        if (typeof s === 'string') return { key: s, builtin: true }
        if (BUILTIN_KEYS.includes(s.key)) return { ...s, builtin: true }
        return { tag: '', cares: '', objection: '-', counter: '-', needsToSee: [], ...s, key: s.key || `custom_${uid()}` }
      })
    : defaultStakeholders()

  const people = {}
  for (const [key, list] of Object.entries(file.people || {})) {
    people[key] = list.map(p => ({
      id: p.id || uid(),
      name: p.name.trim(),
      title: p.title || '',
      email: p.email || '',
      linkedin: p.linkedin || '',
      bio: p.bio || '',
      sources: Array.isArray(p.sources) ? p.sources : [],
      confidence: ['high', 'medium', 'low'].includes(p.confidence) ? p.confidence : 'low',
      found: p.found !== false
    }))
  }

  const deck = file.deck ? migrateDeck(withIds(file.deck)) : defaultDeck()

  return { id: id || uid(), name: file.company.trim(), updatedAt: Date.now(), fields, stakeholders, deck, people }
}

// Hand-written decks may leave out ids; the editor needs them.
function withIds(deck) {
  return deck.map(s =>
    Array.isArray(s.blocks)
      ? { variant: 'plain', ...s, id: s.id || uid(), blocks: s.blocks.map(b => ({ ...b, id: b.id || uid() })) }
      : s
  )
}
