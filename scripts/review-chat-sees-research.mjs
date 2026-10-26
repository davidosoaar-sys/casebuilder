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

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
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
await page.waitForSelector('.chat-rail', { timeout: 15000 }); await page.waitForNetworkIdle({ idleTime: 800 }).catch(() => {})
// 1. Deep research in a new chat.
await page.click('.chat-rail-new'); await sleep(300)
await page.click('.mascot-research')
const Q = `[${STAMP}] When was Spotify founded and who founded it?`
await page.type('#chat-input', Q); await page.keyboard.press('Enter')
await page.waitForFunction(() => document.querySelector('.chat-full .chat-research .research-answer'), { timeout: 240000 })
await sleep(1000)
const answer = await page.$eval('.chat-full .chat-research', e => e.innerText).catch(() => '')
check('research answered in a Deep research chat', /2006|Ek|Lorentzon/i.test(answer), answer.slice(0, 140).replace(/\n/g, ' '))

// 2. A different, new chat: Search off, ask about it.
await page.click('.chat-rail-new'); await sleep(300)
if (await page.$eval('.mascot-research', b => b.getAttribute('aria-pressed') === 'true')) await page.click('.mascot-research')
if (await page.$eval('.mascot-search:not(.mascot-research)', b => b.getAttribute('aria-pressed') === 'true')) await page.click('.mascot-search:not(.mascot-research)')
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
check('trace shows it read the earlier research', steps.some(s => /Read earlier research/.test(s)), steps.join(' | '))
await page.screenshot({ path: '/tmp/cb-review/8-chat-sees-research.png' })
// Cleanup: delete the two chats this made.
for (let k = 0; k < 2; k++) {
  const row = await page.evaluateHandle(s => [...document.querySelectorAll('.chat-rail .chat-row')].find(r => r.innerText.includes(s)), STAMP)
  const el = row.asElement(); if (!el) break
  await el.hover(); await (await el.$('button[aria-label^="Delete"]')).click(); await sleep(1200)
}
check('cleanup: test chats deleted', !(await page.$$eval('.chat-rail .chat-row-title', (l, st) => l.some(e => e.innerText.includes(st)), STAMP)))
check('no page errors', errors.length === 0, errors.join(' | '))
await browser.close()
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
