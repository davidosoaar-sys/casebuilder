// Run one migration file on the live Supabase project via the Management API,
// then print the waitlist columns to prove it landed.
// Usage: node scripts/apply-migration.mjs supabase/migrations/0008_approval_emails.sql
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const { SUPABASE_ACCESS_TOKEN: tok } = envFile(`${os.homedir()}/.config/casebuilder/supabase-admin.env`)
const { SUPABASE_URL } = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const ref = new URL(SUPABASE_URL).hostname.split('.')[0]
const q = async query => {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) })
  const t = await r.text(); if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 300)}`); return JSON.parse(t)
}
const file = process.argv[2]
console.log('apply', file, JSON.stringify(await q(fs.readFileSync(file, 'utf8'))))
if (process.argv[3] !== '--no-waitlist-check') console.log('columns', (await q(`select column_name from information_schema.columns where table_schema='public' and table_name='waitlist' and column_name like 'approval%' order by 1`)).map(r => r.column_name).join(', '))
if (process.argv[3] !== '--no-waitlist-check') console.log('fn has pending', (await q(`select count(*)::int n from pg_proc where proname in ('approve_email','invite_from_waitlist') and prosrc like '%pending%'`))[0].n)
