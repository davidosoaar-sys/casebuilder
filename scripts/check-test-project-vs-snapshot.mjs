// Compare the TEST account's Spotify project deck now vs the snapshot taken before the agent-deck review.
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}` }
const snapFile = process.argv[2]
const snap = JSON.parse(fs.readFileSync(snapFile, 'utf8'))
const id = snap.id || process.argv[3]
console.log('snapshot keys', Object.keys(snap).join(','), 'id', id)
const [row] = await (await fetch(`${W.SUPABASE_URL}/rest/v1/deals?id=eq.${id}&select=id,name,updated_at,data`, { headers: H })).json()
const now = row.data
const sig = d => (d || []).map(s => `${s.id}:${(s.blocks || []).map(b => `${b.id}/${b.type}/${b.style || ''}/${String(b.text ?? b.left ?? '').slice(0, 40)}`).join('|')}|${JSON.stringify(s.design || {})}`)
const a = sig(snap.deck), b = sig(now.deck)
console.log('project', row.name, 'updated', row.updated_at)
console.log('pages snapshot', a.length, 'now', b.length)
console.log('deck identical:', JSON.stringify(a) === JSON.stringify(b))
a.forEach((x, i) => { if (x !== b[i]) console.log('DIFF page', i + 1, '\n  was', x.slice(0, 300), '\n  now', (b[i] || '').slice(0, 300)) })
const ck = ['primary', 'background', 'surface', 'text', 'muted', 'headingFont', 'bodyFont', 'logo']
console.log('brand identical:', ck.every(k => (snap.brand || {})[k] === (now.brand || {})[k]), ck.filter(k => (snap.brand || {})[k] !== (now.brand || {})[k]).join(','))
if (snap.fields) { const fa = JSON.stringify(snap.fields.map(f => [f.key, f.value])), fb = JSON.stringify((now.fields || []).map(f => [f.key, f.value])); console.log('fields identical:', fa === fb) }
if (snap.stakeholders) console.log('stakeholders identical:', JSON.stringify(snap.stakeholders) === JSON.stringify(now.stakeholders))
