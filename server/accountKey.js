import Anthropic from '@anthropic-ai/sdk'

// Which Anthropic key pays for a button command (Find people, Suggest values,
// Person lookup, brand discovery).
//
// 1. The signed-in user's own key, saved in Settings (Supabase Vault). The
//    browser sends its Supabase session token; we check the token with
//    Supabase, then read that user's key with the service key. The key never
//    goes to the browser.
// 2. Otherwise the server's own ANTHROPIC_API_KEY, if one is configured, still
//    behind the workspace access code.
//
// Needs on the server: SUPABASE_URL (or VITE_SUPABASE_URL), the publishable key
// (VITE_SUPABASE_PUBLISHABLE_KEY) and SUPABASE_SECRET_KEY. Never a VITE_ name
// for the secret: Vite would put it in the browser bundle.

const bearer = headers => {
  const h = headers?.authorization || headers?.Authorization || ''
  const m = /^Bearer\s+(\S+)$/i.exec(h)
  return m ? m[1] : ''
}

export function supabaseServerEnv(env = process.env) {
  return {
    url: (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/+$/, ''),
    anon: env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || '',
    secret: env.SUPABASE_SECRET_KEY || ''
  }
}

// Returns { userId, apiKey } for a valid session with a saved key,
// { userId, apiKey: null } for a valid session without one, or null when
// there is no usable session (or the server cannot check sessions).
export async function accountKey(headers, { env = process.env, fetchImpl = fetch } = {}) {
  const token = bearer(headers)
  const { url, anon, secret } = supabaseServerEnv(env)
  if (!token || !url || !anon || !secret) return null
  const who = await fetchImpl(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } })
  if (!who.ok) return null
  const user = await who.json().catch(() => null)
  if (!user?.id) return null
  const res = await fetchImpl(`${url}/rest/v1/rpc/get_model_key`, {
    method: 'POST',
    headers: { apikey: secret, Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_owner: user.id, p_provider: 'anthropic' })
  })
  if (!res.ok) return { userId: user.id, apiKey: null }
  const key = await res.json().catch(() => null)
  return { userId: user.id, apiKey: typeof key === 'string' && key ? key : null }
}

// Decide who pays. Returns { client, apiKey, source } or { error: {status, body} }.
// `needsCode` is only checked when falling back to the server's key.
export async function anthropicFor(headers, { env = process.env, fetchImpl = fetch, needsCode = () => false } = {}) {
  let account = null
  try { account = await accountKey(headers, { env, fetchImpl }) } catch { account = null }
  if (account?.apiKey) return { apiKey: account.apiKey, client: new Anthropic({ apiKey: account.apiKey }), source: 'account' }
  // Signed in, but this server cannot read saved keys (SUPABASE_SECRET_KEY or the
  // Supabase URL/publishable key missing). Say so instead of asking for an access
  // code: the user did nothing wrong, the deployment is misconfigured.
  const { url, anon, secret } = supabaseServerEnv(env)
  const cannotReadKeys = !account && !!bearer(headers) && (!url || !anon || !secret)
  const keysUnavailable = { error: { status: 503, body: { error: 'account_keys_unavailable', message: 'You are signed in, but this server cannot read the API key saved in your Settings: SUPABASE_SECRET_KEY is not set on the deployment. Ask whoever runs it to add it and redeploy.' } } }
  // Not signed in with a key: the workspace access code gate comes first, as before.
  if (!account && needsCode(headers)) return cannotReadKeys ? keysUnavailable : { error: { status: 401, body: { error: 'access_code' } } }
  const serverKey = env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN
  if (serverKey) {
    if (needsCode(headers)) return { error: { status: 401, body: { error: 'access_code' } } }
    return { apiKey: serverKey, client: new Anthropic(env.ANTHROPIC_API_KEY ? { apiKey: env.ANTHROPIC_API_KEY } : { authToken: env.ANTHROPIC_AUTH_TOKEN }), source: 'server' }
  }
  if (account) return { error: { status: 503, body: { error: 'no_key', message: 'Add your Anthropic API key in Settings to use the AI agent.' } } }
  return cannotReadKeys ? keysUnavailable : { error: { status: 503, body: { error: 'not_configured' } } }
}
