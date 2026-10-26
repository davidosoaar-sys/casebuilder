// v0.16.1 Gemini end to end, through the app, on the VPS harness (new worker):
// 1. save the TEST account's real Gemini key (AQ. format) through set_model_key, as Settings does
// 2. ask the agent in a new chat; the reply must come from a Gemini model
// 3. save a fake AQ. key; the next message gets the clear "key was rejected" reply, no generic failure
// 4. always: remove the Gemini key and make Anthropic the active key again, delete the test chat
// Usage: PUMP=1 bash scripts/run-harness-review.sh scripts/review-v0161-gemini.mjs
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'
const base = process.argv[2] || 'http://localhost:5173'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const L = envFile(new URL('../.env.local', import.meta.url).pathname)
const URL_ = L.VITE_SUPABASE_URL, ANON = L.VITE_SUPABASE_PUBLISHABLE_KEY
const ADMIN = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}` }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const results = []
const check = (n, ok, x = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const STAMP = `gem${Date.now().toString(36)}`

const tok = (await (await fetch(`${URL_}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@casebuilder.dev', password: T.TEST_PASSWORD }) })).json()).access_token
const rpc = async (fn, args) => { const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) }); return { ok: r.ok, body: await r.text() } }
const keys = async () => (await (await fetch(`${URL_}/rest/v1/model_keys?select=provider,preferred,last4`, { headers: { apikey: ANON, Authorization: `Bearer ${tok}` } })).json())

const browser = await puppeteer.launch({ headless: 'new', protocolTimeout: 600000 })
const page = await browser.newPage()
const errors = []; page.on('pageerror', e => errors.push(e.message))
const clickText = (label, selector) => page.evaluate((label, selector) => {
  const b = [...document.querySelectorAll(selector)].find(x => (x.getAttribute('aria-label') || x.innerText).trim().toLowerCase() === label.toLowerCase())
  if (!b) throw new Error(`Button not found: "${label}" (${selector})`); b.click()
}, label, selector)
const ask = async q => {
  const before = await page.$$eval('.chat-full .chat-assistant', l => l.length)
  await page.type('#chat-input', q); await page.keyboard.press('Enter')
  await page.waitForFunction(n => document.querySelectorAll('.chat-full .chat-assistant').length > n && !document.querySelector('.chat-typing'), { timeout: 420000 }, before)
  await sleep(1500)
  return page.$eval('.chat-full .chat-assistant:last-of-type', el => el.innerText)
}
const before = await keys()
console.log('keys before:', JSON.stringify(before))
try {
  const s = await rpc('set_model_key', { p_provider: 'google', p_key: T.GEMINI_API_KEY })
  check('a new-format (AQ.) Gemini key saves', s.ok, s.ok ? `ends ${JSON.parse(s.body)}` : s.body.slice(0, 160))
  const bad = await rpc('set_model_key', { p_provider: 'google', p_key: 'sk-ant-api03-notgeminiatall000000000' })
  check('a non-Gemini key is refused with a clear message', !bad.ok && /AQ\./.test(bad.body), bad.body.slice(0, 120))
  await rpc('set_model_key', { p_provider: 'google', p_key: T.GEMINI_API_KEY }) // the failed call above must not have changed it
  check('Gemini is the active key', (await keys()).find(k => k.preferred)?.provider === 'google')

  await page.setViewport({ width: 1280, height: 900 })
  await page.goto(base, { waitUntil: 'networkidle2' })
  await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
  await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
  await clickText('Projects', '.side-item'); await page.waitForSelector('.project-card', { timeout: 15000 })
  const card = await page.evaluateHandle(() => [...document.querySelectorAll('.project-card')].find(c => /spotify/i.test(c.innerText)))
  await card.asElement().click(); await page.waitForSelector('#engineers', { timeout: 15000 })
  await clickText('Agent', '.side-item'); await page.waitForSelector('.chat-full', { timeout: 15000 })
  await page.waitForNetworkIdle({ idleTime: 800 }).catch(() => {})
  if (!(await page.$('.chat-rail'))) await page.click('.chat-menu-btn')
  await page.waitForSelector('.chat-rail-new'); await clickText('New chat', '.chat-rail-new'); await sleep(500)

  const t0 = Date.now()
  const reply = await ask(`[${STAMP}] In one sentence: which company is this project about? Do not change anything.`)
  const [msg] = await (await fetch(`${W.SUPABASE_URL}/rest/v1/chat_messages?role=eq.assistant&order=id.desc&limit=1&content=not.is.null&select=content,meta,chat_id`, { headers: ADMIN })).json()
  check('the agent answers on Gemini', /^gemini-/.test(msg?.meta?.model || '') && /spotify/i.test(reply), `${msg?.meta?.model}${msg?.meta?.fell_back_from ? ' (from ' + msg.meta.fell_back_from + ')' : ''}; ${Math.round((Date.now() - t0) / 1000)}s; "${reply.replace(/\s+/g, ' ').slice(0, 90)}"`)

  await rpc('set_model_key', { p_provider: 'google', p_key: 'AQ.Ab8RN6notarealkey000000000000000000000000000' })
  const rejected = await ask(`[${STAMP}] Say hello.`)
  check('a rejected key gets a clear reply, not a generic failure', /key was rejected/i.test(rejected) && /Settings/.test(rejected) && !/AQ\.Ab8RN6/.test(rejected), rejected.replace(/\s+/g, ' ').slice(0, 160))
  await page.screenshot({ path: '/tmp/cb-v0161-gemini-badkey.png' })
} finally {
  await rpc('delete_model_key', { p_provider: 'google' })
  if (before.some(k => k.provider === 'anthropic')) await rpc('set_preferred_model_key', { p_provider: 'anthropic' })
  const after = await keys()
  check('cleanup: Gemini key removed, Anthropic active again', !after.some(k => k.provider === 'google') && after.find(k => k.preferred)?.provider === (before.find(k => k.preferred)?.provider), JSON.stringify(after))
  const chats = await (await fetch(`${W.SUPABASE_URL}/rest/v1/chats?title=like.*${STAMP}*&select=id`, { headers: ADMIN })).json()
  for (const c of chats) { await fetch(`${W.SUPABASE_URL}/rest/v1/chat_messages?chat_id=eq.${c.id}`, { method: 'DELETE', headers: ADMIN }); await fetch(`${W.SUPABASE_URL}/rest/v1/chats?id=eq.${c.id}`, { method: 'DELETE', headers: ADMIN }) }
  check('cleanup: test chat deleted', chats.length === 1, `${chats.length}`)
  check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 200))
  await browser.close()
}
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
