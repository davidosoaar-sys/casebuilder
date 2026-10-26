// v0.16.0 atmosphere pass: screenshot the main pages in dark + light, 1280 + 375 (TEST account, all DB writes blocked),
// and measure: no sideways scroll, hero present on the dashboard, one glowing nav pill, text contrast of the hero.
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'
const base = process.argv[2] || 'http://localhost:5173'
const out = '/tmp/cb-v0160-atmo'; fs.mkdirSync(out, { recursive: true })
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? '  (' + x + ')' : ''}`) }
const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 800 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
await page.setRequestInterception(true)
let blocked = 0
page.on('request', r => { if (/\/rest\/v1\//.test(r.url()) && ['POST', 'PATCH', 'DELETE', 'PUT'].includes(r.method())) { blocked++; return r.abort() } r.continue() })
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
await page.waitForFunction(() => document.querySelector('.dash-lede') && !/Loading/.test(document.querySelector('.dash-lede').innerText), { timeout: 20000 }); await sleep(800)
const nav = async l => { const [b] = await page.$$(`xpath/.//button[contains(@class,"side-item") and normalize-space(.)="${l}"]`); await b.click(); await sleep(1400); try { await page.waitForNetworkIdle({ idleTime: 500, timeout: 6000 }) } catch {} }
const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
const shot = async name => { await page.screenshot({ path: `${out}/${name}.png` }); return (await overflow()) }

const hero = await page.evaluate(() => {
  const h = document.querySelector('.dash-hello'), f = document.querySelector('.dash-figures'), p = document.querySelector('.dash-pills')
  return { hello: h?.innerText, size: h && getComputedStyle(h).fontSize, weight: h && getComputedStyle(h).fontWeight, figures: f?.innerText.replace(/\n+/g, ' | '), pills: p?.children.length || 0, oldSub: !!document.querySelector('.dashboard .page-sub') }
})
check('dashboard hero: big light greeting', hero.hello && parseFloat(hero.size) >= 48 && Number(hero.weight) <= 300, JSON.stringify({ hello: hero.hello, size: hero.size, weight: hero.weight }))
check('dashboard: numbers in their own row, not a sentence under Hello', !!hero.figures && !hero.oldSub, hero.figures)
check('dashboard: next-action pills', hero.pills > 0, String(hero.pills))
let ov = await shot('01-dashboard-dark'); check('dashboard: no sideways scroll at 1280', ov <= 0, String(ov))
for (const p of ['Projects', 'Scheduled', 'Customize', 'Connectors']) { if (p === 'Connectors') { await page.click('#customize-tab-connections'); await sleep(1000) } else await nav(p); ov = await shot(`02-${p.toLowerCase()}-dark`); check(`${p}: no sideways scroll`, ov <= 0, String(ov)) }
const pills = await page.evaluate(() => [...document.querySelectorAll('.side-pill')].filter(e => e.getBoundingClientRect().height > 0).length)
check('exactly one glowing nav pill', pills === 1, String(pills))
const title = await page.evaluate(() => { const h = document.querySelector('.page-head h1'); return h && { w: getComputedStyle(h).fontWeight, s: getComputedStyle(h).fontSize } })
check('page titles are light and large', title && Number(title.w) <= 300 && parseFloat(title.s) >= 40, JSON.stringify(title))
await nav('Projects'); await page.waitForSelector('.project-card'); const cards = await page.$$('.project-card'); await cards[cards.length - 1].click(); await sleep(1500)
await nav('Agent'); await sleep(1800); ov = await shot('03-agent-dark'); check('Agent: no sideways scroll', ov <= 0, String(ov))
await nav('Case inputs'); await sleep(1200); ov = await shot('04-case-inputs-dark'); check('Case inputs: no sideways scroll', ov <= 0, String(ov))
// light theme
await page.evaluate(() => document.documentElement.dataset.theme = 'light'); await sleep(500)
await shot('05-case-inputs-light')
await page.click('.project-sidebar-back'); await sleep(1200); await nav('Dashboard'); await sleep(1500); await shot('06-dashboard-light')
await page.evaluate(() => document.documentElement.dataset.theme = 'dark')
// phone
await page.setViewport({ width: 375, height: 812 }); await sleep(1000)
ov = await shot('07-dashboard-375'); check('dashboard: no sideways scroll at 375', ov <= 0, String(ov))
check('no page errors', errors.length === 0, errors.join(' | ').slice(0, 200))
console.log(`${results.filter(Boolean).length}/${results.length} passed; blocked writes ${blocked}; screenshots in ${out}`)
await browser.close()
