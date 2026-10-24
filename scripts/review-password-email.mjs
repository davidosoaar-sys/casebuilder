// Real end-to-end check of v0.4.1 password security, on a fresh account that
// can receive email (a +alias of Amr's Gmail, read through the Gmail API):
//   1. sign up with the emailed 6-digit code
//   2. change password: wrong current password rejected, right one accepted
//   3. "your password was changed" email arrives
//   4. forgot password: reset code by email, new password set on screen
//   5. only the final password signs in
// Usage: node scripts/review-password-email.mjs [base-url]
import puppeteer from 'puppeteer'
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import os from 'node:os'
import fs from 'node:fs'

const base = process.argv[2] || 'http://localhost:5173'
const EMAIL = `amr.id.jaz+cbpw${Date.now().toString(36)}@gmail.com`
const pw = () => 'cb-' + crypto.randomBytes(12).toString('base64url')
const P1 = pw(), P2 = pw(), P3 = pw()
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const gapi = args => {
  const out = execFileSync('python3', [`${os.homedir()}/.hermes/skills/productivity/google-workspace/scripts/google_api.py`, ...args], { env: { ...process.env, HERMES_HOME: `${os.homedir()}/.hermes` }, stdio: ['ignore', 'pipe', 'ignore'] }).toString()
  return JSON.parse(out.slice(out.indexOf(out.trim().startsWith('[') ? '[' : '{')))
}
// Wait for an email to EMAIL whose subject matches; return { subject, text }.
async function waitMail(subjectRe, seen = new Set()) {
  for (let i = 0; i < 24; i++) {
    await sleep(5000)
    for (const h of gapi(['gmail', 'search', `to:${EMAIL} newer_than:1h`, '--max', '10'])) {
      if (seen.has(h.id) || !subjectRe.test(h.subject || '')) continue
      seen.add(h.id)
      return { id: h.id, subject: h.subject, text: JSON.stringify(gapi(['gmail', 'get', h.id])) }
    }
  }
  return null
}
const codeIn = m => (m?.subject.match(/(\d{6})/) || m?.text.match(/\b(\d{6})\b/) || [])[1] || ''

const browser = await puppeteer.launch({ headless: 'new' })
const page = await (await browser.createBrowserContext()).newPage()
await page.setViewport({ width: 1280, height: 760 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
const authCalls = []
page.on('response', async r => { const u = r.url(); if (/\/auth\/v1\/(user|verify)/.test(u) && r.request().method() !== 'OPTIONS') { let b = ''; try { b = (await r.text()).slice(0, 160) } catch {} authCalls.push(`${r.request().method()} ${u.split('/auth/v1/')[1].split('?')[0]} ${r.status()} ${/"(code|error_code|msg)"/.test(b) ? b : ''}`) } })
// Triple-click does not select inside password fields, so clear by backspacing.
const clear = async sel => { await page.focus(sel); const n = await page.$eval(sel, e => e.value.length); for (let i = 0; i < n; i++) await page.keyboard.press('Backspace') }
const err = () => page.$eval('.auth-error', e => e.textContent).catch(() => '')
const seen = new Set()

// 1. Sign up
await page.goto(base + '/?signup', { waitUntil: 'networkidle2' })
await page.type('#auth-email', EMAIL); await page.type('#auth-password', P1)
await page.click('button[type=submit]')
await page.waitForSelector('#auth-code', { timeout: 20000 })
const signupCode = codeIn(await waitMail(/CaseBuilder code/i, seen))
await page.type('#auth-code', signupCode); await page.click('button[type=submit]')
await page.waitForSelector('.dashboard', { timeout: 20000 })
check('fresh account signed up and in', true, EMAIL)

async function signOut() {
  if (!(await page.$('.overlay'))) { await page.click('.side-settings'); await page.waitForSelector('.overlay') }
  const [btn] = await page.$$('xpath/.//button[contains(., "Sign out")]')
  await btn.click(); await page.waitForSelector('#auth-email')
}
async function trySignIn(p) {
  await page.goto(base, { waitUntil: 'networkidle2' })
  await page.type('#auth-email', EMAIL); await page.type('#auth-password', p)
  await page.click('button[type=submit]')
  return Promise.race([
    page.waitForSelector('.side-settings', { timeout: 15000 }).then(() => true),
    page.waitForSelector('.auth-error', { timeout: 15000 }).then(() => false),
  ])
}
// 2. Change password, from a normal password sign-in
await signOut()
check('signs in with the sign-up password', await trySignIn(P1))
async function openChange() {
  if (!(await page.$('.overlay'))) { await page.click('.side-settings'); await page.waitForSelector('.overlay') }
  const [btn] = await page.$$('xpath/.//button[contains(., "Change password")]')
  await btn.click(); await page.waitForSelector('#current-password')
}
await openChange()
check('form asks for the current password', Boolean(await page.$('#current-password')))
await page.type('#current-password', 'definitely-wrong-123'); await page.type('#new-password', P2); await page.type('#new-password-again', P2)
await page.click('.modal button[type=submit]')
await page.waitForFunction(() => document.querySelector('.modal .auth-error[role=alert]') || document.querySelector('.change-pw-done'), { timeout: 15000 })
const wrongMsg = await page.$eval('.modal .auth-error[role=alert]', e => e.textContent).catch(() => '')
check('wrong current password rejected', Boolean(wrongMsg) && !(await page.$('.change-pw-done')), wrongMsg)
await page.screenshot({ path: '/tmp/pw41-1-wrong-current.png' })
await clear('#current-password')
await page.type('#current-password', P1)
await page.click('.modal button[type=submit]')
await page.waitForFunction(() => document.querySelector('.change-pw-done') || (document.querySelector('.modal .auth-error[role=alert]') && !document.querySelector('.modal button[type=submit]')?.textContent.includes('Saving')), { timeout: 15000 }).catch(() => {})
await sleep(1500)
const doneOk = Boolean(await page.$('.change-pw-done'))
check('right current password: changed', doneOk, doneOk ? '' : await page.$eval('.modal .auth-error[role=alert]', e => e.textContent).catch(() => 'no message'))
await page.screenshot({ path: '/tmp/pw41-2-changed.png' })
if (!doneOk) { await browser.close(); console.log('STOPPED'); process.exit(1) }
await page.screenshot({ path: '/tmp/pw41-2-changed.png' })
await page.click('.modal .primary'); await page.click('.overlay-x')

// 3. Notification email
const note = await waitMail(/password was changed/i, seen)
check('"password was changed" email arrived', Boolean(note), note?.subject)

await signOut()

// 4. Forgot password
const [forgot] = await page.$$('xpath/.//button[contains(., "Forgot password")]')
check('sign-in screen has "Forgot password?"', Boolean(forgot))
await page.screenshot({ path: '/tmp/pw41-3-signin.png' })
await forgot.click(); await page.waitForSelector('.auth-card h1')
await clear('#auth-email')
await page.type('#auth-email', EMAIL)
await page.click('button[type=submit]')
await page.waitForSelector('#reset-code', { timeout: 20000 })
const resetMail = await waitMail(/reset code/i, seen)
const resetCode = codeIn(resetMail)
check('reset email arrived with a 6-digit code', /^\d{6}$/.test(resetCode), resetMail?.subject.replace(/\d{6}/, '######'))
check('reset email has no link', resetMail && !/token_hash=|\/auth\/v1\/verify/.test(resetMail.text))
await page.type('#reset-code', '000000'); await page.type('#reset-password', P3); await page.type('#reset-password-again', P3)
await page.click('button[type=submit]')
await page.waitForSelector('.auth-error', { timeout: 15000 })
check('wrong reset code rejected', Boolean(await err()), await err())
await clear('#reset-code')
await page.type('#reset-code', resetCode)
await page.screenshot({ path: '/tmp/pw41-4-reset.png' })
await page.click('button[type=submit]')
await page.waitForSelector('.dashboard, .auth-error[role=alert]', { timeout: 20000 })
check('right reset code: new password set, app opens', Boolean(await page.$('.dashboard')), await err())
await signOut()

// 5. Only the final password works
check('first password no longer works', !(await trySignIn(P1)))
check('changed password no longer works', !(await trySignIn(P2)))
check('reset password works', await trySignIn(P3))
check('no page errors', errors.length === 0, errors.join(' | '))
await browser.close()
fs.appendFileSync(`${os.homedir()}/.config/casebuilder/test-signups.txt`, EMAIL + '\n')
console.log(results.every(Boolean) ? 'ALL PASS' : `${results.filter(r => !r).length} FAILED`)
