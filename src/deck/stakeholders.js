import { STAKEHOLDERS, fmtMoney } from '../valueModel.js'

// Stakeholders as stored are plain data. This turns one into everything the
// deck needs: built-ins take the model's definition, custom ones get a generic
// headline and lead drivers, and `edit` holds text the user overwrote.

export const NO_ONE = {
  key: 'none',
  role: 'No stakeholder selected',
  tag: 'Add a stakeholder above',
  cares: 'Add the people this case has to convince',
  lead: [],
  headline: m => `${fmtMoney(m.figures.totalValue.value)} of annual value`,
  objection: '-',
  counter: '-',
  needsToSee: []
}

export function resolveStakeholder(s) {
  const base = s.builtin
    ? STAKEHOLDERS.find(b => b.key === s.key)
    : {
        lead: ['productivity', 'tooling'],
        headline: m => `${fmtMoney(m.figures.totalValue.value)} of annual value`,
        needsToSee: [],
        cares: '',
        tag: '',
        objection: '-',
        counter: '-',
        ...s
      }
  return base && { ...base, ...(s.edit || {}), requirements:s.requirements||[], namedPeople:s.namedPeople||[], privateNotes:s.privateNotes||'' }
}
