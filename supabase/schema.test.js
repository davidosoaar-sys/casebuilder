// Runs the real migration against real Postgres (PGlite, in-process, no
// Docker) with a minimal stand-in for Supabase's auth schema and roles.
// Proves the things that would be expensive to discover in production:
// account isolation, stale-write protection, the job queue, and schedules.
import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const A = '00000000-0000-0000-0000-00000000000a'
const B = '00000000-0000-0000-0000-00000000000b'
const ADMIN = '00000000-0000-0000-0000-0000000000ad'
let db

// Supabase's auth.uid() reads the JWT subject from request.jwt.claim(s).
const SUPABASE_STUB = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  -- Minimal Supabase Vault: same function signatures, no real encryption.
  create schema vault;
  create table vault.secrets (id uuid primary key default gen_random_uuid(), name text unique, description text, secret text);
  create function vault.create_secret(new_secret text, new_name text default null, new_description text default '', new_key_id uuid default null)
    returns uuid language sql as $$ insert into vault.secrets (secret, name, description) values (new_secret, new_name, new_description) returning id $$;
  create function vault.update_secret(secret_id uuid, new_secret text default null, new_name text default null, new_description text default null, new_key_id uuid default null)
    returns void language sql as $$ update vault.secrets set secret = coalesce(new_secret, secret) where id = secret_id $$;
  create view vault.decrypted_secrets as select id, name, secret as decrypted_secret from vault.secrets;
`

// Run fn as a given Supabase identity, inside a transaction that resets role.
async function as(role, uid, fn) {
  return db.transaction(async tx => {
    await tx.query(`set local role ${role}`)
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid ?? ''])
    return fn(tx)
  })
}
const user = (uid, fn) => as('authenticated', uid, fn)
const service = fn => as('service_role', null, fn)
const deal = (id, name = 'Acme') => ({ id, name, fields: [], stakeholders: [], deck: [], connectors: {} })

async function rejects(p, pattern) {
  await assert.rejects(p, err => pattern.test(err.message), `expected error matching ${pattern}`)
}

before(async () => {
  db = new PGlite()
  await db.exec(SUPABASE_STUB)
  await db.exec(readFileSync(new URL('./migrations/0001_init.sql', import.meta.url), 'utf8'))
  await db.exec(readFileSync(new URL('./migrations/0003_model_keys.sql', import.meta.url), 'utf8'))
  await db.exec(readFileSync(new URL('./migrations/0004_project_files.sql', import.meta.url), 'utf8'))
  await db.exec(`insert into auth.users (id, email) values
    ('${A}', 'a@x.com'), ('${B}', 'b@x.com'), ('${ADMIN}', 'admin@x.com')`)
  await db.exec(`update public.profiles set role = 'admin' where id = '${ADMIN}'`)
  // The waitlist gate goes on after the seed accounts exist, as it did in production.
  await db.exec(readFileSync(new URL('./migrations/0005_waitlist.sql', import.meta.url), 'utf8'))
  await db.exec(readFileSync(new URL('./migrations/0006_waitlist_passthrough.sql', import.meta.url), 'utf8'))
  await db.exec(readFileSync(new URL('./migrations/0007_stakeholder_briefs.sql', import.meta.url), 'utf8'))
  await db.exec(readFileSync(new URL('./migrations/0008_approval_emails.sql', import.meta.url), 'utf8'))
  for (const [uid, id] of [[A, 'deal-a'], [B, 'deal-b']]) {
    await user(uid, tx => tx.query(
      'insert into public.deals (id, owner_id, name, data) values ($1, $2, $3, $4)',
      [id, uid, 'Acme', deal(id)]))
  }
})

test('signup creates a profile with role user', async () => {
  const { rows } = await user(A, tx => tx.query('select role from public.profiles where id = $1', [A]))
  assert.equal(rows[0].role, 'user')
})

test('a user cannot promote themselves to admin', async () => {
  await rejects(user(A, tx => tx.query(`update public.profiles set role = 'admin' where id = $1`, [A])), /only be changed by an admin/)
})

test('a user sees only their own deals', async () => {
  const { rows } = await user(A, tx => tx.query('select id from public.deals'))
  assert.deepEqual(rows.map(r => r.id), ['deal-a'])
})

test('a user cannot read, edit or delete another account\'s deal', async () => {
  await user(A, async tx => {
    assert.equal((await tx.query(`select 1 from public.deals where id = 'deal-b'`)).rows.length, 0)
    assert.equal((await tx.query(`update public.deals set name = 'pwned' where id = 'deal-b'`)).affectedRows, 0)
    assert.equal((await tx.query(`delete from public.deals where id = 'deal-b'`)).affectedRows, 0)
  })
  const { rows } = await service(tx => tx.query(`select name from public.deals where id = 'deal-b'`))
  assert.equal(rows[0].name, 'Acme')
})

test('a user cannot create a deal owned by someone else', async () => {
  await rejects(user(A, tx => tx.query(
    'insert into public.deals (id, owner_id, name, data) values ($1, $2, $3, $4)', ['x', B, 'X', deal('x')])), /row-level security/)
})

test('an admin can read every account\'s deals', async () => {
  const { rows } = await user(ADMIN, tx => tx.query('select id from public.deals order by id'))
  assert.deepEqual(rows.map(r => r.id), ['deal-a', 'deal-b'])
})

test('save_deal bumps the version, and a stale save is refused, not merged', async () => {
  const v = await user(A, tx => tx.query(`select version from public.deals where id = 'deal-a'`))
  const start = v.rows[0].version
  const r = await user(A, tx => tx.query('select public.save_deal($1, $2, $3, $4) as v', ['deal-a', 'Acme 2', deal('deal-a', 'Acme 2'), start]))
  assert.equal(r.rows[0].v, start + 1)
  // The agent read version `start` too and now tries to save over Chris's edit.
  await rejects(user(A, tx => tx.query('select public.save_deal($1, $2, $3, $4)', ['deal-a', 'Agent', deal('deal-a'), start])), /deal_conflict/)
  const { rows } = await user(A, tx => tx.query(`select name from public.deals where id = 'deal-a'`))
  assert.equal(rows[0].name, 'Acme 2')
})

test('save_deal cannot reach another account\'s deal', async () => {
  await rejects(user(A, tx => tx.query('select public.save_deal($1, $2, $3, $4)', ['deal-b', 'x', deal('deal-b'), 1])), /deal_not_found/)
})

test('chat: users post only user messages, only on their own deals', async () => {
  await user(A, tx => tx.query(`insert into public.chat_messages (deal_id, owner_id, role, content) values ('deal-a', $1, 'user', 'find 10 leads')`, [A]))
  await rejects(user(A, tx => tx.query(`insert into public.chat_messages (deal_id, owner_id, role, content) values ('deal-a', $1, 'assistant', 'fake')`, [A])), /row-level security/)
  await rejects(user(A, tx => tx.query(`insert into public.chat_messages (deal_id, owner_id, role, content) values ('deal-b', $1, 'user', 'hi')`, [A])), /row-level security/)
  const { rows } = await user(B, tx => tx.query('select * from public.chat_messages'))
  assert.equal(rows.length, 0)
})

test('jobs: a user cannot pre-complete, pre-lock or forge a job', async () => {
  const { rows } = await user(A, tx => tx.query(
    `insert into public.jobs (owner_id, deal_id, kind, status, attempts, result, locked_by)
     values ($1, 'deal-a', 'chat', 'done', 99, '{"fake":true}', 'evil') returning status, attempts, result, locked_by`, [A]))
  assert.deepEqual(rows[0], { status: 'queued', attempts: 0, result: null, locked_by: null })
  await rejects(user(A, tx => tx.query(`insert into public.jobs (owner_id, deal_id, kind) values ($1, 'deal-b', 'chat')`, [A])), /row-level security/)
  await rejects(user(A, tx => tx.query(`update public.jobs set status = 'done'`)), /permission denied/)
})

test('jobs: users cannot call worker functions', async () => {
  await rejects(user(A, tx => tx.query(`select * from public.claim_job('me')`)), /permission denied/)
  await rejects(user(A, tx => tx.query(`select public.enqueue_due_schedules()`)), /permission denied/)
})

test('queue: claim -> complete, and two workers never get the same job', async () => {
  await service(tx => tx.query(`delete from public.jobs`))
  await user(A, tx => tx.query(`insert into public.jobs (owner_id, deal_id, kind, payload) values ($1, 'deal-a', 'find_leads', '{"n":10}')`, [A]))
  const w1 = await service(tx => tx.query(`select * from public.claim_job('w1')`))
  const w2 = await service(tx => tx.query(`select * from public.claim_job('w2')`))
  assert.equal(w1.rows.length, 1)
  assert.equal(w2.rows.length, 0)
  assert.equal(w1.rows[0].status, 'running')
  // w2 cannot complete w1's job
  await rejects(service(tx => tx.query(`select public.complete_job($1, 'w2', '{}')`, [w1.rows[0].id])), /not running under worker w2/)
  await service(tx => tx.query(`select public.complete_job($1, 'w1', '{"leads":10}')`, [w1.rows[0].id]))
  const { rows } = await user(A, tx => tx.query('select status, result from public.jobs'))
  assert.deepEqual(rows[0], { status: 'done', result: { leads: 10 } })
})

test('stakeholder briefs: a user can queue one for their own deal, not for another account', async () => {
  await service(tx => tx.query(`delete from public.jobs`))
  await user(A, tx => tx.query(`insert into public.jobs (owner_id, deal_id, kind, payload) values ($1, 'deal-a', 'stakeholder_brief', '{"role_key":"finance"}')`, [A]))
  const { rows } = await user(A, tx => tx.query(`select kind, status from public.jobs`))
  assert.deepEqual(rows, [{ kind: 'stakeholder_brief', status: 'queued' }])
  await rejects(user(A, tx => tx.query(`insert into public.jobs (owner_id, deal_id, kind) values ($1, 'deal-b', 'stakeholder_brief')`, [A])), /row-level security/)
  await rejects(user(A, tx => tx.query(`insert into public.jobs (owner_id, deal_id, kind) values ($1, 'deal-a', 'not_a_kind')`, [A])), /jobs_kind_check/)
})

test('queue: a failing job retries with backoff, then fails for good', async () => {
  await service(tx => tx.query(`delete from public.jobs`))
  await user(A, tx => tx.query(`insert into public.jobs (owner_id, deal_id, kind) values ($1, 'deal-a', 'research')`, [A]))
  const statuses = []
  for (let i = 0; i < 3; i++) {
    await service(tx => tx.query(`update public.jobs set run_after = now()`)) // skip the backoff wait
    const { rows } = await service(tx => tx.query(`select * from public.claim_job('w1')`))
    const s = await service(tx => tx.query(`select public.fail_job($1, 'w1', 'boom') as s`, [rows[0].id]))
    statuses.push(s.rows[0].s)
  }
  assert.deepEqual(statuses, ['queued', 'queued', 'failed'])
})

test('queue: a job whose worker died is requeued', async () => {
  await service(tx => tx.query(`delete from public.jobs`))
  await user(A, tx => tx.query(`insert into public.jobs (owner_id, deal_id, kind) values ($1, 'deal-a', 'chat')`, [A]))
  const first = await service(tx => tx.query(`select * from public.claim_job('dead-worker')`))
  await service(tx => tx.query(`update public.jobs set locked_at = now() - interval '11 minutes'`))
  const second = await service(tx => tx.query(`select * from public.claim_job('w2')`))
  assert.equal(second.rows[0].id, first.rows[0].id)
  assert.equal(second.rows[0].locked_by, 'w2')
})

test('jobs: rate limit stops a runaway client', async () => {
  await service(tx => tx.query(`delete from public.jobs`))
  await rejects(user(A, async tx => {
    for (let i = 0; i < 31; i++) await tx.query(`insert into public.jobs (owner_id, deal_id, kind) values ($1, 'deal-a', 'chat')`, [A])
  }), /rate_limited/)
})

test('schedules: missed slots collapse into one job, and next run moves past now', async () => {
  await service(tx => tx.query(`delete from public.jobs`))
  await user(A, tx => tx.query(
    `insert into public.schedules (owner_id, deal_id, title, kind, every, timezone, next_run_at)
     values ($1, 'deal-a', 'daily recheck', 'recheck_assumptions', '1 day', 'Asia/Qatar', now() - interval '3 days 1 hour')`, [A]))
  const n = await service(tx => tx.query(`select public.enqueue_due_schedules() as n`))
  assert.equal(n.rows[0].n, 1)
  const again = await service(tx => tx.query(`select public.enqueue_due_schedules() as n`))
  assert.equal(again.rows[0].n, 0, 'running twice in the same minute must not double-queue')
  const { rows } = await service(tx => tx.query(`select next_run_at > now() as future, next_run_at < now() + interval '1 day' as within_a_day from public.schedules`))
  assert.deepEqual(rows[0], { future: true, within_a_day: true })
  const jobs = await user(A, tx => tx.query(`select kind, schedule_id is not null as scheduled from public.jobs`))
  assert.deepEqual(jobs.rows, [{ kind: 'recheck_assumptions', scheduled: true }])
})

test('schedules: no sub-hourly schedules, no month intervals, max 20 per account', async () => {
  const ins = every => user(B, tx => tx.query(
    `insert into public.schedules (owner_id, title, kind, every, next_run_at) values ($1, 't', 'chat', $2, now() + interval '1 day')`, [B, every]))
  await rejects(ins('5 minutes'), /check constraint/)
  await rejects(ins('1 month'), /check constraint/)
  for (let i = 0; i < 20; i++) await ins('1 day')
  await rejects(ins('1 day'), /schedule_limit/)
})

test('schedules: one account cannot attach a schedule to another account\'s deal', async () => {
  await rejects(user(A, tx => tx.query(
    `insert into public.schedules (owner_id, deal_id, title, kind, every, next_run_at) values ($1, 'deal-b', 't', 'chat', '1 day', now())`, [A])), /row-level security/)
})

const KEY_A = 'sk-ant-api03-' + 'a'.repeat(40) + 'WXYZ'
const KEY_B = 'sk-ant-api03-' + 'b'.repeat(40) + 'BBBB'

test('model keys: a user saves a key and sees only the last 4, never the key', async () => {
  const { rows } = await user(A, tx => tx.query(`select public.set_model_key('anthropic', $1) as l4`, [KEY_A]))
  assert.equal(rows[0].l4, 'WXYZ')
  const meta = await user(A, tx => tx.query('select provider, last4 from public.model_keys'))
  assert.deepEqual(meta.rows, [{ provider: 'anthropic', last4: 'WXYZ' }])
  await rejects(user(A, tx => tx.query('select secret_id from public.model_keys')), /permission denied/)
  await rejects(user(A, tx => tx.query('select * from vault.secrets')), /permission denied/)
  await rejects(user(A, tx => tx.query(`select public.get_model_key($1, 'anthropic')`, [A])), /permission denied/)
})

test('model keys: one account never sees or uses another account\'s key', async () => {
  await user(B, tx => tx.query(`select public.set_model_key('anthropic', $1)`, [KEY_B]))
  const seen = await user(B, tx => tx.query('select owner_id from public.model_keys'))
  assert.deepEqual(seen.rows.map(r => r.owner_id), [B])
  const a = await service(tx => tx.query(`select public.get_model_key($1, 'anthropic') as k`, [A]))
  const b = await service(tx => tx.query(`select public.get_model_key($1, 'anthropic') as k`, [B]))
  assert.equal(a.rows[0].k, KEY_A)
  assert.equal(b.rows[0].k, KEY_B)
})

test('model keys: replace updates in place, remove deletes the secret, junk is refused', async () => {
  const NEW = 'sk-ant-api03-' + 'c'.repeat(40) + 'NEW1'
  await user(A, tx => tx.query(`select public.set_model_key('anthropic', $1)`, [NEW]))
  const k = await service(tx => tx.query(`select public.get_model_key($1, 'anthropic') as k`, [A]))
  assert.equal(k.rows[0].k, NEW)
  assert.equal((await db.query(`select count(*)::int as n from vault.secrets where name like $1`, [`model_key:${A}:%`])).rows[0].n, 1)
  await rejects(user(A, tx => tx.query(`select public.set_model_key('anthropic', 'hello')`)), /does not look like an API key/)
  await rejects(user(A, tx => tx.query(`select public.set_model_key('anthropic', $1)`, ['sk-proj-' + 'x'.repeat(40)])), /start with sk-ant-/)
  await user(A, tx => tx.query(`select public.delete_model_key('anthropic')`))
  const gone = await service(tx => tx.query(`select public.get_model_key($1, 'anthropic') as k`, [A]))
  assert.equal(gone.rows[0].k, null)
  assert.equal((await db.query(`select count(*)::int as n from vault.secrets where name like $1`, [`model_key:${A}:%`])).rows[0].n, 0)
})

test('project files: owner adds, reads and removes files on their own deal only', async () => {
  const ins = await user(A, tx => tx.query(
    `insert into public.project_files (owner_id, deal_id, name, kind, text) values ($1, 'deal-a', 'Nike FY26.pdf', 'context', 'Revenue 51bn') returning id`, [A]))
  const id = ins.rows[0].id
  const mine = await user(A, tx => tx.query('select name from public.project_files'))
  assert.deepEqual(mine.rows.map(r => r.name), ['Nike FY26.pdf'])
  const theirs = await user(B, tx => tx.query('select id from public.project_files'))
  assert.equal(theirs.rows.length, 0)
  await rejects(user(B, tx => tx.query(
    `insert into public.project_files (owner_id, deal_id, name, text) values ($1, 'deal-a', 'x', 'x')`, [B])), /row-level security/)
  await rejects(user(A, tx => tx.query(
    `insert into public.project_files (owner_id, deal_id, name, text) values ($1, 'deal-b', 'x', 'x')`, [A])), /row-level security/)
  const del = await user(B, tx => tx.query('delete from public.project_files where id = $1', [id]))
  assert.equal(del.rowCount, 0)
  await user(A, tx => tx.query('delete from public.project_files where id = $1', [id]))
  assert.equal((await service(tx => tx.query('select count(*)::int as n from public.project_files'))).rows[0].n, 0)
})

test('project files: kind is checked and a project is capped', async () => {
  await rejects(user(A, tx => tx.query(
    `insert into public.project_files (owner_id, deal_id, name, kind, text) values ($1, 'deal-a', 'x', 'secret', 'x')`, [A])), /check constraint/)
  await rejects(user(A, tx => tx.query(
    `insert into public.project_files (owner_id, deal_id, name, text) values ($1, 'deal-a', 'big', repeat('x', 300001))`, [A])), /check constraint/)
})

const anon = fn => as('anon', null, fn)
const C = '00000000-0000-0000-0000-00000000000c'

test('waitlist: existing accounts were carried over as joined, nobody locked out', async () => {
  const { rows } = await service(tx => tx.query(`select email, status from public.waitlist order by email`))
  assert.deepEqual(rows.map(r => [r.email, r.status]), [['a@x.com', 'joined'], ['admin@x.com', 'joined'], ['b@x.com', 'joined']])
})

test('waitlist: a signed-out visitor can join, twice is silent, and cannot read the list', async () => {
  const first = await anon(tx => tx.query(`select public.join_waitlist('New.Person@Example.com', 'New Person', 'Account Executive', 'aleena') as s`))
  assert.equal(first.rows[0].s, 'waiting')
  const again = await anon(tx => tx.query(`select public.join_waitlist('new.person@example.com') as s`))
  assert.equal(again.rows[0].s, 'waiting')
  const { rows } = await service(tx => tx.query(`select email, role, source, status from public.waitlist where email like 'new.person%'`))
  assert.deepEqual(rows, [{ email: 'new.person@example.com', role: 'Account Executive', source: 'aleena', status: 'waiting' }])
  await rejects(anon(tx => tx.query(`select email from public.waitlist`)), /permission denied/)
  const seen = await user(A, tx => tx.query(`select email from public.waitlist`))
  assert.equal(seen.rows.length, 0)
  await rejects(anon(tx => tx.query(`select public.join_waitlist('not-an-email')`)), /valid email/)
  await rejects(anon(tx => tx.query(`insert into public.waitlist (email, status) values ('x@y.com', 'invited')`)), /permission denied|row-level/)
})

test('waitlist: only invited emails can create an account; admins invite', async () => {
  // Supabase Auth writes auth.users as the database owner, not as service_role.
  await rejects(db.query(`insert into auth.users (id, email) values ($1, 'new.person@example.com')`, [C]), /waitlist_only/)
  const id = (await service(tx => tx.query(`select id from public.waitlist where email = 'new.person@example.com'`))).rows[0].id
  await rejects(user(A, tx => tx.query(`select public.invite_from_waitlist($1)`, [id])), /only an admin/)
  const admin = await user(ADMIN, tx => tx.query(`select email, status from public.waitlist where email = 'new.person@example.com'`))
  assert.equal(admin.rows[0].status, 'waiting')
  await user(ADMIN, tx => tx.query(`select public.invite_from_waitlist($1)`, [id]))
  await db.query(`insert into auth.users (id, email) values ($1, 'New.Person@example.com')`, [C])
  const after = await service(tx => tx.query(`select status, joined_at is not null as j from public.waitlist where id = $1`, [id]))
  assert.deepEqual(after.rows[0], { status: 'joined', j: true })
  const prof = await service(tx => tx.query(`select role from public.profiles where id = $1`, [C]))
  assert.equal(prof.rows[0].role, 'user')
})

test('waitlist: an approved email passes straight through; existing accounts are told to sign in', async () => {
  await rejects(user(A, tx => tx.query(`select public.approve_email('vip@example.com')`)), /only an admin/)
  await user(ADMIN, tx => tx.query(`select public.approve_email('VIP@example.com')`))
  const r = await anon(tx => tx.query(`select public.join_waitlist('vip@example.com', 'Vera Vip', 'Founder', 'aleena') as s`))
  assert.equal(r.rows[0].s, 'invited')
  const row = await service(tx => tx.query(`select name, role, status from public.waitlist where email = 'vip@example.com'`))
  assert.deepEqual(row.rows[0], { name: 'Vera Vip', role: 'Founder', status: 'invited' })
  const has = await anon(tx => tx.query(`select public.join_waitlist('a@x.com') as s`))
  assert.equal(has.rows[0].s, 'joined')
  // Approving someone already waiting invites them; approving a joined account changes nothing.
  await anon(tx => tx.query(`select public.join_waitlist('later@example.com')`))
  await user(ADMIN, tx => tx.query(`select public.approve_email('later@example.com')`))
  await user(ADMIN, tx => tx.query(`select public.approve_email('a@x.com')`))
  const st = await service(tx => tx.query(`select email, status from public.waitlist where email in ('later@example.com', 'a@x.com') order by email`))
  assert.deepEqual(st.rows.map(r => r.status), ['joined', 'invited'])
})

test('approving queues one confirmation email; joined accounts and repeat approvals do not', async () => {
  await anon(tx => tx.query(`select public.join_waitlist('mail.me@example.com', 'Mia Mail')`))
  const id = (await service(tx => tx.query(`select id from public.waitlist where email = 'mail.me@example.com'`))).rows[0].id
  const q = async e => (await service(tx => tx.query(`select approval_email from public.waitlist where email = $1`, [e]))).rows[0]?.approval_email ?? null
  assert.equal(await q('mail.me@example.com'), null)
  await user(ADMIN, tx => tx.query(`select public.invite_from_waitlist($1)`, [id]))
  assert.equal(await q('mail.me@example.com'), 'pending')
  // The worker sends it; a second click on an already-invited row does not queue it again.
  await service(tx => tx.query(`update public.waitlist set approval_email = 'sent' where id = $1`, [id]))
  await user(ADMIN, tx => tx.query(`select public.invite_from_waitlist($1)`, [id]))
  await user(ADMIN, tx => tx.query(`select public.approve_email('mail.me@example.com')`))
  assert.equal(await q('mail.me@example.com'), 'sent')
  // Approve-by-email for someone new queues it too; an existing account gets nothing.
  await user(ADMIN, tx => tx.query(`select public.approve_email('fresh@example.com')`))
  assert.equal(await q('fresh@example.com'), 'pending')
  await user(ADMIN, tx => tx.query(`select public.approve_email('b@x.com')`))
  assert.notEqual(await q('b@x.com'), 'pending')
})
