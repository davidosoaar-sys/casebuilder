// Real end-to-end check of the project Files tab on the TEST account:
// upload a real PDF, Word doc, PowerPoint and Excel file through the browser,
// check each was read, save instructions, then ask the real agent questions
// only those files can answer. Cleans the files up at the end.
// Usage: node scripts/make-file-fixtures.mjs /tmp/cb-files && node scripts/review-files.mjs [base-url]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const DIR = '/tmp/cb-files'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const FILES = fs.readdirSync(DIR).map(f => `${DIR}/${f}`)

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
page.on('response', async r => { if (r.status() >= 400 && /supabase/.test(r.url())) errors.push(`${r.status()} ${r.url().split('?')[0]} ${(await r.text().catch(() => '')).slice(0, 160)}`) })
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]')
await page.waitForSelector('.dashboard', { timeout: 20000 })
await page.click('.side-item[aria-label="Projects"]')
await page.waitForSelector('.project-card', { timeout: 15000 }); await (await page.$('.project-card')).click()
await page.waitForSelector('.side-item[aria-label="Files"]')
await page.click('.side-item[aria-label="Files"]')
await page.waitForSelector('.pf-page .pf-drop')
await page.waitForFunction(() => !/Loading/.test(document.querySelector('.pf-page')?.innerText || ''))

// Clean slate: remove files left by an earlier run.
for (let i = 0; i < 60; i++) { const b = await page.$('.pf-card-actions .icon-btn'); if (!b) break; await b.click(); await sleep(400) }

// Upload: three as Context, the deck as Deck inspiration.
const input = await page.$('.pf-drop input[type=file]')
await input.uploadFile(...FILES.filter(f => !f.endsWith('.pptx')))
await page.waitForFunction(n => document.querySelectorAll('.pf-card').length >= n, { timeout: 30000 }, 3)
await page.select('.pf-kind select', 'deck_inspiration')
await input.uploadFile(FILES.find(f => f.endsWith('.pptx')))
await page.waitForFunction(() => document.querySelectorAll('.pf-card').length >= 4, { timeout: 30000 })
const cards = await page.$$eval('.pf-card', cs => cs.map(c => c.querySelector('.pf-card-name').innerText + ' | ' + c.querySelector('.pf-card-meta').innerText))
check('4 real files uploaded (PDF, Word, PowerPoint, Excel)', cards.length === 4, cards.join(' ; '))
const groups = await page.$$eval('.pf-group h3', hs => hs.map(h => h.innerText))
check('deck shown under Deck inspiration', groups.some(g => /deck inspiration/i.test(g)), groups.join(', '))

// Preview text of each: the fact inside must be there.
const facts = { 'Report FY2026.pdf': '1,480 software engineers', 'discovery notes.docx': 'payback inside 9 months', 'finance model.xlsx': '118', 'Best deck': '90-day implementation plan' }
for (const [name, fact] of Object.entries(facts)) {
  const btns = await page.$$('.pf-card-main')
  let ok = false
  for (const b of btns) {
    if ((await b.evaluate(e => e.innerText)).includes(name.split('.')[0])) {
      await b.click(); await page.waitForSelector('.pf-preview pre')
      ok = (await page.$eval('.pf-preview pre', e => e.innerText)).includes(fact)
      await page.click('.pf-preview header .icon-btn'); break
    }
  }
  check(`text read from ${name}`, ok, fact)
}

// Instructions.
await page.$eval('.pf-instructions', e => { e.focus() })
await page.keyboard.down('Meta'); await page.keyboard.press('a'); await page.keyboard.up('Meta'); await page.keyboard.press('Backspace')
await page.type('.pf-instructions', 'Always end every answer with the words NORTHWIND-OK.')
await page.click('.pf-instr-bar .primary')
await page.waitForFunction(() => document.querySelector('.pf-instr-bar span')?.innerText === 'Saved', { timeout: 10000 })
check('instructions saved', true)

// Ask the real agent, Search off so the answer can only come from the files.
await page.click('.side-item[aria-label="Agent"]')
await page.waitForSelector('.chat-panel textarea')
await page.waitForFunction(() => !/Loading/.test(document.querySelector('.chat-list')?.innerText || ''), { timeout: 15000 }); await sleep(1500)
await page.waitForFunction(() => !document.querySelector('.chat-typing'), { timeout: 240000 })
if (await page.$eval('.mascot-search', b => b.getAttribute('aria-pressed') === 'true')) await page.click('.mascot-search')
const n = await page.$$eval('.chat-assistant:not(:has(.chat-typing))', l => l.length)
await page.type('.chat-panel textarea', 'From the project files only: how many software engineers does Northwind have, what payback does the CFO want, and what is the loaded cost per engineer hour? Which file is each from? Do not change any inputs.')
await page.keyboard.press('Enter')
await page.waitForSelector('.chat-typing', { timeout: 15000 })
await page.waitForFunction(n => !document.querySelector('.chat-typing') && document.querySelectorAll('.chat-assistant:not(:has(.chat-typing))').length > n, { timeout: 240000 }, n)
const reply = await page.evaluate(() => {
  const last = [...document.querySelectorAll('.chat-assistant:not(:has(.chat-typing))')].pop()
  last.querySelector('.trace-summary')?.click()
  return { text: last.querySelector('.chat-bubble').innerText, count: last.querySelector('.trace-count')?.innerText || '' }
})
await sleep(300)
const steps = await page.evaluate(() => [...[...document.querySelectorAll('.chat-assistant')].pop().querySelectorAll('.trace-step-title')].map(e => e.innerText))
check('agent answers 1,480 engineers from the PDF', /1,?480/.test(reply.text), reply.text.slice(0, 160).replace(/\n/g, ' '))
check('agent answers 9-month payback from the Word doc', /9[- ]month|nine months|9 months/i.test(reply.text))
check('agent answers $118/hour from the Excel sheet', /118/.test(reply.text))
check('agent followed the project instructions', /NORTHWIND-OK/.test(reply.text))
check('trace shows the files it read', steps.filter(s => /^Read /.test(s)).length >= 4, `${reply.count}: ${steps.join(' | ')}`)
await page.screenshot({ path: '/tmp/cb-shots/files-chat.png' })

// Clean up.
await page.click('.side-item[aria-label="Files"]'); await page.waitForSelector('.pf-page .pf-drop'); await sleep(1500)
await page.screenshot({ path: '/tmp/cb-shots/files-1440.png', fullPage: true })
await page.setViewport({ width: 390, height: 844 }); await sleep(300)
check('Files page has no horizontal overflow at 390', !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)))
await page.screenshot({ path: '/tmp/cb-shots/files-390.png', fullPage: true })
await page.setViewport({ width: 1440, height: 900 })
for (let i = 0; i < 60; i++) { const b = await page.$('.pf-card-actions .icon-btn'); if (!b) break; await b.click(); await sleep(400) }
await page.$eval('.pf-instructions', e => e.focus())
await page.keyboard.down('Meta'); await page.keyboard.press('a'); await page.keyboard.up('Meta'); await page.keyboard.press('Backspace')
await page.click('.pf-instr-bar .primary'); await sleep(1000)
check('cleaned up', (await page.$$('.pf-card')).length === 0)
check('no page errors or failed Supabase calls', errors.length === 0, errors.slice(0, 3).join(' | '))
await browser.close()
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
