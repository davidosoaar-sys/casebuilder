import test from 'node:test'
import assert from 'node:assert/strict'
import { handleConnect } from './composio.js'
const env = { SUPABASE_URL: 'https://auth.test', VITE_SUPABASE_PUBLISHABLE_KEY: 'public', COMPOSIO_API_KEY: 'secret', COMPOSIO_AUTH_GMAIL: 'ac_gmail', CB_APP_URL: 'https://case.test' }
const req = (method = 'GET', body = {}) => ({ method, headers: { authorization: 'Bearer session' }, body })
const account = (extra = {}) => ({ id: 'ca_one', user_id: 'u1', status: 'ACTIVE', toolkit: { slug: 'gmail' }, auth_config: { id: 'ac_gmail' }, ...extra })
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data })
function fixture(pages = [{ items: [account()] }]) {
  const calls = []
  return { calls, fetchImpl: async (url, options) => {
    calls.push({ url, ...options })
    if (url.includes('/auth/v1/user')) return response({ id: 'u1' })
    if (url.includes('/connected_accounts?')) return response(pages.shift())
    if (url.endsWith('/link')) return response({ redirect_url: 'https://connect.composio.dev/session', secret: 'never expose' })
    return response({}, 204)
  } }
}
test('requires Supabase session and never trusts user_id in body', async () => {
  let called = false
  assert.equal((await handleConnect({ method: 'GET' }, { env, fetchImpl: () => { called = true } })).status, 401)
  assert.equal(called, false)
  const f = fixture()
  const result = await handleConnect(req('POST', { toolkit: 'gmail', user_id: 'other', callback_url: 'https://evil.test' }), { env, ...f })
  assert.equal(result.status, 200)
  assert.deepEqual(JSON.parse(f.calls[1].body), { user_id: 'u1', auth_config_id: 'ac_gmail', callback_url: 'https://case.test/?connector_callback=1' })
  assert.deepEqual(Object.keys(result.body), ['redirect_url'])
})
test('status paginates, filters ownership/config/status and strips credentials', async () => {
  const f = fixture([{ items: [account({ user_id: 'other' }), account({ status: 'EXPIRED' }), account({ is_disabled: true }), account({ auth_config: { id: 'wrong' } })], next_cursor: 'next' }, { items: [account({ state: { token: 'secret' } })] }])
  const result = await handleConnect(req(), { env, ...f })
  assert.deepEqual(result.body, { configured: ['gmail'], connections: [{ id: 'ca_one', toolkit: 'gmail', status: 'ACTIVE' }] })
  assert.match(f.calls[2].url, /cursor=next/)
  assert.match(f.calls[1].url, /user_ids=u1/)
})
test('disconnect deletes only accounts verified to belong to session user', async () => {
  const f = fixture([{ items: [account(), account({ id: 'victim', user_id: 'other' })] }])
  assert.equal((await handleConnect(req('POST', { toolkit: 'gmail', action: 'disconnect', connected_account_id: 'victim' }), { env, ...f })).status, 200)
  assert.equal(f.calls.filter(c => c.method === 'DELETE').length, 1)
  assert.ok(f.calls.at(-1).url.endsWith('/ca_one'))
})
test('unconfigured toolkits are honest fallbacks; invalid toolkits/actions rejected', async () => {
  const f = fixture()
  assert.deepEqual((await handleConnect(req(), { env: { ...env, COMPOSIO_API_KEY: '' }, ...f })).body, { configured: [], connections: [] })
  assert.equal((await handleConnect(req('POST', { toolkit: 'slack' }), { env, ...f })).status, 503)
  assert.equal((await handleConnect(req('POST', { toolkit: '../../x' }), { env, ...f })).status, 400)
})
test('provider failures never expose secrets or raw responses', async () => {
  const result = await handleConnect(req(), { env, fetchImpl: async () => { throw new Error('secret-token') } })
  assert.equal(result.status, 502)
  assert.ok(!JSON.stringify(result).includes('secret-token'))
})
test('expired Supabase bearer cannot access Composio', async () => {
  let count = 0
  const result = await handleConnect(req(), { env, fetchImpl: async () => { count++; return response({}, 401) } })
  assert.equal(result.status, 401)
  assert.equal(count, 1)
})
