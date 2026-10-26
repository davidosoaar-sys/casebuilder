// v0.16.0: the signed-out screens in the new atmosphere (sign in, waitlist, role picker open, joined, forgot,
// code). Nothing is submitted; every DB write and RPC is blocked. Usage: node scripts/review-v0160-auth.mjs [base]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
const base = process.argv[2] || 'http://localhost:5173'
const out = '/tmp/cb-v0160-auth'; fs.mkdirSync(out, { recursive: true })
const sleep = ms => new Promise(r => setTimeout(r, ms))
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const browser = await puppeteer.launch({ headless: 'new' })
const errors = []
let blocked = 0
async function fresh(w = 1280, h = 820) {
  const ctx = await browser.createBrowserContext(); const page = await ctx.newPage(); await page.setViewport({ width: w, height: h })
  page.on('pageerror', e => errors.push(e.message))
  await page.setRequestInterception(true)
  page.on('request', r => { if (/\/(rest|auth)\/v1\//.test(r.url()) && !['GET', 'HEAD', 'OPTIONS'].includes(r.method())) { blocked++; return r.abort() } r.continue() })
  return { ctx, page }
}
const measure = page => page.evaluate(() => {
  const c = document.querySelector('.auth-card'), h = c?.querySelector('h1'), cs = c && getComputedStyle(c)
  return { aurora: !!document.querySelector('.auth-aurora i'), glass: cs?.backdropFilter || cs?.webkitBackdropFilter, radius: cs?.borderRadius,
    title: h?.innerText, weight: h && getComputedStyle(h).fontWeight, size: h && getComputedStyle(h).fontSize,
    overflow: document.documentElement.scrollWidth - innerWidth, nativeSelect: !!document.querySelector('.auth-card select') }
})

let { ctx, page } = await fresh()
await page.goto(base, { waitUntil: 'networkidle2' }); await page.waitForSelector('.auth-card'); await sleep(700)
let m = await measure(page)
check('sign in: aurora + glass card + light title', m.aurora && /blur/.test(m.glass) && Number(m.weight) <= 300, JSON.stringify(m))
await page.screenshot({ path: `${out}/01-sign-in.png` })

const [join] = await page.$$('xpath/.//button[contains(., "Join the waitlist")]'); await join.click(); await page.waitForSelector('.waitlist-card'); await sleep(700)
m = await measure(page)
check('waitlist: same stage, no native select', m.aurora && /blur/.test(m.glass) && !m.nativeSelect && m.title === 'Join the waitlist', JSON.stringify(m))
await page.screenshot({ path: `${out}/02-waitlist.png` })
await page.type('#wl-name', 'Wanda Example'); await page.type('#wl-email', 'wanda@example.com')
await page.click('#wl-role'); await page.waitForSelector('.cselect-list [role=option]'); await sleep(300)
await page.screenshot({ path: `${out}/03-waitlist-role-open.png` })
const opts = await page.$$eval('.cselect-list [role=option]', l => l.map(o => o.innerText.trim()))
check('role picker lists the 7 roles', opts.length === 7, opts.join(' | '))
await page.click('.cselect-list [role=option][data-value="Account Executive"]'); await sleep(300)
const ready = await page.$eval('.waitlist-card button[type=submit]', b => !b.disabled)
check('choosing a role enables Join the waitlist', ready)
await page.screenshot({ path: `${out}/04-waitlist-filled.png` })

// "You're on the list": the RPC is blocked, so fake a successful join response.
await ctx.close(); ({ ctx, page } = await fresh())
await page.setRequestInterception(true)
page.removeAllListeners('request')
page.on('request', r => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' }
  if (/rpc\/join_waitlist/.test(r.url())) return r.method() === 'OPTIONS' ? r.respond({ status: 204, headers: cors }) : r.respond({ status: 200, contentType: 'application/json', headers: cors, body: '"waitlisted"' })
  if (/\/(rest|auth)\/v1\//.test(r.url()) && !['GET', 'HEAD', 'OPTIONS'].includes(r.method())) { blocked++; return r.abort() }
  r.continue()
})
await page.goto(`${base}/?waitlist`, { waitUntil: 'networkidle2' }); await page.waitForSelector('.waitlist-card')
await page.type('#wl-name', 'Wanda Example'); await page.type('#wl-email', 'wanda@example.com')
await page.click('#wl-role'); await page.waitForSelector('.cselect-list [role=option]'); await page.click('.cselect-list [role=option][data-value="Founder"]'); await sleep(200)
await page.click('.waitlist-card button[type=submit]')
await page.waitForFunction(() => /on the list/.test(document.body.innerText), { timeout: 10000 }).catch(() => {})
await sleep(500)
check('joined screen shows in the same style', /on the list/.test(await page.evaluate(() => document.body.innerText)) && (await measure(page)).aurora)
await page.screenshot({ path: `${out}/05-on-the-list.png` })

await ctx.close(); ({ ctx, page } = await fresh())
await page.goto(base, { waitUntil: 'networkidle2' }); await page.waitForSelector('.auth-card')
const [forgot] = await page.$$('xpath/.//button[contains(., "Forgot password")]'); await forgot.click(); await sleep(600)
await page.screenshot({ path: `${out}/06-forgot.png` })
check('forgot password: same stage', (await measure(page)).aurora)

await ctx.close(); ({ ctx, page } = await fresh(375, 812))
await page.goto(`${base}/?waitlist`, { waitUntil: 'networkidle2' }); await page.waitForSelector('.waitlist-card'); await sleep(600)
m = await measure(page)
check('phone: no sideways scroll', m.overflow <= 0, String(m.overflow))
await page.screenshot({ path: `${out}/07-waitlist-375.png` })
check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 200))
console.log(`${results.filter(Boolean).length}/${results.length} passed; blocked writes ${blocked}; screenshots in ${out}`)
await browser.close()
