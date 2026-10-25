// Chat attachments: attach a real PDF and Excel file in the Agent composer and
// check the real agent answers from them (Search off). TEST account.
// Usage: node scripts/make-file-fixtures.mjs /tmp/cb-files && node scripts/review-chat-attach.mjs [base-url]
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
await page.setViewport({ width: 1280, height: 800 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]')
await page.waitForSelector('.dashboard', { timeout: 20000 })
await page.click('.side-item[aria-label="Projects"]')
await page.waitForSelector('.project-card', { timeout: 15000 }); await (await page.$('.project-card')).click()
await page.waitForSelector('.side-item[aria-label="Agent"]')
await page.click('.side-item[aria-label="Agent"]')
await page.waitForSelector('.chat-panel textarea')
await page.waitForFunction(() => !/Loading/.test(document.querySelector('.chat-list')?.innerText || ''), { timeout: 15000 }); await sleep(1500)
await page.waitForFunction(() => !document.querySelector('.chat-typing'), { timeout: 240000 })
if (await page.$eval('.mascot-search', b => b.getAttribute('aria-pressed') === 'true')) await page.click('.mascot-search')

const input = await page.$('.chat-panel input[type=file]')
await input.uploadFile('/tmp/cb-files/Northwind Financial Report FY2026.pdf', '/tmp/cb-files/Northwind finance model.xlsx')
await page.waitForFunction(() => document.querySelectorAll('.mascot-file').length >= 2, { timeout: 20000 }).catch(() => {})
const chips = await page.$$eval('.mascot-file', l => l.map(e => e.innerText.trim()))
const err = await page.$eval('.mascot-error', e => e.innerText).catch(() => '')
check('PDF and Excel attach in chat (no "text files only")', chips.length === 2 && !err, `${chips.join(', ')} ${err}`)

const n = await page.$$eval('.chat-assistant:not(:has(.chat-typing))', l => l.length)
await page.type('.chat-panel textarea', 'From the two attached files only: how many software engineers does Northwind have, and what is the loaded cost per engineer hour? Name the file for each. Do not change any inputs.')
await page.keyboard.press('Enter')
await page.waitForSelector('.chat-typing', { timeout: 15000 })
await page.waitForFunction(n => !document.querySelector('.chat-typing') && document.querySelectorAll('.chat-assistant:not(:has(.chat-typing))').length > n, { timeout: 240000 }, n)
const reply = await page.evaluate(() => [...document.querySelectorAll('.chat-assistant:not(:has(.chat-typing))')].pop().querySelector('.chat-bubble').innerText)
check('agent read the PDF: 1,480 engineers', /1,?480/.test(reply), reply.slice(0, 200).replace(/\n/g, ' '))
check('agent read the Excel sheet: $118/hour', /118/.test(reply))
check('no page errors', errors.length === 0, errors.join(' | '))
await page.screenshot({ path: '/tmp/cb-review/5-chat-attach.png' })
await browser.close()
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
