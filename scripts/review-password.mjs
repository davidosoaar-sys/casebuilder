// Real-browser check: change password, old one stops working, new one works.
// Uses the TEST account only and restores its original password at the end.
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'
import crypto from 'node:crypto'

const base = process.argv[2] || 'http://localhost:5173'
const envFile = `${os.homedir()}/.config/casebuilder/test-account.env`
const env = Object.fromEntries(fs.readFileSync(envFile, 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const EMAIL = 'test@casebuilder.dev', ORIGINAL = env.TEST_PASSWORD, TEMP = 'tmp-' + crypto.randomBytes(9).toString('base64url')
const results = []
const check = (name, ok) => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`) }

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 690 })
const errors = []; page.on('pageerror', e => errors.push(e.message))

async function signIn(pw) {
  await page.goto(base, { waitUntil: 'networkidle2' })
  await page.waitForSelector('#auth-email')
  await page.type('#auth-email', EMAIL); await page.type('#auth-password', pw)
  await page.click('button[type=submit]')
  return Promise.race([
    page.waitForSelector('.side-settings', { timeout: 15000 }).then(() => true),
    page.waitForSelector('.auth-error', { timeout: 15000 }).then(() => false)
  ])
}
async function openSettings() { if (!(await page.$('.overlay'))) { await page.click('.side-settings'); await page.waitForSelector('.overlay') } }
async function changeTo(pw, shot) {
  await openSettings()
  const [btn] = await page.$$('xpath/.//button[contains(., "Change password")]')
  await btn.click()
  await page.waitForSelector('#new-password')
  await page.type('#new-password', pw); await page.type('#new-password-again', pw)
  if (shot) await page.screenshot({ path: shot })
  await page.click('.modal button[type=submit]')
  await page.waitForSelector('.change-pw-done', { timeout: 15000 })
  await page.click('.modal .primary')
  await page.click('.overlay-x')
}
async function signOut() {
  await openSettings()
  const [btn] = await page.$$('xpath/.//button[contains(., "Sign out")]')
  await btn.click(); await page.waitForSelector('#auth-email')
}

check('sign in with original password', await signIn(ORIGINAL))
await page.screenshot({ path: '/tmp/pw-0-sidebar.png' })
// mismatch is blocked
{
  await openSettings()
  const [btn] = await page.$$('xpath/.//button[contains(., "Change password")]')
  await btn.click(); await page.waitForSelector('#new-password')
  await page.type('#new-password', 'abcdefghijk'); await page.type('#new-password-again', 'abcdefghijX')
  check('mismatched passwords: button disabled + message', await page.$eval('.modal button[type=submit]', b => b.disabled) && Boolean(await page.$('.modal .auth-error')))
  await page.click('.modal .ghost')
  await page.click('.overlay-x')
}
await changeTo(TEMP, '/tmp/pw-1-modal.png')
check('change password reports success', true)
await signOut()
check('old password no longer works', !(await signIn(ORIGINAL)))
check('new password works', await signIn(TEMP))
await changeTo(ORIGINAL)
await signOut()
check('restored: original password works again', await signIn(ORIGINAL))
check('no page errors', errors.length === 0)
await browser.close()
const failed = results.filter(r => !r).length
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
process.exit(failed ? 1 : 0)
