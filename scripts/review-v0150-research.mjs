// v0.15.0 Deep research in the chat. TEST account, real agent runs (2 jobs).
// The live VPS worker is still the old code, so each job the page creates is
// claimed here first (status -> running, locked_by=harness) and run by the NEW
// worker code on the VPS (worker-harness/handle_one.py). Cleans up the chat.
//   1. Deep research on: "New chat" -> research question -> cited answer
//   2. Follow-up in the same chat that only makes sense with the first answer
//   3. Sidebar: Research is gone, "Person lookup" opens the person lookup
// Usage: node scripts/review-v0150-research.mjs [base-url]
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

// Grab the newest queued job of this kind for the test user before the live worker does, and run it on the harness.
async function runOnHarness(owner, kind, since) {
  for (let i = 0; i < 40; i++) {
    const r = await rest(`jobs?owner_id=eq.${owner}&kind=eq.${kind}&status=eq.queued&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=1`, {
      method: 'PATCH', body: JSON.stringify({ status: 'running', locked_by: 'harness', locked_at: new Date().toISOString(), attempts: 1 }), headers: { Prefer: 'return=representation' } })
    const rows = r.ok ? await r.json() : []
    if (rows.length) {
      const id = rows[0].id
      const outp = execFileSync('ssh', ['casebuilder-vps', `sudo -u casebuilder bash -c 'cd /home/casebuilder/worker-harness && set -a && . /home/casebuilder/worker/worker.env && set +a && python3 handle_one.py ${id}'`], { encoding: 'utf8', timeout: 300000 })
      return { id, out: outp.trim().split('\n').slice(-1)[0] }
    }
    await sleep(150)
  }
  return null
}

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
// v0.16.0: sentence-case labels, with explicit failures for missing controls.
async function clickText(label, selector = 'button') {
  await page.evaluate((label, selector) => {
    const button = [...document.querySelectorAll(selector)].find(b =>
      (b.getAttribute('aria-label') || b.innerText).trim().toLowerCase() === label.toLowerCase())
    if (!button) throw new Error(`Button not found: "${label}" (${selector})`)
    button.click()
  }, label, selector)
}
// The rail exists only for 2+ chats; otherwise open the header list.
async function showChats() {
  await page.waitForSelector('.chat-panel', { timeout: 15000 })
  await page.waitForFunction(() => !document.querySelector('.chat-empty') || !/loading/i.test(document.querySelector('.chat-empty').innerText))
  if (!(await page.$('.chat-rail')) && !(await page.$('.chat-menu-pop'))) await page.click('.chat-menu-btn')
  await page.waitForSelector('.chat-rail, .chat-menu-pop')
  await page.waitForFunction(() => ![...document.querySelectorAll('.chat-rail-empty')].some(e => /loading/i.test(e.innerText)))
}
async function newChat() {
  await showChats()
  await clickText('New chat', '.chat-rail-new')
}
async function chatAction(title, action) {
  await showChats()
  await page.evaluate(title => {
    const row = [...document.querySelectorAll('.chat-row')].find(r => r.querySelector('.chat-row-title')?.innerText.includes(title))
    if (!row) throw new Error(`Chat not found: "${title}"`)
    const button = row.querySelector('.chat-row-more')
    if (!button) throw new Error(`Options button not found for chat: "${title}"`)
    button.click()
  }, title)
  await page.waitForSelector('.sched-menu [role=menuitem]')
  await clickText(action, '.sched-menu [role=menuitem]')
}
async function setSearch(label, on) {
  await page.click('.mascot-searchpick')
  const selector = `.searchpick-pop [role="switch"][aria-label="${label}"]`
  await page.waitForSelector(selector)
  if (await page.$eval(selector, b => b.getAttribute('aria-checked')) !== String(on)) await page.click(selector)
  await page.waitForFunction((selector, on) => document.querySelector(selector)?.getAttribute('aria-checked') === String(on), {}, selector, on)
  await page.keyboard.press('Escape')
}

try {
  await page.setViewport({ width: 1280, height: 900 })
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  page.on('dialog', d => d.accept())
  await page.goto(base, { waitUntil: 'networkidle2' })
  await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
  await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
  const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
  const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
  await clickText('Projects', '.side-item')
  await page.waitForSelector('.project-card', { timeout: 15000 }); await (await page.$('.project-card')).click()
  await page.waitForSelector('#engineers', { timeout: 15000 })

  // Sidebar
  const items = await page.$$eval('.sidebar-nav .side-item', l => l.map(e => e.innerText.trim()))
  check('the Research page is gone from the project menu', !items.some(t => t.toLowerCase() === 'research'), items.join(' | '))
  check('"Person lookup" is in the project menu', items.some(t => t.toLowerCase() === 'person lookup'))
  await clickText('Person lookup', '.side-item')
  const lookupOk = await page.waitForSelector('.lookup, .person-lookup, [aria-label*="erson"]', { timeout: 8000 }).then(() => true).catch(() => false)
  check('"Person lookup" opens the person lookup', lookupOk)

  await clickText('Agent', '.side-item')
  await page.waitForSelector('.chat-full', { timeout: 15000 })
  await page.waitForNetworkIdle({ idleTime: 800 }).catch(() => {})
  let created = false
  try {
    await newChat(); await sleep(400)
    await setSearch('Deep research', true)
    const on = await page.$eval('.mascot-searchpick', b => String(b.classList.contains('is-research')))
    check('the Deep research toggle turns on', on === 'true')
    // Removed the hidden Search toggle check: v0.16.0 keeps Web search visible and locked on in Search settings.
    await page.click('.mascot-searchpick')
    await page.waitForSelector('.searchpick-pop [aria-label="Web search"]')
    check('Deep research locks Web search on', await page.$eval('.searchpick-pop [aria-label="Web search"]', b => b.disabled && b.getAttribute('aria-checked') === 'true'))
    await page.keyboard.press('Escape')
    const ph = await page.$eval('#chat-input', e => e.placeholder)
    check('the box says it will research', /research/i.test(ph), ph)

    const since = new Date(Date.now() - 5000).toISOString()
    await page.type('#chat-input', `[${STAMP}] Who founded Spotify, and in what year? Keep it to 2 sentences.`)
    created = true // Sending can create the chat before the harness or wait fails.
    await page.keyboard.press('Enter')
    const run1 = await runOnHarness(owner, 'research', since)
    check('the message started a research job (kind=research)', !!run1, run1?.out)
    await page.waitForFunction(() => document.querySelector('.chat-full .chat-research .research-answer'), { timeout: 60000 }).catch(() => {})
    const ans1 = await page.$eval('.chat-full .chat-research', e => e.innerText).catch(() => '')
    const src1 = await page.$$eval('.chat-full .chat-research .research-sources li', l => l.length).catch(() => 0)
    check('the cited answer appears in the chat', /Ek|Lorentzon/.test(ans1), ans1.replace(/\n+/g, ' ').slice(0, 140))
    check('it lists its sources', src1 > 0, `${src1} sources`)
    await showChats()
    const row = await page.$$eval('.chat-row', l => l[0]?.innerText.replace(/\n/g, ' · '))
    check('the chat is marked "Deep research" in the list', /Deep research/i.test(row || ''), row)
    await page.screenshot({ path: `${out}/v0150-5-research-answer.png` })

    // Follow-up: only answerable with the first answer as context.
    const since2 = new Date(Date.now() - 2000).toISOString()
    await page.type('#chat-input', `[${STAMP}] How old was the younger of those two founders that year?`)
    await page.keyboard.press('Enter')
    const run2 = await runOnHarness(owner, 'research', since2)
    check('the follow-up ran as research in the same chat', !!run2, run2?.out)
    await page.waitForFunction(() => document.querySelectorAll('.chat-full .chat-research').length >= 2, { timeout: 60000 }).catch(() => {})
    const ans2 = await page.$$eval('.chat-full .chat-research', l => l.at(-1)?.innerText || '')
    check('the follow-up answer uses the first answer (names a founder and an age)', /Ek|Lorentzon/.test(ans2) && /\b(2[0-9]|3[0-9])\b/.test(ans2), ans2.replace(/\n+/g, ' ').slice(0, 160))
    await page.screenshot({ path: `${out}/v0150-6-research-followup.png`, fullPage: false })

    // Worker-side proof: the second job's prompt carried the chat.
    const jobs = await (await rest(`jobs?owner_id=eq.${owner}&kind=eq.research&created_at=gte.${encodeURIComponent(since)}&select=id,payload,status&order=created_at.asc`)).json()
    check('both jobs carry the chat id and finished', jobs.length === 2 && jobs.every(j => j.payload.chat_id && j.status === 'done'), jobs.map(j => j.status).join(','))
  } finally {
    if (created) {
      await showChats()
      if (await page.$$eval('.chat-row-title', (l, s) => l.some(e => e.innerText.includes(s)), STAMP)) { await chatAction(STAMP, 'Delete'); await sleep(1500) }
      await showChats()
      const left = await page.$$eval('.chat-row-title', l => l.map(e => e.innerText))
      check('cleanup: research chat deleted', !left.some(t => t.includes(STAMP)))
    }
  }
  check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 200))
} finally {
  await browser.close()
}
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
