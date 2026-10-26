// Real agent formatting check on the VPS harness. Signs in as TEST, opens the Spotify sample's agent,
// starts a NEW chat, asks for a structured reply, waits for it, then checks the rendered bubble has
// headings, a sub-heading, bullets, a divider and a table, with no raw markdown (#, ---, |) showing.
// Screenshots dark + light. Deletes its chat afterwards.
// Usage (always through the harness): bash scripts/run-harness-review.sh scripts/review-v0160-format.mjs
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'
const base = process.argv[2] || 'http://localhost:5173'
const out = '/tmp/cb-v0160-format'; fs.mkdirSync(out, { recursive: true })
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}` }
const rest = (p, init = {}) => fetch(`${W.SUPABASE_URL}/rest/v1/${p}`, { ...init, headers: { ...H, ...(init.headers || {}) } })
const sleep = ms => new Promise(r => setTimeout(r, ms))
const results = []
const check = (name, ok, detail = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`) }
const STAMP = `fmt${Date.now().toString(36)}`
const Q = `[${STAMP}] Give me a structured briefing for this deal: a ## heading, two ### sub-sections with bullet points, a --- divider, and a small markdown table comparing two rollout options (columns: Option, Time, Risk). Keep it short.`

const browser = await puppeteer.launch({ headless: 'new', protocolTimeout: 600000 })
const page = await browser.newPage()
const errors = []; page.on('pageerror', e => errors.push(e.message))
const clickText = (label, selector) => page.evaluate((label, selector) => {
  const b = [...document.querySelectorAll(selector)].find(x => (x.getAttribute('aria-label') || x.innerText).trim().toLowerCase() === label.toLowerCase())
  if (!b) throw new Error(`Button not found: "${label}" (${selector})`)
  b.click()
}, label, selector)
let chatTitle = null
try {
  await page.setViewport({ width: 1280, height: 900 })
  await page.goto(base, { waitUntil: 'networkidle2' })
  await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
  await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
  await clickText('Projects', '.side-item')
  await page.waitForSelector('.project-card', { timeout: 15000 })
  const card = await page.evaluateHandle(() => [...document.querySelectorAll('.project-card')].find(c => /spotify/i.test(c.innerText)))
  if (!card.asElement()) throw new Error('Project card not found: Spotify')
  await card.asElement().click(); await page.waitForSelector('#engineers', { timeout: 15000 })
  await clickText('Agent', '.side-item'); await page.waitForSelector('.chat-full', { timeout: 15000 })
  await page.waitForNetworkIdle({ idleTime: 800 }).catch(() => {})
  // New chat: header menu (one chat) or rail (2+).
  if (!(await page.$('.chat-rail'))) await page.click('.chat-menu-btn')
  await page.waitForSelector('.chat-rail-new'); await clickText('New chat', '.chat-rail-new'); await sleep(500)
  const before = await page.$$eval('.chat-full .chat-assistant', l => l.length)
  await page.type('#chat-input', Q); await page.keyboard.press('Enter')
  chatTitle = Q.slice(0, 30)
  await page.waitForFunction(n => document.querySelectorAll('.chat-full .chat-assistant').length > n && !document.querySelector('.chat-typing'), { timeout: 300000 }, before)
  await sleep(1200)
  const r = await page.$eval('.chat-full .chat-assistant:last-of-type .research-answer', el => ({
    h3: el.querySelectorAll('h3').length, h4: el.querySelectorAll('h4').length, ul: el.querySelectorAll('ul li').length,
    hr: el.querySelectorAll('hr').length, table: el.querySelectorAll('table').length, th: el.querySelectorAll('th').length,
    text: el.innerText,
  })).catch(e => ({ err: e.message }))
  if (r.err) throw new Error('reply bubble not found: ' + r.err)
  check('heading renders', r.h3 >= 1, `${r.h3}`)
  check('sub-headings render', r.h4 >= 1, `${r.h4}`)
  check('bullets render', r.ul >= 2, `${r.ul}`)
  check('divider renders', r.hr >= 1, `${r.hr}`)
  check('table renders with a header', r.table >= 1 && r.th >= 2, `${r.table} tables, ${r.th} headers`)
  check('no raw markdown left in the text', !/^\s*(#{1,6}\s|---\s*$|\|.*\|)/m.test(r.text), r.text.split('\n').find(l => /^\s*(#{1,6}\s|---\s*$|\|.*\|)/.test(l)) || '')
  const bubble = await page.$('.chat-full .chat-assistant:last-of-type')
  await bubble.screenshot({ path: `${out}/reply-dark.png` })
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'))
  await sleep(500)
  await (await page.$('.chat-full .chat-assistant:last-of-type')).screenshot({ path: `${out}/reply-light.png` })
} finally {
  // Delete this run's chat (titled from the message) and its messages.
  const chats = await (await rest(`chats?title=like.*${STAMP}*&select=id`)).json()
  for (const c of chats) { await rest(`chat_messages?chat_id=eq.${c.id}`, { method: 'DELETE' }); await rest(`chats?id=eq.${c.id}`, { method: 'DELETE' }) }
  check('cleanup: test chat deleted', chats.length === 1, `${chats.length}`)
  check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 200))
  await browser.close()
}
console.log(`${results.filter(Boolean).length}/${results.length} passed; screenshots in ${out}`)
process.exit(results.every(Boolean) ? 0 : 1)
