// The Agent sees the project's research: run a research question in the project,
// then ask the Agent about it with Search off. The reply must use the research
// answer and the trace must list "Read earlier research". TEST account, real worker.
// Usage: node scripts/review-chat-sees-research.mjs [base-url]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({ headless: 'new', protocolTimeout: 600000 })
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
  await page.click('button[type=submit]')
  await page.waitForSelector('.dashboard', { timeout: 20000 })
  await page.click('.side-item[aria-label="Projects"]')
  await page.waitForSelector('.project-card', { timeout: 15000 }); await page.waitForNetworkIdle({ idleTime: 800 })
  const i = await page.$$eval('.project-card', cs => cs.findIndex(c => /Spotify/.test(c.innerText)))
  await (await page.$$('.project-card'))[Math.max(0, i)].click()
  // v0.15.0: research happens in a Deep research chat; the agent in ANOTHER chat
  // of the same project must still see it.
  const STAMP = Date.now().toString(36)
  await page.waitForSelector('.side-item[aria-label="Agent"]')
  await page.click('.side-item[aria-label="Agent"]')
  await page.waitForSelector('.chat-full', { timeout: 15000 }); await page.waitForNetworkIdle({ idleTime: 800 }).catch(() => {})
  try {
  // 1. Deep research in a new chat.
  await newChat(); await sleep(300)
  await setSearch('Deep research', true)
  const Q = `[${STAMP}] When was Spotify founded and who founded it?`
  await page.type('#chat-input', Q); await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('.chat-full .chat-research .research-answer'), { timeout: 240000 })
  await sleep(1000)
  const answer = await page.$eval('.chat-full .chat-research', e => e.innerText).catch(() => '')
  check('research answered in a Deep research chat', /2006|Ek|Lorentzon/i.test(answer), answer.slice(0, 140).replace(/\n/g, ' '))

  // 2. A different, new chat: Search off, ask about it.
  await newChat(); await sleep(300)
  await setSearch('Deep research', false)
  await setSearch('Web search', false)
  const n = await page.$$eval('.chat-assistant:not(:has(.chat-typing))', l => l.length)
  await page.type('#chat-input', `[${STAMP}] Can you see the research I did in this project? What did it find about who founded Spotify? Do not change any inputs.`)
  await page.keyboard.press('Enter')
  await page.waitForSelector('.chat-typing', { timeout: 15000 })
  await page.waitForFunction(n => !document.querySelector('.chat-typing') && document.querySelectorAll('.chat-assistant:not(:has(.chat-typing))').length > n, { timeout: 240000 }, n)
  const reply = await page.evaluate(() => {
    const last = [...document.querySelectorAll('.chat-assistant:not(:has(.chat-typing))')].pop()
    last.querySelector('.trace-summary')?.click()
    return last.querySelector('.chat-bubble').innerText
  })
  await sleep(300)
  const steps = await page.evaluate(() => [...[...document.querySelectorAll('.chat-assistant')].pop().querySelectorAll('.trace-step-title')].map(e => e.innerText))
  check('Agent answers from the research (Search off)', /Ek|Lorentzon/i.test(reply) && !/can't see|cannot see|don't see/i.test(reply), reply.slice(0, 200).replace(/\n/g, ' '))
  check('trace shows it read the earlier research', steps.some(s => /Read earlier research/i.test(s)), steps.join(' | '))
  await page.screenshot({ path: '/tmp/cb-review/8-chat-sees-research.png' })
  } finally {
  // Cleanup: delete the two chats this made.
  for (let k = 0; k < 2; k++) {
    await showChats()
    const row = await page.evaluateHandle(s => [...document.querySelectorAll('.chat-row')].find(r => r.innerText.includes(s)), STAMP)
    const el = row.asElement(); if (!el) break
    await chatAction(STAMP, 'Delete'); await sleep(1200)
  }
  await showChats()
  check('cleanup: test chats deleted', !(await page.$$eval('.chat-row-title', (l, st) => l.some(e => e.innerText.includes(st)), STAMP)))
  }
  check('no page errors', errors.length === 0, errors.join(' | '))
} finally {
  await browser.close()
}
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
