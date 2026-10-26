// v0.16.0 Scheduled page review (TEST account, read-only: nothing is saved).
// Pass 1 uses the account's real tasks (usually none: the empty state).
// Pass 2 feeds two fixture tasks into the schedules read (request
// interception) to check the list, switch and overflow menu. Any write to
// schedules, jobs, chats or chat_messages is aborted and fails the run.
// Usage: node scripts/review-v0160-scheduled-ui.mjs [base-url] [out-dir]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const out = process.argv[3] || '/tmp/cb-v0160-scheduled'
fs.mkdirSync(out, { recursive: true })
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }

const tomorrow = new Date(Date.now() + 86400000); tomorrow.setHours(9, 0, 0, 0)
const FIXTURES = [
  { id: '00000000-0000-4000-8000-0000000000a1', deal_id: '00000000-0000-4000-8000-0000000000d1', title: 'Monday account news', kind: 'research', every: '7 days', timezone: 'UTC', next_run_at: tomorrow.toISOString(), enabled: true, created_at: new Date(Date.now() - 864e5 * 3).toISOString(),
    payload: { question: 'Use skill: Account news digest', chat_id: '00000000-0000-4000-8000-0000000000c1', skill_key: 'account_news', skill_inputs: {} } },
  { id: '00000000-0000-4000-8000-0000000000a2', deal_id: '00000000-0000-4000-8000-0000000000d1', title: 'Daily open questions with a fairly long name to check wrapping', kind: 'chat', every: '1 day', timezone: 'UTC', next_run_at: tomorrow.toISOString(), enabled: false, created_at: new Date(Date.now() - 864e5 * 2).toISOString(),
    payload: { message: 'List the inputs on this deal that are still unconfirmed, most important first, and say who could confirm each.', chat_id: '00000000-0000-4000-8000-0000000000c2', web: true } }
]
const JOBS = [{ schedule_id: FIXTURES[0].id, status: 'done', created_at: new Date(Date.now() - 864e5).toISOString(), error: null }]

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
const errors = []
const writes = []
let fixtures = false
page.on('pageerror', e => errors.push(e.message))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('response', async r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`) })
page.on('dialog', d => { writes.push(`dialog: ${d.message()}`); d.dismiss() })
await page.setRequestInterception(true)
page.on('request', req => {
  const u = new URL(req.url())
  const table = (u.pathname.match(/\/rest\/v1\/(schedules|jobs|chats|chat_messages)$/) || [])[1]
  const cors = { 'access-control-allow-origin': req.headers().origin || '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS', 'access-control-expose-headers': 'content-range' }
  if (table && !['GET', 'HEAD', 'OPTIONS'].includes(req.method())) { writes.push(`${req.method()} ${table}`); return req.abort() }
  if (fixtures && table && (table === 'schedules' || table === 'jobs')) {
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: cors })
    return req.respond({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(table === 'schedules' ? FIXTURES : JOBS) })
  }
  req.continue()
})

await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
async function openScheduled() {
  const [b] = await page.$$('xpath/.//button[contains(@class,"side-item") and contains(., "Scheduled")]'); await b.click()
  await page.waitForSelector('.scheduled-page', { timeout: 10000 })
  await page.waitForFunction(() => !document.querySelector('.scheduled-page [aria-busy="true"]'), { timeout: 15000 })
  await sleep(700)
}
await openScheduled()
const head = await page.evaluate(() => ({
  sub: document.querySelector('.scheduled-page .page-sub')?.innerText,
  btn: [...document.querySelectorAll('.scheduled-page .page-head button')].map(b => b.innerText.trim()),
  tabs: [...document.querySelectorAll('.scheduled-page [role=tab]')].map(t => ({ t: t.innerText.trim().replace(/\s+/g, ' '), sel: t.getAttribute('aria-selected') })),
  cards: document.querySelectorAll('.sched-card').length
}))
console.log(JSON.stringify(head))
check('header copy and New task button', /run a skill or a prompt on its own/.test(head.sub || '') && head.btn.includes('New task'), head.btn.join(','))
check('Yours and Templates tabs, one selected', head.tabs.length === 2 && head.tabs.filter(t => t.sel === 'true').length === 1, JSON.stringify(head.tabs))
check('default tab: Yours if tasks, else Templates', head.tabs.find(t => t.sel === 'true')?.t.startsWith(head.cards ? 'Yours' : 'Templates'))
await page.screenshot({ path: `${out}/01-default.png` })

// Yours, real data: empty state or list.
const [yoursTab] = await page.$$('xpath/.//*[@role="tab" and contains(., "Yours")]'); await yoursTab.click(); await sleep(500)
const yours = await page.evaluate(() => ({ cards: document.querySelectorAll('.sched-card').length, empty: document.querySelector('.sched-empty')?.innerText || '' }))
check('Yours renders the empty state or the list', yours.cards > 0 || (/No scheduled tasks yet/.test(yours.empty) && /Browse templates/.test(yours.empty) && /Set up manually/.test(yours.empty)), yours.cards ? `${yours.cards} tasks` : 'empty')
await page.screenshot({ path: `${out}/02-yours.png` })
if (!yours.cards) {
  const [browse] = await page.$$('xpath/.//button[contains(., "Browse templates")]'); await browse.click(); await sleep(500)
  check('"Browse templates" switches tab', await page.$eval('#sched-tab-templates', e => e.getAttribute('aria-selected') === 'true'))
}

// Templates
const [tplTab] = await page.$$('xpath/.//*[@role="tab" and contains(., "Templates")]'); await tplTab.click(); await sleep(600)
const tpl = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.sched-example')]
  return { n: cards.length, lefts: [...new Set(cards.map(c => Math.round(c.getBoundingClientRect().left)))], items: cards.map(c => ({ name: c.querySelector('strong').innerText, chip: c.querySelector('.skill-meta > span')?.innerText, btn: c.querySelector('.skill-try')?.innerText, off: c.querySelector('.skill-try')?.disabled })) }
})
console.log(JSON.stringify(tpl.items))
check('5 templates (.sched-example)', tpl.n === 5, String(tpl.n))
check('2-column grid at 1280', tpl.lefts.length === 2, tpl.lefts.join(','))
check('schedule chips in 12-hour time', tpl.items.find(i => /Monday account news/.test(i.name))?.chip === 'Every Monday, 9:00 AM' && tpl.items.find(i => /stakeholder/.test(i.name))?.chip === 'Every Friday, 4:00 PM' && tpl.items.find(i => /Objection/.test(i.name))?.chip === 'Every 2 weeks, 9:00 AM', tpl.items.map(i => i.chip).join(' | '))
check('no em dashes or emoji in the page', !(await page.evaluate(() => /—|\p{Extended_Pictographic}/u.test(document.querySelector('.scheduled-page').innerText))))
await page.screenshot({ path: `${out}/03-templates.png` })

const mondays = tpl.items.find(i => /Monday account news/.test(i.name))
if (mondays.off) {
  check('template button explains why it is off', /Add skill first|Use template/.test(mondays.btn), mondays.btn)
} else {
  await page.evaluate(() => [...document.querySelectorAll('.sched-example')].find(c => /Monday account news/.test(c.innerText)).querySelector('.skill-try').click())
  await page.waitForSelector('.sched-form-modal .sched-form', { timeout: 5000 }); await sleep(400)
  const f = await page.evaluate(() => {
    const m = document.querySelector('.sched-form-modal')
    return {
      inBody: m.closest('#root') === null,
      name: m.querySelector('input:not([type])')?.value,
      first: m.querySelector('input[type=datetime-local]')?.value,
      runs: m.querySelector('[aria-label="Task type"] .seg-on')?.innerText,
      skill: m.querySelector('[role=combobox][aria-label="Skill"] .cselect-value')?.innerText,
      every: [m.querySelector('.sched-every input')?.value, m.querySelector('.sched-every [role=combobox]')?.dataset.value].join(' '),
      project: !!m.querySelector('[role=combobox][aria-label="Project"]'),
      submit: !!m.querySelector('button[type=submit]'),
      active: document.activeElement?.getAttribute('role') + ':' + document.activeElement?.innerText
    }
  })
  console.log(JSON.stringify(f))
  const when = new Date(f.first)
  check('template form opens in a portalled dialog, prefilled', f.inBody && f.name === 'Monday account news' && f.runs === 'Skill' && f.skill === 'Account news digest' && f.every === '1 weeks', `${f.name} / ${f.runs} / ${f.skill} / ${f.every}`)
  check('first run is in the future, on a Monday at 9:00 AM', when > new Date() && when.getDay() === 1 && when.getHours() === 9 && when.getMinutes() === 0 && when - Date.now() <= 7 * 864e5, f.first)
  check('focus starts on the first field', f.active === 'radio:Skill', f.active)
  check('form keeps the old review hooks (Project select, untyped name input, submit)', f.project && f.submit && f.name !== undefined)
  await page.screenshot({ path: `${out}/04-template-form.png` })
  // Switch to Agent prompt: the textarea appears.
  await page.evaluate(() => [...document.querySelectorAll('.sched-form-modal [role=radio]')].find(b => b.innerText === 'Agent prompt').click()); await sleep(200)
  check('Agent prompt shows the prompt textarea', !!(await page.$('.sched-form-modal textarea')))
  await page.keyboard.press('Escape'); await sleep(450)
  check('Escape closes the form', !(await page.$('.sched-form-modal')))
}
// The daily prompt template: first run within a day, at 9:00 AM.
await page.evaluate(() => [...document.querySelectorAll('.sched-example')].find(c => /Daily open questions/.test(c.innerText)).querySelector('.skill-try').click())
const daily = await page.waitForSelector('.sched-form-modal', { timeout: 5000 }).then(() => sleep(300)).then(() => page.evaluate(() => ({ first: document.querySelector('.sched-form-modal input[type=datetime-local]').value, text: document.querySelector('.sched-form-modal textarea')?.value || '' }))).catch(() => null)
if (daily) {
  const d = new Date(daily.first)
  check('daily template: next 9:00 AM, prompt filled', d > new Date() && d - Date.now() <= 864e5 && d.getHours() === 9 && /unconfirmed/.test(daily.text), daily.first)
  await page.keyboard.press('Escape'); await sleep(450)
} else check('daily template opens', false, 'button disabled (no key or no project?)')

// Pass 2: fixture tasks (read only).
fixtures = true
const [sk] = await page.$$('xpath/.//button[contains(@class,"side-item") and contains(., "Skills")]'); await sk.click()
await page.waitForSelector('.skills-page', { timeout: 10000 })
await openScheduled()
const [yt2] = await page.$$('xpath/.//*[@role="tab" and contains(., "Yours")]'); await yt2.click(); await sleep(600)
const list = await page.evaluate(() => [...document.querySelectorAll('.sched-card')].map(c => ({
  text: c.innerText.replace(/\n+/g, ' | '), off: c.classList.contains('is-off'), opacity: getComputedStyle(c).opacity,
  sw: c.querySelector('[role=switch]')?.getAttribute('aria-checked'), last: c.querySelector('.sched-last')?.className
})))
console.log(JSON.stringify(list, null, 1))
check('fixture list renders 2 rows', list.length === 2)
check('row shows type, schedule, next run, last run', /Skill: Account news digest/.test(list[0]?.text) && /Every week/.test(list[0]?.text) && /Next: Tomorrow, 9:00 AM/.test(list[0]?.text) && /Last run: Yesterday/.test(list[0]?.text) && /is-ok/.test(list[0]?.last), list[0]?.text)
check('switch has role=switch with aria-checked', list[0]?.sw === 'true' && list[1]?.sw === 'false')
check('paused row says Paused, card stays opaque', /Paused/.test(list[1]?.text) && list[1]?.off && list[1]?.opacity === '1')
await page.screenshot({ path: `${out}/05-list.png` })

await page.click('.sched-card .sched-more'); await sleep(300)
const menu = await page.evaluate(() => ({ items: [...document.querySelectorAll('.sched-menu [role=menuitem]')].map(b => b.innerText), focus: document.activeElement?.getAttribute('role'), exp: document.querySelector('.sched-more').getAttribute('aria-expanded') }))
check('overflow menu opens with Open chat, Run now, Edit, Delete', menu.items.join(',') === 'Open chat,Run now,Edit,Delete' && menu.exp === 'true', menu.items.join(','))
check('focus moves into the menu', menu.focus === 'menuitem')
await page.keyboard.press('ArrowDown'); await sleep(80)
check('arrow keys move through items', await page.evaluate(() => document.activeElement?.innerText === 'Run now' || document.activeElement?.innerText === 'Edit'))
await page.screenshot({ path: `${out}/06-menu.png` })
await page.keyboard.press('Escape'); await sleep(300)
check('Escape closes the menu, focus back on its button', !(await page.$('.sched-menu')) && await page.evaluate(() => document.activeElement?.classList.contains('sched-more')))
await page.click('.sched-card .sched-more'); await sleep(250)
await page.mouse.click(5, 5); await sleep(300)
check('outside click closes the menu', !(await page.$('.sched-menu')))

// Card body opens Edit (no save).
await page.click('.sched-card .sched-open'); await sleep(500)
const edit = await page.evaluate(() => ({ title: document.querySelector('.sched-form-modal h2')?.innerText, project: document.querySelector('.sched-form-modal [role=combobox][aria-label="Project"]')?.disabled }))
check('card body opens Edit', edit.title === 'Edit task' && edit.project === true, JSON.stringify(edit))
await page.screenshot({ path: `${out}/07-edit.png` })
await page.keyboard.press('Escape'); await sleep(450)

// Mobile
await page.setViewport({ width: 375, height: 800 }); await sleep(600)
await page.screenshot({ path: `${out}/08-mobile-list.png`, fullPage: true })
check('no overflow at 375 (list)', !(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)))
const [tm] = await page.$$('xpath/.//*[@role="tab" and contains(., "Templates")]'); await tm.click(); await sleep(600)
await page.screenshot({ path: `${out}/09-mobile-templates.png`, fullPage: true })
check('no overflow at 375 (templates)', !(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)))

check('nothing was written', writes.length === 0, writes.join(' | '))
check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '))
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
await browser.close()
process.exit(results.every(Boolean) ? 0 : 1)
