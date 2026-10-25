// Real end-to-end check of the waitlist against the LIVE database, with a
// screenshot of every screen the visitor sees (/tmp/cb-shots/wl-*.png).
//  A. New person: form -> "You're on the list".
//     Signing up before approval is refused; no account is made.
//  B. Admin approves an email that has never joined (Let someone in).
//     That person fills the form -> straight to "Create your account", email
//     filled, password -> email code step. (Sends ONE confirmation email to
//     amr.id.jaz+cbwlb<tag>@gmail.com.)
//  C. Existing account fills the form -> sent to Sign in.
//  D. Non-admin: no Waitlist menu, zero rows readable.
// Admin = the TEST account, promoted for the run, demoted at the end; test
// users and rows are deleted at the end.
// Usage: node scripts/review-waitlist.mjs [base-url]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const ADM = envFile(`${os.homedir()}/.config/casebuilder/supabase-admin.env`)
const REF = new URL(W.SUPABASE_URL).hostname.split('.')[0]
const tag = Date.now().toString(36)
const NEW = `amr.id.jaz+cbwla${tag}@gmail.com`
const VIP = `amr.id.jaz+cbwlb${tag}@gmail.com`
const SHOTS = '/tmp/cb-shots'; fs.mkdirSync(SHOTS, { recursive: true })
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const sql = async query => {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, { method: 'POST', headers: { Authorization: `Bearer ${ADM.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) })
  const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 300)); return j
}
const setTestRole = role => sql(`update public.profiles set role = '${role}' where id = (select id from auth.users where email = 'test@casebuilder.dev')`)

const browser = await puppeteer.launch({ headless: 'new' })
const errors = []
async function fresh(w = 1280, h = 860) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: w, height: h })
  page.on('pageerror', e => errors.push(e.message))
  return { ctx, page }
}
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png` })
async function fillForm(page, name, email, role) {
  await page.type('#wl-name', name); await page.type('#wl-email', email); await page.select('#wl-role', role)
}
async function signInAs(page, email, pw) {
  await page.goto(base, { waitUntil: 'networkidle2' })
  await page.type('#auth-email', email); await page.type('#auth-password', pw)
  await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
}

try {
  // A. New person.
  let { ctx, page } = await fresh()
  await page.goto(`${base}/?waitlist&ref=e2e-${tag}`, { waitUntil: 'networkidle2' })
  const fields = await page.$$eval('.waitlist-card input, .waitlist-card select, .waitlist-card textarea', els => els.map(e => e.id))
  check('form asks only name, email and role', JSON.stringify(fields) === JSON.stringify(['wl-name', 'wl-email', 'wl-role']), fields.join(', '))
  check('no "Got an invite" link on the form', !/Got an invite/i.test(await page.$eval('.waitlist-card', e => e.innerText)))
  await shot(page, 'wl-1-form')
  await fillForm(page, 'Wanda Waitlist', NEW, 'Account Executive')
  await shot(page, 'wl-2-form-filled')
  await page.click('.waitlist-card button[type=submit]')
  await page.waitForFunction(() => /on the list/.test(document.body.innerText), { timeout: 15000 })
  await shot(page, 'wl-3-on-the-list')
  check('new person: "You\'re on the list"', true)
  const row = await sql(`select status, source, name, role from public.waitlist where email = '${NEW}'`)
  check('saved as waiting with name, role and source tag', row[0]?.status === 'waiting' && row[0]?.source === `e2e-${tag}` && row[0]?.name === 'Wanda Waitlist' && row[0]?.role === 'Account Executive', JSON.stringify(row[0]))
  // Joining again with the same email still says on the list (not approved yet).
  await page.goto(`${base}/?waitlist`, { waitUntil: 'networkidle2' })
  await fillForm(page, 'Wanda Waitlist', NEW, 'Account Executive')
  await page.click('.waitlist-card button[type=submit]')
  await page.waitForFunction(() => /on the list/.test(document.body.innerText), { timeout: 15000 })
  check('not approved: joining again still says on the list, no way through', true)
  check('no account made for the unapproved email', (await sql(`select count(*)::int n from auth.users where email = '${NEW}'`))[0].n === 0)
  await ctx.close()

  // Phone view of the form.
  ;({ ctx, page } = await fresh(390, 844))
  await page.goto(`${base}/?waitlist`, { waitUntil: 'networkidle2' })
  await shot(page, 'wl-1-form-phone')
  check('form fits a phone', !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)))
  await ctx.close()

  // B. Admin approves an email that never joined.
  await setTestRole('admin')
  ;({ ctx, page } = await fresh())
  await signInAs(page, 'test@casebuilder.dev', T.TEST_PASSWORD)
  await page.waitForSelector('.side-item[aria-label="Waitlist"]', { timeout: 10000 })
  await page.click('.side-item[aria-label="Waitlist"]')
  await page.waitForSelector('.wl-approve-input')
  await page.type('.wl-approve-input', VIP)
  await page.click('.wl-approve .primary')
  await page.waitForSelector('.wl-approved', { timeout: 10000 })
  await shot(page, 'wl-admin-approved')
  check('admin approves an email that is not on the list yet', (await sql(`select status from public.waitlist where email = '${VIP}'`))[0]?.status === 'invited')
  await ctx.close()
  await setTestRole('user')

  ;({ ctx, page } = await fresh())
  await page.goto(`${base}/?waitlist`, { waitUntil: 'networkidle2' })
  await fillForm(page, 'Vera Vip', VIP, 'Founder')
  await page.click('.waitlist-card button[type=submit]')
  await page.waitForFunction(() => /Create your account/.test(document.body.innerText), { timeout: 15000 })
  await shot(page, 'wl-4-approved-create-account')
  const st = await page.evaluate(() => ({ email: document.querySelector('#auth-email')?.value, notice: document.querySelector('.auth-notice')?.innerText || '' }))
  check('approved email goes straight to Create your account', st.email === VIP && /approved, Vera/.test(st.notice), st.notice)
  await page.type('#auth-password', 'correct-horse-battery-9')
  await page.click('.auth-card button[type=submit]')
  await page.waitForFunction(() => /Check your email/.test(document.body.innerText), { timeout: 20000 })
  await shot(page, 'wl-5-check-email')
  const after = await sql(`select w.status, w.name, w.role, (select count(*)::int from auth.users where email = '${VIP}') n from public.waitlist w where w.email = '${VIP}'`)
  check('account created, row joined, name and role filled from the form', after[0].n === 1 && after[0].status === 'joined' && after[0].name === 'Vera Vip' && after[0].role === 'Founder', JSON.stringify(after[0]))
  await ctx.close()

  // C. Existing account fills the form.
  ;({ ctx, page } = await fresh())
  await page.goto(`${base}/?waitlist`, { waitUntil: 'networkidle2' })
  await fillForm(page, 'Tess Test', 'test@casebuilder.dev', 'Other')
  await page.click('.waitlist-card button[type=submit]')
  await page.waitForFunction(() => /already have an account/i.test(document.body.innerText) && !!document.querySelector('#auth-password'), { timeout: 15000 })
  await shot(page, 'wl-6-existing-account')
  check('existing account is sent to Sign in', true)
  await ctx.close()

  // D. Non-admin.
  ;({ ctx, page } = await fresh())
  await signInAs(page, 'test@casebuilder.dev', T.TEST_PASSWORD); await sleep(1500)
  check('non-admin has no Waitlist menu item', !(await page.$('.side-item[aria-label="Waitlist"]')))
  const leak = await page.evaluate(async () => { const m = await import('/src/supabase.js'); const { data } = await m.supabase.from('waitlist').select('email'); return (data || []).length })
  check('non-admin reads zero waitlist rows', leak === 0, `${leak} rows`)
  const appr = await page.evaluate(async () => { const m = await import('/src/supabase.js'); const { error } = await m.supabase.rpc('approve_email', { p_email: 'sneaky@example.com' }); return error?.message || 'no error' })
  check('non-admin cannot approve an email', /only an admin/.test(appr), appr)
  await ctx.close()
} finally {
  await setTestRole('user').catch(e => console.log('demote failed', e.message))
  await sql(`delete from auth.users where email in ('${NEW}', '${VIP}'); delete from public.waitlist where email in ('${NEW}', '${VIP}', 'sneaky@example.com');`).catch(e => console.log('cleanup failed', e.message))
  const left = await sql(`select (select count(*)::int from auth.users where email in ('${NEW}', '${VIP}')) u, (select count(*)::int from public.waitlist where email in ('${NEW}', '${VIP}')) w, (select role from public.profiles where id = (select id from auth.users where email = 'test@casebuilder.dev')) r`)
  check('cleaned up: test users and rows gone, test account back to user', left[0].u === 0 && left[0].w === 0 && left[0].r === 'user', JSON.stringify(left[0]))
  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
  await browser.close()
  console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
  process.exit(results.every(Boolean) ? 0 : 1)
}
