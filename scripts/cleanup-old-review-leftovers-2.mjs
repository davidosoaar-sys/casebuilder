// TEST account cleanup after the 2026-10-26 old-review runs:
// - cancel the two test research jobs left "running" (worker stopped mid-run)
// - delete the stray Visa e4q7d2d "Earlier chat" created 18:51 and any "News mvpmbo9q" test schedule
// - put Visa e4q7d2d engineers back to blank (the first run logged engineers= empty before the test set 1234)
// Refuses anything not owned by the test user. Prints what it did.
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }
const rest = (p, init = {}) => fetch(`${W.SUPABASE_URL}/rest/v1/${p}`, { ...init, headers: { ...H, ...(init.headers || {}) } })
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
for (const id of ['e9504a4c-3230-4420-bb98-6c3a3df56de6']) {
  const r = await (await rest(`jobs?id=eq.${id}&owner_id=eq.${owner}&status=eq.running`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled', error: 'test run cleanup' }) })).json()
  console.log('cancelled', id.slice(0, 8), r.length)
}
const stuck = await (await rest(`jobs?owner_id=eq.${owner}&status=in.(running,queued)&select=id`)).json()
for (const j of stuck) {
  const r = await (await rest(`jobs?id=eq.${j.id}&owner_id=eq.${owner}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled', error: 'test run cleanup' }) })).json()
  console.log('cancelled', j.id.slice(0, 8), r.length)
}
const chats = await (await rest(`chats?owner_id=eq.${owner}&deal_id=eq.e4q7d2d&created_at=gte.2026-10-26T18:00:00Z&select=id,title`)).json()
for (const c of chats) { await rest(`chat_messages?chat_id=eq.${c.id}`, { method: 'DELETE' }); await rest(`chats?id=eq.${c.id}`, { method: 'DELETE' }); console.log('deleted chat', c.title) }
const sch = await (await rest(`schedules?owner_id=eq.${owner}&title=like.News%20mvp*`, { method: 'DELETE' })).json()
console.log('deleted schedules', sch.length)
const [deal] = await (await rest(`deals?id=eq.e4q7d2d&owner_id=eq.${owner}&select=data`)).json()
const fields = deal.data.fields.map(f => f.key === 'engineers' ? { ...f, value: '', source: { state: 'empty', origin: '' } } : f)
const up = await (await rest(`deals?id=eq.e4q7d2d&owner_id=eq.${owner}`, { method: 'PATCH', body: JSON.stringify({ data: { ...deal.data, fields } }) })).json()
console.log('visa engineers reset', up.length, JSON.stringify(up[0]?.data.fields.find(f => f.key === 'engineers')?.value))
