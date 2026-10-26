// Read-only: the TEST account's Visa deal engineers input + who set it. Usage: node scripts/check-visa-engineers.mjs
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}` }
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
const [d] = await (await fetch(`${W.SUPABASE_URL}/rest/v1/deals?owner_id=eq.${owner}&name=eq.Visa&select=id,updated_at,data`, { headers: H })).json()
const f = (d.data.fields || []).find(x => x.key === 'engineers')
console.log(JSON.stringify({ updated: d.updated_at, engineers: f && { value: f.value, source: f.source }, agentLogEntries: Object.keys(d.data.agentLog || {}).length }, null, 1))
