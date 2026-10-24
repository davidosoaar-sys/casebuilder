// Real end-to-end sign-up: create an account with a fresh +alias of Amr's Gmail,
// wait for the confirmation email via the Gmail API, type the 6-digit code into
// the app, confirm the account opens. Usage: node scripts/review-signup-email.mjs
import puppeteer from 'puppeteer'
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import os from 'node:os'
import fs from 'node:fs'

const base = process.argv[2] || 'http://localhost:5173'
const tag = Date.now().toString(36)
const EMAIL = `amr.id.jaz+cbtest${tag}@gmail.com`
const PW = 'cb-' + crypto.randomBytes(12).toString('base64url')
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const gapi = args => {
  const out = execFileSync('python3', [`${os.homedir()}/.hermes/skills/productivity/google-workspace/scripts/google_api.py`, ...args], { env: { ...process.env, HERMES_HOME: `${os.homedir()}/.hermes` }, stdio: ['ignore', 'pipe', 'ignore'] }).toString()
  return JSON.parse(out.slice(out.indexOf(out.trim().startsWith('[') ? '[' : '{')))
}

const browser = await puppeteer.launch({ headless: 'new' })
const page = await (await browser.createBrowserContext()).newPage()
await page.setViewport({ width: 1280, height: 690 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
await page.goto(base + '/?signup', { waitUntil: 'networkidle2' })
await page.waitForSelector('#auth-email')
await page.type('#auth-email', EMAIL); await page.type('#auth-password', PW)
const t0 = Date.now()
await page.click('button[type=submit]')
await page.waitForSelector('#auth-code, .auth-error', { timeout: 20000 })
const err = await page.$eval('.auth-error', e => e.textContent).catch(() => '')
check('sign-up accepted, app asks for the code', !err && Boolean(await page.$('#auth-code')), err)
await page.screenshot({ path: '/tmp/signup-1-code.png' })

let code = '', msg = null
for (let i = 0; i < 24 && !code; i++) {
  await sleep(5000)
  const hits = gapi(['gmail', 'search', `to:${EMAIL} newer_than:1h`, '--max', '3'])
  if (hits.length) {
    msg = gapi(['gmail', 'get', hits[0].id])
    const text = JSON.stringify(msg)
    code = (text.match(/code:\s*(\d{6})/) || text.match(/\b(\d{6})\b/) || [])[1] || ''
  }
}
const secs = Math.round((Date.now() - t0) / 1000)
check('confirmation email arrived', Boolean(msg), `${secs}s`)
check('email carries a 6-digit code', /^\d{6}$/.test(code))
if (msg) {
  const s = JSON.stringify(msg)
  console.log('      from:', (s.match(/"from":\s*"([^"]+)"/i) || [])[1], '| subject:', ((s.match(/"subject":\s*"([^"]+)"/i) || [])[1] || '').replace(/\d{6}/, '######'))
  check('email has no confirmation link', !/token_hash=|\/auth\/v1\/verify/.test(s))
}
if (code) {
  await page.type('#auth-code', code)
  await page.click('button[type=submit]')
  await page.waitForSelector('.side-settings, .auth-error', { timeout: 20000 })
  const e2 = await page.$eval('.auth-error', e => e.textContent).catch(() => '')
  check('code accepted, account opens on the Dashboard', !e2 && Boolean(await page.$('.dashboard')), e2)
  await page.screenshot({ path: '/tmp/signup-2-in.png' })
}
check('no page errors', errors.length === 0, errors.join(' | '))
await browser.close()
fs.appendFileSync(`${os.homedir()}/.config/casebuilder/test-signups.txt`, EMAIL + '\n')
console.log(results.every(Boolean) ? 'ALL PASS' : `${results.filter(r => !r).length} FAILED`)
