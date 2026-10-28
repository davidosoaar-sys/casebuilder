import { clientCompanyName } from '../src/companyName.js'
import {rasterLogo as toRasterLogo} from './logoRaster.mjs'
import {clientStakeholder} from '../src/stakeholderRequirements.js'
// casebuilder: the command line behind the Claude plugin. It reads and writes
// a case file (see src/caseFile.js), runs the value model, and builds the
// deliverables with exactly the code the standalone app uses. It is bundled into
// one self-contained file (build:plugin), so the plugin needs only Node 18+.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import PptxGenJS from 'pptxgenjs'
import logoSvg from '../src/assets/backstage-logo.svg'
import faviconSvg from '../public/favicon.svg'
import vmSource from '../.build/valueModel.txt'
import {
  INPUT_FIELDS,
  STAKEHOLDERS,
  ARCHETYPES,
  allDrivers,
  confidence,
  unconfirmed,
  fmtMoney,
  fmtMoneyFull
} from '../src/valueModel.js'
import { computeModel } from '../src/model.js'
import { withValue, withState, withOrigin, stateOf, emptySource } from '../src/source.js'
import { projectToCaseFile, caseFileToProject, checkCaseFile, CASE_VERSION } from '../src/caseFile.js'
import { buildEnv, resolveSlides, TEXT_STYLES } from '../src/deck/model.js'
import { resolveStakeholder } from '../src/deck/stakeholders.js'
import { buildOnePager, buildWebsite } from '../src/export/html.js'
import { buildPptx } from '../src/export/pptx.js'
import { prepareOnePager, prepareWebsite, pickAudience } from '../src/export/prepare.js'
import { dataUrlSize } from '../src/export/imageSize.js'
import { newProject } from '../src/projects.js'
import { normalizeBrand, brandDocument, brandLogoHtml } from '../src/brand.js'
import { matchPersonRole } from '../src/personLookup.js'
import { publishSite, projectName, checkPublic, siteFiles, AUTH_NOTE, PublishError } from '../server/publish.js'

const BUILTIN_KEYS = STAKEHOLDERS.map(s => s.key)
const LINKEDIN = /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[^\s?#]+/i

class UserError extends Error {}
const fail = msg => {
  throw new UserError(msg)
}

// ----------------------------------------------------------------- argv

function parseArgs(argv) {
  const pos = []
  const flags = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const k = a.slice(2)
      const next = argv[i + 1]
      if (next === undefined || next.startsWith('--')) flags[k] = [true]
      else {
        ;(flags[k] ||= []).push(next)
        i++
      }
    } else pos.push(a)
  }
  return { pos, flags }
}
const one = (flags, k) => (flags[k] ? flags[k][flags[k].length - 1] : undefined)
const many = (flags, k) => (flags[k] || []).filter(v => v !== true)
const has = (flags, k) => k in flags

const slug = s =>
  String(s || 'case')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'case'

const print = obj => console.log(JSON.stringify(obj, null, 2))

// ------------------------------------------------------------ case files

function readCase(file) {
  if (!file) fail('Which case file? Pass its path, e.g. northwind.case.json')
  if (!fs.existsSync(file)) fail(`No such file: ${file}`)
  let raw
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    fail(`${file} is not valid JSON: ${e.message}`)
  }
  return raw
}

function writeCase(file, data) {
  const { errors, warnings } = checkCaseFile(data)
  if (errors.length) fail(`Not saved. The change would leave the case file invalid:\n- ${errors.join('\n- ')}`)
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
  return warnings
}

function loadProject(file) {
  const raw = readCase(file)
  try {
    return { raw, project: caseFileToProject(raw) }
  } catch (e) {
    fail(e.message)
  }
}

const inputsOf = fields => Object.fromEntries(fields.map(f => [f.key, f.value]))

function audienceFor(project, key) {
  const list = project.stakeholders.map(s=>{
    const resolved=resolveStakeholder(s)
    return resolved?{...resolved,pos:s.pos,namedPeople:(s.namedPeople||project.people?.[s.key]||[]).map(p=>({name:p.name,title:p.title}))}:null
  }).filter(Boolean)
  if (key && !list.some(s => s.key === key)) {
    fail(`No stakeholder "${key}" in this case. Choices: ${list.map(s => s.key).join(', ') || '(none)'}`)
  }
  return { list, who: pickAudience(list, key) }
}

// Hand-written decks may point images at files; embed them so builds are portable.
function inlineImages(deck, baseDir) {
  const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp' }
  return deck.map(s => ({
    ...s,
    blocks: s.blocks.map(b => {
      if (b.type !== 'image' || !b.src || b.src.startsWith('data:')) return b
      const p = path.resolve(baseDir, b.src)
      if (!fs.existsSync(p)) fail(`Image not found: ${b.src}`)
      const type = mime[path.extname(p).toLowerCase()]
      if (!type) fail(`Unsupported image type: ${b.src}`)
      return { ...b, src: `data:${type};base64,${fs.readFileSync(p).toString('base64')}` }
    })
  }))
}

// ------------------------------------------------------------- commands

function cmdInit(pos, flags) {
  const company = pos[0]
  if (!company) fail('Usage: init "<company name>" [--archetype "Enterprise"] [--out file.case.json]')
  const out = one(flags, 'out') || `${slug(company)}.case.json`
  if (fs.existsSync(out) && !has(flags, 'force')) fail(`${out} already exists. Use --force to overwrite it.`)

  const data = projectToCaseFile(newProject(company))
  delete data.deck // left out so the standard deck is used until it is customised
  delete data.exportedAt
  const arch = one(flags, 'archetype')
  if (arch) {
    if (!ARCHETYPES[arch]) fail(`Unknown archetype "${arch}". Choices: ${Object.keys(ARCHETYPES).join(' | ')}`)
    data.inputs.archetype.value = arch
    data.inputs.archetype.confirmed = true
    data.stakeholders = [...ARCHETYPES[arch].stakeholders]
  }
  writeCase(out, data)
  print({ created: path.resolve(out), company, stakeholders: data.stakeholders, next: 'Run "info" to see every input, then "set" to fill them in.' })
}

function cmdInfo(pos, flags) {
  const inputs = INPUT_FIELDS.map(f => ({
    key: f.key,
    label: f.label,
    group: f.group,
    type: f.type,
    unit: f.unit || undefined,
    default: f.value,
    options: f.options,
    startsAs: f.type === 'number' || f.type === 'percent' ? (f.structural ? 'input' : 'empty') : 'input',
    help: f.help
  }))
  const info = {
    inputs,
    archetypes: Object.fromEntries(Object.entries(ARCHETYPES).map(([k, v]) => [k, { stakeholders: v.stakeholders, note: v.note, alternative: v.alternative }])),
    stakeholders: STAKEHOLDERS.map(s => ({ key: s.key, role: s.role, tag: s.tag, cares: s.cares })),
    textStyles: TEXT_STYLES.map(([k]) => k)
  }
  if (!has(flags, 'md')) return print(info)
  const lines = ['| key | label | type | default | starts as |', '|---|---|---|---|---|']
  for (const i of inputs) lines.push(`| ${i.key} | ${i.label} | ${i.type}${i.unit ? ` (${i.unit})` : ''} | ${i.default} | ${i.startsAs} |`)
  console.log(lines.join('\n'))
}

function parseValue(field, raw) {
  if (field.type === 'number' || field.type === 'percent') {
    const n = Number(String(raw).replace(/[$,%\s]/g, ''))
    if (!Number.isFinite(n)) fail(`${field.key} needs a number, got "${raw}".`)
    return n
  }
  if (field.type === 'select' && !field.options.includes(raw)) fail(`${field.key} must be one of: ${field.options.join(' | ')}`)
  return String(raw)
}

// An entry in the case file's `inputs`, as a field the source helpers can work on.
const asField = (key, entry) => ({ key, value: entry && entry.value != null ? entry.value : '', source: entry && entry.source ? entry.source : emptySource() })
const toEntry = (prev, f) => ({ ...prev, value: f.value, confirmed: stateOf(f) === 'input', source: f.source })

function cmdSet(pos, flags) {
  const [file, ...pairs] = pos
  const data = readCase(file)
  const confirmed = new Set(many(flags, 'confirmed').flatMap(v => String(v).split(',')).map(s => s.trim()).filter(Boolean))
  const assumed = new Set(many(flags, 'assumed').flatMap(v => String(v).split(',')).map(s => s.trim()).filter(Boolean))
  const origin = one(flags, 'origin')
  if (!pairs.length && !confirmed.size && !assumed.size) fail('Usage: set <file> key=value [key=value ...] [--confirmed key,key] [--assumed key,key] [--origin "where it came from"]')
  data.inputs ||= {}
  const changed = []
  const apply = (key, f) => {
    // --confirmed: the customer said it (an input). --assumed: your own read. Neither: the source stays as it is.
    if (confirmed.has(key)) f = withState(f, 'input')
    else if (assumed.has(key)) f = withState(f, 'assumption')
    if (origin) f = withOrigin(f, origin)
    data.inputs[key] = toEntry(data.inputs[key] || {}, f)
    changed.push({ key, value: f.value, state: stateOf(f), origin: f.source.origin || '' })
  }
  for (const pair of pairs) {
    const eq = pair.indexOf('=')
    if (eq < 1) fail(`"${pair}" should look like key=value`)
    const key = pair.slice(0, eq)
    const f = INPUT_FIELDS.find(x => x.key === key) || (data.inputs[key] && data.inputs[key].label ? { key, type: data.inputs[key].type } : null)
    if (!f) fail(`Unknown input "${key}". Run "info" for the list, or add your own with "custom".`)
    const raw = pair.slice(eq + 1)
    const value = raw === '' ? '' : parseValue(f, raw)
    apply(key, withValue(asField(key, data.inputs[key]), value))
  }
  // flags can also change the state of a number without changing its value
  for (const key of [...confirmed, ...assumed]) {
    if (changed.some(c => c.key === key)) continue
    if (!INPUT_FIELDS.some(x => x.key === key) && !data.inputs[key]) fail(`Unknown input "${key}".`)
    apply(key, asField(key, data.inputs[key]))
  }
  const warnings = writeCase(file, data)
  print({ saved: path.resolve(file), changed, warnings })
}

function cmdCustom(pos, flags) {
  const file = pos[0]
  const data = readCase(file)
  const key = one(flags, 'key')
  const label = one(flags, 'label')
  const type = one(flags, 'type') || 'number'
  if (!key || !label || !has(flags, 'value')) fail('Usage: custom <file> --key support_tickets --label "Support tickets / month" --value 1200 [--type number|percent|text] [--unit tickets] [--confirmed]')
  if (INPUT_FIELDS.some(f => f.key === key)) fail(`"${key}" is a built-in input; use "set".`)
  const raw = one(flags, 'value')
  data.inputs ||= {}
  data.inputs[key] = { label, type, unit: one(flags, 'unit') || '', value: type === 'text' ? String(raw) : Number(raw), confirmed: has(flags, 'confirmed'), source: has(flags, 'confirmed') ? { state: 'input', origin: one(flags, 'origin') || 'Confirmed by the customer' } : { state: 'assumption', origin: one(flags, 'origin') || 'Your own read' } }
  const warnings = writeCase(file, data)
  print({ saved: path.resolve(file), added: key, note: 'Custom inputs appear in the case and the assumptions list but do not change the value model.', warnings })
}

function currentStakeholders(data) {
  return data.stakeholders ? [...data.stakeholders] : [...BUILTIN_KEYS]
}
const keyOf = s => (typeof s === 'string' ? s : s.key)

function cmdStakeholder(pos, flags) {
  const [verb, file, arg] = pos
  const data = readCase(file)
  const list = currentStakeholders(data)
  if (verb === 'add') {
    const role = one(flags, 'role')
    if (!role) fail('Usage: stakeholder add <file> --role "Head of Data" [--tag ...] [--cares ...] [--objection ...] [--counter ...] [--needs "a|b|c"]')
    const key = one(flags, 'key') || `custom_${slug(role).replace(/-/g, '_')}`
    if (list.some(s => keyOf(s) === key)) fail(`A stakeholder "${key}" already exists.`)
    list.push({
      key,
      role,
      tag: one(flags, 'tag') || '',
      cares: one(flags, 'cares') || '',
      objection: one(flags, 'objection') || '-',
      counter: one(flags, 'counter') || '-',
      needsToSee: (one(flags, 'needs') || '').split('|').map(s => s.trim()).filter(Boolean)
    })
  } else if (verb === 'remove') {
    if (!arg) fail('Usage: stakeholder remove <file> <key>')
    const next = list.filter(s => keyOf(s) !== arg)
    if (next.length === list.length) fail(`No stakeholder "${arg}". Present: ${list.map(keyOf).join(', ')}`)
    list.length = 0
    list.push(...next)
    if (data.people) delete data.people[arg]
  } else if (verb === 'restore') {
    if (!BUILTIN_KEYS.includes(arg)) fail(`"${arg}" is not a built-in stakeholder (${BUILTIN_KEYS.join(', ')}).`)
    if (!list.some(s => keyOf(s) === arg)) list.push(arg)
  } else fail('Usage: stakeholder <add|remove|restore> <file> ...')
  data.stakeholders = list
  writeCase(file, data)
  print({ saved: path.resolve(file), stakeholders: list.map(keyOf) })
}

function cmdPerson(pos, flags) {
  const [verb, file] = pos
  const data = readCase(file)
  const list = currentStakeholders(data).map(keyOf)
  const sk = one(flags, 'stakeholder')
  if (!sk || !list.includes(sk)) fail(`--stakeholder must be one of: ${list.join(', ')}`)
  const name = one(flags, 'name')
  if (!name) fail('--name is required')
  data.people ||= {}
  data.people[sk] ||= []

  if (verb === 'remove') {
    const before = data.people[sk].length
    data.people[sk] = data.people[sk].filter(p => p.name.toLowerCase() !== name.toLowerCase())
    if (data.people[sk].length === before) fail(`No person named "${name}" under ${sk}.`)
  } else if (verb === 'add') {
    const sources = many(flags, 'source')
    const manual = has(flags, 'manual')
    if (!sources.length && !manual) fail('A researched person needs at least one --source URL (the page you found them on). Use --manual for someone you were told about.')
    if(sources.some(s=>{try{const u=new URL(s);return !['https:','http:'].includes(u.protocol)||u.username||u.password}catch{return true}}))fail('Each --source must be an HTTP(S) URL without credentials.')
    const linkedin = one(flags, 'linkedin')
    if (linkedin && !LINKEDIN.test(linkedin)) fail('--linkedin must be a linkedin.com/in/ profile URL.')
    const person = {
      name,
      title: one(flags, 'title') || '',
      email: one(flags, 'email') || '',
      linkedin: linkedin ? linkedin.split(/[?#]/)[0] : '',
      bio: (one(flags, 'bio') || '').slice(0, 400),
      sources,
      confidence: one(flags, 'confidence') || 'low',
      ...(!manual&&one(flags,'title')?{mapping:{...matchPersonRole(one(flags,'title')),key:sk,state:'inferred',origin:'Inferred from title, not confirmed'}}:{}),
      ...(manual ? { found: false } : {})
    }
    const i = data.people[sk].findIndex(p => p.name.toLowerCase() === name.toLowerCase())
    if (i >= 0) data.people[sk][i] = { ...data.people[sk][i], ...person }
    else data.people[sk].push(person)
  } else fail('Usage: person <add|remove> <file> --stakeholder <key> --name "..." ...')

  const warnings = writeCase(file, data)
  print({ saved: path.resolve(file), [sk]: data.people[sk].map(p => p.name), warnings })
}

function cmdValidate(pos) {
  const raw = readCase(pos[0])
  const { errors, warnings } = checkCaseFile(raw)
  print({ file: path.resolve(pos[0]), ok: errors.length === 0, errors, warnings })
  if (errors.length) process.exitCode = 1
}

function calcAll(project) {
  const inputs = inputsOf(project.fields)
  const model = computeModel(inputs)
  const F = model.figures
  const open = unconfirmed(project.fields)
  const stakeholders = project.stakeholders.map(resolveStakeholder).filter(Boolean)
  const totals = {
    annualValue: F.totalValue.value,
    portalCost: model.inputs.portalCost,
    netYearOne: F.netValue.raw,
    paybackMonths: Number(F.paybackMonths.value.toFixed(1)),
    returnMultiple: Number(F.roiMultiple.value.toFixed(2)),
    fiveYearNet: F.fiveYearValue.raw
  }
  return {
    company: project.name,
    confidence: confidence(project.fields),
    totals,
    // a figure that cannot be computed yet is "incomplete", never $0
    formatted: {
      annualValue: F.totalValue.incomplete ? 'incomplete' : fmtMoneyFull(totals.annualValue),
      portalCost: model.blankInputs.includes('portalCost') ? 'incomplete' : fmtMoney(totals.portalCost),
      netYearOne: F.netValue.incomplete ? 'incomplete' : fmtMoney(totals.netYearOne),
      payback: F.paybackMonths.incomplete ? 'incomplete' : totals.paybackMonths > 0 ? `${totals.paybackMonths} months` : 'n/a',
      return: F.roiMultiple.incomplete ? 'incomplete' : `${totals.returnMultiple.toFixed(1)}x`,
      fiveYearNet: F.fiveYearValue.incomplete ? 'incomplete' : fmtMoney(totals.fiveYearNet)
    },
    figures: Object.fromEntries(model.order.map(k => [k, F[k].incomplete ? { incomplete: true, waitingOn: F[k].missing } : { value: F[k].value, equation: F[k].equation, flag: F[k].flag }])),
    warnings: model.warnings.map(w => w.message),
    drivers: allDrivers(model).map(d => (d.incomplete ? { key: d.key, label: d.label, incomplete: true, waitingOn: d.missing } : { key: d.key, label: d.label, value: Math.round(d.value), formatted: fmtMoney(d.value), working: d.detail })),
    versusSelfHost: { selfHost: F.selfHostCost.value, portal: model.inputs.portalCost, portalIsCheaperBy: Math.max(0, F.versusSelfHost.raw), cheaper: F.versusSelfHost.raw > 0 ? 'portal' : 'self-host' },
    stillAssumed: open.map(f => ({ key: f.key, label: f.label, assumedAt: f.value, unit: f.unit || (f.type === 'percent' ? '%' : ''), askThem: f.help })),
    stakeholders: stakeholders.map(s => ({
      key: s.key,
      role: s.role,
      headline: s.headline(model),
      cares: s.cares,
      leadsWith: s.lead,
      people: (project.people[s.key] || []).map(p => p.name)
    }))
  }
}

function cmdCalc(pos, flags) {
  const { project } = loadProject(pos[0])
  const result = calcAll(project)
  const only = one(flags, 'stakeholder')
  if (only) result.stakeholders = result.stakeholders.filter(s => s.key === only)
  if (!has(flags, 'md')) return print(result)

  const f = result.formatted
  const lines = [
    `# ${result.company}: business case`,
    '',
    `Case confidence: **${result.confidence}%** of the numeric inputs are confirmed by the customer.`,
    '',
    '| | |',
    '|---|---|',
    `| Annual value | ${f.annualValue} |`,
    `| Portal cost | ${f.portalCost} |`,
    `| Net, year one | ${f.netYearOne} |`,
    `| Payback | ${f.payback} |`,
    `| Return | ${f.return} |`,
    `| Five-year net | ${f.fiveYearNet} |`,
    '',
    '## Where the value comes from',
    ...result.drivers.map(d => (d.incomplete ? `- **${d.label}**: incomplete, waiting on ${d.waitingOn.join(', ')}` : `- **${d.label}**: ${d.formatted} (${d.working})`)),
    '',
    `## Against self-hosting`,
    `Self-hosting costs about ${fmtMoney(result.versusSelfHost.selfHost)}/yr in platform engineers; Portal is ${fmtMoney(result.versusSelfHost.portal)}/yr.`,
    '',
    '## Stakeholders',
    ...result.stakeholders.map(s => `- **${s.role}**: ${s.headline}`),
    '',
    `## Still assumed (${result.stillAssumed.length})`,
    ...result.stillAssumed.map(a => `- ${a.label}: assumed at ${a.assumedAt}${a.unit ? ' ' + a.unit : ''}`)
  ]
  console.log(lines.join('\n'))
}

function findBrowser() {
  const c = []
  if (process.platform === 'win32') {
    const pf = [process.env['ProgramFiles'], process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean)
    for (const d of pf) {
      c.push(path.join(d, 'Google/Chrome/Application/chrome.exe'), path.join(d, 'Microsoft/Edge/Application/msedge.exe'))
    }
  } else if (process.platform === 'darwin') {
    c.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Chromium.app/Contents/MacOS/Chromium')
  } else {
    for (const n of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) {
      const r = spawnSync('which', [n], { encoding: 'utf8' })
      if (r.status === 0 && r.stdout.trim()) c.push(r.stdout.trim())
    }
  }
  return c.find(p => fs.existsSync(p)) || null
}

function printToPdf(htmlPath, pdfPath) {
  const browser = findBrowser()
  if (!browser) return { ok: false, reason: 'No Chrome, Edge or Chromium found. Open the .html file and use Print > Save as PDF.' }
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cb-pdf-'))
  const r = spawnSync(
    browser,
    ['--headless=new', '--disable-gpu', '--no-sandbox', `--user-data-dir=${profile}`, '--no-pdf-header-footer', `--print-to-pdf=${pdfPath}`, 'file:///' + htmlPath.replace(/\\/g, '/').replace(/^\//, '')],
    { timeout: 90000, stdio: 'ignore' }
  )
  fs.rmSync(profile, { recursive: true, force: true })
  return fs.existsSync(pdfPath) ? { ok: true } : { ok: false, reason: `The browser did not produce a PDF (exit ${r.status}). Open the .html and print it instead.` }
}

async function cmdBuild(pos, flags) {
  const file = pos[0]
  const { project } = loadProject(file)
  const wanted = one(flags, 'format') || 'all'
  const formats = wanted === 'all' ? ['pptx', 'onepager', 'website'] : String(wanted).split(',').map(s => s.trim())
  for (const f of formats) if (!['pptx', 'google-slides', 'canva', 'onepager', 'website'].includes(f)) fail(`Unknown format "${f}". Use pptx, google-slides, canva, onepager, website or all.`)

  const { list, who } = audienceFor(project, one(flags, 'stakeholder'))
  const outDir = path.resolve(one(flags, 'out') || path.dirname(path.resolve(file)))
  fs.mkdirSync(outDir, { recursive: true })

  const inputs = inputsOf(project.fields)
  const company = clientCompanyName(inputs.companyName, project.name)
  const deck = inlineImages(project.deck, path.dirname(path.resolve(file)))
  const name = slug(company)
  const written = []
  const brand=normalizeBrand(project.brand)
  const hasCompanyLogo=Boolean(brand.logo&&!brand.hideLogo)
  const companyLogo=brandLogoHtml(brand,'')
  const rasterLogo=hasCompanyLogo ? await toRasterLogo(brand.logo) : null
  const warnings=[]
  if(hasCompanyLogo&&!rasterLogo&&formats.some(f=>['pptx','google-slides','canva'].includes(f)))warnings.push('The company logo is not PNG/JPEG. PPTX omits it; supply a PNG/JPEG variant for an embedded logo. HTML outputs retain the original asset.')

  for(const target of formats.filter(f=>['pptx','google-slides','canva'].includes(f))) {
    const env = buildEnv(inputs, project.fields, clientStakeholder(who))
    const pptx = await buildPptx({
      company,
      brand,
      slides: resolveSlides(deck, env),
      deps: { PptxGenJS, importTarget:target, logoPng: async () => {if(!rasterLogo)return null;const size=dataUrlSize(rasterLogo);return {data:rasterLogo,ratio:size.w/size.h}}, imageSize: async src => dataUrlSize(src) }
    })
    const out = path.join(outDir, `${name}-business-case${target==='pptx'?'':'-'+target}.pptx`)
    fs.writeFileSync(out, await pptx.write({ outputType: 'nodebuffer' }))
    written.push({ format: target, file: out, bytes: fs.statSync(out).size, audience: who.role,...(target==='google-slides'?{importInstructions:'Google Slides: File → Open → Upload this PPTX.',openUrl:'https://slides.google.com/'}:target==='canva'?{importInstructions:'Upload this PPTX in Canva. Charts are editable shapes.',openUrl:'https://www.canva.com/'}:{}) })
  }

  if (formats.includes('onepager')) {
    const facts = prepareOnePager({ inputs, fields: project.fields, who })
    const out = path.join(outDir, `${name}-one-pager.html`)
    fs.writeFileSync(out, brandDocument(buildOnePager({ facts, brand:project.brand, logoSvg:companyLogo, faviconSvg }),brand))
    written.push({ format: 'onepager', file: out, bytes: fs.statSync(out).size, audience: who.role })
    if (has(flags, 'pdf')) {
      const pdf = out.replace(/\.html$/, '.pdf')
      const r = printToPdf(out, pdf)
      written.push(r.ok ? { format: 'onepager-pdf', file: pdf, bytes: fs.statSync(pdf).size, audience: who.role } : { format: 'onepager-pdf', skipped: r.reason })
    }
  }

  if (formats.includes('website')) {
    const out = path.join(outDir, `${name}-business-case.html`)
    fs.writeFileSync(out, websiteHtml({ company, deck, inputs, project, list, who }))
    written.push({ format: 'website', file: out, bytes: fs.statSync(out).size, audience: 'company story with stakeholder map' })
  }

  print({ built: written, warnings, assets:{companyLogo:hasCompanyLogo,pptxLogo:!!rasterLogo,coverImage:!!brand.heroImage,headingFont:brand.headingFont,bodyFont:brand.bodyFont,embeddedFontFamilies:brand.fontFaces.map(f=>f.family),fallbackFont:'Poppins'}, note: 'PowerPoint and one-pager use the selected stakeholder. The website uses the company story and stakeholder map. PPTX keeps font names; recipients need those fonts installed.' })
}

function websiteHtml({ company, deck, inputs, project, list, who }) {
  const args = prepareWebsite({ company, deck, inputs, fields: project.fields, stakeholders: list, who })
  return brandDocument(buildWebsite({ ...args, logoSvg:brandLogoHtml(project.brand,''), faviconSvg, vmSource,websiteBrand:project.brand }),project.brand)
}

// Publish the interactive website to its own Vercel project. This puts the
// customer's numbers at a public address, so it only runs with --yes, which
// must only be passed after the user has agreed.
async function cmdPublish(pos, flags) {
  const file = pos[0]
  const { project } = loadProject(file)
  const { list, who } = audienceFor(project, one(flags, 'stakeholder'))
  const inputs = inputsOf(project.fields)
  const company = inputs.companyName || project.name
  const deck = inlineImages(project.deck, path.dirname(path.resolve(file)))
  const name = one(flags, 'name') || projectName(company)
  const via = process.env.VERCEL_TOKEN ? 'api' : 'cli'

  if (!has(flags, 'yes')) {
    return print({
      published: false,
      wouldPublish: {
        company,
        project: name,
        address: `https://${name}.vercel.app`,
        via: via === 'api' ? 'Vercel API (VERCEL_TOKEN)' : 'the Vercel CLI (vercel deploy)',
        audience: 'all stakeholders (switchable)'
      },
      warning: "This puts the customer's numbers at a public address. Anyone with the link can read them. The address is long and unlisted, and the page asks search engines not to index it.",
      next: 'Nothing was published. Ask the user to confirm, then run the same command again with --yes.'
    })
  }

  const html = websiteHtml({ company, deck, inputs, project, list, who })

  if (process.env.VERCEL_TOKEN) {
    try {
      const r = await publishSite({ html, company, token: process.env.VERCEL_TOKEN, teamId: process.env.VERCEL_TEAM_ID || undefined, name })
      return print({ published: true, via: 'api', url: r.url, project: r.name, public: r.public, note: r.note })
    } catch (e) {
      if (e instanceof PublishError) fail(e.message)
      throw e
    }
  }

  // No token: use the Vercel CLI the user is already logged in with.
  const probe = spawnSync('vercel', ['--version'], { shell: true, encoding: 'utf8' })
  if (probe.status !== 0) {
    fail('Cannot publish: set VERCEL_TOKEN (create one at vercel.com/account/tokens), or install the Vercel CLI (npm i -g vercel) and run "vercel login". The site is not published.')
  }
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cb-site-')), name)
  fs.mkdirSync(dir)
  for (const f of siteFiles(html)) fs.writeFileSync(path.join(dir, f.file), Buffer.from(f.data, 'base64'))
  const args = ['deploy', '--prod', '--yes']
  const scope = one(flags, 'scope') || process.env.VERCEL_SCOPE
  if (typeof scope === 'string') args.push('--scope', scope)
  const r = spawnSync('vercel', args, { cwd: dir, shell: true, encoding: 'utf8', timeout: 240000 })
  fs.rmSync(path.dirname(dir), { recursive: true, force: true })
  const out = `${r.stdout || ''}\n${r.stderr || ''}`
  const urls = out.match(/https:\/\/[a-z0-9.-]+\.vercel\.app/g) || []
  if (r.status !== 0 || !urls.length) {
    const hint = /missing_scope|--scope/.test(out) ? ' Pass --scope <team-slug> (run "vercel teams ls" to see yours).' : ''
    fail(`The Vercel CLI did not publish the site.${hint}\n${out.trim().split('\n').slice(-6).join('\n')}`)
  }
  const url = urls.find(u => u.startsWith(`https://${name}.`)) || urls[urls.length - 1]
  const open = await checkPublic(url)
  print({ published: true, via: 'cli', url, project: name, public: open, note: open === false ? AUTH_NOTE : undefined })
}

function cmdExport(pos, flags) {
  // Case file -> a copy with the full deck written out, ready for the app to import.
  const { project } = loadProject(pos[0])
  const out = one(flags, 'out') || pos[0]
  const data = projectToCaseFile(project)
  fs.writeFileSync(out, JSON.stringify(data, null, 2) + '\n')
  print({ wrote: path.resolve(out), note: 'Import this file in the CaseBuilder app (Projects > Import).' })
}

function help() {
  console.log(`casebuilder ${CASE_VERSION}: build a business case from a case file

  init "<company>" [--archetype A] [--out f]      create a case file
  info [--md]                                      list every input, archetype and stakeholder
  set <f> key=value ... [--confirmed k,k] [--assumed k,k] [--origin text]   change inputs (confirmed = the customer said it)
  custom <f> --key k --label L --value V           add an input of your own
  stakeholder <add|remove|restore> <f> ...         manage who is in the room
  person <add|remove> <f> --stakeholder k ...      record a researched person (with sources)
  validate <f>                                     check the file, in plain words
  calc <f> [--stakeholder k] [--md]                run the value model
  build <f> [--format pptx|google-slides|canva|onepager|website|all] [--stakeholder k] [--out dir] [--pdf]
  publish <f> [--stakeholder k] [--yes]            put the website on Vercel (needs --yes)
  export <f> [--out f]                             write the full case file for the app`)
}

// ----------------------------------------------------------------- main

async function main() {
  const { pos, flags } = parseArgs(process.argv.slice(2))
  const [cmd, ...rest] = pos
  switch (cmd) {
    case 'init': return cmdInit(rest, flags)
    case 'info': return cmdInfo(rest, flags)
    case 'set': return cmdSet(rest, flags)
    case 'custom': return cmdCustom(rest, flags)
    case 'stakeholder': return cmdStakeholder(rest, flags)
    case 'person': return cmdPerson(rest, flags)
    case 'validate': return cmdValidate(rest)
    case 'calc': return cmdCalc(rest, flags)
    case 'build': return cmdBuild(rest, flags)
    case 'publish': return cmdPublish(rest, flags)
    case 'export': return cmdExport(rest, flags)
    case undefined:
    case 'help':
    case '--help':
      return help()
    default:
      fail(`Unknown command "${cmd}". Run with no arguments for the list.`)
  }
}

main().catch(err => {
  if (err instanceof UserError) console.error(err.message)
  else console.error(`Unexpected error: ${err && err.stack ? err.stack : err}`)
  process.exit(1)
})
