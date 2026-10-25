// "Show older chats": seed 55 empty chats on the TEST account's first project,
// check the list shows 50 + a "Show older chats" button that loads the rest, then
// delete the seeded chats. No agent jobs.
// Usage: node scripts/review-v0150-older-chats.mjs [base-url]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const W = envFile(`${os.homedir()}/.config/casebuilder/worker.env`)
const H = { apikey: W.SUPABASE_SECRET_KEY, Authorization: `Bearer ${W.SUPABASE_SECRET_KEY}`, 'Content-Type': 'application/json' }
const rest = (path, init = {}) => fetch(`${W.SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } })
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const TAG = `Seeded ${Date.now().toString(36)}`

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 860 })
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
const [projects] = await page.$$('xpath/.//button[contains(., "Projects")]'); await projects.click()
await page.waitForSelector('.project-card', { timeout: 15000 }); await (await page.$('.project-card')).click()
await page.waitForSelector('#engineers', { timeout: 15000 })
// The project the UI opens first = the one whose chat the review saw ("Earlier chat", 4 messages).
await page.click('.side-item[aria-label="Agent"]').catch(async () => { const [x] = await page.$$('xpath/.//button[contains(., "Agent")]'); await x?.click() })
await page.waitForSelector('.chat-rail .chat-row', { timeout: 15000 })
const openDeal = await page.$eval('.chat-panel[data-deal]', e => e.dataset.deal)
const users = await (await fetch(`${W.SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: H })).json()
const owner = users.users.find(u => u.email === 'test@casebuilder.dev').id
const mine = await (await rest(`chats?select=id,deal_id&owner_id=eq.${owner}`)).json()
const target = { owner_id: owner, deal_id: openDeal }
console.log('project', target.deal_id)
try {
  if (!target) throw new Error('could not identify the open project')
  const rows = Array.from({ length: 55 }, (_, i) => ({ deal_id: target.deal_id, owner_id: target.owner_id, title: `${TAG} ${String(i).padStart(2, '0')}` }))
  const r = await rest('chats', { method: 'POST', body: JSON.stringify(rows), headers: { Prefer: 'return=minimal' } })
  check('seeded 55 chats', r.ok, String(r.status))
  // Reopen the list: switch to another chat and back is not needed; a reload re-reads it.
  await page.reload({ waitUntil: 'networkidle2' })
  await page.waitForSelector('.dashboard, #engineers, .chat-rail', { timeout: 20000 })
  if (!(await page.$('.chat-rail'))) {
    if (!(await page.$('#engineers'))) {
      const [pr] = await page.$$('xpath/.//button[contains(., "Projects")]'); await pr.click()
      await page.waitForSelector('.project-card', { timeout: 15000 }); await (await page.$('.project-card')).click()
      await page.waitForSelector('#engineers', { timeout: 15000 })
    }
    await page.click('.side-item[aria-label="Agent"]').catch(async () => { const [x] = await page.$$('xpath/.//button[contains(., "Agent")]'); await x?.click() })
  }
  await page.waitForSelector('.chat-rail .chat-row', { timeout: 20000 })
  await page.waitForNetworkIdle({ idleTime: 800 }).catch(() => {})
  const nowDeal = await page.$eval('.chat-panel[data-deal]', e => e.dataset.deal)
  check('reopened the same project', nowDeal === target.deal_id, nowDeal)
  const first = await page.$$eval('.chat-rail .chat-row', l => l.length)
  const btn = await page.$('.chat-rail .chat-older')
  check('the list shows the newest 50 and a "Show older chats" button', first === 50 && !!btn, `${first} rows`)
  await btn?.click(); await page.waitForNetworkIdle({ idleTime: 800 }).catch(() => {})
  const all = await page.$$eval('.chat-rail .chat-row', l => l.length)
  check('"Show older chats" loads the rest, and the button goes away', all >= 56 && !(await page.$('.chat-rail .chat-older')), `${all} rows`)
} finally {
  const d = await rest(`chats?title=like.${encodeURIComponent(TAG)}*`, { method: 'DELETE', headers: { Prefer: 'return=representation' } })
  const gone = d.ok ? (await d.json()).length : 0
  check('cleanup: seeded chats deleted', gone === 55, `${gone}`)
}
await browser.close()
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
