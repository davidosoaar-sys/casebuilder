// Brand palette sweep through the real server code: discoverBrand for each
// company, one row each, and a FAIL for any palette that carries one of
// CaseBuilder's own theme colours (the app default leaking into a client brand).
// Uses the TEST account's Console key and the team search key; each company
// costs a few cents. Saves each brand to /tmp/cb-v0160-export/brand-<name>.json.
// A colour equal to one of ours that the review shows was read from the
// site's own CSS (origin "observed", e.g. Nike's #111111 text) is the site's
// colour, not a leak: it is reported as "site" and does not fail.
// Usage: node scripts/check-brand-palette.mjs [--saved] [Company ...]
//   --saved  re-check the saved results without discovering again (free)
import fs from 'node:fs'
import os from 'node:os'
import Anthropic from '@anthropic-ai/sdk'
import { discoverBrand } from '../server/brand.js'
import { DEFAULT_BRAND, COLOR_KEYS } from '../src/brand.js'
import { luminance } from '../src/export/websiteFramework.js'

const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
Object.assign(process.env, envFile(`${os.homedir()}/.config/casebuilder/search.env`))
const client = new Anthropic({ apiKey: T.ANTHROPIC_API_KEY })
const out = '/tmp/cb-v0160-export'
fs.mkdirSync(out, { recursive: true })

const args = process.argv.slice(2)
const saved = args.includes('--saved')
const named = args.filter(a => a !== '--saved')
const companies = named.length ? named : ['Apple', 'Stripe', 'Notion', 'Spotify', 'Visa', 'Coca-Cola', 'Netflix', 'Uber', 'Nike', 'Shopify', 'Airbnb', 'Linear']
const APP = new Set(COLOR_KEYS.map(k => DEFAULT_BRAND[k].toLowerCase()))

async function one(company) {
  const t = Date.now()
  const file = `${out}/brand-${company.replace(/\W+/g, '')}.json`
  try {
    const b = saved ? JSON.parse(fs.readFileSync(file, 'utf8')) : await discoverBrand({ company }, undefined, client)
    if (!saved) fs.writeFileSync(file, JSON.stringify(b))
    const seen = key => b.review?.decisions?.some(d => d.field === key && d.origin === 'observed' && /^https:\/\//.test(d.sourceUrl) && d.value.toLowerCase() === b[key].toLowerCase())
    const matches = COLOR_KEYS.filter(k => APP.has(String(b[k]).toLowerCase()))
    const leaks = matches.filter(k => !seen(k)).map(k => `${k} ${b[k]}`)
    const site = matches.filter(seen).map(k => `${k} ${b[k]}`)
    const svg = b.logo.startsWith('data:image/svg+xml') ? Buffer.from(b.logo.split(',')[1], 'base64').toString() : ''
    return { company, site: b.website.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''), bg: b.background, text: b.text, primary: b.primary, mode: luminance(b.background) > 0.4 ? 'light' : 'dark', logo: b.logo ? (svg ? 'svg ' + (svg.match(/viewBox="([^"]+)"/)?.[1] || '') : b.logo.slice(11, b.logo.indexOf(';'))) : 'no', field: b.logoBackground, leaks, own: site, secs: Math.round((Date.now() - t) / 1000) }
  } catch (error) {
    return { company, error: error.message.slice(0, 80), leaks: [], secs: Math.round((Date.now() - t) / 1000) }
  }
}

// Four at a time: polite to the sites, done in a few minutes.
const rows = []
for (let i = 0; i < companies.length; i += 4) rows.push(...await Promise.all(companies.slice(i, i + 4).map(one)))

const cols = ['company', 'site', 'bg', 'text', 'primary', 'mode', 'logo', 'field', 'result']
const cell = r => ({ ...r, result: r.error ? 'ERROR ' + r.error : r.leaks.length ? 'FAIL ' + r.leaks.join(', ') : r.own?.length ? 'ok (site colour: ' + r.own.join(', ') + ')' : 'ok' })
const table = rows.map(cell)
const width = Object.fromEntries(cols.map(c => [c, Math.max(c.length, ...table.map(r => String(r[c] ?? '').length))]))
console.log(cols.map(c => c.padEnd(width[c])).join('  '))
for (const r of table) console.log(cols.map(c => String(r[c] ?? '').padEnd(width[c])).join('  '))
const failed = rows.filter(r => r.leaks.length)
console.log(`\n${rows.length - failed.length - rows.filter(r => r.error).length}/${rows.length} ok, ${failed.length} with a CaseBuilder colour, ${rows.filter(r => r.error).length} errors`)
process.exit(failed.length ? 1 : 0)
