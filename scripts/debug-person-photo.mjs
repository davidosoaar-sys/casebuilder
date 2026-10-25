// Debug: why a person search returns no photo. Logs the model's photo claim,
// what the enrichment step fetched, and the final result.
// Usage: node scripts/debug-person-photo.mjs "Shopify" "VP Engineering"
import fs from 'node:fs'
import os from 'node:os'
import Anthropic from '@anthropic-ai/sdk'
import { fetchPublic } from '../server/publicWeb.js'

const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
Object.assign(process.env, envFile('.env.server.local'))
const { research } = await import('../server/research.js')
const agentSearch = await import('../server/agentSearch.js')

const [company = 'Shopify', role = 'VP Engineering'] = process.argv.slice(2)
const client = new Anthropic({ apiKey: T.TEST_ANTHROPIC_KEY || T.ANTHROPIC_API_KEY })

// Wrap the real fetcher so every page/asset the enrichment touches is logged.
const fetcher = async (url, opts) => {
  try {
    const r = await fetchPublic(url, opts)
    console.log('  fetch', r.type?.split(';')[0], r.buffer?.length, url.slice(0, 120))
    return r
  } catch (e) { console.log('  fetch FAIL', String(e.message).slice(0, 80), url.slice(0, 120)); throw e }
}

// Peek at the raw model answer by wrapping runWithSearch's client.
const origCreate = client.messages.stream.bind(client.messages)
let lastText = ''
client.messages.stream = (...a) => { const s = origCreate(...a); s.finalMessage().then(m => { const t = m.content.filter(b => b.type === 'text').map(b => b.text).join(''); if (t.includes('"people"')) lastText = t }).catch(() => {}); return s }

const out = await research({ company, role }, client, { fetcher })
try {
  const raw = JSON.parse(lastText.slice(lastText.indexOf('{'), lastText.lastIndexOf('}') + 1))
  for (const p of raw.people || []) console.log('MODEL', p.name, '| photo:', JSON.stringify(p.photo), '| sources:', (p.source_urls || []).join(' , ').slice(0, 300))
} catch { console.log('MODEL raw (unparsed):', lastText.slice(0, 400)) }
for (const p of out.people) console.log('RESULT', p.name, '| photo:', p.photo ? `${p.photo.imageUrl} from ${p.photo.sourceUrl}` : 'none')
