import { emptySource } from './source.js'

// Keep a complete record for persistence, but remove the value from the model.
// A deliberate deletion is distinct from a partial or damaged storage write.
export const removeInput = (fields, key) => fields.map(f => f.key === key && !f.deleted ? { ...f, deleted: true, removedInput: { value: f.value, source: f.source }, value: '', source: emptySource() } : f)
export const restoreInput = (fields, key) => fields.map(f => {
  if (f.key !== key || !f.deleted) return f
  const { deleted, removedInput, ...rest } = f
  return { ...rest, value: removedInput?.value ?? '', source: removedInput?.source || emptySource() }
})
export const editInput = (fields, key, patch) => fields.map(f => f.key === key ? { ...f, label: String(patch.label || '').trim() || f.label, unit: String(patch.unit || '').trim(), help: String(patch.help || '').trim() } : f)
