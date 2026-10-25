// The AI providers a user can bring a key for, and the model each one runs at
// each tier the chat picker offers. Must match worker.py PROVIDERS and
// server/compatClient.js TIERS (tested in modelProviders.test.js).
export const MODEL_PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic (Claude)', short: 'Anthropic', prefix: 'sk-ant-', where: 'console.anthropic.com → API Keys',
    models: { fast: 'Haiku 5.5', balanced: 'Sonnet 5.5', best: 'Opus 5.5' } },
  { id: 'openai', name: 'OpenAI', short: 'OpenAI', prefix: 'sk-', where: 'platform.openai.com → API keys',
    models: { fast: 'GPT-5.6 Luna', balanced: 'GPT-5.6 Terra', best: 'GPT-5.6 Sol' } },
  { id: 'google', name: 'Google Gemini', short: 'Gemini', prefix: 'AIza', where: 'aistudio.google.com → Get API key',
    models: { fast: 'Gemini 3.5 Flash Lite', balanced: 'Gemini 3.8 Flash', best: 'Gemini 3.1 Pro' } },
  { id: 'openrouter', name: 'OpenRouter (any model, one key)', short: 'OpenRouter', prefix: 'sk-or-', where: 'openrouter.ai → Keys',
    models: { fast: 'Claude Haiku 5.5', balanced: 'Claude Sonnet 5.5', best: 'Claude Opus 5.5' } }
]
export const providerById = id => MODEL_PROVIDERS.find(p => p.id === id) || null

// The key the agent runs on: the one marked preferred, else the newest.
export function activeKey(keys) {
  if (!keys?.length) return null
  return keys.find(k => k.preferred) || [...keys].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))[0]
}
