// Print the full brand result for one company (colours, logo shape, background), image data truncated.
// Usage: node scripts/inspect-brand.mjs Apple
import fs from 'node:fs'
import os from 'node:os'
import Anthropic from '@anthropic-ai/sdk'
import { discoverBrand } from '../server/brand.js'

const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
Object.assign(process.env, envFile(`${os.homedir()}/.config/casebuilder/search.env`))
const client = new Anthropic({ apiKey: T.ANTHROPIC_API_KEY })
const company = process.argv[2] || 'Apple'
const b = await discoverBrand({ company }, undefined, client)
const short = v => typeof v === 'string' && v.startsWith('data:') ? `${v.slice(0, 40)}... (${v.length} chars)` : v
const out = JSON.parse(JSON.stringify(b, (k, v) => short(v)))
delete out.review; delete out.colorEvidence
console.log(JSON.stringify(out, null, 1).slice(0, 6000))
const save = (name, d) => { if (typeof d === 'string' && d.startsWith('data:image/')) { const m = d.match(/^data:image\/([a-z+]+);base64,(.*)$/); if (m) { const f = `/tmp/brand-${company}-${name}.${m[1].replace('svg+xml', 'svg')}`; fs.writeFileSync(f, Buffer.from(m[2], 'base64')); console.log('saved', f) } } }
save('logo', b.logo); save('icon', b.icon); (b.logoVariants || []).forEach((v, i) => save('variant' + i, v.logo))
