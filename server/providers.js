// Any model provider, one shape.
//
// The point of this file: provenance must NOT depend on which model you use.
// Previously the citation chain came from Anthropic's server-side web_search,
// which meant swapping provider threw away the evidence trail that makes a
// business case defensible. Here search is OUR job (see search.js) and the
// model only ever reasons over text we already hold. So every provider gets
// the same verifiable sources, and a missing one is dropped the same way.
//
// A provider implements:
//   name
//   configured()            -> boolean, is a key present
//   complete({ system, messages, maxTokens, temperature }) -> { text }
//
// That is deliberately the smallest possible surface: one text call. Tool use,
// web search and citation handling all live above this layer so they behave
// identically no matter who is answering.

const num = (v, fallback) => (Number.isFinite(Number(v)) ? Number(v) : fallback)

// ---------------------------------------------------------------- Anthropic
export function anthropicProvider(env = process.env, fetchImpl = fetch) {
  const key = env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN || ''
  return {
    name: 'anthropic',
    label: 'Anthropic Claude',
    configured: () => !!key,
    keyName: 'ANTHROPIC_API_KEY',
    defaultModel: env.ANTHROPIC_MODEL || 'claude-opus-5-5',
    async complete({ system, messages, maxTokens = 4000, temperature }) {
      const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.defaultModel,
          max_tokens: num(maxTokens, 4000),
          ...(temperature === undefined ? {} : { temperature }),
          ...(system ? { system } : {}),
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        })
      })
      if (!res.ok) throw await providerError(res, 'anthropic')
      const data = await res.json()
      const text = (data.content || [])
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n')
      return { text, raw: data }
    }
  }
}

// ------------------------------------------------------------------- OpenAI
export function openaiProvider(env = process.env, fetchImpl = fetch) {
  const key = env.OPENAI_API_KEY || ''
  const base = env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  return {
    name: 'openai',
    label: 'OpenAI',
    configured: () => !!key,
    keyName: 'OPENAI_API_KEY',
    defaultModel: env.OPENAI_MODEL || 'gpt-5.2',
    async complete({ system, messages, maxTokens = 4000, temperature }) {
      const res = await fetchImpl(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: this.defaultModel,
          max_completion_tokens: num(maxTokens, 4000),
          ...(temperature === undefined ? {} : { temperature }),
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            ...messages.map(m => ({ role: m.role, content: flatten(m.content) }))
          ]
        })
      })
      if (!res.ok) throw await providerError(res, 'openai')
      const data = await res.json()
      return { text: data.choices?.[0]?.message?.content || '', raw: data }
    }
  }
}

// ------------------------------------------------------------------- Google
export function googleProvider(env = process.env, fetchImpl = fetch) {
  const key = env.GOOGLE_AI_API_KEY || env.GEMINI_API_KEY || ''
  return {
    name: 'google',
    label: 'Google Gemini',
    configured: () => !!key,
    keyName: 'GOOGLE_AI_API_KEY',
    defaultModel: env.GOOGLE_MODEL || 'gemini-3-pro',
    async complete({ system, messages, maxTokens = 4000, temperature }) {
      const model = this.defaultModel
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: flatten(m.content) }]
          })),
          generationConfig: {
            maxOutputTokens: num(maxTokens, 4000),
            ...(temperature === undefined ? {} : { temperature })
          }
        })
      })
      if (!res.ok) throw await providerError(res, 'google')
      const data = await res.json()
      const text = (data.candidates?.[0]?.content?.parts || [])
        .map(p => p.text || '')
        .join('\n')
      return { text, raw: data }
    }
  }
}

// ------------------------------------------- OpenAI-compatible (Hermes etc.)
// Hermes, Ollama, OpenRouter, LM Studio, vLLM and most self-hosted gateways
// all speak the OpenAI chat-completions shape. One provider covers them all:
// the user supplies a base URL and (optionally) a key.
export function compatibleProvider(env = process.env, fetchImpl = fetch) {
  const base = env.COMPATIBLE_BASE_URL || ''
  const key = env.COMPATIBLE_API_KEY || ''
  const inner = openaiProvider(
    { OPENAI_API_KEY: key || 'not-needed', OPENAI_BASE_URL: base, OPENAI_MODEL: env.COMPATIBLE_MODEL || 'default' },
    fetchImpl
  )
  return {
    name: 'compatible',
    label: 'OpenAI-compatible endpoint',
    configured: () => !!base,
    keyName: 'COMPATIBLE_BASE_URL',
    defaultModel: env.COMPATIBLE_MODEL || 'default',
    complete: args => inner.complete(args)
  }
}

export const PROVIDERS = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
  google: googleProvider,
  compatible: compatibleProvider
}

export class ProviderError extends Error {
  constructor(message, { status, code, provider } = {}) {
    super(message)
    this.name = 'ProviderError'
    this.status = status
    this.code = code
    this.provider = provider
  }
}

async function providerError(res, provider) {
  let detail = ''
  try {
    const body = await res.json()
    detail = body?.error?.message || body?.message || ''
  } catch {
    try { detail = (await res.text()).slice(0, 200) } catch {}
  }
  const code =
    res.status === 401 || res.status === 403 ? 'auth'
      : res.status === 429 ? 'rate_limit'
        : 'upstream'
  const friendly =
    code === 'auth' ? 'The API key was rejected.'
      : code === 'rate_limit' ? 'Rate limited. Try again in a minute.'
        : `The model provider returned an error (${res.status}).`
  return new ProviderError(detail ? `${friendly} ${detail}` : friendly, {
    status: res.status, code, provider
  })
}

const flatten = content =>
  typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content.map(c => (typeof c === 'string' ? c : c.text || '')).join('\n')
      : String(content ?? '')

// Pick the provider: an explicit choice wins, otherwise the first one holding
// a key. Order puts Anthropic first only because it is what is configured
// today, not because anything depends on it.
export function selectProvider(env = process.env, fetchImpl = fetch) {
  const wanted = (env.AI_PROVIDER || '').trim().toLowerCase()
  if (wanted) {
    const make = PROVIDERS[wanted]
    if (!make) throw new ProviderError(`Unknown provider "${wanted}". Choose one of: ${Object.keys(PROVIDERS).join(', ')}.`, { code: 'config' })
    const p = make(env, fetchImpl)
    if (!p.configured()) throw new ProviderError(`${p.label} is selected but ${p.keyName} is not set.`, { code: 'not_configured' })
    return p
  }
  for (const name of ['anthropic', 'openai', 'google', 'compatible']) {
    const p = PROVIDERS[name](env, fetchImpl)
    if (p.configured()) return p
  }
  throw new ProviderError('No model provider is configured. Add a key for Anthropic, OpenAI or Google, or point at an OpenAI-compatible endpoint.', { code: 'not_configured' })
}

// What the settings screen shows: every provider and whether it is ready.
export function providerStatus(env = process.env) {
  return Object.keys(PROVIDERS).map(name => {
    const p = PROVIDERS[name](env)
    return { name, label: p.label, keyName: p.keyName, configured: p.configured(), defaultModel: p.defaultModel }
  })
}
