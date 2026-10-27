import { supabaseServerEnv } from './accountKey.js'

export const TOOLKITS = ['googlecalendar', 'gmail', 'slack', 'hubspot']
const BASE = 'https://backend.composio.dev/api/v3.1'

export async function handleConnect(req, { env = process.env, fetchImpl = fetch } = {}) {
  const reply = (status, body) => ({ status, body })
  if (!['GET', 'POST'].includes(req.method)) return reply(405, { error: 'Method not allowed' })
  const { url, anon } = supabaseServerEnv(env)
  const token = /^Bearer\s+(\S+)$/i.exec(req.headers?.authorization || req.headers?.Authorization || '')?.[1]
  if (!token) return reply(401, { error: 'Sign in to manage connections.' })
  if (!url || !anon) return reply(503, { error: 'Account authentication is not configured.' })
  try {
    const who = await fetchImpl(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) })
    if (!who.ok) return reply(401, { error: 'Sign in again to manage connections.' })
    const user = await who.json()
    if (!user?.id) return reply(401, { error: 'Invalid session.' })
    const configured = TOOLKITS.filter(k => env.COMPOSIO_API_KEY && env[`COMPOSIO_AUTH_${k.toUpperCase()}`])
    async function api(path, method = 'GET', body) {
      const res = await fetchImpl(`${BASE}${path}`, { method, headers: { 'x-api-key': env.COMPOSIO_API_KEY, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) })
      if (!res.ok) throw new Error('provider')
      return res.status === 204 ? {} : res.json()
    }
    async function accounts() {
      const found = [], seen = new Set()
      let cursor
      do {
        const q = new URLSearchParams({ user_ids: user.id, statuses: 'ACTIVE', limit: '100', ...(cursor ? { cursor } : {}) })
        const page = await api(`/connected_accounts?${q}`)
        for (const a of page.items || []) {
          const toolkit = a.toolkit?.slug
          if (a.user_id === user.id && a.status === 'ACTIVE' && !a.is_disabled && configured.includes(toolkit) && a.auth_config?.id === env[`COMPOSIO_AUTH_${toolkit.toUpperCase()}`]) found.push({ id: a.id, toolkit, status: 'ACTIVE' })
        }
        cursor = page.next_cursor
        if (cursor && seen.has(cursor)) throw new Error('pagination')
        seen.add(cursor)
      } while (cursor)
      return found
    }
    if (req.method === 'GET') return reply(200, { configured, connections: configured.length ? await accounts() : [] })
    const { toolkit, action = 'connect' } = req.body || {}
    if (!TOOLKITS.includes(toolkit) || !['connect', 'disconnect'].includes(action)) return reply(400, { error: 'Invalid connector or action.' })
    if (!configured.includes(toolkit)) return reply(503, { error: 'Live connection is not configured. Use upload or paste.' })
    if (action === 'disconnect') {
      for (const a of (await accounts()).filter(a => a.toolkit === toolkit)) await api(`/connected_accounts/${encodeURIComponent(a.id)}`, 'DELETE')
      return reply(200, { disconnected: true })
    }
    // Trusted deployment setting, never a browser-supplied redirect or Host header.
    const origin = new URL(env.CB_APP_URL || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:5173'))
    if (origin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(origin.hostname)) return reply(503, { error: 'Configure CB_APP_URL with the application HTTPS URL.' })
    const callback = new URL('/?connector_callback=1', origin)
    const link = await api('/connected_accounts/link', 'POST', { user_id: user.id, auth_config_id: env[`COMPOSIO_AUTH_${toolkit.toUpperCase()}`], callback_url: callback.href })
    if (!link.redirect_url || new URL(link.redirect_url).protocol !== 'https:') throw new Error('redirect')
    return reply(200, { redirect_url: link.redirect_url })
  } catch {
    return reply(502, { error: 'Connections could not be updated. Please retry.' })
  }
}
