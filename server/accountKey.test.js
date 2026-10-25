import test from 'node:test'
import assert from 'node:assert/strict'
import { accountKey, anthropicFor } from './accountKey.js'

const ENV = { VITE_SUPABASE_URL: 'https://p.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'pub', SUPABASE_SECRET_KEY: 'sec' }

// Fake Supabase: token "good" belongs to user u1, who has key "sk-user" unless noKey.
function fakeSupabase({ noKey = false } = {}) {
  const calls = []
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, init })
    if (url.endsWith('/auth/v1/user')) {
      const ok = init.headers.Authorization === 'Bearer good' && init.headers.apikey === 'pub'
      return { ok, json: async () => (ok ? { id: 'u1' } : { msg: 'bad jwt' }) }
    }
    if (url.endsWith('/rest/v1/rpc/get_model_key')) {
      assert.equal(init.headers.apikey, 'sec', 'key lookup must use the service key')
      assert.deepEqual(JSON.parse(init.body), { p_owner: 'u1', p_provider: 'anthropic' }, 'key lookup must be for the verified user only')
      return { ok: true, json: async () => (noKey ? null : 'sk-user') }
    }
    throw new Error('unexpected ' + url)
  }
  return { fetchImpl, calls }
}

test('a valid session uses that user\'s own saved key', async () => {
  const { fetchImpl } = fakeSupabase()
  const r = await anthropicFor({ authorization: 'Bearer good' }, { env: { ...ENV, ANTHROPIC_API_KEY: 'sk-server' }, fetchImpl })
  assert.equal(r.source, 'account')
  assert.equal(r.apiKey, 'sk-user')
})

test('the user id comes from Supabase, never from the request', async () => {
  const { fetchImpl } = fakeSupabase()
  const r = await accountKey({ authorization: 'Bearer good', 'x-user-id': 'someone-else' }, { env: ENV, fetchImpl })
  assert.equal(r.userId, 'u1')
})

test('a forged or expired token gets no account key', async () => {
  const { fetchImpl, calls } = fakeSupabase()
  const r = await anthropicFor({ authorization: 'Bearer forged' }, { env: ENV, fetchImpl })
  assert.equal(r.error.body.error, 'not_configured')
  assert.ok(!calls.some(c => c.url.includes('get_model_key')), 'must not look up a key without a verified user')
})

test('signed in without a saved key and no server key: tells the user to add one', async () => {
  const { fetchImpl } = fakeSupabase({ noKey: true })
  const r = await anthropicFor({ authorization: 'Bearer good' }, { env: ENV, fetchImpl })
  assert.equal(r.error.status, 503)
  assert.equal(r.error.body.error, 'no_key')
})

test('no session falls back to the server key, behind the access code', async () => {
  const { fetchImpl } = fakeSupabase()
  const env = { ...ENV, ANTHROPIC_API_KEY: 'sk-server' }
  const locked = await anthropicFor({}, { env, fetchImpl, needsCode: () => true })
  assert.equal(locked.error.status, 401)
  const open = await anthropicFor({}, { env, fetchImpl, needsCode: () => false })
  assert.equal(open.source, 'server')
  assert.equal(open.apiKey, 'sk-server')
})

test('a user with their own key is not blocked by the access code', async () => {
  const { fetchImpl } = fakeSupabase()
  const r = await anthropicFor({ authorization: 'Bearer good' }, { env: ENV, fetchImpl, needsCode: () => true })
  assert.equal(r.source, 'account')
})

test('without the service key the server cannot read account keys', async () => {
  const { fetchImpl, calls } = fakeSupabase()
  const r = await accountKey({ authorization: 'Bearer good' }, { env: { ...ENV, SUPABASE_SECRET_KEY: '' }, fetchImpl })
  assert.equal(r, null)
  assert.equal(calls.length, 0)
})

test('signed in but the server lacks SUPABASE_SECRET_KEY: says so, not "access code"', async () => {
  const { fetchImpl } = fakeSupabase()
  const env = { VITE_SUPABASE_URL: ENV.VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY: 'pub', ANTHROPIC_API_KEY: 'sk-server' }
  for (const e of [env, { ...env, ANTHROPIC_API_KEY: '' }]) {
    const r = await anthropicFor({ authorization: 'Bearer good' }, { env: e, fetchImpl, needsCode: () => true })
    assert.equal(r.error.status, 503)
    assert.equal(r.error.body.error, 'account_keys_unavailable')
    assert.match(r.error.body.message, /SUPABASE_SECRET_KEY/)
  }
  // Signed out on the same server: still the access-code gate.
  const out = await anthropicFor({}, { env, fetchImpl, needsCode: () => true })
  assert.equal(out.error.body.error, 'access_code')
})
