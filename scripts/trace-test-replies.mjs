// Read-only: the newest TEST jobs (kind/status/payload chat) and the chats + last messages of each, to trace
// where an agent reply landed.
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}` }
const get = p => fetch(`${W.SUPABASE_URL}/rest/v1/${p}`, { headers: H }).then(r => r.json())
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
const jobs = await get(`jobs?owner_id=eq.${owner}&created_at=gte.2026-10-26T16:25:00Z&order=created_at.asc&select=id,kind,status,deal_id,created_at,payload,result`)
for (const j of jobs) console.log('JOB', j.id.slice(0, 8), j.kind, j.status, j.created_at.slice(11, 19), 'deal', j.deal_id.slice(0, 8), 'chat', String(j.payload?.chat_id || '-').slice(0, 8), 'result', JSON.stringify(j.result || {}).slice(0, 120))
const chats = await get(`chats?owner_id=eq.${owner}&select=id,deal_id,title,created_at&order=created_at.desc&limit=6`)
for (const c of chats) {
  const msgs = await get(`chat_messages?chat_id=eq.${c.id}&order=id.desc&limit=4&select=id,role,created_at,content`)
  console.log('CHAT', c.id.slice(0, 8), 'deal', c.deal_id.slice(0, 8), c.title, c.created_at.slice(0, 19))
  for (const m of msgs) console.log('   ', m.role, m.created_at.slice(11, 19), String(m.content).replace(/\s+/g, ' ').slice(0, 110))
}
