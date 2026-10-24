// Publish a one-file website to Vercel as its own project, using the REST API.
// Shared by the app's /api/publish function and the plugin's command line.
//
// One project per case, so each gets its own production address
// (https://<name>.vercel.app) that is public and unguessable, and projects can
// be removed one at a time from the Vercel dashboard.
//
// Flow: create the project (no framework, Vercel Authentication off) ->
// deploy index.html + vercel.json to production -> wait until READY -> check
// from here that the address really is public, and say so if it is not.

export class PublishError extends Error {
  constructor(message, code = 'failed') {
    super(message)
    this.code = code
  }
}

const apiBase = () => (process.env.VERCEL_API_URL || 'https://api.vercel.com').replace(/\/+$/, '')

const b64 = text => (typeof Buffer !== 'undefined' ? Buffer.from(text, 'utf8').toString('base64') : btoa(unescape(encodeURIComponent(text))))
const sleep = ms => new Promise(r => setTimeout(r, ms))

const slug = s =>
  String(s || 'case')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36)
    .replace(/-+$/g, '') || 'case'

// Vercel project names: lowercase letters, digits, "." "_" "-", up to 100
// characters, no "---". A short random tail keeps the address unguessable.
export function projectName(company, random = Math.random) {
  const tail = Array.from({ length: 6 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(random() * 36)]).join('')
  return `bc-${slug(company)}-${tail}`
}

// vercel.json for a published site: keeps it out of search engines, sends no
// referrer, and makes the HTML always revalidate so a republish shows at once.
export const SITE_CONFIG = {
  cleanUrls: true,
  headers: [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }
      ]
    }
  ]
}

// The two files a deployment needs.
export function siteFiles(html) {
  return [
    { file: 'index.html', data: b64(html), encoding: 'base64' },
    { file: 'vercel.json', data: b64(JSON.stringify(SITE_CONFIG, null, 2)), encoding: 'base64' }
  ]
}

function explain(status, body) {
  const msg = body?.error?.message || body?.message || ''
  if (status === 401) return new PublishError('Vercel rejected the token (VERCEL_TOKEN). Create a new one at vercel.com/account/tokens.', 'bad_token')
  if (status === 403) return new PublishError(`The token is not allowed to do that${msg ? `: ${msg}` : ''}. If the account uses a team, set VERCEL_TEAM_ID.`, 'forbidden')
  if (status === 429) return new PublishError('Vercel is rate limiting new deployments (the free plan allows 100 a day). Try again later.', 'rate_limited')
  if (status === 402) return new PublishError('Vercel says this needs a payment method or a higher plan.', 'payment')
  return new PublishError(`Vercel returned ${status}${msg ? `: ${msg}` : ''}.`, 'failed')
}

// opts: { html, company, token, teamId, name, fetchImpl, wait, verify, log }
export async function publishSite(opts) {
  const { html, company, token, teamId, fetchImpl = fetch, wait = sleep, log = () => {} } = opts
  if (!token) throw new PublishError('No Vercel token. Set VERCEL_TOKEN.', 'no_token')
  if (typeof html !== 'string' || !html.trim()) throw new PublishError('There is no page to publish.', 'bad_input')

  const name = opts.name || projectName(company)
  const base = apiBase()
  const q = (extra = '') => {
    const parts = []
    if (teamId) parts.push(`teamId=${encodeURIComponent(teamId)}`)
    if (extra) parts.push(extra)
    return parts.length ? `?${parts.join('&')}` : ''
  }
  const call = async (method, path, body) => {
    let res
    try {
      res = await fetchImpl(`${base}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      })
    } catch (e) {
      throw new PublishError(`Could not reach Vercel (${e.message}).`, 'network')
    }
    let json = null
    try {
      json = await res.json()
    } catch {
      // some responses have no body
    }
    return { status: res.status, ok: res.ok, json }
  }

  // 1. the project. 409 means it already exists, which is fine. If this
  //    endpoint refuses our settings, the deployment below creates the project.
  log(`creating project ${name}`)
  let made = await call('POST', `/v10/projects${q()}`, { name, framework: null, ssoProtection: null })
  if (made.status === 400) made = await call('POST', `/v10/projects${q()}`, { name, framework: null })
  if (made.status === 401 || made.status === 403 || made.status === 429 || made.status === 402) throw explain(made.status, made.json)
  const projectOk = made.ok || made.status === 409

  // 2. the deployment
  log('uploading the site')
  const dep = await call('POST', `/v13/deployments${q('skipAutoDetectionConfirmation=1')}`, {
    name,
    ...(projectOk ? { project: name } : {}),
    files: siteFiles(html),
    target: 'production',
    projectSettings: { framework: null, buildCommand: null, outputDirectory: null, installCommand: null }
  })
  if (!dep.ok) throw explain(dep.status, dep.json)

  const id = dep.json?.id
  let state = dep.json?.readyState || 'QUEUED'
  let aliases = dep.json?.alias || []

  // 3. wait for READY (a one-file site takes a few seconds)
  for (let i = 0; i < 40 && state !== 'READY'; i++) {
    if (state === 'ERROR' || state === 'CANCELED' || state === 'BLOCKED') throw new PublishError(`The deployment ended as ${state}. Check the project in the Vercel dashboard.`, 'deploy_failed')
    await wait(1000)
    const poll = await call('GET', `/v13/deployments/${encodeURIComponent(id)}${q()}`)
    if (poll.ok) {
      state = poll.json?.readyState || state
      aliases = poll.json?.alias || aliases
    }
  }
  if (state !== 'READY') throw new PublishError('The site was uploaded but is not ready yet. Give it a minute and open the address below.', 'not_ready')

  // 4. the address: the project's production domain
  const host = aliases.find(a => a === `${name}.vercel.app`) || aliases.find(a => a.startsWith(`${name}`) && a.endsWith('.vercel.app')) || `${name}.vercel.app`
  const url = `https://${host}`

  // 5. is it really public?
  const publicAccess = opts.verify === false || process.env.VERCEL_API_URL ? null : await checkPublic(url, fetchImpl, wait)

  return {
    url,
    name,
    deploymentId: id,
    public: publicAccess,
    note: publicAccess === false ? AUTH_NOTE : undefined
  }
}

// Is the address open to anyone? true = yes (200). false = Vercel Authentication is
// turning visitors away (401/403). null = cannot tell yet (e.g. a 404 while the
// address propagates), so it retries a few times before giving up.
export async function checkPublic(url, fetchImpl = fetch, wait = sleep) {
  let result = null
  for (let i = 0; i < 4 && result === null; i++) {
    try {
      const probe = await fetchImpl(url, { method: 'GET', redirect: 'manual' })
      if (probe.status === 200) result = true
      else if (probe.status === 401 || probe.status === 403) result = false
    } catch {
      // keep trying
    }
    if (result === null && i < 3) await wait(1500)
  }
  return result
}

export const AUTH_NOTE =
  'The site is deployed but Vercel is asking visitors to log in. Open the project in the Vercel dashboard, then Settings > Deployment Protection, and turn Vercel Authentication off.'
