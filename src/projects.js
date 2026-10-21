import { INPUT_FIELDS, STAKEHOLDERS } from './valueModel.js'

// Projects live in localStorage. Each project is one business case: its input
// fields (including any custom ones) and its list of stakeholders.

const KEY = 'casebuilder.projects.v1'

export function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export function loadProjects() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function saveProjects(projects) {
  try {
    localStorage.setItem(KEY, JSON.stringify(projects))
  } catch {
    // storage unavailable (private mode, quota): the session still works
  }
}

export function defaultFields() {
  return INPUT_FIELDS.map(f => ({ ...f }))
}

export function defaultStakeholders() {
  return STAKEHOLDERS.map(s => ({ key: s.key, builtin: true }))
}

export function newProject(name) {
  const fields = defaultFields()
  const company = fields.find(f => f.key === 'companyName')
  if (company) company.value = name
  return {
    id: uid(),
    name,
    updatedAt: Date.now(),
    fields,
    stakeholders: defaultStakeholders()
  }
}

// Fill in anything a stored project is missing (e.g. fields added to the model
// after it was saved) without touching what the user has already entered.
export function hydrate(project) {
  const saved = project.fields || []
  const byKey = Object.fromEntries(saved.map(f => [f.key, f]))
  const base = INPUT_FIELDS.map(f => ({ ...f, ...(byKey[f.key] || {}) }))
  const custom = saved.filter(f => f.custom)
  return {
    ...project,
    fields: [...base, ...custom],
    stakeholders: project.stakeholders || defaultStakeholders()
  }
}
