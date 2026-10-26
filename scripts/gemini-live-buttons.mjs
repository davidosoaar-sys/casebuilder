// Real Gemini calls through the button client (server/compatClient.js) with the TEST key.
// The key is never printed. Usage: node scripts/gemini-live-buttons.mjs
import fs from 'node:fs'
import os from 'node:os'
import { compatClient } from '../server/compatClient.js'
const t = fs.readFileSync(`${os.homedir()}/.config/casebuilder/test-account.env`, 'utf8')
const key = (/^GEMINI_API_KEY=(.*)$/m.exec(t)?.[1] || '').trim()
const results = []
const check = (n, ok, x = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const urls = []
const spy = (url, init) => { const m = url.match(/models\/([^:]+)/)?.[1]; urls.push(m); const t1 = Date.now(); console.log('  call', m); return fetch(url, { ...init, signal: init.signal || AbortSignal.timeout(90000) }).then(r => { console.log('  ', m, r.status, Date.now() - t1, 'ms'); return r }) }
const c = compatClient('google', key, { env: {}, fetchImpl: spy })
// 1. Plain answer, best tier requested (free keys get no Pro: should step down).
let t0 = Date.now()
try {
  const r = await c.messages.create({ model: 'claude-opus-5-5', max_tokens: 400, system: 'Answer in one short sentence.', messages: [{ role: 'user', content: 'What is the capital of Sweden?' }] })
  const txt = r.content.filter(b => b.type === 'text').map(b => b.text).join('')
  check('best tier request answers', /stockholm/i.test(txt), `${urls.join(' -> ')}; ${Date.now() - t0}ms; "${txt.slice(0, 60)}"`)
} catch (e) { check('best tier request answers', false, `${urls.join(' -> ')}: ${e.message.slice(0, 200)}`) }
// 2. Tool use round trip (how Find people / Suggest values search), forced tool, then the result.
urls.length = 0; t0 = Date.now()
const tools = [{ name: 'web_search', description: 'Search the web', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } }]
try {
  const m1 = await c.messages.stream({ model: 'claude-sonnet-5-5', max_tokens: 800, tools, tool_choice: { type: 'any' },
    system: 'Use web_search before answering.', messages: [{ role: 'user', content: 'Who is the CEO of Spotify?' }] }).finalMessage()
  const call = m1.content.find(b => b.type === 'tool_use')
  check('model calls the search tool', call && m1.stop_reason === 'tool_use' && call.input?.query, call ? `query "${call.input?.query}"` : JSON.stringify(m1.content).slice(0, 150))
  if (call) {
    const m2 = await c.messages.create({ model: 'claude-sonnet-5-5', max_tokens: 800, tools, system: 'Use web_search before answering.', messages: [
      { role: 'user', content: 'Who is the CEO of Spotify?' }, { role: 'assistant', content: m1.content },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: call.id, content: 'Result: Alex Norstrom and Gustav Soderstrom are co-CEOs of Spotify since 1 January 2026.' }] }] })
    const txt = m2.content.filter(b => b.type === 'text').map(b => b.text).join('')
    console.log("  m2:", m2.stop_reason, JSON.stringify(m2.content).slice(0, 300)); check("answers from the tool result (thought signature accepted)", /norstr|s.derstr/i.test(txt) || (m2.stop_reason === "tool_use" && m2.content.some(b => b.type === "tool_use")), `${urls.join(' -> ')}; ${Date.now() - t0}ms; "${txt.slice(0, 80)}"`)
  }
} catch (e) { check('tool round trip', false, `${urls.join(' -> ')}: ${e.message.slice(0, 220)}`) }
// 3. A wrong key fails clearly and is not retried.
urls.length = 0
const bad = compatClient('google', 'AQ.Ab8RN6notarealkey000000000000000000000000000', { env: {}, fetchImpl: spy })
try { await bad.messages.create({ model: 'claude-opus-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] }); check('bad key rejected', false) }
catch (e) { check('bad key rejected once, clear message', urls.length === 1 && /Google Gemini returned 4\d\d/.test(e.message), `${urls.length} call; ${e.message.slice(0, 120)}`) }
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
