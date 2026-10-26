// v0.16.0 Export review (TEST account, read-only: writes are blocked).
// The deck toolbar's Export menu (4 formats), the Slides preview with its
// hidden-pages notice and format Select, Escape, "Fill them in" landing on
// Case inputs, and Export on Case artifacts. Then the discovered Apple brand
// rendered into a Live room page (needs /tmp/cb-v0160-export/brand-Apple.json
// from scripts/check-brand-palette.mjs).
// Usage: node scripts/review-v0160-export.mjs [base-url] [out-dir]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'

const base = process.argv[2] || 'http://localhost:5173'
const out = process.argv[3] || '/tmp/cb-v0160-export'
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
await sleep(500)
await page.click('.sidebar-desktop .side-item[aria-label="Projects"]'); await page.waitForSelector('.projects-page')
await page.waitForSelector('.project-card', { timeout: 15000 }).catch(() => {})
const pillOn = () => page.evaluate(() => document.querySelector('.sidebar-desktop .side-pill')?.closest('.side-item')?.getAttribute('aria-label'))

if (!(await page.$('.project-card'))) check('open a project (none on the TEST account)', false)
else {
  await page.click('.project-card'); await page.waitForSelector('.inputs-page, .field', { timeout: 15000 }); await sleep(700)
  // Case artifacts opens the Live room; Edit slides goes to the deck editor.
  await page.click('.sidebar-desktop .side-item[aria-label="Case artifacts"]'); await page.waitForSelector('.site-bar', { timeout: 15000 }); await sleep(900)
  const siteExport = await page.$('.site-bar-actions .export-trigger')
  check('Case artifacts: one labelled Export entry point', siteExport && (await siteExport.evaluate(b => b.innerText.trim())) === 'Export' && (await page.$$('.site-bar-actions .export-trigger')).length === 1)
  const siteNotice = await page.$eval('.site-view', v => v.querySelector('.hidden-pages')?.innerText || '')
  await page.screenshot({ path: `${out}/01-artifacts.png` })
  await page.click('.site-bar .link-btn'); await page.waitForSelector('.deck-wrap .toolbar', { timeout: 15000 }); await sleep(700)

  // What the editor marks as "not in the client deck yet".
  const pages = await page.$$eval('.deck .slide-wrap', l => ({ all: l.length, hidden: l.filter(s => s.classList.contains('slide-incomplete')).length }))
  check('Case artifacts: hidden-pages notice matches the editor', pages.hidden ? /hidden until/.test(siteNotice) : !siteNotice, `${pages.hidden} hidden, notice: ${siteNotice.replace(/\s+/g, ' ').slice(0, 80) || 'none'}`)

  const trigger = await page.$('.toolbar .export-trigger')
  check('deck toolbar: the button says Export, keeps .export', trigger && (await trigger.evaluate(b => b.innerText.trim() === 'Export' && !!b.closest('.export'))))
  await trigger.click(); await sleep(350)
  const menu = await page.evaluate(() => {
    const m = document.querySelector('.export-menu')
    return m && { role: m.getAttribute('role'), items: [...m.querySelectorAll('[role=menuitem]')].map(b => ({ name: b.querySelector('strong')?.innerText, note: b.querySelector('.export-item-text span')?.innerText, gets: b.querySelector('.export-item-gets')?.innerText })), focus: document.activeElement?.getAttribute('role'), origin: getComputedStyle(m).transformOrigin, expanded: document.querySelector('.toolbar .export-trigger').getAttribute('aria-expanded') }
  })
  check('Export menu: opens with 4 items, focus on the first', menu && menu.role === 'menu' && menu.items.length === 4 && menu.focus === 'menuitem' && menu.expanded === 'true', JSON.stringify(menu?.items.map(i => i.name)))
  const want = { PDF: 'Preview, then save as PDF', Slides: 'Present, or download PowerPoint (.pptx)', 'One-pager': 'Preview, then PDF or HTML', 'Live room': 'Interactive page you can share' }
  check('Export menu: each item names the format, a note and what you get', menu && menu.items.every(i => want[i.name] === i.note && i.gets), menu?.items.map(i => `${i.name}: ${i.note} [${i.gets}]`).join(' | '))
  await page.screenshot({ path: `${out}/02-export-menu.png` })
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Escape'); await sleep(300)
  check('Export menu: Escape closes, focus back on Export', !(await page.$('.export-menu')) && await page.evaluate(() => document.activeElement?.classList.contains('export-trigger')))

  // Slides preview.
  const openSlides = async () => {
    await page.click('.toolbar .export-trigger'); await page.waitForSelector('.export-menu [role=menuitem]')
    const items = await page.$$('.export-menu [role=menuitem]')
    for (const b of items) if ((await b.evaluate(x => x.querySelector('strong').innerText)) === 'Slides') { await b.click(); break }
    await page.waitForSelector('.preview[role=dialog]', { timeout: 8000 }); await sleep(900)
  }
  await openSlides()
  const preview = await page.evaluate(() => {
    const p = document.querySelector('.preview')
    const sel = p.querySelector('[role=combobox][aria-label="Preview format"]')
    return { title: p.getAttribute('aria-label'), select: !!sel, value: sel?.dataset.value, native: !!p.querySelector('select'), notice: p.querySelector('.hidden-pages')?.innerText || '', fill: !!p.querySelector('.hidden-pages-fill'), bar: !!p.querySelector('.preview-bar + .hidden-pages') }
  })
  check('Slides preview: shared Select labelled Preview format, no native select', preview.select && preview.value === 'slides' && !preview.native, JSON.stringify({ select: preview.select, value: preview.value, native: preview.native }))
  if (pages.hidden) {
    const n = Number(preview.notice.match(/^(\d+) pages? (?:is|are) hidden/)?.[1])
    check('Slides preview: hidden-pages notice under the header, with the count and inputs', preview.bar && n === pages.hidden && /filled in: .+\./.test(preview.notice) && preview.fill, preview.notice.replace(/\s+/g, ' '))
  } else check('Slides preview: no notice when nothing is hidden', !preview.notice)
  await page.screenshot({ path: `${out}/03-slides-preview.png` })
  await page.keyboard.press('Escape'); await sleep(350)
  check('Slides preview: Escape closes it', !(await page.$('.preview[role=dialog]')))

  if (pages.hidden) {
    await openSlides()
    await page.click('.hidden-pages-fill'); await sleep(900)
    const landed = await page.evaluate(() => ({ preview: !!document.querySelector('.preview[role=dialog]'), inputs: !!document.querySelector('.inputs-page, .field') }))
    const on = await pillOn()
    check('"Fill them in" closes the preview and lands on Case inputs', !landed.preview && landed.inputs && on === 'Case inputs', JSON.stringify({ ...landed, on }))
    await page.screenshot({ path: `${out}/04-case-inputs.png` })
  } else check('"Fill them in" (skipped, nothing hidden)', true)
}

// The discovered Apple brand, as the app would show it after the display
// check, on a Live room page with sample figures.
const brandFile = `${out}/brand-Apple.json`
if (!fs.existsSync(brandFile)) check('Apple Live room render (run check-brand-palette.mjs first)', false)
else {
  const brand = JSON.parse(fs.readFileSync(brandFile, 'utf8'))
  const built = await page.evaluate(async brand => {
    const [{ newProject }, { DEMO_VALUES }, { buildSiteHtml }, { verifyBrandForDisplay }] = await Promise.all([import('/src/projects.js'), import('/src/valueModel.js'), import('/src/export/site.js'), import('/src/verifyBrand.js')])
    const p = newProject('Apple')
    p.fields = p.fields.map(f => f.key !== 'companyName' && DEMO_VALUES[f.key] !== undefined ? { ...f, value: DEMO_VALUES[f.key] } : f)
    p.brand = await verifyBrandForDisplay(brand)
    const inputs = Object.fromEntries(p.fields.map(f => [f.key, f.value]))
    return { html: buildSiteHtml({ project: p, inputs, activeKey: p.stakeholders[0]?.key }), brand: { background: p.brand.background, text: p.brand.text, primary: p.brand.primary, logoBackground: p.brand.logoBackground, status: p.brand.status } }
  }, brand)
  const live = await browser.newPage()
  live.on('pageerror', e => errors.push('live: ' + e.message))
  await live.setViewport({ width: 1280, height: 800 })
  await live.setContent(built.html, { waitUntil: 'load' }); await sleep(1200)
  const look = await live.evaluate(() => {
    const img = [...document.querySelectorAll('img[alt="Company logo"]')].find(i => i.getBoundingClientRect().height > 0)
    const r = img?.getBoundingClientRect()
    return { bg: getComputedStyle(document.body).backgroundColor, logo: !!img, w: Math.round(r?.width || 0), h: Math.round(r?.height || 0), field: img ? getComputedStyle(img).backgroundColor : '' }
  })
  check('Apple: light page, black logo, no field behind it', built.brand.background === '#ffffff' && built.brand.logoBackground === 'transparent' && look.logo && /rgba\(0, 0, 0, 0\)|transparent/.test(look.field), JSON.stringify({ ...built.brand, ...look }))
  await live.screenshot({ path: `${out}/apple-live.png` })
  await live.close()
}

check('nothing was written', writes.length === 0, writes.join(' | '))
check('no page errors or 4xx', errors.length === 0, errors.slice(0, 5).join(' | '))
console.log(`${results.filter(Boolean).length}/${results.length} passed`)
await browser.close()
process.exit(results.every(Boolean) ? 0 : 1)
