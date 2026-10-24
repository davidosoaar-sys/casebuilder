import { INPUT_FIELDS, STAKEHOLDERS, migrateOldInputs, sourceOf } from './valueModel.js'
import { uid } from './uid.js'
import { defaultDeck, migrateDeck } from './deck/model.js'
import { normalizeBrand } from './brand.js'
import { dealStorage } from './dealStorage.js'
import { loadConnections } from './connectors.js'
import { SPOTIFY_LOGO } from './spotifyLogo.js'
import { styleSpotifyDeck } from './spotifyDeck.js'
import { SAMPLE_CASES, createSampleCase } from './sampleCases.js'

export { uid }

// Projects live in localStorage. Each project is one business case: its input
// fields (including any custom ones), its stakeholders, the people found for
// them, and its deck (an ordered list of slides the user can edit).

let loadError = ''
export const dealLoadError = () => loadError

export function loadProjects() {
  loadError = ''
  try {
    dealStorage.migrateLegacy(hydrate)
  } catch (error) {
    loadError = error.message || 'Some older deals could not be read.'
  }
  try {
    dealStorage.seedSample('spotify.v1', () => ({ ...newProject('Spotify'), projectLogo: SPOTIFY_LOGO, sample: true }), p => p.name.toLowerCase() === 'spotify')
    for (const sample of SAMPLE_CASES) {
      dealStorage.seedSample('website-'+sample.key+'.v1',()=>createSampleCase(sample,newProject),p=>p.sampleCaseKey===sample.key)
    }
  } catch (error) {
    loadError = error.message || 'The sample project could not be saved.'
  }
  try {
    return dealStorage.list().map(project => {
      const styled = styleSpotifyDeck(project)
      if (styled !== project) {
        try { dealStorage.set(styled) } catch (error) { loadError = error.message || 'The Spotify design could not be saved.' }
      }
      return styled
    })
  } catch (error) {
    loadError = error.message || 'Stored deals could not be read.'
    return []
  }
}

export function saveProjects(projects) {
  for (const project of projects) dealStorage.set(project)
}

export function defaultFields() {
  return INPUT_FIELDS.map(f => ({ ...f }))
}

export function defaultStakeholders() {
  return STAKEHOLDERS.map(s => ({ key: s.key, builtin: true }))
}

export function newProject(name, connectors = loadConnections()) {
  const fields = defaultFields()
  const company = fields.find(f => f.key === 'companyName')
  if (company) company.value = name
  return styleSpotifyDeck({
    id: uid(),
    name,
    ...(/^spotify$/i.test(name.trim()) ? { projectLogo: SPOTIFY_LOGO } : {}),
    updatedAt: Date.now(),
    createdAt: Date.now(),
    connectors: { ...connectors },
    fields,
    stakeholders: defaultStakeholders(),
    deck: defaultDeck(),
    people: {},
    documents: [],
    brand: normalizeBrand()
  })
}

export function duplicateProject(project) {
  const copy = JSON.parse(JSON.stringify(project))
  const name = `${project.name} (copy)`
  return { ...copy, id: uid(), name, createdAt: Date.now(), updatedAt: Date.now(), fields: copy.fields.map(f => f.key === 'companyName' ? { ...f, value: name } : f), site: undefined }
}

// Fill in anything a stored project is missing (e.g. fields added to the model
// after it was saved) without touching what the user has already entered.
export function hydrate(project) {
  const brand = normalizeBrand(project.brand)
  if (brand.status === 'scanning') {
    brand.status = 'idle'
    brand.message = 'The previous brand scan was interrupted. You can scan again in Deck design.'
  }
  const saved = project.fields || []
  const byKey = Object.fromEntries(saved.map(f => [f.key, f]))
  // projects saved before the inputs became today / with-Portal pairs
  const migrated = migrateOldInputs(
    Object.fromEntries(saved.map(f => [f.key, { value: f.value, confirmed: f.confirmed }]))
  )
  // Only what the user entered (the value and where it came from) is taken from
  // storage. Labels, help and the rest always come from the model. Saved fields
  // that predate sources carry `confirmed`, which becomes a source here.
  const base = INPUT_FIELDS.map(f => {
    const mine = byKey[f.key] || migrated[f.key]
    if (!mine) return { ...f }
    return { ...f, ...mine, value: mine.value ?? f.value, source: sourceOf(mine) }
  })
  const custom = saved.filter(f => f.custom).map(f => ({ ...f, source: sourceOf(f) }))
  return {
    ...project,
    createdAt: Number.isFinite(project.createdAt) ? project.createdAt : Number.isFinite(project.updatedAt) ? project.updatedAt : Date.now(),
    updatedAt: Number.isFinite(project.updatedAt) ? project.updatedAt : Date.now(),
    brand,
    fields: [...base, ...custom],
    stakeholders: project.stakeholders || defaultStakeholders(),
    deck: project.deck ? migrateDeck(project.deck) : defaultDeck(),
    people: project.people || {},
    connectors: project.connectors && typeof project.connectors === 'object' ? { ...project.connectors } : loadConnections(),
    documents: Array.isArray(project.documents) ? project.documents : []
  }
}
