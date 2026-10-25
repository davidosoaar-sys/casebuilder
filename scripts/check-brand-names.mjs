// Real brand lookup for a few company names, through the same server code the
// app calls. Uses the test account's Anthropic key and the team Tavily key.
// Usage: node scripts/check-brand-names.mjs Apple Visa ...
import fs from 'node:fs'
import os from 'node:os'
import Anthropic from '@anthropic-ai/sdk'
import { discoverBrand } from '../server/brand.js'

const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
Object.assign(process.env, envFile(`${os.homedir()}/.config/casebuilder/search.env`))
const client = new Anthropic({ apiKey: T.ANTHROPIC_API_KEY })
let bad = 0
for (const company of process.argv.slice(2)) {
  const t0 = Date.now()
  try {
    const b = await discoverBrand({ company }, undefined, client)
    const ok = b.status !== 'error' && !!b.website
    if (!ok) bad++
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${company}: status=${b.status} website=${b.website || '-'} logo=${b.logo ? 'yes' : 'no'} colors=${(b.colors || []).length} ${b.message ? '| ' + b.message.slice(0, 200) : ''} (${Math.round((Date.now() - t0) / 1000)}s)`)
  } catch (e) {
    bad++
    console.log(`FAIL ${company}: threw ${String(e.message).slice(0, 300)} (${Math.round((Date.now() - t0) / 1000)}s)`)
  }
}
process.exit(bad ? 1 : 0)
