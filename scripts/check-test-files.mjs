// Read-only: TEST account project files of kind 'instructions' (and any containing NORTHWIND).
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}` }
const rest = async p => (await fetch(`${W.SUPABASE_URL}/rest/v1/${p}`, { headers: H })).json()
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
const deals = await rest(`deals?owner_id=eq.${owner}&select=id,name`)
const files = await rest(`project_files?deal_id=in.(${deals.map(d => d.id).join(',')})&select=*`)
if (!Array.isArray(files)) { console.log(JSON.stringify(files)); process.exit(0) }
for (const f of files) {
  const text = JSON.stringify(f)
  console.log(deals.find(d => d.id === f.deal_id)?.name, f.deal_id.slice(0, 8), f.kind, f.name || f.title || '', f.created_at, /NORTHWIND/.test(text) ? 'HAS NORTHWIND' : '')
}
console.log('files', files.length)
