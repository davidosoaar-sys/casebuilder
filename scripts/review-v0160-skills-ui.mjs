// v0.16.0 Skills page review (TEST account, read-only: no adds/removes saved).
// Shots: Discover, Yours, detail modal, Try picker, hover, 375px; plus checks.
// Usage: node scripts/review-v0160-skills-ui.mjs [base-url] [out-dir]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const out = process.argv[3] || '/tmp/cb-v0160-skills'
fs.mkdirSync(out, { recursive: true })
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
const errors = []
page.on('pageerror', e => errors.push(e.message))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('response', async r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`) })
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
const [b] = await page.$$('xpath/.//button[contains(@class,"side-item") and contains(., "Customize")]'); await b.click()
await page.waitForSelector('.skills-page .skill-card', { timeout: 15000 }); await sleep(900)
await page.screenshot({ path: `${out}/01-discover.png` })
await page.screenshot({ path: `${out}/01b-discover-full.png`, fullPage: true })

const geo = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.skill-card')].map(c => c.getBoundingClientRect())
  const tabs = [...document.querySelectorAll('[role=tab]')].map(t => ({ t: t.innerText.trim(), sel: t.getAttribute('aria-selected') }))
  return { n: cards.length, lefts: [...new Set(cards.map(c => Math.round(c.left)))], heights: cards.map(c => Math.round(c.height)), widths: [...new Set(cards.map(c => Math.round(c.width)))], tabs, overflow: document.documentElement.scrollWidth > innerWidth, names: [...document.querySelectorAll('.skill-card strong')].map(s => s.innerText) }
})
console.log(JSON.stringify(geo))
check('Discover shows the 4 built-ins', geo.n === 4, geo.names.join(', '))
check('2-column grid at 1280', geo.lefts.length === 2, geo.lefts.join(','))
check('exactly one tab selected', geo.tabs.filter(t => t.sel === 'true' && ['Discover', 'Yours'].some(n => t.t.startsWith(n))).length === 1, JSON.stringify(geo.tabs))
check('no horizontal overflow', !geo.overflow)
check('no Schedule button on the page', !(await page.evaluate(() => [...document.querySelectorAll('.skills-page button')].some(b => /schedule/i.test(b.innerText)))))

// hover lift
const card = await page.$('.skill-card'); const box = await card.boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + 20); await sleep(350)
const tf = await card.evaluate(e => getComputedStyle(e).transform)
check('card lifts on hover', tf !== 'none', tf)
await page.screenshot({ path: `${out}/02-hover.png`, clip: { x: box.x - 20, y: box.y - 20, width: box.width + 40, height: box.height + 40 } })

// search
const SEL = '.skills-page input[type=search], .skills-page input[placeholder*="earch"]'
const search = await page.$(SEL)
const clear = async () => { await page.$eval(SEL, el => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, ''); el.dispatchEvent(new Event('input', { bubbles: true })) }); await sleep(500) }
check('search input exists', !!search)
if (search) {
  await search.type('objection'); await sleep(500)
  const n = await page.$$eval('.skill-card', l => l.length)
  check('search filters to 1', n === 1, String(n))
  await clear(); await search.type('zzzz'); await sleep(400)
  check('no-match message', await page.evaluate(() => /No skills match/.test(document.body.innerText)))
  await page.screenshot({ path: `${out}/03-nomatch.png` })
  await clear()
  check('clearing search restores 4', (await page.$$eval('.skill-card', l => l.length)) === 4)
}

// detail modal
await page.evaluate(() => document.querySelector('.skill-card strong').click()); await sleep(500)
const modal = await page.$('.skill-modal')
check('detail modal opens', !!modal)
if (modal) {
  const m = await page.evaluate(() => ({ inBody: document.querySelector('.skill-modal').closest('#root') === null, active: document.activeElement?.getAttribute('aria-label') || document.activeElement?.innerText, overflow: getComputedStyle(document.body).overflow, text: document.querySelector('.skill-modal').innerText.slice(0, 300) }))
  check('modal portalled to body', m.inBody); check('focus on close', /close/i.test(m.active || ''), m.active); check('body scroll locked', m.overflow === 'hidden', m.overflow)
  await page.screenshot({ path: `${out}/04-modal.png` })
  await page.keyboard.press('Escape'); await sleep(400)
  check('Escape closes modal', !(await page.$('.skill-modal')))
  check('body scroll restored', await page.evaluate(() => getComputedStyle(document.body).overflow !== 'hidden'))
}

// Try -> project picker (cancel, nothing sent)
await page.click('.skill-card .skill-try'); await sleep(600)
const pick = await page.$('.skill-pick')
console.log('after Try:', pick ? 'picker open' : 'no picker (single project or navigated)')
if (pick) { await page.screenshot({ path: `${out}/05-try-picker.png` }); await page.keyboard.press('Escape'); await sleep(400) }
else { await page.screenshot({ path: `${out}/05-after-try.png` }) }

// Yours tab
if (!(await page.$('.skills-page'))) { const [s] = await page.$$('xpath/.//button[contains(@class,"side-item") and contains(., "Customize")]'); await s.click(); await page.waitForSelector('.skills-page', { timeout: 10000 }) }
const [yours] = await page.$$('xpath/.//*[@role="tab" and contains(., "Yours")]')
await yours.click(); await sleep(800)
await page.screenshot({ path: `${out}/06-yours.png` })
check('Yours tab selected', await yours.evaluate(e => e.getAttribute('aria-selected') === 'true'))

// New skill modal (cancel)
const [nb] = await page.$$('xpath/.//button[contains(., "New skill")]'); await nb.click(); await sleep(500)
await page.screenshot({ path: `${out}/07-new-skill.png` })
await page.keyboard.press('Escape'); await sleep(300)

// mobile
await page.setViewport({ width: 375, height: 800 }); await sleep(600)
const [disc] = await page.$$('xpath/.//*[@role="tab" and contains(., "Discover")]'); await disc.click(); await sleep(700)
await page.screenshot({ path: `${out}/08-mobile.png`, fullPage: true })
check('no overflow at 375', !(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)))

check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '))
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
await browser.close()
