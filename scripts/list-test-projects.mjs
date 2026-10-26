// List the TEST account's projects with deck signature + saved time, to see what the editor review touched.
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}` }
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
const rows = await (await fetch(`${W.SUPABASE_URL}/rest/v1/deals?owner_id=eq.${owner}&select=id,name,updated_at,data&order=updated_at.desc`, { headers: H })).json()
for (const r of rows) {
  const d = r.data || {}
  console.log(`${r.id} | ${r.name} | updated ${r.updated_at} | pages ${(d.deck || []).length} | titles: ${(d.deck || []).map(s => (s.blocks || []).find(b => b.type === 'text' && /hero|title|headline/.test(b.style))?.text?.slice(0, 22) || '-').join(' / ')}`)
}
// versions table, if it exists, shows the save history
const v = await fetch(`${W.SUPABASE_URL}/rest/v1/deal_versions?select=deal_id,created_at&order=created_at.desc&limit=30`, { headers: H })
if (v.ok) { const vs = await v.json(); const by = {}; vs.forEach(x => (by[x.deal_id] ||= []).push(x.created_at.slice(11, 19))); console.log('recent versions', JSON.stringify(by)) } else console.log('no deal_versions table', v.status)
