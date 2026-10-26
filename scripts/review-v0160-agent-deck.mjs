// v0.16.0 The agent edits the case artifacts. TEST account. Three real agent
// runs on the NEW worker code (VPS harness: copy worker/worker.py into
// /home/casebuilder/worker-harness first; the caller stops the live worker for
// the run, as for the v0.15.0 reviews).
//   1) "Change the title page heading to <STAMP> Platform case" -> a change card,
//      the deck in the database and the Live room show the new heading
//   2) follow-up "Add a page after the title with three bullet points on the
//      rollout plan" -> a new page 2 with 3 bullets
//   3) "Make the background white" -> brand.background #ffffff
//   4) Undo on reply 2 -> the page is gone, the title change and white background stay
//   5) cleanup: the project's deck, brand and agentLog are restored from a snapshot
//      taken at the start (service key, deals row), and the test chat is deleted
// Usage: node scripts/review-v0160-agent-deck.mjs [base-url]
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
const check = (n, ok, x = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const STAMP = Date.now().toString(36)

async function runOnHarness(owner, since) {
  for (let i = 0; i < 60; i++) {
    const r = await rest(`jobs?owner_id=eq.${owner}&status=eq.queued&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=1`, {
      method: 'PATCH', body: JSON.stringify({ status: 'running', locked_by: 'harness', locked_at: new Date().toISOString(), attempts: 1 }), headers: { Prefer: 'return=representation' } })
    const rows = r.ok ? await r.json() : []
    if (rows.length) {
      const o = execFileSync('ssh', ['casebuilder-vps', `sudo -u casebuilder bash -c 'cd /home/casebuilder/worker-harness && set -a && . /home/casebuilder/worker/worker.env && set +a && python3 handle_one.py ${rows[0].id}'`], { encoding: 'utf8', timeout: 300000 })
      return { job: rows[0], out: o.trim().split('\n').at(-1) }
    }
    await sleep(200)
  }
  return null
}

const dealRow = async id => (await (await rest(`deals?id=eq.${id}&select=data`)).json())[0]?.data
// Poll the saved deal until `test` holds (the app saves ~600 ms after a change).
async function dealUntil(id, test, ms = 15000) {
  let d
  for (const t0 = Date.now(); Date.now() - t0 < ms; await sleep(500)) { d = await dealRow(id); if (d && test(d)) return d }
  return d
}
const texts = s => (s?.blocks || []).filter(b => b.type === 'text').map(b => String(b.text || ''))
const bullets = s => texts(s).flatMap(t => t.split('\n')).filter(l => /^\s*[-•]\s+\S/.test(l)).length

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
await nav('Agent'); await page.waitForSelector('.chat-panel[data-deal]', { timeout: 15000 })
const dealId = await page.$eval('.chat-panel[data-deal]', e => e.dataset.deal)
const chatsBefore = (await (await rest(`chats?deal_id=eq.${dealId}&select=id`)).json()).map(c => c.id)
const snapshot = await dealRow(dealId)
const before = { deck: snapshot.deck, brand: snapshot.brand, agentLog: snapshot.agentLog }
fs.writeFileSync(`${out}/v0160-agent-deck-snapshot-${dealId}.json`, JSON.stringify(before))
const startIds = new Set(snapshot.deck.map(s => s.id))

const replies = () => page.$$('.chat-full .chat-assistant:not(:has(.chat-typing))')
async function ask(text) {
  // Follow-ups stay in the same chat: the agent sees the earlier replies and the current deck.
  const n = (await replies()).length
  await page.type('.chat-panel textarea', text)
  const since = new Date(Date.now() - 3000).toISOString()
  await page.keyboard.press('Enter')
  const run = await runOnHarness(owner, since)
  await page.waitForFunction(k => document.querySelectorAll('.chat-full .chat-assistant:not(:has(.chat-typing))').length > k, { timeout: 60000 }, n).catch(() => {})
  await sleep(800)
  const all = await replies()
  return { run, reply: all.at(-1), card: await all.at(-1)?.$eval('.chat-changes', e => e.innerText).catch(() => '') }
}

try {
  // 1) the title page heading
  await page.click('.chat-head button[aria-label="New chat"]'); await sleep(300)
  const heading = `${STAMP} Platform case`
  let r = await ask(`Change the title page heading to ${heading}`)
  check('reply 1 ran on the harness', !!r.run, r.run?.out)
  check('reply 1 shows a change card for the case', /Changed the case/i.test(r.card), r.card.replace(/\n+/g, ' | ').slice(0, 160))
  check('reply 1 never shows JSON or ids', !/casebuilder-deck|slide_id|block_id|"op"/.test(await r.reply.evaluate(e => e.innerText)))
  let d = await dealUntil(dealId, x => texts(x.deck[0]).some(t => t.includes(heading)))
  check('the saved deck has the new heading on page 1', texts(d.deck[0]).some(t => t.includes(heading)), texts(d.deck[0]).join(' / ').slice(0, 120))
  await r.reply.evaluate(e => [...e.querySelectorAll('.chg-actions button')].find(b => b.innerText === 'View').click())
  await page.waitForSelector('iframe[title="Live Room"]', { timeout: 15000 })
  await sleep(1500)
  const room = await page.$eval('iframe[title="Live Room"]', f => f.srcdoc || '')
  check('"View" opens Case artifacts with the new heading', room.includes(STAMP))
  await page.screenshot({ path: `${out}/v0160-agent-deck-1-live-room.png` })
  await nav('Agent'); await page.waitForSelector('.chat-full', { timeout: 15000 }); await sleep(800)

  // 2) a follow-up in the same chat: a new page after the title
  r = await ask('Add a page after the title with three bullet points on the rollout plan')
  check('reply 2 ran on the harness', !!r.run, r.run?.out)
  check('reply 2 shows a change card', /Changed the case/i.test(r.card) && /Added a page/.test(r.card), r.card.replace(/\n+/g, ' | ').slice(0, 160))
  d = await dealUntil(dealId, x => x.deck.length === snapshot.deck.length + 1)
  const added = d.deck[1]
  check('a new page sits after page 1', d.deck.length === snapshot.deck.length + 1 && added && !startIds.has(added.id), `${d.deck.length} pages`)
  check('the new page has 3 bullet points', bullets(added) === 3, texts(added).join(' / ').slice(0, 160))
  check('the title change is still there', texts(d.deck[0]).some(t => t.includes(heading)))

  // 3) the brand
  r = await ask('Make the background white')
  check('reply 3 ran on the harness', !!r.run, r.run?.out)
  d = await dealUntil(dealId, x => String(x.brand?.background).toLowerCase() === '#ffffff')
  check('brand.background is #ffffff', String(d.brand?.background).toLowerCase() === '#ffffff', d.brand?.background)
  check('reply 3 card names the background', /Background/.test(r.card), r.card.replace(/\n+/g, ' | ').slice(0, 120))
  await page.screenshot({ path: `${out}/v0160-agent-deck-2-chat.png` })

  // 4) Undo on reply 2 only
  const all = await replies()
  const second = all.at(-2)
  await second.evaluate(e => [...e.querySelectorAll('.chg-actions button')].find(b => b.innerText === 'Undo').click())
  await sleep(500)
  check('reply 2 card says Undone', /Undone/i.test(await second.$eval('.chat-changes', e => e.innerText).catch(() => '')))
  d = await dealUntil(dealId, x => x.deck.length === snapshot.deck.length)
  check('after Undo the added page is gone', d.deck.length === snapshot.deck.length && d.deck.every(s => startIds.has(s.id)), `${d.deck.length} pages`)
  check('after Undo the title change stays', texts(d.deck[0]).some(t => t.includes(heading)))
  check('after Undo the white background stays', String(d.brand?.background).toLowerCase() === '#ffffff')
  await page.screenshot({ path: `${out}/v0160-agent-deck-3-undone.png` })
} finally {
  // Let the app finish saving, close it so it cannot save over the restore, then restore.
  await page.waitForFunction(() => /Saved/.test(document.querySelector('[role=status]')?.innerText || ''), { timeout: 10000 }).catch(() => {})
  await browser.close()
  const now = (await (await rest(`deals?id=eq.${dealId}&select=data`)).json())[0]?.data
  const res = await rest(`deals?id=eq.${dealId}`, { method: 'PATCH', body: JSON.stringify({ data: { ...now, ...before, updatedAt: Date.now() } }) })
  const back = await dealRow(dealId)
  const after = (await (await rest(`chats?deal_id=eq.${dealId}&select=id`)).json()).map(c => c.id)
  const mine = after.filter(id => !chatsBefore.includes(id))
  for (const id of mine) await rest(`chats?id=eq.${id}`, { method: 'DELETE' })
  check('cleanup: deck and brand restored from the snapshot, test chat deleted',
    res.ok && JSON.stringify(back?.deck) === JSON.stringify(before.deck) && JSON.stringify(back?.brand) === JSON.stringify(before.brand) && mine.length === 1,
    `${res.status}, ${mine.length} chat removed`)
}
check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 200))
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
