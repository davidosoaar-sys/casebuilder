import faviconSvg from '../../public/favicon.svg?raw'
import formatSource from '../format.js?raw'
import modelSource from '../model.js?raw'
import sourceSource from '../source.js?raw'
import valueModelSource from '../valueModel.js?raw'
import { prepareWebsite, pickAudience } from './prepare.js'
import { buildWebsite } from './html.js'
import { resolveStakeholder } from '../deck/stakeholders.js'
import { brandDocument, brandLogoHtml } from '../brand.js'
import { websiteIdentity } from './websiteFramework.js'

// The interactive website for a project, exactly as it is shown in the app and
// as it is published. `stakeholders` are the project's stored stakeholders.
const vmSource = [formatSource, modelSource, sourceSource, valueModelSource].join('\n')

export function buildSiteHtml({ project, inputs, activeKey, mode = 'website' }) {
  const company = inputs.companyName || project.name
  const stakeholders = project.stakeholders.map(s=>{
    const resolved=resolveStakeholder(s)
    return resolved ? {...resolved,pos:s.pos,namedPeople:(s.namedPeople||[]).map(p=>({name:p.name,title:p.title}))} : null
  }).filter(Boolean)
  const who = pickAudience(stakeholders, activeKey)
  const args = prepareWebsite({ company, deck: project.deck, inputs, fields: project.fields, stakeholders, who })
  const brand=mode==='website'?websiteIdentity(project.brand,project.deck):project.brand
  return brandDocument(buildWebsite({ ...args, viewMode: mode, websiteBrand: brand, logoSvg: brandLogoHtml(brand, ''), faviconSvg, vmSource }), brand)
}

// A short fingerprint, to tell whether the site changed since it was published.
export function hashText(text) {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return `${text.length}:${(h >>> 0).toString(36)}`
}
