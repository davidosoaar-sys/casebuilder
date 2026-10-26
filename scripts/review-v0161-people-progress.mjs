// v0.16.1 people-search loading state, in the Spotify sample's Case inputs ("Find people").
// /api/research is HELD (never answered, never reaches the server); every Supabase write blocked.
// Usage: node scripts/review-v0161-people-progress.mjs [base]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'
const base = process.argv[2] || 'http://localhost:5173'
const out = '/tmp/cb-v0161-progress'; fs.mkdirSync(out, { recursive: true })
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const results = []
const check = (n, ok, x = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
const errors = []; page.on('pageerror', e => errors.push(e.message))
let signedIn = false, blocked = 0, held = 0
await page.setRequestInterception(true)
page.on('request', r => {
  const u = r.url(), m = r.method()
  if (new URL(u).pathname === '/api/research') { held++; return }
  if (signedIn && /supabase\.co\/(rest|storage)\/v1\//.test(u) && !['GET', 'HEAD', 'OPTIONS'].includes(m)) { blocked++; return r.abort() }
  r.continue()
})
try {
  await page.setViewport({ width: 1280, height: 900 })
  await page.goto(base, { waitUntil: 'networkidle2' })
  await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
  await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 }); signedIn = true
  await page.click('.side-item[aria-label="Projects"]'); await page.waitForSelector('.project-card', { timeout: 15000 })
  const card = await page.evaluateHandle(() => [...document.querySelectorAll('.project-card')].find(c => /spotify/i.test(c.innerText)))
  await card.asElement().click(); await page.waitForSelector('#engineers', { timeout: 15000 })
  // The People tab of Case inputs.
  await page.evaluate(() => { const t = [...document.querySelectorAll('.details-tab')].find(b => /^People/.test(b.innerText.trim())); t?.click() })
  await page.waitForSelector('.people-embedded .role-block', { timeout: 10000 })
  const btn = await page.evaluateHandle(() => [...document.querySelectorAll('.people-embedded .role-block .role-head button')][0])
  if (!btn.asElement()) throw new Error('no Find people button in Case inputs')
  await btn.asElement().evaluate(b => b.scrollIntoView({ block: 'center' }))
  await btn.asElement().click()
  await page.waitForSelector('.people-embedded .agent-progress', { timeout: 5000 })
  check('people: progress shows while searching', true, `held ${held}`)
  const n = await page.$$eval('.people-embedded .agent-progress-steps li', l => l.length)
  check('people: 4 steps', n === 4, `${n}`)
  check('people: person-card placeholders', (await page.$$('.people-embedded .agent-ghost-person')).length >= 1)
  check('people: the role button says Searching…', /Searching/.test(await btn.asElement().evaluate(b => b.innerText)))
  await sleep(10500)
  const st = await page.$$eval('.people-embedded .agent-progress-steps li', l => l.map(li => li.className))
  check('people: first step done after ~10s', st[0] === 'is-done' && st[1] === 'is-now', st.join(' '))
  const box = await page.$('.people-embedded .role-block:has(.agent-progress)')
  await box.evaluate(b => b.scrollIntoView({ block: 'center' })); await sleep(300)
  await box.screenshot({ path: `${out}/people-dark.png` })
  await page.setViewport({ width: 375, height: 800 }); await sleep(600)
  await (await page.$('.people-embedded .role-block:has(.agent-progress)')).screenshot({ path: `${out}/people-375.png` })
  check('no sideways scroll at 375', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
} finally {
  check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 200))
  await page.goto('about:blank').catch(() => {}); await sleep(400)
  await browser.close()
}
console.log(`${results.filter(Boolean).length}/${results.length} passed; blocked writes ${blocked}; screenshots in ${out}`)
process.exit(results.every(Boolean) ? 0 : 1)
