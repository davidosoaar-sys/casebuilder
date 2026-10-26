// The agent changes a deal: check every edit again (never trust the worker
// blindly), apply it straight away, and keep what it replaced so it can be
// undone. Pure functions; the chat panel and App wire them up.
//
// An agent edit is never "known": a figure the user stated in chat becomes an
// assumption ("You said it in chat"), anything else becomes a suggestion with
// the agent's reason as its origin, until Chris confirms it on the input sheet.
import { isBlank, stateOf } from './source.js'

export const AGENT_SELECTS = ['archetype', 'strategicPriority']

export function isAgentEditable(field) {
  if (!field || field.structural || field.custom || field.deleted) return false
  if (field.type === 'number' || field.type === 'percent') return true
  return field.type === 'select' && AGENT_SELECTS.includes(field.key)
}

// Validate one edit against the current field. Returns the clean value, or
// { error } explaining why it was refused.
export function checkEdit(field, edit) {
  if (!field) return { error: `There is no field called "${edit?.key}".` }
  if (!isAgentEditable(field)) return { error: `${field.label || field.key} cannot be changed by the agent.` }
  const v = edit.value
  if (field.type === 'select') {
    return (field.options || []).includes(v) ? { value: v } : { error: `${field.label}: "${v}" is not one of the options.` }
  }
  const n = typeof v === 'string' ? Number(v.replace(/[,$%\s]/g, '')) : v
  if (typeof n !== 'number' || !Number.isFinite(n)) return { error: `${field.label}: "${v}" is not a number.` }
  if (n < 0 || (field.type === 'percent' && n > 100)) return { error: `${field.label}: ${n} is out of range.` }
  return { value: n }
}

const sourceFor = (edit, at) => edit.from_user
  ? { state: 'assumption', origin: 'You said it in chat', agent: { at, reason: edit.reason || '' } }
  : { state: 'suggestion', origin: edit.reason ? `Agent: ${edit.reason}` : 'Suggested by the agent in chat', confidence: 'low', pinnedAt: at, agent: { at, reason: edit.reason || '' } }

// Apply a list of edits to fields. Returns the new fields, a change record per
// applied edit (with what it replaced, for undo), and the refused ones.
export function applyAgentEdits(fields, edits, { now = new Date().toISOString() } = {}) {
  const byKey = new Map(fields.map(f => [f.key, f]))
  const changes = []
  const refused = []
  const next = new Map()
  for (const edit of Array.isArray(edits) ? edits : []) {
    const field = next.get(edit?.key) || byKey.get(edit?.key)
    const ok = checkEdit(field, edit || {})
    if (ok.error) { refused.push(ok.error); continue }
    if (field.value === ok.value && stateOf(field) !== 'empty') continue // nothing to change
    changes.push({
      key: field.key,
      label: field.label,
      unit: field.unit || (field.type === 'percent' ? '%' : ''),
      before: { value: field.value, source: field.source },
      after: { value: ok.value, source: sourceFor(edit, now) },
      reason: edit.reason || ''
    })
    next.set(field.key, { ...field, value: ok.value, source: sourceFor(edit, now) })
  }
  return { fields: fields.map(f => next.get(f.key) || f), changes, refused }
}

// Undo a set of changes. A field is only put back if it still holds what the
// agent wrote; if Chris has edited it since, his number wins and it is skipped.
// With { force: true } (he chose "Undo anyway") it is put back regardless.
export const editedSince = (f, c) => f.value !== c.after.value || (f.source?.state ?? '') !== c.after.source.state
export function undoAgentEdits(fields, changes, { force = false } = {}) {
  const byKey = new Map(changes.map(c => [c.key, c]))
  const skipped = []
  let restored = 0
  const out = fields.map(f => {
    const c = byKey.get(f.key)
    if (!c) return f
    if (!force && editedSince(f, c)) { skipped.push(c.label || c.key); return f }
    restored++
    return { ...f, value: c.before.value, source: c.before.source }
  })
  return { fields: out, restored, skipped }
}

// Redo: write the agent's values again (the user asked for it, so always).
export function redoAgentEdits(fields, changes) {
  const byKey = new Map(changes.map(c => [c.key, c]))
  return fields.map(f => (byKey.has(f.key) ? { ...f, value: byKey.get(f.key).after.value, source: byKey.get(f.key).after.source } : f))
}

export function describeValue(v, unit) {
  if (isBlank(v)) return 'blank'
  if (typeof v !== 'number') return String(v)
  const s = v.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (unit === '$/yr' || unit === '$/hr') return `$${s}${unit === '$/hr' ? '/hr' : '/yr'}`
  if (unit === '%') return `${s}%`
  return unit ? `${s} ${unit}` : s
}
