// One undo history per project: every committed change to the parts the case
// artifacts are built from (deck, brand, fields, stakeholders) is a step with a
// short label. A step keeps only the parts that changed, before and after, so
// undo puts back exactly those parts and nothing else. Typing into the same
// block within a second is one step. Kept in memory for this session.
import { useCallback, useEffect, useRef, useState } from 'react'

export const TRACKED = ['deck', 'brand', 'fields', 'stakeholders']
export const LIMIT = 100
export const COALESCE_MS = 1000

export const emptyHistory = () => ({ past: [], future: [] })

// The tracked parts that differ (by reference) between two project states.
export function diffParts(prev, next) {
  const before = {}
  const after = {}
  let changed = false
  for (const k of TRACKED) {
    if (prev?.[k] !== next?.[k]) { before[k] = prev?.[k]; after[k] = next?.[k]; changed = true }
  }
  return changed ? { before, after } : null
}

let seq = 0
export const stepId = () => `h${Date.now().toString(36)}${(++seq).toString(36)}`

// Add a step. A step with the same `key` as the last one, within `coalesceMs`
// of it, is folded into it: the oldest "before" and the newest "after" win.
// A new step always clears redo.
export function pushStep(h, step, { now = Date.now(), limit = LIMIT, coalesceMs = COALESCE_MS } = {}) {
  const last = h.past[h.past.length - 1]
  if (last && step.key && last.key === step.key && now - last.at <= coalesceMs) {
    const merged = { ...last, before: { ...step.before, ...last.before }, after: { ...last.after, ...step.after }, at: now }
    return { past: [...h.past.slice(0, -1), merged], future: [] }
  }
  const entry = { id: step.id || stepId(), label: step.label || 'Edit', key: step.key || null, agent: step.agent || null, before: step.before, after: step.after, at: now }
  return { past: [...h.past, entry].slice(-limit), future: [] }
}

// Undo: returns the step to put back (apply step.before) and the new history.
export function undoStep(h) {
  const step = h.past[h.past.length - 1]
  if (!step) return { history: h, step: null }
  return { history: { past: h.past.slice(0, -1), future: [...h.future, step] }, step }
}

// Redo: returns the step to apply again (apply step.after).
export function redoStep(h) {
  const step = h.future[h.future.length - 1]
  if (!step) return { history: h, step: null }
  return { history: { past: [...h.past, step], future: h.future.slice(0, -1) }, step }
}

// Labels are written as actions ("Deleted page 3"); a tooltip reads
// "Undo: deleted page 3".
export const actionLabel = (verb, step) => (step ? `${verb}: ${step.label.charAt(0).toLowerCase()}${step.label.slice(1)}` : `Nothing to ${verb.toLowerCase()}`)

// The hook. App calls `record(opts)` just before a change it makes through
// update(); the next commit that changes a tracked part becomes one step with
// that label. Changes made without record() (a brand scan finishing, a reload)
// are not steps. `apply(parts, step, direction)` writes parts back; it is
// App's update(), called with { skip: true } so it is not recorded again.
export default function useHistory(project, apply) {
  const store = useRef(new Map())
  const last = useRef(null)
  const pending = useRef(null)
  const [, setTick] = useState(0)
  const bump = () => setTick(t => t + 1)
  const id = project?.id || null
  const get = k => store.current.get(k) || emptyHistory()

  useEffect(() => {
    const prev = last.current
    last.current = id ? { id, parts: Object.fromEntries(TRACKED.map(k => [k, project[k]])) } : null
    const opts = pending.current
    pending.current = null
    if (!id || !prev || prev.id !== id || !opts || opts.skip) return
    const d = diffParts(prev.parts, last.current.parts)
    if (!d) return
    store.current.set(id, pushStep(get(id), { ...d, id: opts.id, label: opts.label, key: opts.key, agent: opts.agent }))
    bump()
  }, [id, project]) // eslint-disable-line react-hooks/exhaustive-deps

  const record = useCallback(opts => { pending.current = opts || { label: 'Edit' } }, [])

  const applyRef = useRef(apply)
  applyRef.current = apply
  const undo = useCallback(() => {
    if (!id) return null
    const { history, step } = undoStep(get(id))
    if (!step) return null
    store.current.set(id, history)
    applyRef.current(step.before, step, 'undo')
    bump()
    return step
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  const redo = useCallback(() => {
    if (!id) return null
    const { history, step } = redoStep(get(id))
    if (!step) return null
    store.current.set(id, history)
    applyRef.current(step.after, step, 'redo')
    bump()
    return step
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // A toast's Undo: only while its step is still the latest one, and only on
  // the project the toast was made in. Switching projects makes it a no-op,
  // so a stale toast can never write one project's history into another.
  const undoIf = useCallback(stepId => {
    const top = id ? get(id).past.at(-1) : null
    return top && top.id === stepId ? undo() : null
  }, [id, undo]) // eslint-disable-line react-hooks/exhaustive-deps
  const undoIfRef = useRef(undoIf)
  undoIfRef.current = undoIf
  // For callbacks that outlive a render (toasts): checks the step against the
  // project open at click time.
  const latestUndoIf = useCallback(stepId => undoIfRef.current(stepId), [])

  const h = id ? get(id) : emptyHistory()
  const next = h.past[h.past.length - 1] || null
  const again = h.future[h.future.length - 1] || null
  return { record, undo, redo, undoIf: latestUndoIf, canUndo: !!next, canRedo: !!again, undoStep: next, redoStep: again, undoLabel: actionLabel('Undo', next), redoLabel: actionLabel('Redo', again) }
}
