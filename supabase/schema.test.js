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
  await db.exec(`insert into auth.users (id, email) values
    ('${A}', 'a@x.com'), ('${B}', 'b@x.com'), ('${ADMIN}', 'admin@x.com')`)
  await db.exec(`update public.profiles set role = 'admin' where id = '${ADMIN}'`)
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
