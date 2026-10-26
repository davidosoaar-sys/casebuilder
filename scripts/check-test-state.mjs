// Read-only: TEST account jobs not finished, recent jobs' kind/timing, Visa e4q7d2d engineers, schedules.
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}` }
const rest = async p => (await fetch(`${W.SUPABASE_URL}/rest/v1/${p}`, { headers: H })).json()
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
const since = encodeURIComponent(new Date(Date.now() - 3 * 3600e3).toISOString())
const jobs = await rest(`jobs?owner_id=eq.${owner}&created_at=gte.${since}&select=id,kind,status,deal_id,created_at,locked_at,updated_at,attempts,locked_by,error,payload,schedule_id&order=created_at`)
for (const j of jobs) if (j.status !== 'done' || j.kind !== 'chat') console.log('JOB', j.id.slice(0, 8), j.kind, j.status, j.deal_id?.slice(0, 8), j.created_at.slice(11, 19), 'locked', String(j.locked_at || '').slice(11, 19), 'upd', String(j.updated_at || '').slice(11, 19), 'try', j.attempts, j.locked_by, 'sched', String(j.schedule_id||'').slice(0,8), j.error || '', JSON.stringify(Object.keys(j.payload || {})), JSON.stringify(String(j.payload?.message || j.payload?.question || '').slice(0, 60)))
const [visa] = await rest(`deals?id=eq.e4q7d2d&select=id,updated_at,data`)
const f = (visa?.data?.fields || []).find(x => x.key === 'engineers')
console.log('VISA e4q7d2d engineers', JSON.stringify(f?.value), JSON.stringify(f?.source), 'updated', visa?.updated_at)
const sch = await rest(`schedules?owner_id=eq.${owner}&select=id,title,created_at`)
console.log('schedules', JSON.stringify(sch))
const sk = await rest(`skills?owner_id=eq.${owner}&select=id,name`)
console.log('skills', JSON.stringify(sk))
