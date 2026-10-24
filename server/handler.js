import Anthropic from '@anthropic-ai/sdk'
import { research } from './research.js'
import { suggest } from './suggest.js'
import { publishSite, PublishError } from './publish.js'

// Shared by the Vercel functions (api/*.js) and the Vite dev server. Each
// handler returns { status, body }. RESEARCH_ACCESS_CODE gates both, so a
// deployed copy cannot be used by strangers to spend the API key or to host
// pages on your Vercel account.

const needsCode = headers => {
  const code = process.env.RESEARCH_ACCESS_CODE
  return code && headers['x-access-code'] !== code
}

export async function handle({ body, headers }) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return { status: 503, body: { error: 'not_configured' } }
  }
  if (needsCode(headers)) return { status: 401, body: { error: 'access_code' } }

  const company = typeof body?.company === 'string' ? body.company.trim() : ''
  const role = typeof body?.role === 'string' ? body.role.trim() : ''
  if (!company || !role || company.length > 120 || role.length > 120) {
    return { status: 400, body: { error: 'A company and a role (under 120 characters) are required.' } }
  }

  try {
    return { status: 200, body: await research({ company, role }) }
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

// Suggest starting values for unconfirmed inputs. The only model call that
// touches the numbers, and it never produces a figure.
export async function handleSuggest({ body, headers }) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return { status: 503, body: { error: 'not_configured' } }
  }
  if (needsCode(headers)) return { status: 401, body: { error: 'access_code' } }

  const company = typeof body?.company === 'string' ? body.company.trim() : ''
  const engineers = Number(body?.engineers)
  if (!company || company.length > 120) return { status: 400, body: { error: 'A company name is required.' } }
  if (!Number.isFinite(engineers) || engineers < 1 || engineers > 1_000_000) {
    return { status: 400, body: { error: 'An engineer count is required.' } }
  }
  const only = Array.isArray(body?.only) ? body.only.filter(k => typeof k === 'string').slice(0, 40) : undefined

  try {
    return { status: 200, body: await suggest({ company, engineers: Math.round(engineers), only }) }
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return { status: 429, body: { error: 'Rate limited. Try again in a minute.' } }
    return { status: 502, body: { error: 'The suggestion service is unavailable.' } }
  }
}
