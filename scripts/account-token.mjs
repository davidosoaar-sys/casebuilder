// Sign in as the TEST account and print its access token (for scripts that call RPCs as that user).
import fs from 'node:fs'
import os from 'node:os'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
// This is an explicit live utility, not an offline node:test suite.
if (!process.env.NODE_TEST_CONTEXT) {
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const L = envFile(new URL('../.env.local', import.meta.url))
const r = await fetch(`${L.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: L.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'test@casebuilder.dev', password: T.TEST_PASSWORD }) })
const j = await r.json(); if (!j.access_token) { console.error('sign-in failed', r.status); process.exit(1) }
process.stdout.write(j.access_token)

}
