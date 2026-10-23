import { buildEnv, resolveBlock } from '../deck/model.js'
import { STAKEHOLDERS } from '../valueModel.js'
import { NO_ONE } from '../deck/stakeholders.js'

// Turn a project into the plain data the one-pager and website builders take.
// Used by the app's Export menu and by the plugin's command line, so both make
// exactly the same files.

export const pickAudience = (stakeholders, key) => stakeholders.find(s => s.key === key) || stakeholders[0] || NO_ONE

export function prepareOnePager({ inputs, fields, who, date }) {
  const env = buildEnv(inputs, fields, who)
  const block = type => resolveBlock({ type }, env)
  const room = block('room')
  const asm = block('assumptions')
  const drivers = block('drivers')
  return {
    company: env.ctx.company,
    role: who.role,
    headline: env.ctx.headline,
    cares: who.cares,
    stats: block('stats').items,
    drivers: drivers.rows,
    total: drivers.total,
    versus: block('versus'),
    needs: room.needs,
    objection: room.objection,
    counter: room.counter,
    open: asm.items.slice(0, 8),
    openCount: asm.count,
    date: date || new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  }
}

// Sliders for the inputs that drive most of the value, where they exist.
const SLIDERS = [
  ['engineers', 'Engineers', '', 1],
  ['hourlyCost', 'Cost per engineer hour', '$', 5],
  ['hoursLostPerWeek', 'Hours lost per engineer per week', '', 0.5],
  ['captureRate', 'Share of that time Portal recovers', '%', 1],
  ['portalCost', 'Portal annual subscription', '$', 10000]
]

export function prepareWebsite({ company, deck, inputs, fields, stakeholders, who }) {
  const env = buildEnv(inputs, fields, who)
  const values = Object.fromEntries(fields.map(f => [f.key, f.value]))
  return {
    company,
    slides: deck,
    stakeholders: stakeholders.map(s => ({
      key: s.key,
      role: s.role,
      tag: s.tag || '',
      cares: s.cares || '',
      objection: s.objection || '',
      counter: s.counter || '',
      needsToSee: s.needsToSee || [],
      lead: s.lead || [],
      builtin: STAKEHOLDERS.some(b => b.key === s.key)
    })),
    activeKey: who.key,
    inputs: values,
    openFields: resolveBlock({ type: 'assumptions' }, env).items,
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
