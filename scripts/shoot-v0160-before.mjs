// v0.16.0 UI revamp: capture the CURRENT main-menu pages (TEST account) as the "before" set.
// Usage: node scripts/shoot-v0160-before.mjs [base-url] [out-dir]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const out = process.argv[3] || '/tmp/cb-v0160-before'
fs.mkdirSync(out, { recursive: true })
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
await sleep(800)
await page.screenshot({ path: `${out}/01-dashboard.png` })
const items = await page.$$eval('.sidebar-nav .side-item', l => l.map(e => e.innerText.trim()))
console.log('main menu:', items.join(' | '))
let i = 2
for (const label of items) {
  const [b] = await page.$$(`xpath/.//button[contains(@class,"side-item") and contains(., "${label}")]`)
  if (!b) continue
  await b.click(); await sleep(1500)
  try { await page.waitForNetworkIdle({ idleTime: 600, timeout: 6000 }) } catch {}
  const f = `${out}/${String(i++).padStart(2, '0')}-${label.toLowerCase().replace(/\W+/g, '-')}.png`
  await page.screenshot({ path: f }); console.log(f)
}
await browser.close()
