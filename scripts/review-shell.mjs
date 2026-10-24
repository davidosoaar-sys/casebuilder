// Real-browser review of the app shell (test2@casebuilder.dev only):
// auth screens, dashboard, unified page headers, Projects index,
// Settings overlay (gear, bottom-left, blur, X/Esc, appearance, API key),
// Settings from inside a project keeps you in the project, collapse.
// Usage: node scripts/review-shell.mjs [baseUrl]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const cfg = `${os.homedir()}/.config/casebuilder`
const readEnv = f => Object.fromEntries(fs.readFileSync(f, 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T2 = { email: 'test2@casebuilder.dev', pw: readEnv(`${cfg}/accounts/test2@casebuilder.dev.env`).PASSWORD }
const KEY = readEnv(`${cfg}/test-account.env`).ANTHROPIC_API_KEY
const results = []
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const btn = (scope, text) => scope.$$(`xpath/.//button[normalize-space()="${text}"]`).then(x => x[0])

const browser = await puppeteer.launch({ headless: 'new' })
const ctx = await browser.createBrowserContext()
const page = await ctx.newPage()
await page.setViewport({ width: 1280, height: 690 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
const shot = n => page.screenshot({ path: `/tmp/shell-${n}.png` })
const nav = async label => { await page.click(`.sidebar-nav button[aria-label="${label}"]`); await sleep(250) }
const headOf = () => page.$eval('.page-head', h => { const r = h.querySelector('h1').getBoundingClientRect(); return { label: h.querySelector('.mono-label')?.textContent, title: h.querySelector('h1').textContent, x: Math.round(r.left), size: getComputedStyle(h.querySelector('h1')).fontSize } })
const openSettings = async () => { await page.click('.side-settings'); await page.waitForSelector('.overlay .overlay-card', { timeout: 5000 }) }
const settingsClosed = () => page.$('.overlay').then(x => !x)

// --- auth screens
await page.goto(base, { waitUntil: 'networkidle2' }); await page.waitForSelector('#auth-email')
check('sign-in screen shows "Create an account" link', Boolean(await btn(page, 'Create an account')))
await (await btn(page, 'Create an account')).click()
check('switches to Create your account', (await page.$eval('h1', e => e.textContent)) === 'Create your account')
check('create page links back to Sign in', Boolean(await btn(page, 'Sign in')))
await shot('1-signup')
await page.type('#auth-email', 'not-real@casebuilder.dev'); await page.type('#auth-password', 'short')
await page.click('button[type=submit]'); await page.waitForSelector('.auth-error')
check('short password rejected before any email is sent', /10 characters/.test(await page.$eval('.auth-error', e => e.textContent)))
await (await btn(page, 'Sign in')).click()
check('switches back to Sign in', (await page.$eval('h1', e => e.textContent)) === 'Sign in')
await page.goto(base + '/?signup', { waitUntil: 'networkidle2' }); await page.waitForSelector('h1')
check('?signup link opens Create account directly', (await page.$eval('h1', e => e.textContent)) === 'Create your account')

// --- sign in -> dashboard
await page.goto(base, { waitUntil: 'networkidle2' }); await page.waitForSelector('#auth-email')
await page.type('#auth-email', T2.email); await page.type('#auth-password', T2.pw)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
await page.waitForFunction(() => !document.body.innerText.includes('Checking…') && !document.body.innerText.includes('Loading…'), { timeout: 15000 }).catch(() => {})
check('lands on the Dashboard after sign-in', true)
check('sidebar shows CaseBuilder, not Backstage', await page.$eval('.sidebar-logo', e => e.innerText.includes('CaseBuilder') && !e.innerText.includes('Backstage')))
check('no theme toggle out in the open', !(await page.$('.sidebar .theme-toggle')))
check('Settings is not in the main menu', !(await page.$('.sidebar-nav button[aria-label="Settings"]')))
const gear = await page.$eval('.side-settings', e => { const r = e.getBoundingClientRect(); return { bottom: Math.round(innerHeight - r.bottom), left: Math.round(r.left), circles: e.querySelectorAll('svg circle').length, paths: e.querySelectorAll('svg path').length } })
check('Settings sits at the bottom left with a gear icon', gear.bottom < 60 && gear.left < 40 && gear.paths === 1 && gear.circles === 1, JSON.stringify(gear))
check('dashboard shows deal count', /open deals/i.test(await page.$eval('.dash-stats', e => e.innerText)))
await shot('2-dashboard')

// --- unified headers
const heads = {}
heads.Dashboard = await headOf()
await nav('Projects'); await page.waitForSelector('.projects-page .page-head'); heads.Projects = await headOf()
await shot('6-projects')
await nav('Connectors'); await page.waitForSelector('.connections-page .page-head'); heads.Connectors = await headOf()
await nav('Person lookup'); await page.waitForSelector('.lookup-page .page-head'); heads['Person lookup'] = await headOf()
console.log('      heads', JSON.stringify(heads))
check('every page has the mint label naming the page', Object.entries(heads).every(([k, h]) => h.label === k))
check('every page title is the same size', new Set(Object.values(heads).map(h => h.size)).size === 1)
check('Dashboard, Projects, Person lookup titles line up', new Set([heads.Dashboard.x, heads.Projects.x, heads['Person lookup'].x]).size === 1)

// --- Projects index
await nav('Projects'); await page.waitForSelector('.project-card')
const cards = await page.$$eval('.projects-page .project-card', els => els.map(e => ({ h: Math.round(e.getBoundingClientRect().height), logo: Boolean(e.querySelector('.project-company-logo')), name: e.querySelector('strong')?.textContent })))
check('project cards are compact rows with logo + name', cards.length > 0 && cards.every(c => c.h < 90 && c.logo && c.name), JSON.stringify(cards.slice(0, 2)))
await page.click('.view-btn[aria-label="List"]'); await sleep(200)
check('List view switches to one column', await page.$eval('.project-grid', e => e.classList.contains('project-list-view')))
await page.click('.view-btn[aria-label="Cards"]'); await sleep(200)

// --- Settings overlay
await openSettings(); await sleep(400)
const ov = await page.$eval('.overlay', e => ({ blur: getComputedStyle(e).backdropFilter, card: (() => { const r = e.querySelector('.overlay-card').getBoundingClientRect(); return { cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2) } })() }))
check('Settings opens as a centred card with a blurred background', /blur/.test(ov.blur) && Math.abs(ov.card.cx - 640) < 4 && Math.abs(ov.card.cy - 345) < 40, JSON.stringify(ov))
check('Appearance with Dark / Light lives in Settings', Boolean(await page.$('.overlay [role=radiogroup][aria-label=Theme]')))
await page.waitForFunction(() => !document.querySelector('.overlay').innerText.includes('Checking…'), { timeout: 15000 })
await shot('7-settings-overlay')
await (await page.$('.overlay button[role=radio][aria-checked=false]')).click(); await sleep(200)
const themeNow = await page.evaluate(() => document.documentElement.dataset.theme)
check('switching theme in Settings changes the app', themeNow === 'light', themeNow)
await shot('8-settings-light')
await (await page.$('.overlay button[role=radio][aria-checked=false]')).click(); await sleep(200)
check('and back to dark', (await page.evaluate(() => document.documentElement.dataset.theme)) === 'dark')

// API key inside the overlay
const hadKey = /Saved · ends in/.test(await page.$eval('#api-key', e => e.innerText))
if (hadKey) { page.once('dialog', d => d.accept()); await (await btn(page, 'Remove')).click(); await page.waitForFunction(() => document.querySelector('#api-key').innerText.includes('No key yet'), { timeout: 15000 }) }
await page.type('#api-key input[type=password]', 'not-a-real-key-123456789')
await (await btn(page, 'Save key')).click(); await page.waitForSelector('#api-key .auth-error', { timeout: 15000 })
check('a non-Anthropic key is refused with a clear reason', /sk-ant-/.test(await page.$eval('#api-key .auth-error', e => e.textContent)))
// Clear the React-controlled input properly (native setter + input event).
await page.$eval('#api-key input[type=password]', el => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ''); el.dispatchEvent(new Event('input', { bubbles: true })) })
check('the input really is empty before typing the real key', (await page.$eval('#api-key input[type=password]', e => e.value)) === '')
await page.type('#api-key input[type=password]', KEY)
await (await btn(page, 'Save key')).click()
await page.waitForFunction(() => /Saved · ends in/.test(document.querySelector('#api-key').innerText), { timeout: 15000 }).catch(() => {})
const keyText = await page.$eval('#api-key', e => e.innerText)
console.log('      key section:', JSON.stringify(keyText.replace(KEY, '<KEY>').slice(0, 400)))
check('real key saves and shows only the last 4', keyText.includes(`ends in …${KEY.slice(-4)}`))
check('the key itself is nowhere in the page', !(await page.content()).includes(KEY))
await page.click('.overlay-x'); await sleep(200)
check('X closes Settings and you are where you were (Projects)', (await settingsClosed()) && Boolean(await page.$('.projects-page')))

// --- the reported bug: Settings from inside a project
await (await page.$('.projects-page .project-card')).click()
await page.waitForSelector('#engineers', { timeout: 15000 })
await page.evaluate(() => window.scrollTo(0, 400)); const y0 = await page.evaluate(() => scrollY)
await openSettings(); await sleep(400); await shot('9-settings-in-project')
check('Settings card is on top of the project page (not behind it)', await page.evaluate(() => {
  const r = document.querySelector('.overlay-card').getBoundingClientRect()
  return [[0.5, 0.3], [0.5, 0.6], [0.2, 0.5], [0.8, 0.5]].every(([fx, fy]) => document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy)?.closest('.overlay-card'))
}))
await page.keyboard.press('Escape'); await sleep(200)
check('Settings inside a project: Esc closes and you stay in the project', (await settingsClosed()) && Boolean(await page.$('#engineers')))
check('...at the same scroll position', Math.abs((await page.evaluate(() => scrollY)) - y0) < 5)
await openSettings()
await page.mouse.click(30, 400); await sleep(200)
check('clicking the blurred background also closes it, still in the project', (await settingsClosed()) && Boolean(await page.$('#engineers')))
await page.click('.project-sidebar-back')
await page.waitForSelector('.projects-page')

// --- dashboard agent status
await nav('Dashboard'); await page.waitForSelector('.dashboard')
await page.waitForFunction(() => document.body.innerText.includes('Ready ·'), { timeout: 15000 }).catch(() => {})
check('dashboard agent card says Ready once a key is saved', /Ready · key ends in/.test(await page.$eval('.dashboard', e => e.innerText)))

// --- collapse
await page.click('.sidebar-collapse'); await sleep(400)
const w = await page.$eval('.sidebar', e => e.getBoundingClientRect().width)
check('collapse shrinks the menu to icons', w < 90, `${Math.round(w)}px`)
check('collapsed: logo is the mark only', !(await page.$eval('.sidebar-logo', e => e.innerText.includes('CaseBuilder'))))
check('collapsed: labels hidden, icons stay', await page.$$eval('.sidebar .side-label', els => els.every(e => getComputedStyle(e).display === 'none')) && (await page.$$('.sidebar .side-item svg')).length >= 4)
check('collapsed: gear still reachable', await page.$eval('.side-settings', e => { const r = e.getBoundingClientRect(); return r.width > 20 && r.right <= 70 }))
await shot('5-collapsed')
await page.reload({ waitUntil: 'networkidle2' }); await page.waitForSelector('.sidebar')
check('collapsed state survives a reload', (await page.$eval('.sidebar', e => e.getBoundingClientRect().width)) < 90)
await page.click('.sidebar-collapse'); await sleep(400)
check('expand brings the full menu back', (await page.$eval('.sidebar', e => e.getBoundingClientRect().width)) > 200)
check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '))

await browser.close()
const failed = results.filter(r => !r).length
console.log(failed ? `${failed} FAILED` : 'ALL PASS')
process.exit(failed ? 1 : 0)
