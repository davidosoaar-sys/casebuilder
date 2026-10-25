// Repro for "opening a project sometimes says New project": click New project on
// the Dashboard, cancel, then go to Projects. The New project dialog must not
// reappear. Usage: node scripts/review-new-project-dialog.mjs [base-url]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const dialog = () => page.$('.modal .mono-label')

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]')
await page.waitForSelector('.dashboard', { timeout: 20000 })

await page.click('.dashboard .primary') // Dashboard "New project"
await page.waitForSelector('.modal', { timeout: 5000 })
check('Dashboard New project opens the dialog', !!(await dialog()))
await page.click('.modal .ghost') // Cancel
await sleep(300)

await page.click('.side-item[aria-label="Dashboard"]'); await page.waitForSelector('.dashboard')
await page.click('.side-item[aria-label="Projects"]'); await page.waitForSelector('.project-card', { timeout: 15000 })
await sleep(500)
check('going to Projects later does not reopen New project', !(await dialog()))

await (await page.$('.project-card')).click()
await page.waitForSelector('.side-item[aria-label="Files"]')
await page.click('.side-item[aria-label="All projects"]'); await page.waitForSelector('.project-card')
await sleep(500)
check('back to All projects from a project does not open New project', !(await dialog()))

await browser.close()
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
