// v0.15.0 Scheduled tasks. TEST account. One real agent run, triggered by the
// REAL scheduler: the task's next run is moved to "now" (service role), the
// per-minute pg_cron runner queues it, and the NEW worker code runs it on the
// VPS harness (the live worker must be stopped by the caller for that minute).
//   - menu item, empty state with examples
//   - create from an example (own chat created), edit, pause/resume
//   - the scheduled run lands in the task's chat, labelled as a scheduled run
//   - delete; cleanup removes the task and its chat
// Usage: node scripts/review-v0150-scheduled.mjs [base-url]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'
import { execFileSync } from 'node:child_process'

const base = process.argv[2] || 'http://localhost:5173'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}`, 'Content-Type': 'application/json' }
const rest = (path, init = {}) => fetch(`${W.SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } })
const out = '/tmp/cb-review'; fs.mkdirSync(out, { recursive: true })
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const STAMP = Date.now().toString(36)

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
page.on('dialog', d => d.accept())
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
const [projects] = await page.$$('xpath/.//button[contains(., "Projects")]'); await projects.click()
await page.waitForSelector('.project-card', { timeout: 15000 }); await (await page.$('.project-card')).click()
await page.waitForSelector('#engineers', { timeout: 15000 })
const nav = async label => { const [b] = await page.$$(`xpath/.//button[contains(@class,"side-item") and contains(., "${label}")]`); await b.click() }
async function openScheduled() {
  await page.waitForSelector('.dashboard, #engineers, .scheduled-page, .chat-rail, .project-card', { timeout: 20000 })
  if (await page.$('.project-sidebar-back')) { await page.click('.project-sidebar-back'); await page.waitForSelector('.project-card', { timeout: 15000 }) }
  await nav('Scheduled')
  await page.waitForSelector('.scheduled-page', { timeout: 10000 })
  await page.waitForFunction(() => !/Loading/.test(document.querySelector('.scheduled-page').innerText), { timeout: 10000 })
}
await nav('Agent'); await page.waitForSelector('.chat-panel[data-deal]', { timeout: 15000 })
const dealId = await page.$eval('.chat-panel[data-deal]', e => e.dataset.deal)

let schedId = null, chatId = null
try {
  await openScheduled()
  const ex = await page.$$eval('.sched-example strong', l => l.map(e => e.innerText))
  check('"Scheduled" is in the main menu, empty state offers examples', ex.length === 2, ex.join(' | '))
  await page.screenshot({ path: `${out}/v0150-7-scheduled-empty.png` })

  // Create from the research example, with our own name.
  await page.click('.sched-example')
  await page.waitForSelector('.sched-form')
  await page.select('.sched-form select[aria-label="Project"]', dealId)
  const name = await page.$('.sched-form input:not([type])')
  await name.evaluate(i => i.select()); await page.keyboard.type(`News ${STAMP}`)
  const pre = await page.$eval('.sched-form textarea', t => t.value)
  check('the example fills the form (Deep research, weekly)', /last 7 days/.test(pre) && await page.$eval('[aria-label="Task type"] .seg-on', b => b.innerText) === 'Deep research')
  await page.$eval('.sched-form textarea', t => { t.value = '' })
  await page.click('.sched-form textarea', { clickCount: 3 }); await page.keyboard.press('Backspace')
  await page.type('.sched-form textarea', `[${STAMP}] In one sentence: what is Spotify's ticker symbol and exchange?`)
  await page.click('.sched-form button[type=submit]')
  await page.waitForSelector('.sched-card', { timeout: 10000 })
  const card = await page.$eval('.sched-card', e => e.innerText.replace(/\n+/g, ' · '))
  check('the card names the project', !!(await page.$eval('.sched-card .sched-project', e => e.innerText).catch(() => '')))
  check('the task is listed with its repeat, next run and "Not run yet"', /Every week/.test(card) && /Next: Tomorrow, 9:00 AM/.test(card) && /Not run yet/.test(card), card.slice(0, 160))
  const row = (await (await rest(`schedules?owner_id=eq.${owner}&title=eq.${encodeURIComponent('News ' + STAMP)}&select=id,payload,every,timezone,kind`)).json())[0]
  schedId = row?.id; chatId = row?.payload?.chat_id
  check('saved with its own chat, the browser time zone and kind research', !!chatId && row.kind === 'research' && row.timezone && row.every === '7 days', `${row?.timezone} ${row?.every}`)

  // Edit: every 2 days.
  await page.evaluate(() => [...document.querySelectorAll('.sched-card button')].find(b => b.innerText === 'Edit').click())
  await page.waitForSelector('.sched-form')
  await page.$eval('.sched-every input', i => i.select()); await page.keyboard.type('2')
  await page.select('.sched-every select', 'days')
  await page.click('.sched-form button[type=submit]'); await sleep(1200)
  check('edit: "Every 2 days" saved', /Every 2 days/.test(await page.$eval('.sched-card', e => e.innerText)))

  // Pause / resume.
  await page.click('.sched-card .pf-toggle input'); await sleep(1000)
  check('pause shows Paused', /Paused/.test(await page.$eval('.sched-card', e => e.innerText)))
  await page.click('.sched-card .pf-toggle input'); await sleep(1000)
  check('resume shows the next run again', /Next:/.test(await page.$eval('.sched-card', e => e.innerText)))
  await page.screenshot({ path: `${out}/v0150-8-scheduled-list.png` })

  // The real scheduler: make it due now, let pg_cron queue it, run it on the harness.
  await rest(`schedules?id=eq.${schedId}`, { method: 'PATCH', body: JSON.stringify({ next_run_at: new Date(Date.now() - 30000).toISOString() }) })
  let job = null
  for (let i = 0; i < 50 && !job; i++) {
    await sleep(2000)
    const r = await rest(`jobs?schedule_id=eq.${schedId}&status=eq.queued&select=id`, { method: 'PATCH', body: JSON.stringify({ status: 'running', locked_by: 'harness', locked_at: new Date().toISOString(), attempts: 1 }), headers: { Prefer: 'return=representation' } })
    const rows = r.ok ? await r.json() : []
    if (rows.length) job = rows[0].id
  }
  check('the per-minute scheduler queued the due task', !!job)
  if (job) {
    const o = execFileSync('ssh', ['casebuilder-vps', `sudo -u casebuilder bash -c 'cd /home/casebuilder/worker-harness && set -a && . /home/casebuilder/worker/worker.env && set +a && python3 handle_one.py ${job}'`], { encoding: 'utf8', timeout: 300000 })
    check('the worker ran it', /"done"/.test(o), o.trim().split('\n').at(-1))
  }
  const next = (await (await rest(`schedules?id=eq.${schedId}&select=next_run_at`)).json())[0]?.next_run_at
  check('the next run moved forward about 2 days', next && new Date(next) - Date.now() > 40 * 3600000, next)

  // The result is in the task's chat, labelled.
  await page.reload({ waitUntil: 'networkidle2' })
  await openScheduled()
  await page.waitForSelector('.sched-card', { timeout: 15000 })
  await page.waitForFunction(() => /Last run:/.test(document.querySelector('.sched-card')?.innerText || ''), { timeout: 10000 }).catch(() => {})
  const lr = await page.$eval('.sched-card', e => (e.innerText.match(/Last run: [^\n·]+/) || [''])[0])
  check('the card shows the last run', /Last run: Today/.test(lr), lr)
  await page.evaluate(() => [...document.querySelectorAll('.sched-card button')].find(b => b.innerText === 'Open chat').click())
  await page.waitForSelector('.chat-full', { timeout: 15000 })
  await page.waitForFunction(() => document.querySelector('.chat-full .chat-research .research-answer'), { timeout: 20000 }).catch(() => {})
  const label = await page.$eval('.chat-full .chat-scheduled-run .mono-label', e => e.innerText).catch(() => '')
  const ans = await page.$eval('.chat-full .chat-research', e => e.innerText).catch(() => '')
  const title = await page.$eval('.chat-full .chat-deal', e => e.innerText).catch(() => '')
  check('"Open chat" opens the task\'s own chat in its project', title === `News ${STAMP}` && (await page.$eval('.chat-panel[data-deal]', e => e.dataset.deal)) === dealId, title)
  check('the run is labelled as a scheduled run with the task name', /SCHEDULED RUN · News/i.test(label), label)
  check('the cited answer is in the chat', /SPOT/.test(ans) && /NYSE|New York Stock Exchange/i.test(ans), ans.replace(/\n+/g, ' ').slice(0, 140))
  await page.screenshot({ path: `${out}/v0150-9-scheduled-run-chat.png` })

  // Delete the task: chat stays.
  await openScheduled(); await page.waitForSelector('.sched-card', { timeout: 10000 })
  await page.click('.sched-card button[aria-label^="Delete"]'); await sleep(1200)
  const gone = (await (await rest(`schedules?id=eq.${schedId}&select=id`)).json()).length === 0
  const chatStays = (await (await rest(`chats?id=eq.${chatId}&select=id`)).json()).length === 1
  check('delete removes the task and keeps its chat', gone && chatStays)
  if (gone) schedId = null
} finally {
  if (schedId) await rest(`schedules?id=eq.${schedId}`, { method: 'DELETE' })
  if (chatId) await rest(`chats?id=eq.${chatId}`, { method: 'DELETE' })
  const left = await (await rest(`schedules?owner_id=eq.${owner}&select=id`)).json()
  check('cleanup: no test schedules or chats left', left.length === 0 && (await (await rest(`chats?id=eq.${chatId}&select=id`)).json()).length === 0)
}
check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 200))
await browser.close()
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
