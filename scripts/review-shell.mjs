// Real-browser review of: sign in <-> create account switch, ?signup entry,
// dashboard, settings (incl. saving + replacing the test API key), collapsible
// sidebar (persists across reload). Uses test2@casebuilder.dev only.
// Usage: node scripts/review-shell.mjs [baseUrl]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const cfg = `${os.homedir()}/.config/casebuilder`
const readEnv = f => Object.fromEntries(fs.readFileSync(f, 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T2 = { email: 'test2@casebuilder.dev', pw: readEnv(`${cfg}/accounts/test2@casebuilder.dev.env`).PASSWORD }
const KEY = readEnv(`${cfg}/test-account.env`).ANTHROPIC_API_KEY
const results = []
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const btn = (page, text) => page.$$(`xpath/.//button[normalize-space()="${text}"]`).then(x => x[0])

const browser = await puppeteer.launch({ headless: 'new' })
const ctx = await browser.createBrowserContext()
const page = await ctx.newPage()
await page.setViewport({ width: 1280, height: 690 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
const shot = n => page.screenshot({ path: `/tmp/shell-${n}.png` })

// --- auth screens
await page.goto(base, { waitUntil: 'networkidle2' }); await page.waitForSelector('#auth-email')
check('sign-in screen shows "Create an account" link', Boolean(await btn(page, 'Create an account')))
await (await btn(page, 'Create an account')).click()
check('switches to Create your account', (await page.$eval('h1', e => e.textContent)) === 'Create your account')
check('create page links back to Sign in', Boolean(await btn(page, 'Sign in')))
await shot('1-signup')
await page.type('#auth-email', 'not-real@casebuilder.dev'); await page.type('#auth-password', 'short')
await page.click('button[type=submit]'); await page.waitForSelector('.auth-error')
check('short password rejected before any email is sent', /10 characters/.test(await page.$eval('.auth-error', e => e.textContent)))
await (await btn(page, 'Sign in')).click()
check('switches back to Sign in', (await page.$eval('h1', e => e.textContent)) === 'Sign in')
await page.goto(base + '/?signup', { waitUntil: 'networkidle2' }); await page.waitForSelector('h1')
check('?signup link opens Create account directly', (await page.$eval('h1', e => e.textContent)) === 'Create your account')

// --- sign in -> dashboard
await page.goto(base, { waitUntil: 'networkidle2' }); await page.waitForSelector('#auth-email')
await page.type('#auth-email', T2.email); await page.type('#auth-password', T2.pw)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
await page.waitForFunction(() => !document.body.innerText.includes('Checking…') && !document.body.innerText.includes('Loading…'), { timeout: 15000 }).catch(() => {})
check('lands on the Dashboard after sign-in', true)
check('sidebar shows CaseBuilder, not Backstage', await page.$eval('.sidebar-logo', e => e.innerText.includes('CaseBuilder') && !e.innerText.includes('Backstage')))
check('Dashboard and Settings in the menu', Boolean(await page.$('button[aria-label="Dashboard"]')) && Boolean(await page.$('button[aria-label="Settings"]')))
check('dashboard shows deal count', /open deals/i.test(await page.$eval('.dash-stats', e => e.innerText)))
await shot('2-dashboard')

// --- settings: API key
await page.click('button[aria-label="Settings"]'); await page.waitForSelector('.settings-page')
await page.waitForFunction(() => !document.body.innerText.includes('Checking…'), { timeout: 15000 })
const hadKey = /Saved · ends in/.test(await page.$eval('#api-key', e => e.innerText))
if (hadKey) { page.once('dialog', d => d.accept()); await (await btn(page, 'Remove')).click(); await page.waitForFunction(() => document.body.innerText.includes('No key yet'), { timeout: 15000 }) }
await shot('3-settings-nokey')
await page.type('#api-key input[type=password]', 'not-a-real-key-123456789')
await (await btn(page, 'Save key')).click(); await page.waitForSelector('#api-key .auth-error', { timeout: 15000 })
check('a non-Anthropic key is refused with a clear reason', /sk-ant-/.test(await page.$eval('#api-key .auth-error', e => e.textContent)))
await page.$eval('#api-key input[type=password]', e => { e.value = '' })
await page.click('#api-key input[type=password]', { clickCount: 3 }); await page.keyboard.press('Backspace')
await page.type('#api-key input[type=password]', KEY)
await (await btn(page, 'Save key')).click()
await page.waitForFunction(() => /Saved · ends in/.test(document.querySelector('#api-key').innerText), { timeout: 15000 }).catch(() => {})
const keyText = await page.$eval('#api-key', e => e.innerText)
check('real key saves and shows only the last 4', keyText.includes(`ends in …${KEY.slice(-4)}`) && !keyText.includes(KEY.slice(0, 12)))
check('the key itself is nowhere in the page', !(await page.content()).includes(KEY))
await shot('4-settings-key')
await page.click('button[aria-label="Dashboard"]'); await page.waitForSelector('.dashboard')
await page.waitForFunction(() => document.body.innerText.includes('Ready ·'), { timeout: 15000 }).catch(() => {})
check('dashboard agent card says Ready once a key is saved', /Ready · key ends in/.test(await page.$eval('.dashboard', e => e.innerText)))

// --- collapse
await page.click('.sidebar-collapse'); await sleep(400)
const w = await page.$eval('.sidebar', e => e.getBoundingClientRect().width)
check('collapse shrinks the menu to icons', w < 90, `${Math.round(w)}px`)
check('collapsed: logo is the mark only', !(await page.$eval('.sidebar-logo', e => e.innerText.includes('CaseBuilder'))))
check('collapsed: labels hidden, icons stay', await page.$$eval('.sidebar .side-label', els => els.every(e => getComputedStyle(e).display === 'none')) && (await page.$$('.sidebar .side-item svg')).length >= 4)
await shot('5-collapsed')
await page.reload({ waitUntil: 'networkidle2' }); await page.waitForSelector('.sidebar')
check('collapsed state survives a reload', (await page.$eval('.sidebar', e => e.getBoundingClientRect().width)) < 90)
await page.click('.sidebar-collapse'); await sleep(400)
check('expand brings the full menu back', (await page.$eval('.sidebar', e => e.getBoundingClientRect().width)) > 200)
check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '))

await browser.close()
const failed = results.filter(r => !r).length
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
process.exit(failed ? 1 : 0)
