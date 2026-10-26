// Read-only: what did the old review run leave in the TEST account? Schedules, skills, and chat
// messages from the last 2 hours. Usage: node scripts/check-test-leftovers.mjs
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}` }
const rest = async path => (await fetch(`${W.SUPABASE_URL}/rest/v1/${path}`, { headers: H })).json()
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = (users.users || []).find(u => u.email === (T.TEST_EMAIL || 'test@casebuilder.dev'))?.id
console.log('test owner found:', !!owner)
const since = encodeURIComponent(new Date(Date.now() - 2 * 3600e3).toISOString())
const schedules = await rest(`schedules?owner_id=eq.${owner}&select=id,title,created_at`)
const skills = await rest(`skills?owner_id=eq.${owner}&select=id,name,created_at`)
const deals = await rest(`deals?owner_id=eq.${owner}&select=id,name`)
const ids = deals.map(d => d.id)
const chats = ids.length ? await rest(`chats?deal_id=in.(${ids.join(',')})&select=id,title,deal_id,created_at`) : []
const msgs = chats.length ? await rest(`chat_messages?chat_id=in.(${chats.map(c => c.id).join(',')})&created_at=gte.${since}&select=id,chat_id,role,created_at,content`) : []
console.log(JSON.stringify({
  schedules, skills,
  newChats: chats.filter(c => c.created_at >= decodeURIComponent(since)).map(c => ({ id: c.id, title: c.title, deal: deals.find(d => d.id === c.deal_id)?.name })),
  recentMessages: msgs.map(m => ({ id: m.id, chat: chats.find(c => c.id === m.chat_id)?.title, deal: deals.find(d => d.id === chats.find(c => c.id === m.chat_id)?.deal_id)?.name, role: m.role, at: m.created_at, text: String(m.content || '').slice(0, 70) })),
}, null, 1))
