// Read-only: print the live definition of a Postgres function (Management API).
// Usage: node scripts/show-function.mjs set_model_key
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const { SUPABASE_ACCESS_TOKEN: tok } = envFile(`${os.homedir()}/.config/casebuilder/supabase-admin.env`)
const { SUPABASE_URL } = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const ref = new URL(SUPABASE_URL).hostname.split('.')[0]
const name = process.argv[2]
if (!/^[a-z_]+$/.test(name || '')) { console.log('usage: show-function.mjs <name>'); process.exit(1) }
const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: 'POST',
  headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: `select pg_get_functiondef(p.oid) def, array_to_string(p.proacl, ',') acl from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = '${name}'` }) })
const rows = await r.json()
for (const x of rows) { console.log(x.def); console.log('-- acl:', x.acl) }
