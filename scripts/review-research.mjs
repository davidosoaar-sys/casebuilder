// Real end-to-end check of Research and the chat tool trace on the TEST
// account: browser -> research job -> Hermes worker on the VM (Tavily) ->
// answer, verified sources and "Used N tools" rendered. Then one chat message
// with Search on and one with Search off, checking the trace on each reply.
// Usage: node scripts/review-research.mjs [base-url]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const EMAIL = 'test@casebuilder.dev'
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const shots = '/tmp/cb-shots'; fs.mkdirSync(shots, { recursive: true })

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
page.on('response', async r => { if (r.status() >= 400 && /supabase/.test(r.url())) errors.push(`${r.status()} ${r.url().split('?')[0]} ${(await r.text().catch(() => '')).slice(0, 160)}`) })
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', EMAIL); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]')
await page.waitForSelector('.dashboard', { timeout: 20000 })

// Sidebar: Research outside a project, not Person lookup.
const labels = await page.$$eval('.sidebar-nav .side-label', els => els.map(e => e.textContent))
check('main sidebar shows Research, not Person lookup', labels.includes('Research') && !labels.includes('Person lookup'), labels.join(', '))

await page.click('.side-item[aria-label="Research"]')
await page.waitForSelector('.research-page .research-ask textarea')
await page.click('.research-modes button:nth-child(2)')
await page.waitForSelector('.research-page .lookup-search input')
check('Person tab shows the person lookup inside Research', true)
await page.click('.research-modes button:nth-child(1)')
await page.waitForSelector('.research-ask textarea')

const before = await page.$$eval('.research-history li', l => l.length)
const Q = 'What is the latest Backstage (backstage.io) release version and when was it released?'
await page.type('.research-ask textarea', Q)
await page.click('.research-ask button[type=submit]')
await page.waitForSelector('.research-result', { timeout: 15000 })
check('question enqueued and shown in history', (await page.$$eval('.research-history li', l => l.length)) === before + 1)

// Live progress: a step should appear before the answer does.
let sawLive = false
const t0 = Date.now()
while (Date.now() - t0 < 240000) {
  const s = await page.evaluate(() => ({
    running: !!document.querySelector('.research-working'),
    steps: document.querySelectorAll('.research-result .trace-step').length,
    answer: !!document.querySelector('.research-answer')
  }))
  if (s.running && s.steps > 0) sawLive = true
  if (s.answer) break
  await new Promise(r => setTimeout(r, 1500))
}
check('tool steps shown live while the agent works', sawLive)
await page.waitForSelector('.research-answer', { timeout: 5000 })
const r = await page.evaluate(() => ({
  answer: document.querySelector('.research-answer')?.innerText || '',
  count: document.querySelector('.research-result .trace-count')?.innerText || '',
  sources: [...document.querySelectorAll('.research-sources a')].map(a => a.href),
  cites: document.querySelectorAll('.research-answer .research-cite').length,
  rawFence: document.body.innerText.includes('casebuilder-sources')
}))
check('answer rendered', r.answer.length > 40, r.answer.slice(0, 140).replace(/\n/g, ' '))
check('"Used N tools" shown', /^Used \d+ tools?$/.test(r.count), r.count)
check('sources listed and cited inline', r.sources.length > 0 && r.cites > 0, `${r.sources.length} sources, ${r.cites} cites`)
check('no raw sources block leaks', !r.rawFence)
await page.click('.research-result .trace-summary')
const first = await page.$('.research-result .trace-step-head')
if (first) await first.click()
const detail = await page.evaluate(() => ({
  title: document.querySelector('.research-result .trace-step-title')?.innerText || '',
  provider: document.querySelector('.research-result .trace-step-provider')?.innerText || '',
  input: document.querySelector('.research-result .trace-input')?.innerText || ''
}))
check('first step is a Tavily search with its query', /Searched the web/.test(detail.title) && detail.provider.startsWith('Tavily') && /query/.test(detail.input), `${detail.title} · ${detail.provider}`)
await page.screenshot({ path: `${shots}/research-1440.png`, fullPage: true })
await page.setViewport({ width: 390, height: 844 })
await page.screenshot({ path: `${shots}/research-390.png`, fullPage: true })
check('no horizontal overflow at 390', !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)))
await page.setViewport({ width: 1440, height: 900 })

// Reopen from history after a reload.
await page.reload({ waitUntil: 'networkidle2' })
await page.click('.side-item[aria-label="Research"]')
await page.waitForSelector('.research-history li button')
await page.click('.research-history li button')
await page.waitForSelector('.research-answer', { timeout: 10000 })
check('reopens from history after reload', (await page.$eval('.research-q h2', e => e.innerText)) === Q)

// Chat: Search on -> trace with a search; Search off -> no search.
await page.click('.side-item[aria-label="Projects"]')
await page.waitForSelector('.project-card', { timeout: 15000 }); await (await page.$('.project-card')).click()
await page.waitForSelector('.side-item[aria-label="Agent"]')
const pl = await page.$$eval('.sidebar-nav .side-label', els => els.map(e => e.textContent))
check('project sidebar keeps Person lookup', pl.includes('Person lookup'), pl.join(', '))
await page.click('.side-item[aria-label="Agent"]')
await page.waitForSelector('.chat-panel textarea')

// Wait for the chat history to finish loading before counting replies, or an
// old reply from an earlier run is read as the answer.
await page.waitForFunction(() => !/Loading/.test(document.querySelector('.chat-list')?.innerText || ''), { timeout: 15000 })
await new Promise(r => setTimeout(r, 1500))
const done = () => '.chat-assistant:not(:has(.chat-typing))'
async function chat(text, searchOn) {
  await page.waitForFunction(() => !document.querySelector('.chat-typing'), { timeout: 240000 })
  const on = await page.$eval('.mascot-search', b => b.getAttribute('aria-pressed') === 'true')
  if (on !== searchOn) await page.click('.mascot-search')
  const n = await page.$$eval(done(), l => l.length)
  await page.type('.chat-panel textarea', text)
  await page.keyboard.press('Enter')
  await page.waitForSelector('.chat-typing', { timeout: 15000 })
  await page.waitForFunction((sel, n) => !document.querySelector('.chat-typing') && document.querySelectorAll(sel).length > n, { timeout: 240000 }, done(), n)
  return page.evaluate(() => {
    const last = [...document.querySelectorAll('.chat-assistant:not(:has(.chat-typing))')].pop()
    return { text: last.querySelector('.chat-bubble')?.innerText || '', count: last.querySelector('.trace-count')?.innerText || '', meta: last.querySelector('.msg-meta')?.innerText || '' }
  })
}
const on = await chat('Search the web: who is the current CEO of Spotify? One sentence, name the source.', true)
check('chat with Search on shows the tools it used', /^Used \d+ tools?$/.test(on.count), `${on.count} · ${on.text.slice(0, 100)}`)
await page.screenshot({ path: `${shots}/chat-trace-1440.png` })
const off = await chat('Without searching: what does a champion do in a B2B deal? One sentence.', false)
check('chat with Search off uses no web tools and says so', !/Used/.test(off.count) && /search off/.test(off.meta), `${off.meta}`)

check('no page errors or failed Supabase calls', errors.length === 0, errors.slice(0, 3).join(' | '))
await browser.close()
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
