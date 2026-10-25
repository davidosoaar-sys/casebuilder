import Anthropic from '@anthropic-ai/sdk'
import { research } from './research.js'
import { suggest, SUGGESTIBLE } from './suggest.js'
import { publishSite, PublishError } from './publish.js'
import { discoverBrand } from './brand.js'
import { anthropicFor } from './accountKey.js'

// Shared by the Vercel functions (api/*.js) and the Vite dev server. Each
// handler returns { status, body }. RESEARCH_ACCESS_CODE gates both, so a
// deployed copy cannot be used by strangers to spend the API key or to host
// pages on your Vercel account.

// Only the server's shared key is gated; a signed-in user's own key is not.
// On Vercel the shared key is never used without an access code configured.
const needsCode = headers => {
  const code = process.env.RESEARCH_ACCESS_CODE
  if (!code) return !!process.env.VERCEL
  return headers['x-access-code'] !== code
}

// Brand scans accept verified app sessions as well as legacy workspace codes.
export async function brandAccountAuthorized(headers, fetcher = fetch) {
  const token = (headers.authorization || headers.Authorization || '').match(/^Bearer (.+)$/i)?.[1]
  const url = process.env.VITE_SUPABASE_URL, key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!token || !url || !key) return false
  try {
    const result = await fetcher(new URL('/auth/v1/user', url), {headers:{Authorization:'Bearer '+token,apikey:key},signal:AbortSignal.timeout(5000)})
    if (!result.ok) return false
    const user=await result.json(); return !!user.id && !user.is_anonymous
  } catch { return false }
}
export async function handleBrand({ body, headers }) {
  const signedIn = await brandAccountAuthorized(headers)
  if (!signedIn && needsCode(headers)) return {status:401,body:{error:"Sign in or enter your access code to scan company branding."}}
  const company = typeof body?.company === 'string' ? body.company.trim().slice(0, 120) : ''
  const website = typeof body?.website === 'string' ? body.website.trim().slice(0, 500) : ''
  if (!company && !website) return { status: 400, body: { error: 'Enter a company name or official website.' } }
  // A signed-in user's own key pays for the name search; otherwise the server's
  // key behind the access code; with neither, only a typed website works.
  const who = await anthropicFor(headers, { needsCode: h => signedIn ? false : needsCode(h) })
  if (who.error?.status === 401) return { status: 401, body: { error: 'Enter your access code to scan company branding.' } }
  try { return { status: 200, body: await discoverBrand({ company, website }, undefined, who.client || null) } }
  catch (err) { return { status: 422, body: { error: err.message || 'Could not read the company branding. You can set it manually.' } } }
}

export async function handle({ body, headers }) {
  const who = await anthropicFor(headers, { needsCode })
  if (who.error) return who.error

  const company = typeof body?.company === 'string' ? body.company.trim() : ''
  const role = typeof body?.role === 'string' ? body.role.trim() : ''
  if (!company || !role || company.length > 120 || role.length > 120) {
    return { status: 400, body: { error: 'A company and a role (under 120 characters) are required.' } }
  }

  try {
    return { status: 200, body: await research({ company, role }, who.client) }
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return { status: 502, body: { error: 'The API key was rejected.' } }
    }
    if (err instanceof Anthropic.RateLimitError) {
      return { status: 429, body: { error: 'Rate limited. Try again in a minute.' } }
    }
    if (err instanceof Anthropic.APIError) {
      return { status: 502, body: { error: `The AI service returned an error (${err.status}).` } }
    }
    return { status: 500, body: { error: 'Something went wrong running the agent.' } }
  }
}

// Publish a one-file website to its own Vercel project.
export const MAX_SITE_BYTES = 4_000_000 // Vercel functions accept request bodies up to 4.5 MB

export async function handlePublish({ body, headers, fetchImpl, wait }) {
  const token = process.env.VERCEL_TOKEN
  if (!token) return { status: 503, body: { error: 'not_configured_publish' } }

  // On Vercel an access code is mandatory: without one, anyone who found the
  // site could publish pages to your account.
  if (process.env.VERCEL && !process.env.RESEARCH_ACCESS_CODE) return { status: 503, body: { error: 'code_required' } }
  if (needsCode(headers)) return { status: 401, body: { error: 'access_code' } }

  const html = typeof body?.html === 'string' ? body.html : ''
  const company = typeof body?.company === 'string' ? body.company.trim() : ''
  if (!/^\s*<!doctype html/i.test(html)) return { status: 400, body: { error: 'That is not a web page.' } }
  if (Buffer.byteLength(html, 'utf8') > MAX_SITE_BYTES) {
    return { status: 413, body: { error: 'The site is too large to publish from the app (over 4 MB), usually because of large images. Remove or shrink them, or download the Vercel project and deploy it yourself.' } }
  }
  if (!company || company.length > 120) return { status: 400, body: { error: 'A company name is required.' } }

  // Republishing a case reuses its project so the link stays the same. Only names
  // this app generates (bc-...) are accepted.
  const wanted = typeof body?.name === 'string' ? body.name : ''
  const name = /^bc-[a-z0-9]+(-[a-z0-9]+)*$/.test(wanted) && wanted.length <= 80 ? wanted : undefined

  try {
    const result = await publishSite({ html, company, name, token, teamId: process.env.VERCEL_TEAM_ID || undefined, fetchImpl, wait })
    return { status: 200, body: result }
  } catch (err) {
    if (err instanceof PublishError) {
      const status = err.code === 'rate_limited' ? 429 : err.code === 'not_ready' ? 504 : 502
      return { status, body: { error: err.message, code: err.code } }
    }
    return { status: 500, body: { error: 'Something went wrong while publishing.' } }
  }
}

// The suggestion agent: reads only the material the caller sends (what Chris switched
// on) and proposes values for empty inputs. It never produces a figure.
const DOC_SOURCES = ['claude', 'gong', 'hubspot', 'slack', 'clay', 'lemlist', 'granola', 'sheets', 'excel', 'figma', 'canva']

export async function handleSuggest({ body, headers }) {

  const company = typeof body?.company === 'string' ? body.company.trim() : ''
  if (!company || company.length > 120) return { status: 400, body: { error: 'A company name is required.' } }
  const only = (Array.isArray(body?.only) ? body.only : []).filter(k => typeof k === 'string' && k in SUGGESTIBLE).slice(0, 40)
  const documents = (Array.isArray(body?.documents) ? body.documents : [])
    .filter(d => d && DOC_SOURCES.includes(d.source) && typeof d.text === 'string' && d.text.trim())
    .slice(0, 20)
    .map(d => ({ source: d.source, name: typeof d.name === 'string' ? d.name : 'Untitled', text: d.text }))
  const web = body?.web === true
  const filled = Object.fromEntries(
    Object.entries(body?.filled && typeof body.filled === 'object' ? body.filled : {})
      .filter(([k, v]) => k in SUGGESTIBLE && Number.isFinite(Number(v)))
      .slice(0, 60)
  )
  const labels = Object.fromEntries(Object.entries(body?.labels && typeof body.labels === 'object' ? body.labels : {}).filter(([k, v]) => k in SUGGESTIBLE && typeof v === 'string').map(([k, v]) => [k, v.slice(0, 160)]))

  // nothing to read: nothing to ask
  if (!only.length || (!documents.length && !web)) return { status: 200, body: { suggestions: [] } }
  const who = await anthropicFor(headers, { needsCode })
  if (who.error) return who.error

  try {
    return { status: 200, body: await suggest({ company, filled, documents, web, only, labels }, who.client) }
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) return { status: 502, body: { error: 'The API key was rejected.' } }
    if (err instanceof Anthropic.RateLimitError) return { status: 429, body: { error: 'Rate limited. Try again in a minute.' } }
    return { status: 502, body: { error: 'The suggestion service is unavailable.' } }
  }
}
