// Check the project nav renames, Research inside the project, and the
// Instructions saved/edit state on the TEST account. Restores the original
// instructions at the end.
// Usage: node scripts/review-nav-instructions.mjs [base-url]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const results = []
const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const out = process.env.SHOTS || '/tmp/cb-review'
fs.mkdirSync(out, { recursive: true })

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
page.on('response', async r => { if (r.status() >= 400 && /supabase/.test(r.url())) errors.push(`${r.status()} ${r.url().split('?')[0]} ${(await r.text().catch(() => '')).slice(0, 160)}`) })
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]')
await page.waitForSelector('.dashboard', { timeout: 20000 })

const globalNav = await page.$$eval('.sidebar-nav .side-item', bs => bs.map(b => b.getAttribute('aria-label')))
check('global menu has no Research tab', !globalNav.includes('Research'), globalNav.join(', '))

await page.click('.side-item[aria-label="Projects"]')
await page.waitForSelector('.project-card', { timeout: 15000 }); await (await page.$('.project-card')).click()
await page.waitForSelector('.side-item[aria-label="Files"]')
const nav = await page.$$eval('.sidebar-nav .side-item', bs => bs.map(b => b.getAttribute('aria-label')))
check('project menu: Case inputs, Case artifacts, Agent, Research, Files, Person lookup',
  JSON.stringify(nav) === JSON.stringify(['All projects', 'Case inputs', 'Case artifacts', 'Agent', 'Research', 'Files', 'Person lookup']), nav.join(', '))
check('no "Input sheet" or "Deck" label in the menu', !nav.includes('Input sheet') && !nav.includes('Deck'))

await page.click('.side-item[aria-label="Case artifacts"]')
await page.waitForSelector('.site-view', { timeout: 15000 }).catch(() => {})
const live = await page.$eval('.site-bar-left strong', e => e.innerText).catch(() => '')
check('Case artifacts opens on the Live room', live === 'Live room', live)
check('Case artifacts stays highlighted on the Live room', await page.$eval('.side-item[aria-label="Case artifacts"]', b => b.classList.contains('side-on')))
await page.screenshot({ path: `${out}/1-live-room.png` })
await page.click('.site-bar-left .link-btn')
await page.waitForFunction(() => !document.querySelector('.site-view'), { timeout: 10000 })
check('"Edit deck" goes to the deck, menu still on Case artifacts', await page.$eval('.side-item[aria-label="Case artifacts"]', b => b.classList.contains('side-on')))

await page.click('.side-item[aria-label="Research"]')
await page.waitForSelector('.research-page', { timeout: 10000 })
const stillInProject = await page.$('.side-item[aria-label="Files"]')
check('Research opens inside the project (project menu still shown)', !!stillInProject)
check('Research has no project picker', !(await page.$('.research-page select[aria-label="Project context"]')))
const sub = await page.$eval('.research-page .page-head p, .research-page header p', e => e.innerText).catch(() => '')
check('Research names the project', sub.length > 0 && !/an account,/.test(sub), sub)
await page.screenshot({ path: `${out}/2-research.png` })

await page.click('.side-item[aria-label="Files"]')
await page.waitForSelector('.pf-page')
await page.waitForFunction(() => !/Loading/.test(document.querySelector('.pf-page')?.innerText || ''))
await page.waitForNetworkIdle({ idleTime: 800 })
const editBtn = async () => (await page.$$('.pf-instr-bar button')).find(async b => true)
const barButtons = () => page.$$eval('.pf-instr-bar button', bs => bs.map(b => b.innerText.trim()))
// Remember what was there so the run leaves it as it found it.
let original = await page.$eval('.pf-instr-view', e => e.innerText).catch(() => null)
if (original === null) original = await page.$eval('.pf-instructions', e => e.value).catch(() => '')
if (await page.$('.pf-instr-view')) { await page.click('.pf-instr-bar .ghost'); await page.waitForSelector('.pf-instructions') }

const TEXT = 'Open with the CFO cost target.\nEvery deck needs an implementation plan slide.'
await page.$eval('.pf-instructions', e => { e.focus(); e.select() })
await page.keyboard.press('Backspace')
await page.type('.pf-instructions', TEXT)
await page.click('.pf-instr-bar .primary')
await page.waitForSelector('.pf-instr-view', { timeout: 10000 }).catch(async e => { console.log('DEBUG value', JSON.stringify(await page.$eval('.pf-instructions', x => x.value)), 'bar', await barButtons(), 'disabled', await page.$eval('.pf-instr-bar .primary', b => b.disabled), 'err', await page.$eval('.pf-page', p => p.querySelector('.auth-error')?.innerText || '')); await page.screenshot({ path: out + '/debug.png' }); throw e })
check('after saving, the text box is gone and the saved text shows', !(await page.$('.pf-instructions')) && (await page.$eval('.pf-instr-view', e => e.innerText)) === TEXT)
check('saved state shows only an Edit button', JSON.stringify(await barButtons()) === '["Edit"]', (await barButtons()).join(', '))
await page.screenshot({ path: `${out}/3-instructions-saved.png` })

await page.click('.pf-instr-bar .ghost')
await page.waitForSelector('.pf-instructions')
const boxValue = await page.$eval('.pf-instructions', e => e.value)
check('Edit opens the box with the saved text', boxValue === TEXT, JSON.stringify(boxValue))
check('edit state shows Cancel and Save changes', JSON.stringify(await barButtons()) === '["Cancel","Save changes"]', (await barButtons()).join(', '))
check('Save changes is off until something changes', await page.$eval('.pf-instr-bar .primary', b => b.disabled))
await page.type('.pf-instructions', ' Avoid "DevEx".')
await page.screenshot({ path: `${out}/4-instructions-editing.png` })
await page.click('.pf-instr-bar .ghost') // Cancel
await page.waitForSelector('.pf-instr-view')
check('Cancel throws the edit away', (await page.$eval('.pf-instr-view', e => e.innerText)) === TEXT)

await page.click('.pf-instr-bar .ghost')
await page.waitForSelector('.pf-instructions')
await page.type('.pf-instructions', ' Avoid "DevEx".')
await page.click('.pf-instr-bar .primary')
await page.waitForSelector('.pf-instr-view')
check('Save changes saves the edit', (await page.$eval('.pf-instr-view', e => e.innerText)) === TEXT + ' Avoid "DevEx".')

await page.reload({ waitUntil: 'networkidle2' })
await page.waitForSelector('.dashboard', { timeout: 20000 })
await page.click('.side-item[aria-label="Projects"]')
await page.waitForSelector('.project-card', { timeout: 15000 }); await (await page.$('.project-card')).click()
await page.waitForSelector('.side-item[aria-label="Files"]', { timeout: 15000 })
await page.click('.side-item[aria-label="Files"]')
await page.waitForSelector('.pf-instr-view', { timeout: 15000 }).catch(() => {})
check('after a reload it opens in the saved view', (await page.$eval('.pf-instr-view', e => e.innerText).catch(() => '')) === TEXT + ' Avoid "DevEx".')

// Restore.
await page.click('.pf-instr-bar .ghost'); await page.waitForSelector('.pf-instructions')
await page.$eval('.pf-instructions', e => { e.focus(); e.select() }); await page.keyboard.press('Backspace')
if (original) { await page.type('.pf-instructions', original); await page.click('.pf-instr-bar .primary'); await page.waitForSelector('.pf-instr-view') }
else console.log('note: test project had no instructions; left the last test text (instructions cannot be emptied from the UI)')

check('no page errors or failed Supabase calls', errors.length === 0, errors.join(' | '))
await browser.close()
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
