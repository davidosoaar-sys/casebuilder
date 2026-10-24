// Where a number came from. Pure helpers around the `source` object every input
// carries:
//
//   source: {
//     state:  'empty' | 'input' | 'assumption' | 'suggestion'
//     origin: string          where it came from, shown to Chris on the field
//     quote?: string          the exact words, if pulled from a transcript
//     link?:  string          the URL, if pulled from a public source
//     pinnedAt?: string       when a suggestion was generated (ISO time)
//     confidence?: 'high' | 'medium' | 'low'
//     enabled?: string[]      the connectors that were on when it was generated
//     notes?: string[]        why a gap or a thin suggestion looks the way it does
//   }
//
//   input       a verified fact: the customer said it, or a checkable public source
//   assumption  Chris's own read, unverified
//   suggestion  the tool proposed it
//
// Only `input` counts toward confidence. None of this is ever shown on the deck.

export const STATES = ['empty', 'input', 'assumption', 'suggestion']

export const ORIGIN = {
  input: 'Confirmed by the customer',
  assumption: 'Your own read',
  edited: 'Your own number (edited from a suggestion)',
  calendar: 'Calendar constant'
}

export const isBlank = v => v === '' || v == null

export const emptySource = () => ({ state: 'empty', origin: '' })

// The state of a field as Chris sees it. A blank value is always 'empty'.
export function stateOf(field) {
  if (isBlank(field.value)) return 'empty'
  const s = field.source && field.source.state
  return s === 'input' || s === 'suggestion' || s === 'assumption' ? s : 'assumption'
}

// Chris typed a value. The moment a suggestion is edited it becomes his number.
export function withValue(field, value) {
  if (isBlank(value)) return { ...field, value: '', source: emptySource() }
  const was = stateOf(field)
  if (was === 'suggestion') return { ...field, value, source: { state: 'assumption', origin: ORIGIN.edited } }
  if (was === 'empty') return { ...field, value, source: { state: 'assumption', origin: ORIGIN.assumption } }
  return { ...field, value } // an input or assumption keeps its source
}

// Chris marks a number as verified (or takes that back).
export function withState(field, state) {
  if (isBlank(field.value) || (state !== 'input' && state !== 'assumption')) return field
  const origin = field.source && field.source.origin
  const generic = !origin || origin === ORIGIN.input || origin === ORIGIN.assumption || origin === ORIGIN.edited
  return {
    ...field,
    source: {
      ...field.source,
      state,
      origin: generic ? (state === 'input' ? ORIGIN.input : ORIGIN.assumption) : origin
    }
  }
}

export function withOrigin(field, origin) {
  if (isBlank(field.value)) return field
  return { ...field, source: { ...field.source, origin: String(origin ?? '') } }
}

// A value the tool proposed (or, for a call figure, extracted), pinned with its
// origin and a timestamp. `ctx` = { now, enabled }.
export function withSuggestion(field, s, ctx) {
  return {
    ...field,
    value: s.value,
    source: {
      state: s.state === 'input' ? 'input' : 'suggestion',
      origin: s.origin,
      ...(s.quote ? { quote: s.quote } : {}),
      ...(s.link ? { link: s.link } : {}),
      ...(s.range ? { range: s.range } : {}),
      confidence: s.confidence || 'low',
      pinnedAt: ctx.now,
      enabled: ctx.enabled,
      ...(s.notes && s.notes.length ? { notes: s.notes } : {})
    }
  }
}

// Nothing could be suggested. The field stays empty and says why.
export function withGap(field, notes, ctx) {
  return { ...field, value: '', source: { state: 'empty', origin: '', notes, pinnedAt: ctx.now, enabled: ctx.enabled } }
}

// Fields saved before sources existed carried `confirmed: true|false`.
export function sourceFromLegacy(value, confirmed) {
  if (isBlank(value)) return emptySource()
  return confirmed
    ? { state: 'input', origin: 'Confirmed by the customer (saved before sources were tracked)' }
    : { state: 'assumption', origin: 'Starting number from an earlier version' }
}

export function validSource(s) {
  return !!s && typeof s === 'object' && STATES.includes(s.state) && typeof (s.origin ?? '') === 'string'
}
