// Harness pump: while a review runs with the live worker paused, hand every job the
// TEST account queues to the NEW worker.py on the VPS (handle_one.py), one at a time.
// Only TEST-owned jobs created after the pump started; real users' jobs are never
// touched (they wait in the queue until the live worker restarts after the review).
// Usage: node scripts/harness-pump.mjs   (runs until killed; logs each job)
import fs from 'node:fs'
import os from 'node:os'
import { execFile } from 'node:child_process'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}`, 'Content-Type': 'application/json' }
const rest = (path, init = {}) => fetch(`${W.SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } })
const sleep = ms => new Promise(r => setTimeout(r, ms))
const since = new Date(Date.now() - 5000).toISOString()
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev')?.id
if (!owner) { console.log('pump: TEST account not found'); process.exit(1) }
const runOne = id => new Promise(res => execFile('ssh', ['casebuilder-vps',
  `sudo -u casebuilder bash -c 'cd /home/casebuilder/worker-harness && set -a && . /home/casebuilder/worker/worker.env && set +a && python3 handle_one.py ${id}'`],
  { encoding: 'utf8', timeout: 600000 }, (err, out, errOut) => res(err ? `ERROR ${String(errOut || err.message).trim().split('\n').at(-1)}` : out.trim().split('\n').at(-1))))
console.log(`pump: watching TEST jobs since ${since}`)
for (;;) {
  // Claim the oldest queued TEST job atomically (status=queued in the filter, so a
  // job someone else already took is never taken twice).
  const pick = await rest(`jobs?owner_id=eq.${owner}&status=eq.queued&created_at=gte.${encodeURIComponent(since)}&order=created_at.asc&limit=1&select=id,kind`).then(r => r.ok ? r.json() : []).catch(() => [])
  if (!pick.length) { await sleep(400); continue }
  const { id, kind } = pick[0]
  const lock = await rest(`jobs?id=eq.${id}&status=eq.queued`, { method: 'PATCH', headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ status: 'running', locked_by: 'harness', locked_at: new Date().toISOString(), attempts: 1 }) }).then(r => r.ok ? r.json() : []).catch(() => [])
  if (!lock.length) continue
  const t0 = Date.now()
  console.log(`pump: ${kind} ${id.slice(0, 8)} -> new worker`)
  const res = await runOne(id)
  console.log(`pump: ${kind} ${id.slice(0, 8)} done in ${Math.round((Date.now() - t0) / 1000)}s ${res}`)
}
