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

try {
  await page.setViewport({ width: 1280, height: 860 })
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  page.on('response', async r => { if (r.status() >= 400 && /supabase/.test(r.url())) errors.push(`${r.status()} ${r.url().split('?')[0].split('/').slice(-2).join('/')} ${(await r.text().catch(() => '')).slice(0, 120)}`) })
  page.on('dialog', d => d.accept())
  const rows = async () => { await showChats(); return page.$$eval('.chat-row-title', l => l.map(e => e.innerText)) }
  const bubbles = () => page.$$eval('.chat-full .chat-msg .chat-bubble', l => l.map(e => e.innerText))

  await page.goto(base, { waitUntil: 'networkidle2' })
  await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForSelector('.dashboard', { timeout: 20000 })
  async function openAgent() {
    await page.waitForSelector('.dashboard, #engineers, .chat-full', { timeout: 20000 })
    if (!(await page.$('.chat-full'))) {
      if (!(await page.$('#engineers'))) {
        // Open the project that has the migrated "Earlier chat" (Spotify sample), not
        // whichever project happens to be newest.
        await clickText('Projects', '.side-item')
        await page.waitForSelector('.project-card', { timeout: 15000 })
        const card = await page.evaluateHandle(() => [...document.querySelectorAll('.project-card')].find(c => /spotify/i.test(c.innerText)))
        if (!card.asElement()) throw new Error('Project card not found: Spotify')
        await card.asElement().click()
        await page.waitForSelector('#engineers', { timeout: 15000 })
      }
      await clickText('Agent', '.side-item')
      await page.waitForSelector('.chat-full', { timeout: 15000 })
    }
    await page.waitForFunction(() => !document.querySelector('.chat-rail-empty') || !/Loading/i.test(document.querySelector('.chat-rail-empty').innerText), { timeout: 15000 })
    await page.waitForNetworkIdle({ idleTime: 800 }).catch(() => {})
  }
  await openAgent()

  let created = false
  try {
    const before = await rows()
    check('full-page agent shows a chat list', before.length >= 1, `${before.length} chats: ${before.slice(0, 3).join(' | ')}`)
    check('existing messages were kept as "Earlier chat"', before.some(t => /^earlier chat$/i.test(t)))
    const oldCount = (await bubbles()).length
    await page.screenshot({ path: `${out}/v0150-2-chat-list.png` })

    await newChat(); await sleep(500)
    check('"New chat" opens an empty chat', (await bubbles()).length === 0, `was ${oldCount} messages`)

    await page.type('#chat-input', `${STAMP}: reply with just the word OK.`)
    created = true // Cleanup must also run if sending or waiting fails.
    await page.keyboard.press('Enter')
    await page.waitForFunction(s => [...document.querySelectorAll('.chat-row-title')].some(e => e.innerText.startsWith(s)), { timeout: 15000 }, STAMP)
    const after = await rows()
    check('the first message creates a chat titled from it, at the top', after[0]?.startsWith(STAMP), after[0])
    // Wait for the agent's reply in this chat.
    await page.waitForFunction(() => document.querySelectorAll('.chat-full .chat-assistant .chat-bubble:not(.chat-typing)').length > 0, { timeout: 240000 })
    const mine = await bubbles()
    check('the reply lands in the new chat', mine.length === 2, mine.map(b => b.slice(0, 40)).join(' / '))

    // Switch to the earlier chat and back: each shows only its own messages.
    await showChats()
    await clickText('Earlier chat', '.chat-row-title')
    await page.waitForFunction(n => document.querySelectorAll('.chat-full .chat-msg .chat-bubble').length === n, { timeout: 15000 }, oldCount).catch(() => {})
    const old = await bubbles()
    check('switching to the earlier chat shows its own messages only', old.length === oldCount && !old.some(b => b.includes(STAMP)), `${old.length} messages`)
    await showChats()
    await clickText(after[0], '.chat-row-title')
    await page.waitForFunction(() => document.querySelectorAll('.chat-full .chat-msg .chat-bubble').length === 2, { timeout: 15000 }).catch(() => {})
    check('switching back shows the new chat again', (await bubbles()).length === 2)

    // Rename inline.
    await chatAction(STAMP, 'Rename')
    await page.waitForSelector('.chat-row.is-editing input')
    await page.evaluate(() => { const i = document.querySelector('.chat-row.is-editing input'); i.select() })
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
    await page.click('button[aria-label="Full page"]'); await page.waitForSelector('.chat-full', { timeout: 10000 })
  } finally {
    if (created) {
      await openAgent().catch(() => {})
      await showChats()
      if ((await rows()).some(t => t.startsWith(STAMP))) { await chatAction(STAMP, 'Delete'); await sleep(1500) }
      const left = await rows()
      check('delete removes the chat from the list', left.length > 0 && !left.some(t => t.startsWith(STAMP)), `${left.length} chats left`)
    }
  }
  check('no page errors or failed database calls', errors.length === 0, errors.join(' | ').slice(0, 300))
} finally {
  await browser.close()
}
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
