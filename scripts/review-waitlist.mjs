// Real end-to-end check of the waitlist against the LIVE database:
//  1. a visitor opens ?waitlist&ref=e2e, joins            -> "You're on the list"
//  2. they try to create an account before being invited  -> refused, told to wait
//  3. an admin opens Waitlist, sees them, clicks Invite   -> copy invite link
//  4. they open the invite link and create the account    -> code screen (email sent)
// Admin = the TEST account, promoted for the run and demoted at the end.
// Sends ONE confirmation email to amr.id.jaz+cbwl<tag>@gmail.com (step 4).
// Cleans up the test user and waitlist row at the end.
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
const EMAIL = `amr.id.jaz+cbwl${tag}@gmail.com`
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const sql = async query => {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, { method: 'POST', headers: { Authorization: `Bearer ${ADM.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) })
  const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 300)); return j
}
const setTestRole = role => sql(`begin; set local session_replication_role = replica; update public.profiles set role = '${role}' where id = (select id from auth.users where email = 'test@casebuilder.dev'); commit;`)

const browser = await puppeteer.launch({ headless: 'new' })
const errors = []
const fresh = async () => {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 1280, height: 860 })
  page.on('pageerror', e => errors.push(e.message))
  return { ctx, page }
}

try {
  // 1. Join.
  let { ctx, page } = await fresh()
  await page.goto(`${base}/?waitlist&ref=e2e-${tag}`, { waitUntil: 'networkidle2' })
  check('?waitlist opens the waitlist form', !!(await page.$('#wl-email')))
  const fields = await page.$$eval('.waitlist-card input, .waitlist-card select, .waitlist-card textarea', els => els.map(e => e.id))
  check('form asks only name, email and role', JSON.stringify(fields) === JSON.stringify(['wl-name', 'wl-email', 'wl-role']), fields.join(', '))
  const roles = await page.$$eval('#wl-role option:not([disabled])', os => os.map(o => o.value))
  check('role is a dropdown with general roles incl. Student', roles.includes('Student') && roles.includes('Account Executive') && roles.length >= 5, roles.join(' / '))
  await page.type('#wl-name', 'Wanda Waitlist'); await page.type('#wl-email', EMAIL)
  check('Join is disabled until a role is picked', await page.$eval('.waitlist-card button[type=submit]', b => b.disabled))
  await page.select('#wl-role', 'Account Executive')
  await page.screenshot({ path: '/tmp/cb-shots/waitlist-form.png' })
  await page.click('.waitlist-card button[type=submit]')
  await page.waitForFunction(() => /on the list/.test(document.body.innerText), { timeout: 15000 })
  check('joined: "You\'re on the list"', true)
  await page.screenshot({ path: '/tmp/cb-shots/waitlist-joined.png' })
  const row = await sql(`select status, source, name, role from public.waitlist where email = '${EMAIL}'`)
  check('row saved as waiting with name, role and source tag', row[0]?.status === 'waiting' && row[0]?.source === `e2e-${tag}` && row[0]?.name === 'Wanda Waitlist' && row[0]?.role === 'Account Executive', JSON.stringify(row[0]))

  // 2. Sign-up before invite is refused.
  await page.click('.waitlist-card .link-btn')
  await page.waitForSelector('#auth-password')
  await page.$eval('#auth-email', e => { e.value = '' }); await page.type('#auth-email', EMAIL)
  await page.type('#auth-password', 'correct-horse-battery-9')
  await page.click('.auth-card button[type=submit]')
  await page.waitForSelector('.auth-error', { timeout: 15000 })
  const refused = await page.$eval('.auth-error', e => e.innerText)
  check('sign-up before invite is refused with a clear message', /not been invited/.test(refused), refused)
  check('no account was created', (await sql(`select count(*)::int n from auth.users where email = '${EMAIL}'`))[0].n === 0)
  await ctx.close()

  // Normal sign-in screen points new people at the waitlist.
  ;({ ctx, page } = await fresh())
  await page.goto(base, { waitUntil: 'networkidle2' })
  check('sign-in screen offers "Join the waitlist", not "Create an account"', /Join the waitlist/.test(await page.$eval('.auth-switch', e => e.innerText)))

  // 3. Admin invites.
  await setTestRole('admin')
  await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForSelector('.dashboard', { timeout: 20000 })
  await page.waitForSelector('.side-item[aria-label="Waitlist"]', { timeout: 10000 })
  await page.click('.side-item[aria-label="Waitlist"]')
  await page.waitForSelector('.wl-row', { timeout: 10000 })
  const mine = await page.$$eval('.wl-row', (rs, e) => rs.filter(r => r.innerText.includes('Wanda Waitlist')).length, EMAIL)
  check('admin sees the new person under Waiting', mine === 1)
  await page.screenshot({ path: '/tmp/cb-shots/waitlist-admin.png' })
  const rows = await page.$$('.wl-row')
  for (const r of rows) if ((await r.evaluate(e => e.innerText)).includes('Wanda Waitlist')) { await (await r.$('.primary')).click(); break }
  await sleep(1500)
  check('invite saved', (await sql(`select status from public.waitlist where email = '${EMAIL}'`))[0].status === 'invited')
  await ctx.close()

  // A normal user does not see the Waitlist page, and cannot read the table.
  await setTestRole('user')
  ;({ ctx, page } = await fresh())
  await page.goto(base, { waitUntil: 'networkidle2' })
  await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
  await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 }); await sleep(1500)
  check('non-admin has no Waitlist menu item', !(await page.$('.side-item[aria-label="Waitlist"]')))
  const leak = await page.evaluate(async () => { const m = await import('/src/supabase.js'); const { data } = await m.supabase.from('waitlist').select('email'); return (data || []).length })
  check('non-admin reads zero waitlist rows', leak === 0, `${leak} rows`)
  await ctx.close()

  // 4. Invite link -> create account.
  ;({ ctx, page } = await fresh())
  await page.goto(`${base}/?invited&email=${encodeURIComponent(EMAIL)}`, { waitUntil: 'networkidle2' })
  check('invite link opens Create account with the email filled', (await page.$eval('#auth-email', e => e.value)) === EMAIL)
  await page.type('#auth-password', 'correct-horse-battery-9')
  await page.click('.auth-card button[type=submit]')
  await page.waitForFunction(() => /6-digit code|Enter the code|sent a/i.test(document.body.innerText), { timeout: 20000 })
  check('invited sign-up goes through to the email code step', true)
  const after = await sql(`select w.status, (select count(*)::int from auth.users where email = '${EMAIL}') n from public.waitlist w where w.email = '${EMAIL}'`)
  check('account created and waitlist row marked joined', after[0].n === 1 && after[0].status === 'joined', JSON.stringify(after[0]))
  await ctx.close()
} finally {
  await setTestRole('user').catch(e => console.log('demote failed', e.message))
  await sql(`delete from auth.users where email = '${EMAIL}'; delete from public.waitlist where email = '${EMAIL}';`).catch(e => console.log('cleanup failed', e.message))
  const left = await sql(`select (select count(*)::int from auth.users where email = '${EMAIL}') u, (select count(*)::int from public.waitlist where email = '${EMAIL}') w, (select role from public.profiles where id = (select id from auth.users where email = 'test@casebuilder.dev')) r`)
  check('cleaned up: test user and row gone, test account back to user', left[0].u === 0 && left[0].w === 0 && left[0].r === 'user', JSON.stringify(left[0]))
  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
  await browser.close()
  console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
  process.exit(results.every(Boolean) ? 0 : 1)
}
