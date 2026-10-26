// v0.16.0: is more than one sidebar item highlighted inside a project? (mouse parked off the sidebar)
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'
const base = process.argv[2] || 'http://localhost:5173'
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 800 })
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
const nav = async l => { const [b] = await page.$$(`xpath/.//button[contains(@class,"side-item") and normalize-space(.)="${l}"]`); await b.click(); await sleep(900) }
await nav('Projects'); await page.waitForSelector('.project-card'); await (await page.$('.project-card')).click(); await sleep(1500)
const state = async tag => {
  await page.mouse.move(900, 500); await sleep(400)
  const r = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.sidebar-nav .side-item')]
    const pill = [...document.querySelectorAll('.sidebar-nav [class*=pill]')].map(p => { const b = p.getBoundingClientRect(); return Math.round(b.top) })
    return items.map(i => { const b = i.getBoundingClientRect(); const bg = getComputedStyle(i).backgroundColor; return { t: i.innerText.trim().replace(/\n.*/, ''), cur: i.getAttribute('aria-current'), bg, top: Math.round(b.top) } }).concat([{ pills: pill }])
  })
  console.log(tag, JSON.stringify(r))
  await page.screenshot({ path: `/tmp/cb-v0160-polish/zz-${tag}.png`, clip: { x: 0, y: 0, width: 240, height: 360 } })
}
await state('case-inputs')
await nav('Files'); await state('files')
await nav('Agent'); await state('agent')
await nav('Case inputs'); await state('back-to-inputs')
await browser.close()
