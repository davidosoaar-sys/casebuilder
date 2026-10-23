import Anthropic from '@anthropic-ai/sdk'
import { research } from './research.js'

// Shared by the Vercel function (api/research.js) and the Vite dev server.
// Returns { status, body }. Optionally gated by RESEARCH_ACCESS_CODE so a
// deployed copy cannot be used by strangers to spend the API key.

export async function handle({ body, headers }) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return { status: 503, body: { error: 'not_configured' } }
  }

  const code = process.env.RESEARCH_ACCESS_CODE
  if (code && headers['x-access-code'] !== code) {
    return { status: 401, body: { error: 'access_code' } }
  }

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
