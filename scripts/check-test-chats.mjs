// Read-only: every chat on the TEST account, with its project and message count.
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}` }
const rest = async p => (await fetch(`${W.SUPABASE_URL}/rest/v1/${p}`, { headers: H })).json()
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
const deals = await rest(`deals?owner_id=eq.${owner}&select=id,name,updated_at&order=updated_at.desc`)
const chats = await rest(`chats?owner_id=eq.${owner}&select=id,title,deal_id,created_at`)
const msgs = chats.length ? await rest(`chat_messages?chat_id=in.(${chats.map(c => c.id).join(',')})&select=chat_id`) : []
console.log('projects (newest first):', deals.map(d => `${d.name} ${d.id.slice(0, 8)}`).join(' | '))
for (const c of chats) console.log(`${deals.find(d => d.id === c.deal_id)?.name || '?'} | ${c.title} | ${msgs.filter(m => m.chat_id === c.id).length} msgs | ${c.created_at.slice(0, 16)}`)
console.log('total chats', chats.length)
