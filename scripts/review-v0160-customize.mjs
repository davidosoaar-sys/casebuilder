// v0.16.0 Customize: Skills and Connectors under one sidebar item with two tabs.
// TEST account, blocks every Supabase write (incl. rpc). Screenshots dark/light, 1280 and 375.
// Usage: node scripts/review-v0160-customize.mjs [base-url]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'
const base = process.argv[2] || 'http://localhost:5173'
const out = '/tmp/cb-v0160-customize'; fs.mkdirSync(out, { recursive: true })
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const results = []
const check = (name, ok, detail = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`) }
const browser = await puppeteer.launch({ headless: 'new', protocolTimeout: 120000 })
const page = await browser.newPage()
const errors = []; page.on('pageerror', e => errors.push(e.message))
let blocked = 0, signedIn = false
await page.setRequestInterception(true)
page.on('request', r => {
  const u = r.url(), m = r.method()
  const write = /supabase\.co\/(rest\/v1|storage\/v1)\//.test(u) && (m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS')
  if (write && signedIn) { blocked++; return r.abort() }
  r.continue()
})
const nav = label => page.evaluate(label => {
  const b = [...document.querySelectorAll('.sidebar-desktop .side-item')].find(x => (x.getAttribute('aria-label') || '').toLowerCase() === label.toLowerCase())
  if (!b) throw new Error('nav not found: ' + label); b.click()
}, label)
const sideLabels = () => page.$$eval('.sidebar-desktop .sidebar-nav .side-item', l => l.map(e => e.getAttribute('aria-label')))
const lit = () => page.$eval('.sidebar-desktop .side-item[aria-current=page]', e => e.getAttribute('aria-label')).catch(() => null)
try {
  await page.setViewport({ width: 1280, height: 860 })
  await page.goto(base, { waitUntil: 'networkidle2' })
  await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
  await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 }); signedIn = true
  const labels = await sideLabels()
  check('sidebar has Customize, not separate Skills / Connectors', labels.includes('Customize') && !labels.includes('Skills') && !labels.includes('Connectors'), labels.join(', '))
  await nav('Customize'); await page.waitForSelector('.customize-page', { timeout: 10000 }); await sleep(900)
  const h1 = await page.$eval('.customize-page h1', e => e.innerText)
  check('Customize page has one title', h1 === 'Customize' && (await page.$$('.customize-page h1')).length === 1, h1)
  check('opens on the Skills tab', await page.$eval('#customize-tab-skills', e => e.getAttribute('aria-selected')) === 'true')
  check('Customize is lit in the sidebar', (await lit()) === 'Customize', await lit())
  check('Skills content shows (Discover/Yours, search, New skill)', !!(await page.$('#skills-tab-discover')) && !!(await page.$('.skill-search input')) && !!(await page.$('.skill-new')))
  await page.waitForSelector('.skill-card, .skill-featured', { timeout: 15000 }).catch(() => {})
  await page.screenshot({ path: `${out}/skills-dark.png` })
  await page.click('#customize-tab-connections'); await page.waitForSelector('.connections-embedded', { timeout: 10000 }); await sleep(700)
  check('Connectors tab shows the connector list', (await page.$$('.connector-list > *')).length > 0, `${(await page.$$('.connector-list > *')).length} connectors`)
  check('still one title on the Connectors tab', (await page.$$eval('h1', l => l.filter(e => e.offsetParent).map(e => e.innerText))).join('|') === 'Customize')
  check('Customize still lit on Connectors', (await lit()) === 'Customize', await lit())
  await page.screenshot({ path: `${out}/connectors-dark.png` })
  // Arrow keys move between the tabs.
  await page.focus('#customize-tab-connections'); await page.keyboard.press('ArrowLeft'); await sleep(700)
  check('arrow key switches back to Skills', !!(await page.$('.skills-embedded')))
  const wide = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  check('no sideways scroll at 1280', wide)
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]); await sleep(500)
  await page.screenshot({ path: `${out}/skills-light.png` })
  await page.setViewport({ width: 375, height: 800 }); await sleep(700)
  await page.screenshot({ path: `${out}/skills-375.png`, fullPage: false })
  check('no sideways scroll at 375', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
  check('mobile bar title says Customize', (await page.$eval('.mobile-bar-title', e => e.innerText).catch(() => '')) === 'Customize')
} finally {
  check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 200))
  await browser.close()
}
console.log(`${results.filter(Boolean).length}/${results.length} passed; blocked writes ${blocked}; screenshots in ${out}`)
process.exit(results.every(Boolean) ? 0 : 1)
