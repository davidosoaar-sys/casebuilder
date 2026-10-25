import {clientStakeholder} from '../stakeholderRequirements.js'
import {contextStatement} from '../caseContext.js'
import { buildEnv, resolveBlock } from '../deck/model.js'
import { STAKEHOLDERS, INPUT_GROUPS, confidence, unconfirmed, completeness, fmtDec, fmtMoneyFull } from '../valueModel.js'
import { computeModel } from '../model.js'
import { stateOf, isBlank } from '../source.js'
import { enabledLabels } from '../connectors.js'
import { NO_ONE } from '../deck/stakeholders.js'

// Turn a project into the plain data the one-pager and website builders take.
// Used by the app's Export menu and by the plugin's command line, so both make
// exactly the same files.

export const pickAudience = (stakeholders, key) => stakeholders.find(s => s.key === key) || stakeholders[0] || NO_ONE

export function prepareOnePager({ inputs, fields, who, date }) {
  who=clientStakeholder(who)
  const env = buildEnv(inputs, fields, who)
  const block = type => resolveBlock({ type }, env)
  const room = block('room')
  const drivers = block('drivers')
  return {
    company: env.ctx.company,
    caseContext: contextStatement(inputs),
    role: who.role,
    archetype: inputs.archetype || '',
    priority: inputs.strategicPriority || '',
    headline: !env.model.figures.versusSelfHost.incomplete?env.ctx.decisionHeadline:!env.model.figures.totalValue.incomplete?env.ctx.valueHeadline:'',
    cares: who.cares,
    stats: block('stats').items,
    groups: drivers.groups,
    totalEq: drivers.totalEq,
    pairs: block('pairs').rows,
    total: drivers.total,
    versus: (v => (v.incomplete ? null : v))(block('versus')),
    needs: room.needs,
    requirements:who.requirements,
    objection: room.objection,
    counter: room.counter,
    date: date || new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  }
}

// Sliders for the inputs that drive most of the value, where they exist.
const SLIDERS = [
  ['engineers', 'Engineers', '', 1],
  ['hourlyCost', 'Cost per engineer hour', '$', 5],
  ['searchHoursToday', 'Search hours per engineer per week, today', '', 0.5],
  ['searchHoursPortal', 'Search hours per engineer per week, with Portal', '', 0.5],
  ['portalCost', 'Portal annual subscription', '$', 10000]
]

export function prepareWebsite({ company, deck, inputs, fields, stakeholders, who }) {
  const env = buildEnv(inputs, fields, who)
  const values = Object.fromEntries(fields.map(f => [f.key, f.value]))
  return {
    company,
    slides: deck,
    stakeholders: stakeholders.map(clientStakeholder).map(s => ({
      key: s.key,
      role: s.role,
        namedPeople: s.namedPeople || [],
        pos:s.pos,
      tag: s.tag || '',
      cares: s.cares || '',
      objection: s.objection || '',
      counter: s.counter || '',
      needsToSee: s.needsToSee || [],
      requirements:s.requirements||[],
      lead: s.lead || [],
      builtin: STAKEHOLDERS.some(b => b.key === s.key)
    })),
    activeKey: who.key,
    inputs: values,
    sliders: SLIDERS.filter(([k]) => typeof values[k] === 'number').map(([key, label, unit, step]) => ({
      key,
      label,
      unit,
      step,
      min: 0,
      max: unit === '%' ? 100 : Math.max(step * 10, Math.ceil((values[key] * 3) / step) * step)
    }))
  }
}

// ---------------------------------------------------------------- internal summary

const shown = f => {
  if (isBlank(f.value)) return ''
  if (f.type === 'percent') return `${f.value}%`
  if (f.unit === '$/yr' || f.unit === '$/hr') return `${fmtMoneyFull(f.value)}${f.unit === '$/hr' ? '/hr' : '/yr'}`
  return `${fmtDec(Number(f.value), 2)}${f.unit ? ` ${f.unit}` : ''}`
}

// CHRIS'S page, not the client's: every number, its state and its origin, which
// figures are still incomplete, and the questions to confirm. It is the question set
// he can send the customer before a trial. It is never part of the deck.
export function prepareInternal({ company, fields, inputs, connectors, date }) {
  const model = computeModel(inputs)
  const numeric = fields.filter(f => (f.type === 'number' || f.type === 'percent') && !f.structural)
  const row = f => {
    const s = f.source || {}
    return {
      label: f.label,
      value: shown(f),
      state: stateOf(f),
      origin: stateOf(f) === 'empty' ? (s.notes && s.notes.length ? s.notes.join(' ') : '') : s.origin || '',
      link: s.link || '',
      pinnedAt: s.pinnedAt || ''
    }
  }
  const groups = [...INPUT_GROUPS, 'Custom']
    .map(g => ({ group: g, rows: numeric.filter(f => (f.group || 'Custom') === g).map(row) }))
    .filter(g => g.rows.length)
  const done = completeness(model)
  return {
    company,
    date: date || new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
    confidence: confidence(fields),
    connections: enabledLabels(connectors),
    figuresDone: done.done,
    figuresTotal: done.total,
    waiting: done.waiting.map(w => ({ label: w.label, missing: w.missing.map(k => (fields.find(f => f.key === k) || {}).label || k) })),
    groups,
    questions: unconfirmed(fields).map(f => ({ label: f.label, value: shown(f), state: stateOf(f), origin: (f.source && f.source.origin) || '' }))
  }
}
