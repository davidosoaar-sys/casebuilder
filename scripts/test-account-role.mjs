// Temporarily set the TEST account's role, for exercising admin-only UI.
// Usage: node scripts/test-account-role.mjs admin|user   (prints the role read back)
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const role = process.argv[2]
if (!['admin', 'user'].includes(role)) { console.error('role must be admin or user'); process.exit(2) }
const h = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}`, 'Content-Type': 'application/json' }
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: h })).json()
const u = users.users.find(x => x.email === 'test@casebuilder.dev')
if (!u) { console.error('test account not found'); process.exit(1) }
const before = await (await fetch(`${W.SUPABASE_URL}/rest/v1/profiles?id=eq.${u.id}&select=role`, { headers: h })).json()
const r = await fetch(`${W.SUPABASE_URL}/rest/v1/profiles?id=eq.${u.id}`, { method: 'PATCH', headers: { ...h, Prefer: 'return=representation' }, body: JSON.stringify({ role }) })
const after = await r.json()
console.log('before', before[0]?.role, 'after', after[0]?.role, r.status)
