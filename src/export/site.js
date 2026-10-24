import logoSvg from '../assets/backstage-logo.svg?raw'
import faviconSvg from '../../public/favicon.svg?raw'
import formatSource from '../format.js?raw'
import modelSource from '../model.js?raw'
import sourceSource from '../source.js?raw'
import valueModelSource from '../valueModel.js?raw'
import { prepareWebsite, pickAudience } from './prepare.js'
import { buildWebsite } from './html.js'
import { resolveStakeholder } from '../deck/stakeholders.js'
import { brandDocument, brandLogoHtml } from '../brand.js'

// The interactive website for a project, exactly as it is shown in the app and
// as it is published. `stakeholders` are the project's stored stakeholders.
const vmSource = [formatSource, modelSource, sourceSource, valueModelSource].join('\n')

export function buildSiteHtml({ project, inputs }) {
  const company = inputs.companyName || project.name
  const stakeholders = project.stakeholders.map(resolveStakeholder).filter(Boolean)
  const who = pickAudience(stakeholders, null)
  const args = prepareWebsite({ company, deck: project.deck, inputs, fields: project.fields, stakeholders, who })
  return brandDocument(buildWebsite({ ...args, logoSvg: brandLogoHtml(project.brand, logoSvg), faviconSvg, vmSource }), project.brand)
}

// A short fingerprint, to tell whether the site changed since it was published.
export function hashText(text) {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return `${text.length}:${(h >>> 0).toString(36)}`
}
