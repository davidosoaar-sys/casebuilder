// One client for OpenAI, Google Gemini and OpenRouter that looks like the
// Anthropic SDK to the rest of the server.
//
// Every research command (Find people, Suggest values, Person lookup, brand) is
// written against Anthropic's Messages API: `client.messages.create(...)` and
// `client.messages.stream(...).finalMessage()`, with tool_use / tool_result
// blocks. All three other providers speak OpenAI chat completions (Gemini and
// OpenRouter through their OpenAI-compatible endpoints), so this adapter
// translates the request in and the response back, and nothing above it changes.
//
// What does not carry over: Anthropic's extended thinking and its built-in
// server-side web search. Thinking is dropped (the other models reason on
// their own); built-in search is refused with a clear error, because our own
// search (Tavily, agentSearch.js) is what every provider should use.

export const PROVIDERS = {
  openai: { label: 'OpenAI', base: 'https://api.openai.com/v1' },
  google: { label: 'Google Gemini', base: 'https://generativelanguage.googleapis.com/v1beta/openai' },
  openrouter: { label: 'OpenRouter', base: 'https://openrouter.ai/api/v1' }
}

// Callers ask for a Claude model; each provider answers with its model of the
// same tier. Override per provider with <PROVIDER>_MODEL_{BEST,BALANCED,FAST}.
const TIERS = {
  openai: { best: 'gpt-5.6-sol', balanced: 'gpt-5.6-terra', fast: 'gpt-5.6-luna' },
  google: { best: 'gemini-3.1-pro-preview', balanced: 'gemini-3.8-flash', fast: 'gemini-3.5-flash-lite' },
  openrouter: { best: 'anthropic/claude-opus-5.5', balanced: 'anthropic/claude-sonnet-5.5', fast: 'anthropic/claude-haiku-5.5' }
}
export const tierOf = model => /opus/i.test(model) ? 'best' : /haiku/i.test(model) ? 'fast' : 'balanced'
export function modelFor(provider, requested, env = process.env) {
  const tier = tierOf(String(requested || ''))
  return env[`${provider.toUpperCase()}_MODEL_${tier.toUpperCase()}`] || TIERS[provider][tier]
}

export class ProviderAPIError extends Error {
  constructor(status, message, provider) {
    super(message); this.status = status; this.provider = provider; this.name = 'ProviderAPIError'
  }
}

const text = c => typeof c === 'string' ? c : (Array.isArray(c) ? c.map(b => b.type === 'text' ? b.text : '').join('\n') : String(c ?? ''))

// Anthropic request -> OpenAI chat-completions request.
export function toOpenAI(req, provider, env = process.env) {
  if ((req.tools || []).some(t => t.type && String(t.type).startsWith('web_search'))) {
    throw new ProviderAPIError(400, 'Web search needs a search key on the server (TAVILY_API_KEY) when you use a non-Anthropic model.', provider)
  }
  const messages = []
  if (req.system) messages.push({ role: 'system', content: text(req.system) })
  for (const m of req.messages || []) {
    if (typeof m.content === 'string') { messages.push({ role: m.role, content: m.content }); continue }
    if (m.role === 'assistant') {
      const calls = m.content.filter(b => b.type === 'tool_use')
      const out = { role: 'assistant', content: m.content.filter(b => b.type === 'text').map(b => b.text).join('\n') || null }
      if (calls.length) out.tool_calls = calls.map(b => ({ id: b.id, type: 'function', function: { name: b.name, arguments: JSON.stringify(b.input ?? {}) } }))
      messages.push(out)
      continue
    }
    // user turn: tool results become `tool` messages, the rest stays a user message.
    for (const b of m.content.filter(b => b.type === 'tool_result')) {
      messages.push({ role: 'tool', tool_call_id: b.tool_use_id, content: (b.is_error ? 'Error: ' : '') + text(b.content) })
    }
    const rest = m.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
    if (rest) messages.push({ role: 'user', content: rest })
  }
  const body = { model: modelFor(provider, req.model, env), messages, max_tokens: req.max_tokens }
  if (provider === 'openai') { body.max_completion_tokens = req.max_tokens; delete body.max_tokens }
  if (req.temperature !== undefined) body.temperature = req.temperature
  const tools = (req.tools || []).filter(t => t.name && t.input_schema)
  if (tools.length) body.tools = tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description || '', parameters: t.input_schema } }))
  return body
}

// OpenAI chat-completions response -> Anthropic message.
export function fromOpenAI(data, model) {
  const choice = data.choices?.[0] || {}
  const msg = choice.message || {}
  const content = []
  if (msg.content) content.push({ type: 'text', text: msg.content, citations: [] })
  for (const c of msg.tool_calls || []) {
    let input = {}
    try { input = JSON.parse(c.function?.arguments || '{}') } catch { input = {} }
    content.push({ type: 'tool_use', id: c.id, name: c.function?.name, input })
  }
  const reason = choice.finish_reason
  const stop_reason = (msg.tool_calls || []).length || reason === 'tool_calls' ? 'tool_use'
    : reason === 'length' ? 'max_tokens'
      : reason === 'content_filter' ? 'refusal' : 'end_turn'
  return { id: data.id, type: 'message', role: 'assistant', model: data.model || model, content, stop_reason,
    usage: { input_tokens: data.usage?.prompt_tokens || 0, output_tokens: data.usage?.completion_tokens || 0 } }
}

// ------------------------------------------------------------ Gemini, native
// Gemini goes through Google's own generateContent API, not its OpenAI-compatible
// endpoint: the new AI Studio keys (AQ.…) are rejected there ("Multiple
// authentication credentials received" / 401), and the old AIza keys are being
// retired. The key goes in the x-goog-api-key header, never the URL.
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
// Gemini 3 wants each functionCall's thoughtSignature sent back with it. We keep
// it on the tool_use block (callers pass assistant content back unchanged); a
// call with none (e.g. history from another provider) uses Google's documented
// skip value.
const SKIP_SIGNATURE = 'skip_thought_signature_validator'

export function toGemini(req, env = process.env) {
  if ((req.tools || []).some(t => t.type && String(t.type).startsWith('web_search'))) {
    throw new ProviderAPIError(400, 'Web search needs a search key on the server (TAVILY_API_KEY) when you use a non-Anthropic model.', 'google')
  }
  const names = {} // tool_use id -> tool name, for functionResponse
  const contents = []
  const push = (role, parts) => {
    if (!parts.length) return
    const last = contents.at(-1)
    if (last && last.role === role) last.parts.push(...parts) // Gemini wants turns to alternate
    else contents.push({ role, parts })
  }
  for (const m of req.messages || []) {
    const role = m.role === 'assistant' ? 'model' : 'user'
    if (typeof m.content === 'string') { push(role, m.content ? [{ text: m.content }] : []); continue }
    const parts = []
    for (const b of m.content || []) {
      if (b.type === 'text' && b.text) parts.push({ text: b.text })
      else if (b.type === 'tool_use') {
        names[b.id] = b.name
        parts.push({ functionCall: { name: b.name, args: b.input ?? {} }, thoughtSignature: b.thoughtSignature || SKIP_SIGNATURE })
      } else if (b.type === 'tool_result') {
        const out = (b.is_error ? 'Error: ' : '') + text(b.content)
        parts.push({ functionResponse: { name: names[b.tool_use_id] || 'tool', response: { result: out } } })
      }
    }
    push(role, parts)
  }
  const body = { contents, generationConfig: { maxOutputTokens: req.max_tokens } }
  if (req.system) body.systemInstruction = { parts: [{ text: text(req.system) }] }
  if (req.temperature !== undefined) body.generationConfig.temperature = req.temperature
  const tools = (req.tools || []).filter(t => t.name && t.input_schema)
  if (tools.length) body.tools = [{ functionDeclarations: tools.map(t => ({ name: t.name, description: t.description || '', parametersJsonSchema: t.input_schema })) }]
  if (req.tool_choice?.type === 'tool') body.toolConfig = { functionCallingConfig: { mode: 'ANY', allowedFunctionNames: [req.tool_choice.name] } }
  else if (req.tool_choice?.type === 'any') body.toolConfig = { functionCallingConfig: { mode: 'ANY' } }
  return { model: modelFor('google', req.model, env), body }
}

export function fromGemini(data, model) {
  const cand = data.candidates?.[0] || {}
  const content = []
  let n = 0
  for (const p of cand.content?.parts || []) {
    if (p.thought) continue // reasoning summary, not the answer
    if (p.functionCall) {
      content.push({ type: 'tool_use', id: `gem_${Date.now().toString(36)}_${n++}`, name: p.functionCall.name, input: p.functionCall.args || {},
        ...(p.thoughtSignature ? { thoughtSignature: p.thoughtSignature } : {}) })
    } else if (p.text) {
      const last = content.at(-1)
      if (last?.type === 'text') last.text += p.text
      else content.push({ type: 'text', text: p.text, citations: [] })
    }
  }
  const reason = cand.finishReason
  const stop_reason = content.some(b => b.type === 'tool_use') ? 'tool_use'
    : reason === 'MAX_TOKENS' ? 'max_tokens'
      : /SAFETY|BLOCKLIST|PROHIBITED|SPII|RECITATION/.test(reason || '') || data.promptFeedback?.blockReason ? 'refusal' : 'end_turn'
  return { id: data.responseId || `gem_${Date.now().toString(36)}`, type: 'message', role: 'assistant', model: data.modelVersion || model, content, stop_reason,
    usage: { input_tokens: data.usageMetadata?.promptTokenCount || 0, output_tokens: data.usageMetadata?.candidatesTokenCount || 0 } }
}

export function compatClient(provider, apiKey, { env = process.env, fetchImpl = fetch } = {}) {
  if (!PROVIDERS[provider]) throw new Error(`unknown provider ${provider}`)
  const callGemini = async (req, opts = {}) => {
    const { model, body } = toGemini(req, env)
    const res = await fetchImpl(`${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
      ...(opts.signal ? { signal: opts.signal } : {})
    })
    if (!res.ok) {
      let detail = ''
      try { const j = await res.json(); detail = j?.error?.message || '' } catch {}
      throw new ProviderAPIError(res.status, `Google Gemini returned ${res.status}${detail ? `: ${String(detail).slice(0, 200)}` : ''}`, 'google')
    }
    return fromGemini(await res.json(), model)
  }
  const call = async (req, opts = {}) => {
    if (provider === 'google') return withFallback(callGemini, req, opts)
    return withFallback(callCompat, req, opts)
  }
  // A model the key cannot use (free Gemini keys get no Gemini 3.1 Pro; a model is
  // overloaded or not on the account): step down a tier instead of failing. A
  // rejected key (401/403) is not retried, since no tier will work.
  const withFallback = async (fn, req, opts) => {
    const tiers = ['best', 'balanced', 'fast']
    const asModel = { best: 'claude-opus-5-5', balanced: 'claude-sonnet-5-5', fast: 'claude-haiku-5-5' }
    // A model that never answers (Gemini under load hangs instead of returning 503)
    // gets a time limit per tier; the caller's own abort still ends everything.
    const perTier = Number(env.PROVIDER_TIER_TIMEOUT_MS) || 60000
    let last
    for (const tier of tiers.slice(tiers.indexOf(tierOf(String(req.model || ''))))) {
      const limit = AbortSignal.timeout(perTier)
      const signal = opts.signal ? AbortSignal.any([opts.signal, limit]) : limit
      try { return await fn({ ...req, model: asModel[tier] }, { ...opts, signal }) }
      catch (e) {
        if (opts.signal?.aborted) throw e
        const timedOut = limit.aborted
        last = timedOut ? new ProviderAPIError(504, `${PROVIDERS[provider].label} did not answer within ${Math.round(perTier / 1000)}s`, provider) : e
        if (!timedOut && (!(e instanceof ProviderAPIError) || ![404, 429, 503, 529].includes(e.status))) throw e
      }
    }
    throw last
  }
  const callCompat = async (req, opts = {}) => {
    const body = toOpenAI(req, provider, env)
    const res = await fetchImpl(`${PROVIDERS[provider].base}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}`,
        ...(provider === 'openrouter' ? { 'HTTP-Referer': 'https://casebuilder-three.vercel.app', 'X-Title': 'CaseBuilder' } : {}) },
      body: JSON.stringify(body),
      ...(opts.signal ? { signal: opts.signal } : {})
    })
    if (!res.ok) {
      let detail = ''
      try { const j = await res.json(); detail = j?.error?.message || j?.message || '' } catch {}
      throw new ProviderAPIError(res.status, `${PROVIDERS[provider].label} returned ${res.status}${detail ? `: ${String(detail).slice(0, 200)}` : ''}`, provider)
    }
    return fromOpenAI(await res.json(), body.model)
  }
  return {
    provider,
    messages: {
      create: (req, opts) => call(req, opts),
      stream: (req, opts) => { const p = call(req, opts); return { finalMessage: () => p } }
    }
  }
}
