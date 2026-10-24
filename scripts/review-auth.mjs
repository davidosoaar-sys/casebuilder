// Real-browser check of sign-in at a laptop window size (1280x690).
// Reads the test account's password from ~/.config/casebuilder (never printed).
// Usage: node scripts/review-auth.mjs [baseUrl]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const env = Object.fromEntries(fs.readFileSync(`${os.homedir()}/.config/casebuilder/test-account.env`, 'utf8')
  .split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const EMAIL = 'test@casebuilder.dev'
const results = []
const check = (name, ok) => { results.push([name, ok]); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`) }

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 690 })
const errors = []
page.on('pageerror', e => errors.push(e.message))

await page.goto(base, { waitUntil: 'networkidle2' })
await page.waitForSelector('#auth-email', { timeout: 10000 })
check('signed-out visitor sees the sign-in screen', true)
check('app content is hidden before sign-in', !(await page.$('.sidebar')))
await page.screenshot({ path: '/tmp/auth-1-signin.png' })

await page.type('#auth-email', EMAIL)
await page.type('#auth-password', 'definitely-wrong-password')
await page.click('button[type=submit]')
await page.waitForSelector('.auth-error', { timeout: 10000 })
check('wrong password shows a plain error', /do not match/.test(await page.$eval('.auth-error', e => e.textContent)))
await page.screenshot({ path: '/tmp/auth-2-wrong.png' })

await page.$eval('#auth-password', e => { e.value = '' })
await page.type('#auth-password', env.TEST_PASSWORD)
await page.click('button[type=submit]')
await page.waitForSelector('.sidebar-account', { timeout: 15000 })
check('right password opens the app', true)
check('sidebar shows the signed-in email', (await page.$eval('.sidebar-account span', e => e.textContent)) === EMAIL)
await page.screenshot({ path: '/tmp/auth-3-in.png' })

await page.reload({ waitUntil: 'networkidle2' })
await page.waitForSelector('.sidebar-account', { timeout: 15000 }).catch(() => {})
check('session survives a page reload', Boolean(await page.$('.sidebar-account')))

await page.click('.sidebar-account button')
await page.waitForSelector('#auth-email', { timeout: 10000 }).catch(() => {})
check('sign out returns to the sign-in screen', Boolean(await page.$('#auth-email')))
check('no page errors', errors.length === 0)
if (errors.length) console.log(errors.slice(0, 3))

await browser.close()
const failed = results.filter(r => !r[1]).length
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
process.exit(failed ? 1 : 0)
