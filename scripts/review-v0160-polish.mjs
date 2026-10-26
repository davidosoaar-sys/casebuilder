// v0.16.0 app-wide polish review (TEST account, read-only: writes are blocked).
// Sidebar pill, custom Select, mobile top bar and drawer, save status, button
// press and transitions, no overflow at 375. Shots at 1280 and 375.
// Usage: node scripts/review-v0160-polish.mjs [base-url] [out-dir]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const out = process.argv[3] || '/tmp/cb-v0160-polish'
fs.mkdirSync(out, { recursive: true })
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const results = []
const check = (n, ok, x = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
const errors = []
const writes = []
page.on('pageerror', e => errors.push(e.message))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`) })
page.on('dialog', d => { writes.push(`dialog: ${d.message()}`); d.dismiss() })
await page.setRequestInterception(true)
page.on('request', req => {
  const u = new URL(req.url())
  if (/\/(rest|storage|functions)\/v1\//.test(u.pathname) && !['GET', 'HEAD', 'OPTIONS'].includes(req.method())) { writes.push(`${req.method()} ${u.pathname}`); return req.abort() }
  req.continue()
})

await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
await page.waitForFunction(() => !document.querySelector('.dashboard [aria-busy="true"]'), { timeout: 15000 }).catch(() => {})
await sleep(600)

// Desktop menu: one pill, on the current page; it moves with navigation.
const pill = () => page.evaluate(() => {
  const pills = [...document.querySelectorAll('.sidebar-desktop .side-pill')]
  return { n: pills.length, on: pills[0]?.closest('.side-item')?.getAttribute('aria-label') }
})
const p1 = await pill()
check('sidebar: exactly one active pill, on Dashboard', p1.n === 1 && p1.on === 'Dashboard', JSON.stringify(p1))
check('sidebar: no left accent border on the active item', await page.$eval('.sidebar-desktop .side-on', b => parseFloat(getComputedStyle(b).borderLeftWidth) === 0))
await page.screenshot({ path: `${out}/01-dashboard-1280.png` })
await page.click('.sidebar-desktop .side-item[aria-label="Projects"]'); await page.waitForSelector('.projects-page'); await sleep(450)
const p2 = await pill()
check('sidebar: the pill moves to Projects', p2.n === 1 && p2.on === 'Projects', JSON.stringify(p2))
check('page enter: content settles at full opacity, no transform', await page.$eval('main.content > *', e => getComputedStyle(e).opacity === '1' && getComputedStyle(e).transform === 'none'))
await page.screenshot({ path: `${out}/02-projects-1280.png` })

// Save status: a dot and a label in the footer row.
const save = await page.evaluate(() => {
  const s = document.querySelector('.sidebar-desktop .save-indicator')
  return s && { role: s.getAttribute('role'), live: s.getAttribute('aria-live'), title: s.title, dot: !!s.querySelector('.save-dot'), label: s.querySelector('.save-label')?.innerText, inRow: !!s.closest('.sidebar-meta') }
})
check('save status: dot + label, role=status, inline in the footer row', save && save.dot && save.role === 'status' && save.live === 'polite' && !!save.title && /Saved|Saving|Not saved/.test(save.label) && save.inRow, JSON.stringify(save))

// Buttons: press transform defined, nothing transitions "all".
const css = await page.evaluate(() => {
  const rules = []
  const walk = list => { for (const r of list) { if (r.cssRules) walk(r.cssRules); if (r.selectorText) rules.push([r.selectorText, r.style.transform]) } }
  for (const s of document.styleSheets) { try { walk(s.cssRules) } catch {} }
  const press = rules.filter(([sel, t]) => /\.primary[^,]*:active/.test(sel) && /scale\(0?\.97\)/.test(t)).length
  const all = [...document.querySelectorAll('button')].filter(b => {
    const cs = getComputedStyle(b)
    const props = cs.transitionProperty.split(',').map(s => s.trim())
    const durs = cs.transitionDuration.split(',').map(s => parseFloat(s))
    return props.some((p, i) => p === 'all' && (durs[i % durs.length] || 0) > 0)
  }).map(b => b.className || b.innerText).slice(0, 5)
  return { press, all }
})
check('buttons: :active press transform is defined', css.press > 0, `${css.press} rules`)
check('buttons: no "transition: all" in computed styles', css.all.length === 0, css.all.join(' | '))

// Custom select on Connectors (choosing a project here is view state only).
await page.click('.sidebar-desktop .side-item[aria-label="Connectors"]'); await page.waitForSelector('[data-testid=connections]'); await sleep(500)
const trig = '[role=combobox][aria-label="Connection project"]'
const before = await page.$eval(trig, b => ({ v: b.dataset.value, exp: b.getAttribute('aria-expanded'), controls: b.getAttribute('aria-controls') }))
await page.focus(trig); await page.keyboard.press('ArrowDown'); await sleep(250)
const opened = await page.evaluate(t => {
  const b = document.querySelector(t), l = document.querySelector('.cselect-list')
  return { exp: b.getAttribute('aria-expanded'), list: !!l, role: l?.getAttribute('role'), id: l?.id === b.getAttribute('aria-controls'), opts: l ? [...l.querySelectorAll('[role=option]')].map(o => ({ v: o.dataset.value, sel: o.getAttribute('aria-selected') })) : [], active: b.getAttribute('aria-activedescendant'), inBody: l?.parentElement === document.body }
}, trig)
check('select: opens on ArrowDown as a portalled listbox', opened.exp === 'true' && opened.list && opened.role === 'listbox' && opened.id && opened.inBody, JSON.stringify({ ...opened, opts: opened.opts.length }))
check('select: one option aria-selected, active option tracked', opened.opts.filter(o => o.sel === 'true').length === 1 && !!opened.active)
await page.screenshot({ path: `${out}/03-select-open-1280.png` })
if (opened.opts.length > 1) {
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await sleep(300)
  const after = await page.$eval(trig, b => ({ v: b.dataset.value, exp: b.getAttribute('aria-expanded') }))
  check('select: Down + Enter changes the value and closes', after.v !== before.v && after.exp === 'false' && !(await page.$('.cselect-list')), `${before.v || '(default)'} -> ${after.v}`)
  // Put it back the same way (view state only).
  await page.keyboard.press('Home'); await sleep(200); await page.keyboard.press('Home'); await page.keyboard.press('Enter'); await sleep(250)
} else check('select: Down + Enter (skipped, one option)', true)
await page.keyboard.press('ArrowDown'); await sleep(200)
await page.keyboard.press('Escape'); await sleep(250)
check('select: Escape closes, focus stays on the trigger', !(await page.$('.cselect-list')) && await page.evaluate(t => document.activeElement === document.querySelector(t), trig))
await page.screenshot({ path: `${out}/04-connectors-1280.png` })

// Mobile: top bar + drawer.
await page.setViewport({ width: 375, height: 800 }); await sleep(500)
const bar = await page.evaluate(() => ({
  bar: getComputedStyle(document.querySelector('.mobile-bar')).display !== 'none',
  title: document.querySelector('.mobile-bar-title')?.innerText,
  side: getComputedStyle(document.querySelector('.sidebar-desktop')).display
}))
check('375: top bar with the page title, desktop sidebar hidden', bar.bar && bar.title === 'Connectors' && bar.side === 'none', JSON.stringify(bar))
await page.click('.mobile-menu-btn'); await sleep(400)
const drawer = await page.evaluate(() => {
  const d = document.querySelector('.sidebar-drawer')
  return d && { dialog: d.getAttribute('role'), focus: document.activeElement?.classList.contains('side-item') && d.contains(document.activeElement), lock: document.body.style.overflow, items: [...d.querySelectorAll('.sidebar-nav .side-item')].length, pills: d.querySelectorAll('.side-pill').length, left: Math.round(d.getBoundingClientRect().left) }
})
check('375: drawer opens from the left, focus on the first item, scroll locked', drawer && drawer.dialog === 'dialog' && drawer.focus && drawer.lock === 'hidden' && drawer.left === 0 && drawer.items >= 4 && drawer.pills === 1, JSON.stringify(drawer))
await page.screenshot({ path: `${out}/05-drawer-375.png` })
await page.keyboard.press('Escape'); await sleep(450)
check('375: Escape closes the drawer, focus back on the menu button', !(await page.$('.sidebar-drawer')) && await page.evaluate(() => document.activeElement?.classList.contains('mobile-menu-btn') && document.body.style.overflow !== 'hidden'))
await page.click('.mobile-menu-btn'); await sleep(400)
await page.mouse.click(360, 400); await sleep(450)
check('375: backdrop click closes the drawer', !(await page.$('.sidebar-drawer')))

// No horizontal overflow at 375 on the main pages and a project's Case inputs.
async function go(label, sel) {
  await page.click('.mobile-menu-btn'); await page.waitForSelector('.sidebar-drawer'); await sleep(300)
  await page.click(`.sidebar-drawer .side-item[aria-label="${label}"]`); await page.waitForSelector(sel, { timeout: 15000 }); await sleep(700)
}
const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
for (const [label, sel, file] of [['Dashboard', '.dashboard', '06-dashboard'], ['Projects', '.projects-page', '07-projects'], ['Scheduled', '.scheduled-page', '08-scheduled'], ['Skills', '.skills-page', '09-skills'], ['Connectors', '[data-testid=connections]', '10-connectors']]) {
  await go(label, sel)
  check(`375: no horizontal overflow on ${label}`, !(await overflow()))
  await page.screenshot({ path: `${out}/${file}-375.png`, fullPage: true })
}
await go('Projects', '.projects-page')
await page.waitForSelector('.project-card', { timeout: 15000 }).catch(() => {})
if (await page.$('.project-card')) {
  await page.click('.project-card'); await page.waitForSelector('.inputs-page, .field', { timeout: 15000 }).catch(() => {}); await sleep(900)
  const t = await page.$eval('.mobile-bar-title', e => e.innerText)
  check('375: no horizontal overflow on Case inputs', !(await overflow()) && t === 'Case inputs', t)
  await page.screenshot({ path: `${out}/11-case-inputs-375.png`, fullPage: true })
  await page.setViewport({ width: 1280, height: 800 }); await sleep(500)
  const p3 = await pill()
  check('project menu: one pill, on Case inputs', p3.n === 1 && p3.on === 'Case inputs', JSON.stringify(p3))
  await page.screenshot({ path: `${out}/12-case-inputs-1280.png` })
  // Case artifacts toolbar: Copy link, format select, Edit content, "..." menu.
  await page.click('.sidebar-desktop .side-item[aria-label="Case artifacts"]'); await page.waitForSelector('.site-bar', { timeout: 15000 }); await sleep(800)
  const bar2 = await page.$$eval('.site-bar-actions > *', l => l.map(e => e.getAttribute('aria-label') || e.innerText.trim()))
  check('artifacts toolbar: format select, Edit content, menu, Copy link', bar2.join('|') === 'View as format|Edit content|More ways to share|Copy link', bar2.join(' | '))
  await page.screenshot({ path: `${out}/13-artifacts-1280.png` })
  await page.click('.site-more'); await sleep(300)
  const menu = await page.$$eval('.sched-menu [role=menuitem]', l => l.map(b => b.innerText.split('\n')[0]))
  check('artifacts menu: Open in new tab, Download .html, Vercel project', menu.join('|') === 'Open in new tab|Download .html|Vercel project', menu.join(' | '))
  await page.screenshot({ path: `${out}/14-artifacts-menu-1280.png` })
  await page.keyboard.press('Escape'); await sleep(250)
} else check('375: Case inputs (no project on the TEST account)', false, 'no project card')

check('nothing was written', writes.length === 0, writes.join(' | '))
check('no page errors or 4xx', errors.length === 0, errors.slice(0, 5).join(' | '))
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
await browser.close()
process.exit(results.every(Boolean) ? 0 : 1)
