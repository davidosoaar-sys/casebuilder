// Read-only: recent chat exchanges (any account, emails masked) that mention the Live room,
// screenshots/images, or the one-pager, to see what users asked and what the agent answered.
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}` }
const get = p => fetch(`${W.SUPABASE_URL}/rest/v1/${p}`, { headers: H }).then(r => r.json())
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const em = Object.fromEntries(users.users.map(u => [u.id, u.email.replace(/^(..).*@/, '$1***@')]))
const pat = process.argv[2] || '(live room|live-room|website|one-pager|onepager|screenshot|image)'
const rows = await get(`chat_messages?role=eq.user&content=imatch.${encodeURIComponent(pat)}&order=created_at.desc&limit=12&select=id,chat_id,owner_id,created_at,content`)
for (const m of rows) {
  if (/test@casebuilder|te\*\*\*@casebuilder/.test(em[m.owner_id] || '')) continue
  const next = await get(`chat_messages?chat_id=eq.${m.chat_id}&id=gt.${m.id}&role=eq.assistant&order=id.asc&limit=1&select=content,meta`)
  console.log(`\n[${m.created_at.slice(0, 16)}] ${em[m.owner_id]} USER: ${m.content.replace(/\s+/g, ' ').slice(0, 220)}`)
  if (next[0]) console.log(`   AGENT: ${next[0].content.replace(/\s+/g, ' ').slice(0, 320)}  {deck_ops: ${(next[0].meta?.deck_ops || next[0].meta?.deckOps || []).length}}`)
}
