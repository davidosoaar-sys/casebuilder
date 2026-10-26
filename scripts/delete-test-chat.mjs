// Delete ONE test chat (and its messages) from the TEST account, by id, after checking it belongs to the
// test user's deal. Usage: node scripts/delete-test-chat.mjs <chat-id>
import fs from 'node:fs'
import os from 'node:os'
const id = process.argv[2]
if (!/^[0-9a-f-]{36}$/.test(id || '')) { console.log('usage: <chat-id>'); process.exit(1) }
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}` }
const rest = (p, init = {}) => fetch(`${W.SUPABASE_URL}/rest/v1/${p}`, { ...init, headers: { ...H, ...(init.headers || {}) } })
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
const [chat] = await (await rest(`chats?id=eq.${id}&select=id,deal_id,title`)).json()
if (!chat) { console.log('no such chat'); process.exit(1) }
const [deal] = await (await rest(`deals?id=eq.${chat.deal_id}&select=owner_id,name`)).json()
if (deal?.owner_id !== owner) { console.log('REFUSED: chat is not on a TEST account deal'); process.exit(1) }
await rest(`chat_messages?chat_id=eq.${id}`, { method: 'DELETE' })
const r = await rest(`chats?id=eq.${id}`, { method: 'DELETE' })
const left = await (await rest(`chats?id=eq.${id}&select=id`)).json()
console.log(JSON.stringify({ deal: deal.name, title: chat.title, deleteStatus: r.status, gone: left.length === 0 }))
