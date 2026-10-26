// Remove what today's (2026-10-26) old-review runs left on the TEST account: project files created
// today on the Spotify sample and Visa e4q7d2d projects, and the stray "Earlier chat" with one OK reply
// on Visa. Refuses anything not owned by the test user. Prints what it deletes.
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}` }
const rest = (p, init = {}) => fetch(`${W.SUPABASE_URL}/rest/v1/${p}`, { ...init, headers: { ...H, ...(init.headers || {}) } })
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
const files = await (await rest(`project_files?owner_id=eq.${owner}&created_at=gte.2026-10-26T18:00:00Z&select=id,deal_id,name,kind,created_at`)).json()
console.log('files to delete:', files.map(f => `${f.deal_id.slice(0, 8)} ${f.kind} ${f.name}`).join(' | '))
for (const f of files) await rest(`project_files?id=eq.${f.id}&owner_id=eq.${owner}`, { method: 'DELETE' })
const chatId = 'b08fb9db-5954-4049-ac43-ad35ae5b4f71'
const [chat] = await (await rest(`chats?id=eq.${chatId}&owner_id=eq.${owner}&select=id,title`)).json()
const msgs = chat ? await (await rest(`chat_messages?chat_id=eq.${chatId}&select=id,role,content`)).json() : []
if (chat && msgs.length === 1 && /^OK/.test(msgs[0].content)) {
  await rest(`chat_messages?chat_id=eq.${chatId}`, { method: 'DELETE' })
  await rest(`chats?id=eq.${chatId}`, { method: 'DELETE' })
  console.log('deleted stray chat', chat.title)
} else console.log('stray chat NOT deleted (not as expected):', chat?.title, msgs.length)
const left = await (await rest(`project_files?owner_id=eq.${owner}&created_at=gte.2026-10-26T18:00:00Z&select=id`)).json()
console.log('today files left:', left.length)
