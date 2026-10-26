// Read-only: the messages in one chat. Usage: node scripts/show-chat.mjs <chat-title-substring> <deal-name>
import fs from 'node:fs'
import os from 'node:os'
const [title, dealName] = process.argv.slice(2)
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}` }
const rest = async p => (await fetch(`${W.SUPABASE_URL}/rest/v1/${p}`, { headers: H })).json()
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
const deals = await rest(`deals?owner_id=eq.${owner}&select=id,name`)
const deal = deals.find(d => d.name === dealName && true)
const chats = (await rest(`chats?owner_id=eq.${owner}&select=id,title,deal_id,created_at`)).filter(c => c.title.includes(title) && deals.find(d => d.id === c.deal_id)?.name === dealName)
for (const c of chats) {
  const m = await rest(`chat_messages?chat_id=eq.${c.id}&select=id,role,created_at,content,meta&order=created_at`)
  console.log(c.id, c.created_at, JSON.stringify(m.map(x => ({ role: x.role, at: x.created_at, text: String(x.content).slice(0, 120), meta: Object.keys(x.meta || {}) })), null, 1))
}
