// v0.16.1 setup loading states. TEST account; /api/brand and /api/research are HELD (never answered,
// never reach the server) so the loading states can be seen, then the page is closed. Blocks every
// Supabase write. Opens the setup screens on the Spotify sample by driving App's own stage via the
// "Brand" and "People" steps of a fresh in-memory project (the project is never saved).
// Usage: node scripts/review-v0161-progress.mjs [base]
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
let signedIn = false, blocked = 0, held = []
await page.setRequestInterception(true)
page.on('request', r => {
  const u = r.url(), m = r.method()
  if (/\/api\/(brand|research)$/.test(new URL(u).pathname)) { held.push(new URL(u).pathname); return } // never answered
  if (signedIn && /supabase\.co\/(rest|storage)\/v1\//.test(u) && !['GET', 'HEAD', 'OPTIONS'].includes(m)) { blocked++; return r.abort() }
  r.continue()
})
const clickText = (label, selector) => page.evaluate((label, selector) => {
  const b = [...document.querySelectorAll(selector)].find(x => (x.getAttribute('aria-label') || x.innerText).trim().toLowerCase() === label.toLowerCase())
  if (!b) throw new Error(`Button not found: "${label}" (${selector})`); b.click()
}, label, selector)
try {
  await page.setViewport({ width: 1280, height: 900 })
  await page.goto(base, { waitUntil: 'networkidle2' })
  await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
  await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 }); signedIn = true
  // New project dialog -> creates the project in memory and starts brand discovery (held).
  await page.click('.side-item[aria-label="Projects"]'); await page.waitForSelector('.project-card', { timeout: 15000 })
  await clickText('New project', 'main button.primary'); await page.waitForSelector('.modal #company-name', { timeout: 5000 }); await sleep(700)
  await page.type('#company-name', 'Northwind Review'); await sleep(200)
  await page.click('.modal button[type=submit]'); await sleep(1500)
  // The setup flow starts on the map; continue to brand.
  await page.screenshot({ path: `${out}/after-create.png` })
  for (let i = 0; i < 4 && !(await page.$('.brand-setup')); i++) {
    const btns = await page.$$eval('main button.primary', l => l.map(b => b.innerText.trim()))
    console.log('  step', i, 'primary buttons:', JSON.stringify(btns))
    const clicked = await page.evaluate(() => { const b = [...document.querySelectorAll('main button.primary')].at(-1); if (!b || b.disabled) return false; b.click(); return true })
    if (!clicked) break
    await sleep(900)
  }
  await page.waitForSelector('.brand-setup', { timeout: 15000 })
  await page.waitForSelector('.brand-setup .agent-progress', { timeout: 8000 })
  check('brand: progress shows while scanning', true, `held ${held.join(',')}`)
  const s0 = await page.$$eval('.agent-progress-steps li', l => l.map(li => li.className))
  check('brand: 5 steps, first is current', s0.length === 5 && s0[0] === 'is-now' && s0.slice(1).every(c => c === 'is-next'), s0.join(' '))
  check('brand: shimmer placeholder in the result\'s shape', !!(await page.$('.agent-ghost-brand .ghost-logo')) && !!(await page.$('.agent-ghost-brand .ghost-swatch')))
  check('brand: Continue disabled while scanning', await page.$eval('.brand-setup-actions .primary', b => b.disabled))
  await sleep(800); await page.screenshot({ path: `${out}/brand-0s.png` })
  await sleep(14500)
  const s1 = await page.$$eval('.agent-progress-steps li', l => l.map(li => li.className))
  check('brand: steps tick forward (2 done after ~15s)', s1.slice(0, 2).every(c => c === 'is-done') && s1[2] === 'is-now', s1.join(' '))
  check('brand: elapsed time shown', /\d+s/.test(await page.$eval('.agent-progress-time', e => e.innerText)))
  await page.screenshot({ path: `${out}/brand-15s.png` })
  // Light theme.
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await sleep(400)
  await page.screenshot({ path: `${out}/brand-light.png` })
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme')); await sleep(300)
  // Skip ahead to People (Continue is disabled while scanning: use the sidebar step if present, else stop here).
  await page.evaluate(() => { const b = [...document.querySelectorAll('.brand-setup-actions .ghost')][0]; b?.click() }); await sleep(400)
  check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 200))
} finally {
  // Leave the page while writes are still blocked: the app saves on pagehide, and a
  // save during browser.close() would slip past the interception.
  await page.goto('about:blank').catch(() => {}); await sleep(500)
  await browser.close()
  const { execFileSync } = await import('node:child_process')
  const left = execFileSync('node', [new URL('./delete-test-project.mjs', import.meta.url).pathname, 'Northwind Review'], { encoding: 'utf8' })
  check('cleanup: no test project saved', /matched 0/.test(left), left.trim().split('\n').at(-1))
}
console.log(`${results.filter(Boolean).length}/${results.length} passed; blocked writes ${blocked}; held ${held.length}; screenshots in ${out}`)
process.exit(results.every(Boolean) ? 0 : 1)
