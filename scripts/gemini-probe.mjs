// Probe the TEST account's Gemini key (never printed): which models exist, and how each
// tier model and each route answers. Usage: node scripts/gemini-probe.mjs
import fs from 'node:fs'
import os from 'node:os'
const t = fs.readFileSync(`${os.homedir()}/.config/casebuilder/test-account.env`, 'utf8')
const k = (/^GEMINI_API_KEY=(.*)$/m.exec(t)?.[1] || '').trim()
const B = 'https://generativelanguage.googleapis.com/v1beta'
const timed = (url, init, ms = 45000) => { const c = new AbortController(); const id = setTimeout(() => c.abort(), ms); const t0 = Date.now()
  return fetch(url, { ...init, signal: c.signal }).then(async r => ({ status: r.status, body: await r.text(), ms: Date.now() - t0 }))
    .catch(e => ({ status: 'ERR', body: e.name === 'AbortError' ? `timeout ${ms}ms` : e.message, ms: Date.now() - t0 })).finally(() => clearTimeout(id)) }
const list = await timed(`${B}/models?pageSize=200`, { headers: { 'x-goog-api-key': k } })
const names = list.status === 200 ? JSON.parse(list.body).models.filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace('models/', '')) : []
console.log('models', list.status, names.filter(n => /^gemini-(3|4)/.test(n)).join(', '))
for (const model of process.argv.slice(2).length ? process.argv.slice(2) : ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.1-pro-preview']) {
  const r = await timed(`${B}/models/${model}:generateContent`, { method: 'POST', headers: { 'x-goog-api-key': k, 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with the word OK.' }] }] }) })
  let out = r.body
  try { const j = JSON.parse(r.body); out = (j.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text).join('') || JSON.stringify(j.error || j).slice(0, 180) } catch {}
  console.log('native', model, r.status, `${r.ms}ms`, String(out).replace(/\s+/g, ' ').slice(0, 180))
}
