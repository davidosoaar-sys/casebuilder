// Read-only: TEST account agent jobs in the last hour (deal, chat, status, message), and each project's
// saved instructions. Usage: node scripts/check-recent-jobs.mjs
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}` }
const rest = async p => (await fetch(`${W.SUPABASE_URL}/rest/v1/${p}`, { headers: H })).json()
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
const deals = await rest(`deals?owner_id=eq.${owner}&select=id,name,data`)
const name = id => { const d = deals.find(x => x.id === id); return d ? `${d.name} ${d.id.slice(0, 8)}` : String(id) }
const since = encodeURIComponent(new Date(Date.now() - 3600e3).toISOString())
const jobs = await rest(`jobs?created_at=gte.${since}&select=*&order=created_at`)
if (!Array.isArray(jobs)) console.log('agent_jobs:', JSON.stringify(jobs).slice(0, 300))
else for (const j of jobs) console.log(j.created_at.slice(11, 19), name(j.deal_id), 'chat', String(j.payload?.chat_id || j.chat_id || '').slice(0, 8), j.status, JSON.stringify(String(j.payload?.message || '').slice(0, 70)))
for (const d of deals) console.log('instructions', name(d.id), JSON.stringify(String(d.data?.instructions || '').slice(0, 80)))
