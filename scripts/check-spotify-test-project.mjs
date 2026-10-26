// Spotify test project: page/block counts and any editor-review leftovers (vs the pre-review shoot: 6 pages, 24 blocks).
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}` }
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
const [row] = await (await fetch(`${W.SUPABASE_URL}/rest/v1/deals?owner_id=eq.${owner}&name=eq.Spotify&select=id,version,updated_at,data`, { headers: H })).json()
const d = row.data
const blocks = d.deck.flatMap(s => s.blocks)
const ids = blocks.map(b => b.id)
console.log('version', row.version, 'updated', row.updated_at)
console.log('pages', d.deck.length, 'blocks', blocks.length, 'duplicate block ids', ids.length - new Set(ids).size)
console.log('page designs', JSON.stringify(d.deck.map(s => s.design || null)))
console.log('suspicious text', JSON.stringify(blocks.filter(b => /^(New text|New heading|New page|Text|First point)/.test(String(b.text || ''))).map(b => b.text)))
console.log('stakeholders', (d.stakeholders || []).length, 'fields', (d.fields || []).length, 'brand bg', d.brand?.background)
d.deck.forEach((s, i) => console.log(` ${i + 1}. ${s.variant} | ${s.blocks.map(b => b.type + (b.style ? ':' + b.style : '')).join(', ')}`))
