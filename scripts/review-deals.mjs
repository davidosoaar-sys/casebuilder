// Real-browser check: deals live in Supabase, per account.
// Uses test2@casebuilder.dev (fresh account) and test@casebuilder.dev only.
// Usage: node scripts/review-deals.mjs [baseUrl]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const cfg = `${os.homedir()}/.config/casebuilder`
const readEnv = f => Object.fromEntries(fs.readFileSync(f, 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const w = readEnv(`${cfg}/worker.env`)
const T2 = { email: 'test2@casebuilder.dev', pw: readEnv(`${cfg}/accounts/test2@casebuilder.dev.env`).PASSWORD }
const T1 = { email: 'test@casebuilder.dev', pw: readEnv(`${cfg}/test-account.env`).TEST_PASSWORD }
const NAME = `Northwind Retail ${Date.now().toString(36)}`

const db = async (path, init = {}) => {
  const r = await fetch(`${w.SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { apikey: w.SUPABASE_SECRET_KEY, Authorization: `Bearer ${w.SUPABASE_SECRET_KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) } })
  return r.status === 204 ? null : r.json()
}
const rowsNamed = name => db(`deals?select=id,owner_id,name,version&name=eq.${encodeURIComponent(name)}`)
const results = []
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({ headless: 'new' })
const errors = []
async function session(acct) {
  const ctx = await browser.createBrowserContext() // fresh: no localStorage
  const page = await ctx.newPage()
  await page.setViewport({ width: 1280, height: 690 })
  page.on('pageerror', e => errors.push(e.message))
  await page.goto(base, { waitUntil: 'networkidle2' })
  await page.waitForSelector('#auth-email')
  await page.type('#auth-email', acct.email); await page.type('#auth-password', acct.pw)
  await page.click('button[type=submit]')
  await page.waitForSelector('.side-settings', { timeout: 15000 })
  await toProjects(page)
  return { ctx, page }
}
// Sign-in lands on the Dashboard; deal tests work from the Projects page.
async function toProjects(page) {
  await page.waitForSelector('button[aria-label="Projects"]', { timeout: 15000 })
  await page.click('button[aria-label="Projects"]')
  await page.waitForSelector('.projects-page', { timeout: 15000 })
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), { timeout: 15000 })
}
const names = page => page.$$eval('.project-card strong', els => els.map(e => e.textContent))
const waitSaved = page => page.waitForSelector('.save-indicator.save-saved', { timeout: 20000 })

// 1. Fresh account gets the sample deal, stored in Supabase.
const a = await session(T2)
const first = await names(a.page)
const t2id = (await db(`profiles?select=id&email=eq.${encodeURIComponent(T2.email)}`))[0]?.id
const t2rows = await db(`deals?select=name&owner_id=eq.${t2id}`)
check('new account sees exactly one Spotify sample', first.filter(n => /spotify/i.test(n)).length === 1, first.join(', '))
check('sample is a row in Supabase for that account', t2rows.some(r => /spotify/i.test(r.name)))

// 1b. Projects page offers New project straight away (name now lives in Settings).
check('New project available on Projects', Boolean((await a.page.$$('xpath/.//button[normalize-space()="New project"]')).length))

// 2. Create a deal in the UI -> row appears in Supabase.
const [newBtn] = await a.page.$$('xpath/.//button[normalize-space()="New project"]'); await newBtn.click()
await a.page.waitForSelector('#company-name'); await a.page.type('#company-name', NAME)
await a.page.click('.modal button[type=submit]')
await sleep(800); await waitSaved(a.page)
let rows = await rowsNamed(NAME)
check('created deal is saved to Supabase', rows.length === 1 && rows[0].owner_id === t2id)
await a.page.screenshot({ path: '/tmp/deals-1-created.png' })

// 3. Edits save (version goes up).
const v1 = rows[0]?.version
await a.page.reload({ waitUntil: 'networkidle2' })
await toProjects(a.page)
await a.page.waitForSelector('.project-card', { timeout: 15000 })
const [card] = await a.page.$$(`xpath/.//div[contains(@class,"project-card")][.//strong[normalize-space()="${NAME}"]]`)
const [dup] = await card.$$('button[aria-label^="Duplicate"]'); await dup.click()
await sleep(800); await waitSaved(a.page)
rows = await rowsNamed(NAME)
const copies = await rowsNamed(NAME + ' (copy)')
check('reload keeps the deal, duplicate saves as its own row', rows.length === 1 && copies.length === 1, `orig=${rows.length} copy=${copies.length}`)
check('original row untouched by the duplicate', rows.some(r => r.version === v1))

// 3b. Edit inside an existing deal (version-checked update path, save_deal RPC).
{
  const [open] = await a.page.$$(`xpath/.//div[contains(@class,"project-card")][.//strong[normalize-space()="${NAME}"]]`)
  await open.click()
  await a.page.waitForSelector('#engineers', { timeout: 15000 })
  const before = (await rowsNamed(NAME))[0]
  const MARK = String(400 + Math.floor(Math.random() * 500))
  const box = await a.page.$('#engineers')
  const fieldId = 'engineers'
  await box.click({ clickCount: 3 }); await box.type(MARK)
  await sleep(1200); await waitSaved(a.page)
  const after = (await rowsNamed(NAME))[0]
  const full = await db(`deals?select=data&id=eq.${after.id}`)
  check('editing inside a deal saves (version went up)', after.version > before.version, `v${before.version} -> v${after.version}`)
  check('the edit itself is in Supabase', JSON.stringify(full[0].data).includes(MARK))
  await a.page.screenshot({ path: '/tmp/deals-4-edit.png' })
  // a second, fresh browser opens the deal and sees the edit
  const d = await session(T2)
  const [o2] = await d.page.$$(`xpath/.//div[contains(@class,"project-card")][.//strong[normalize-space()="${NAME}"]]`)
  await o2.click(); await d.page.waitForSelector(`#${fieldId}`, { timeout: 15000 })
  check('the edit shows in another browser', (await d.page.$eval(`#${fieldId}`, e => e.value)) === MARK)
  await d.ctx.close()
  await a.page.goto(base, { waitUntil: 'networkidle2' }); await toProjects(a.page); await a.page.waitForSelector('.project-card', { timeout: 15000 })
}

// 4. Different browser, same account: deals are there (cloud, not this browser).
const b = await session(T2)
const fromB = await names(b.page)
check('same account in a clean browser sees its deals', fromB.includes(NAME) && fromB.includes(NAME + ' (copy)'), fromB.join(', '))
await b.page.screenshot({ path: '/tmp/deals-2-other-browser.png' })

// 5. Another account sees none of them.
const c = await session(T1)
const fromC = await names(c.page)
check('other account does not see them', !fromC.some(n => n.startsWith(NAME)), fromC.join(', '))

// 6. Offline: change is kept and saved when the network returns.
await a.page.setOfflineMode(true)
const [newBtn2] = await a.page.$$('xpath/.//button[normalize-space()="New project"]')
if (newBtn2) {
  await newBtn2.click(); await a.page.waitForSelector('#company-name'); await a.page.type('#company-name', NAME + ' offline')
  await a.page.click('.modal button[type=submit]')
} else {
  await a.page.goto(base) // fall back: should not happen
}
await a.page.waitForSelector('.save-indicator.save-error', { timeout: 20000 }).catch(() => {})
check('offline: indicator shows not saved', Boolean(await a.page.$('.save-indicator.save-error')))
await a.page.screenshot({ path: '/tmp/deals-3-offline.png' })
await a.page.setOfflineMode(false)
await a.page.waitForSelector('.save-indicator.save-saved', { timeout: 30000 }).catch(() => {})
rows = await rowsNamed(NAME + ' offline')
check('back online: offline deal reaches Supabase on its own', rows.length === 1)

// 7. Delete in the UI -> rows gone.
await a.page.goto(base, { waitUntil: 'networkidle2' })
await toProjects(a.page)
await a.page.waitForSelector('.project-card', { timeout: 15000 })
a.page.on('dialog', d => d.accept())
for (const n of [NAME, NAME + ' (copy)', NAME + ' offline']) {
  const [del] = await a.page.$$(`xpath/.//div[contains(@class,"project-card")][.//strong[normalize-space()="${n}"]]//button[@title="Delete project"]`)
  if (del) { await del.click(); await sleep(1500) }
}
const left = [...await rowsNamed(NAME), ...await rowsNamed(NAME + ' (copy)'), ...await rowsNamed(NAME + ' offline')]
check('delete removes the rows from Supabase', left.length === 0, `left=${left.length}`)
check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '))

await browser.close()
// Safety cleanup if a step failed midway.
for (const n of [NAME, NAME + ' (copy)', NAME + ' offline']) await db(`deals?name=eq.${encodeURIComponent(n)}`, { method: 'DELETE' })
const failed = results.filter(r => !r).length
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
process.exit(failed ? 1 : 0)
