// v0.15.0 chat history: the full-page agent shows a chat list; "New chat" starts an
// empty chat; the first message creates a chat titled from it; switching chats
// shows each chat's own messages; rename and delete work; split screen has the
// same list in a dropdown. TEST account. Sends ONE real message (one agent job).
// Cleans up: deletes the chat it created.
// Usage: node scripts/review-v0150-chats.mjs [base-url]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const out = '/tmp/cb-review'; fs.mkdirSync(out, { recursive: true })
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const STAMP = `Chat history check ${Date.now().toString(36)}`

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 860 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
page.on('response', async r => { if (r.status() >= 400 && /supabase/.test(r.url())) errors.push(`${r.status()} ${r.url().split('?')[0].split('/').slice(-2).join('/')} ${(await r.text().catch(() => '')).slice(0, 120)}`) })
page.on('dialog', d => d.accept())
const rows = () => page.$$eval('.chat-rail .chat-row-title', l => l.map(e => e.innerText))
const bubbles = () => page.$$eval('.chat-full .chat-msg .chat-bubble', l => l.map(e => e.innerText))

await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]')
await page.waitForSelector('.dashboard', { timeout: 20000 })
async function openAgent() {
  await page.waitForSelector('.dashboard, #engineers, .chat-rail', { timeout: 20000 })
  if (!(await page.$('.chat-rail'))) {
    if (!(await page.$('#engineers'))) {
      const [projects] = await page.$$('xpath/.//button[contains(., "Projects")]'); await projects.click()
      await page.waitForSelector('.project-card', { timeout: 15000 }); await (await page.$('.project-card')).click()
      await page.waitForSelector('#engineers', { timeout: 15000 })
    }
    await page.click('.side-item[aria-label="Agent"]').catch(async () => { const [a] = await page.$$('xpath/.//button[contains(., "Agent")]'); await a?.click() })
    await page.waitForSelector('.chat-rail', { timeout: 15000 })
  }
  await page.waitForFunction(() => !document.querySelector('.chat-rail-empty') || !/Loading/.test(document.querySelector('.chat-rail-empty').innerText), { timeout: 15000 })
  await page.waitForNetworkIdle({ idleTime: 800 }).catch(() => {})
}
await openAgent()

let created = false
try {
  const before = await rows()
  check('full-page agent shows a chat list', before.length >= 1, `${before.length} chats: ${before.slice(0, 3).join(' | ')}`)
  check('existing messages were kept as "Earlier chat"', before.includes('Earlier chat'))
  const oldCount = (await bubbles()).length
  await page.screenshot({ path: `${out}/v0150-2-chat-list.png` })

  await page.click('.chat-rail-new'); await sleep(500)
  check('"New chat" opens an empty chat', (await bubbles()).length === 0, `was ${oldCount} messages`)

  await page.type('#chat-input', `${STAMP}: reply with just the word OK.`)
  await page.keyboard.press('Enter')
  await page.waitForFunction(s => [...document.querySelectorAll('.chat-rail .chat-row-title')].some(e => e.innerText.startsWith(s)), { timeout: 15000 }, STAMP)
  created = true
  const after = await rows()
  check('the first message creates a chat titled from it, at the top', after[0]?.startsWith(STAMP), after[0])
  // Wait for the agent's reply in this chat.
  await page.waitForFunction(() => document.querySelectorAll('.chat-full .chat-assistant .chat-bubble:not(.chat-typing)').length > 0, { timeout: 240000 })
  const mine = await bubbles()
  check('the reply lands in the new chat', mine.length === 2, mine.map(b => b.slice(0, 40)).join(' / '))

  // Switch to the earlier chat and back: each shows only its own messages.
  await page.evaluate(() => [...document.querySelectorAll('.chat-rail .chat-row')].find(r => r.innerText.includes('Earlier chat')).querySelector('.chat-row-open').click())
  await page.waitForFunction(n => document.querySelectorAll('.chat-full .chat-msg .chat-bubble').length === n, { timeout: 15000 }, oldCount).catch(() => {})
  const old = await bubbles()
  check('switching to the earlier chat shows its own messages only', old.length === oldCount && !old.some(b => b.includes(STAMP)), `${old.length} messages`)
  await page.evaluate(s => [...document.querySelectorAll('.chat-rail .chat-row')].find(r => r.innerText.startsWith(s)).querySelector('.chat-row-open').click(), STAMP)
  await page.waitForFunction(() => document.querySelectorAll('.chat-full .chat-msg .chat-bubble').length === 2, { timeout: 15000 }).catch(() => {})
  check('switching back shows the new chat again', (await bubbles()).length === 2)

  // Rename inline.
  const row = await page.evaluateHandle(s => [...document.querySelectorAll('.chat-rail .chat-row')].find(r => r.innerText.startsWith(s)), STAMP)
  await row.hover(); await (await row.$('button[aria-label^="Rename"]')).click()
  await page.waitForSelector('.chat-rail .chat-row.is-editing input')
  await page.evaluate(() => { const i = document.querySelector('.chat-rail .chat-row.is-editing input'); i.select() })
  await page.keyboard.type(`${STAMP} renamed`); await page.keyboard.press('Enter'); await sleep(1200)
  await page.reload({ waitUntil: 'networkidle2' })
  await openAgent()
  await page.waitForFunction(() => document.querySelectorAll('.chat-full .chat-msg .chat-bubble').length > 0, { timeout: 15000 }).catch(() => {})
  const renamed = await rows()
  check('rename sticks after a reload', renamed.includes(`${STAMP} renamed`), renamed[0])
  check('after a reload the last-used chat is open', (await bubbles()).length === 2)
  await page.screenshot({ path: `${out}/v0150-3-chat-new.png` })

  // Split screen: same chats in a dropdown.
  await page.click('button[aria-label="Split screen"]')
  await page.waitForSelector('.chat-split .chat-menu-btn', { timeout: 10000 })
  await page.waitForFunction(s => document.querySelector('.chat-split .chat-menu-btn')?.innerText.startsWith(s), { timeout: 15000 }, STAMP).catch(() => {})
  const label = await page.$eval('.chat-split .chat-menu-btn', b => b.innerText)
  check('split screen opens on the same chat', label.startsWith(STAMP), label)
  await page.click('.chat-split .chat-menu-btn')
  await page.waitForSelector('.chat-menu-pop .chat-row-title', { timeout: 10000 }).catch(() => {})
  const menu = await page.$$eval('.chat-menu-pop .chat-row-title', l => l.map(e => e.innerText))
  check('split screen lists the same chats in a dropdown', menu.length === renamed.length, `${menu.length} chats`)
  await page.screenshot({ path: `${out}/v0150-4-chat-split-menu.png` })
  await page.keyboard.press('Escape')
  await page.click('button[aria-label="Full page"]'); await page.waitForSelector('.chat-rail', { timeout: 10000 })
} finally {
  if (created) {
    await openAgent().catch(() => {})
    const row = await page.evaluateHandle(s => [...document.querySelectorAll('.chat-rail .chat-row')].find(r => r.innerText.startsWith(s)), STAMP)
    const el = row.asElement()
    if (el) { await el.hover(); await (await el.$('button[aria-label^="Delete"]')).click(); await sleep(1500) }
    const left = await rows()
    check('delete removes the chat from the list', left.length > 0 && !left.some(t => t.startsWith(STAMP)), `${left.length} chats left`)
  }
}
check('no page errors or failed database calls', errors.length === 0, errors.join(' | ').slice(0, 300))
await browser.close()
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
