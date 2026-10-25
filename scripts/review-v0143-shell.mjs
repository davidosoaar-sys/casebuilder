// v0.14.3 shell checks: connectors in alphabetical order with the real Claude logo,
// the version under Settings in the bottom-left corner, and (admin account) the
// Admin / Regular user view switch hiding the Waitlist tab.
// Usage: node scripts/review-v0143-shell.mjs [base-url] [email] [password-env-key]
// Defaults to the TEST account (not an admin): the admin part is skipped there.
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const email = process.argv[3] || 'test@casebuilder.dev'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const password = process.env.CB_PASSWORD || envFile(`${os.homedir()}/.config/casebuilder/test-account.env`).TEST_PASSWORD
const out = '/tmp/cb-review'; fs.mkdirSync(out, { recursive: true })
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 720 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
await page.goto(base, { waitUntil: 'networkidle2' })
await page.evaluate(() => localStorage.removeItem('casebuilder.adminView'))
await page.type('#auth-email', email); await page.type('#auth-password', password)
await page.click('button[type=submit]')
await page.waitForSelector('.dashboard', { timeout: 20000 })
await sleep(1500)

// Version: below Settings, bottom-left.
const geo = await page.evaluate(() => {
  const v = document.querySelector('.platform-version'), s = document.querySelector('.side-settings'), side = document.querySelector('aside')
  const r = e => e.getBoundingClientRect()
  return { text: v?.innerText, vTop: r(v).top, vBottom: r(v).bottom, sBottom: r(s).bottom, sideBottom: r(side).bottom, vLeft: r(v).left, sideLeft: r(side).left }
})
check('version sits below the Settings button', geo.vTop >= geo.sBottom - 1, `version top ${geo.vTop.toFixed(0)}, settings bottom ${geo.sBottom.toFixed(0)}`)
check('version is in the bottom-left corner', geo.sideBottom - geo.vBottom < 40 && geo.vLeft - geo.sideLeft < 30, `${(geo.sideBottom - geo.vBottom).toFixed(0)}px from bottom, ${(geo.vLeft - geo.sideLeft).toFixed(0)}px from left, "${geo.text}"`)
await page.screenshot({ path: `${out}/v0143-1-sidebar.png` })

// Connectors: alphabetical, real Claude logo.
await page.click('.side-item[aria-label="Connectors"]')
await page.waitForSelector('[data-testid=connections]')
await page.waitForFunction(() => [...document.querySelectorAll('.connector img')].every(i => i.complete && i.naturalWidth > 0), { timeout: 10000 }).catch(() => {})
const cards = await page.$$eval('.connector', l => l.map(c => ({ name: c.querySelector('strong').innerText, src: c.querySelector('img').getAttribute('src'), ok: c.querySelector('img').naturalWidth > 0 })))
const names = cards.map(c => c.name)
check('connectors are in alphabetical order', JSON.stringify(names) === JSON.stringify([...names].sort((a, b) => a.localeCompare(b))), names.join(', '))
const claude = cards.find(c => c.name === 'Claude')
check('Claude uses a real logo image, not the drawn letter', !!claude && claude.ok && !/^data:image\/svg/.test(claude.src), claude?.src.slice(0, 60))
check('all connector logos load', cards.length > 0 && cards.every(c => c.ok), `${cards.length} cards`)
await page.screenshot({ path: `${out}/v0143-2-connectors.png`, fullPage: true })

// Admin view switch (admin accounts only).
await page.click('.side-settings'); await page.waitForSelector('.settings-card-overlay')
const hasSwitch = !!(await page.$('[aria-label="Admin view"]'))
const waitlistTab = () => page.$('.side-item[aria-label="Waitlist"]').then(Boolean)
if (!hasSwitch) {
  check('non-admin: no admin switch and no Waitlist tab', !(await waitlistTab()))
} else {
  check('admin: Waitlist tab shows in admin view', await waitlistTab())
  await page.screenshot({ path: `${out}/v0143-3-settings-admin.png` })
  const [regular] = await page.$$('[aria-label="Admin view"] button')
  await page.evaluate(() => [...document.querySelectorAll('[aria-label="Admin view"] button')].find(b => b.innerText === 'Regular user').click())
  await sleep(300)
  check('admin: Regular user hides the Waitlist tab', !(await waitlistTab()))
  await page.reload({ waitUntil: 'networkidle2' }); await page.waitForSelector('.dashboard', { timeout: 20000 }); await sleep(1500)
  check('admin: the choice survives a reload', !(await waitlistTab()))
  await page.click('.side-settings'); await page.waitForSelector('[aria-label="Admin view"]')
  await page.evaluate(() => [...document.querySelectorAll('[aria-label="Admin view"] button')].find(b => b.innerText === 'Admin').click())
  await sleep(300)
  check('admin: switching back shows Waitlist again', await waitlistTab())
}
check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 200))
await browser.close()
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
