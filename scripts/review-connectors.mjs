// Connectors page: the new Granola, Google Sheets, Excel, Figma and Canva cards show
// with logos, and an Excel file uploads (read as a spreadsheet, not as raw bytes).
// TEST account; removes what it added. Usage: node scripts/review-connectors.mjs [base-url]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]')
await page.waitForSelector('.dashboard', { timeout: 20000 })
await page.click('.side-item[aria-label="Connectors"]')
await page.waitForSelector('[data-testid=connections]')

const cards = await page.$$eval('.connector', l => l.map(c => ({ key: c.dataset.connector, name: c.querySelector('strong').innerText, logo: c.querySelector('img').complete && c.querySelector('img').naturalWidth > 0 })))
for (const k of ['granola', 'sheets', 'excel', 'figma', 'canva']) {
  const c = cards.find(c => c.key === k)
  check(`${k} card shows with its logo`, !!c && c.logo, c ? c.name : 'missing')
}
check('all connector logos load', cards.every(c => c.logo), `${cards.length} cards`)

await page.waitForFunction(() => document.querySelectorAll('select[aria-label="Connection project"] option').length > 1, { timeout: 15000 })
const sel = await page.$('select[aria-label="Connection project"]')
const firstProject = await page.$eval('select[aria-label="Connection project"]', s => [...s.options].map(o => o.value).find(Boolean) || "")
console.log("project option:", firstProject)
await sel.select(firstProject); await sleep(500)
const wasOn = await page.$eval('[data-connector=excel] input[type=checkbox]', i => i.checked)
if (!wasOn) await page.click('[data-connector=excel] .switch')
await page.waitForSelector('[data-connector=excel] input[type=file]')
await (await page.$('[data-connector=excel] input[type=file]')).uploadFile('/tmp/cb-files/Northwind finance model.xlsx')
await page.waitForFunction(() => document.querySelector('[data-connector=excel] .doc-list li'), { timeout: 10000 }).catch(() => {})
const doc = await page.$eval('[data-connector=excel] .doc-list li', e => e.innerText).catch(() => '')
check('Excel file uploads into the Excel connector', /finance model\.xlsx/.test(doc), doc.replace(/\n/g, ' '))
const chars = Number((doc.match(/([\d,]+) characters/) || [])[1]?.replace(/,/g, '') || 0)
check('it was read as a spreadsheet (small text, not raw zip bytes)', chars > 0 && chars < 20000, `${chars} characters`)
await page.screenshot({ path: '/tmp/cb-review/6-connectors.png', fullPage: true })

// Clean up.
await page.click('[data-connector=excel] .doc-list .icon-btn').catch(() => {})
if (!wasOn) await page.click('[data-connector=excel] .switch')
check('no page errors', errors.length === 0, errors.join(' | '))
await browser.close()
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
