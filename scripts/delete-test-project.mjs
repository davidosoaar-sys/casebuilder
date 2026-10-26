// Delete TEST-account projects created by review scripts, by exact name. Refuses anything not
// owned by test@casebuilder.dev. Usage: node scripts/delete-test-project.mjs "Northwind Review"
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}`, Prefer: 'return=representation' }
const name = process.argv[2]
if (!name) { console.log('usage: delete-test-project.mjs <name>'); process.exit(1) }
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
const deals = await (await fetch(`${W.SUPABASE_URL}/rest/v1/deals?owner_id=eq.${owner}&name=eq.${encodeURIComponent(name)}&select=id,name`, { headers: H })).json()
for (const d of deals) {
  for (const t of ['chat_messages', 'chats', 'jobs']) await fetch(`${W.SUPABASE_URL}/rest/v1/${t}?deal_id=eq.${d.id}&owner_id=eq.${owner}`, { method: 'DELETE', headers: H })
  const r = await (await fetch(`${W.SUPABASE_URL}/rest/v1/deals?id=eq.${d.id}&owner_id=eq.${owner}`, { method: 'DELETE', headers: H })).json()
  console.log('deleted', d.id, d.name, r.length)
}
console.log('matched', deals.length)
