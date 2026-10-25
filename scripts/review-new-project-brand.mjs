// New project -> branding, through the real app (localhost dev server, which runs
// the same /api/brand code as Vercel). Creates a project per company on the TEST
// account, waits for the brand step, checks a logo was found, then deletes it.
// Usage: node scripts/review-new-project-brand.mjs [base-url] [Company ...]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const args = process.argv.slice(2)
const base = /^https?:/.test(args[0] || '') ? args.shift() : 'http://localhost:5173'
const companies = args.length ? args : ['Apple', 'Visa']
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
page.on('dialog', d => d.accept())
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]')
await page.waitForSelector('.dashboard', { timeout: 20000 })

for (const company of companies) {
  const name = `${company}`
  await page.click('.side-item[aria-label="Projects"]').catch(async () => { await page.click('.side-item[aria-label="All projects"]') })
  await page.waitForSelector('.projects-page', { timeout: 15000 }); await page.waitForNetworkIdle({ idleTime: 800 })
  await page.click('.projects-page .page-head .primary, .projects-page button.primary')
  await page.waitForSelector('#company-name')
  await page.type('#company-name', name)
  await page.click('.modal .primary')
  // Walk to the brand step: it is either first, or after the map/people steps.
  let onBrand = false
  for (let i = 0; i < 6 && !onBrand; i++) {
    await sleep(800)
    onBrand = !!(await page.$('.brand-setup'))
    if (!onBrand) { const next = await page.$('.map-page .primary, .people-page .primary'); if (next) await next.click() }
  }
  check(`${company}: reached the branding step`, onBrand)
  await page.waitForFunction(() => !/Finding/.test(document.querySelector('.brand-setup-preview')?.innerText || ''), { timeout: 90000 }).catch(() => {})
  await sleep(500)
  const state = await page.evaluate(() => ({
    logo: !!document.querySelector('.brand-setup-logo, .brand-setup-icon'),
    loaded: [...document.querySelectorAll('.brand-setup-logo, .brand-setup-icon')].some(i => i.complete && i.naturalWidth > 0),
    site: document.querySelector('.brand-setup a[href^="http"]')?.href || '',
    msg: [...document.querySelectorAll('.brand-setup .help')].map(e => e.innerText).join(' | ')
  }))
  check(`${company}: found the official site and a logo`, state.logo && state.loaded && !/400|error|signature/i.test(state.msg), `${state.site} ${state.msg.slice(0, 160)}`)
  await page.screenshot({ path: `/tmp/cb-review/brand-${company.toLowerCase().replace(/\W/g, '')}.png` })
  // Delete the test project.
  await page.click('.side-item[aria-label="All projects"]').catch(() => {})
  await page.waitForSelector('.project-card', { timeout: 15000 })
  await page.evaluate(n => [...document.querySelectorAll('.project-card')].find(c => c.querySelector('strong')?.innerText === n)?.querySelector('[aria-label^="Delete"]')?.click(), name)
  await sleep(1500)
}
await browser.close()
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
