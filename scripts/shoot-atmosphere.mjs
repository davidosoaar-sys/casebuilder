// Prototype review: inject sketches/002-atmosphere/atmosphere.css into the REAL app (TEST account, all DB writes
// blocked) and screenshot the main pages before/after. Usage: node scripts/shoot-atmosphere.mjs [base]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'
const base = process.argv[2] || 'http://localhost:5173'
const out = '/tmp/cb-atmosphere'; fs.mkdirSync(out, { recursive: true })
const css = fs.readFileSync('sketches/002-atmosphere/atmosphere.css', 'utf8')
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 800 })
await page.setRequestInterception(true)
page.on('request', r => { if (/\/rest\/v1\//.test(r.url()) && ['POST', 'PATCH', 'DELETE', 'PUT'].includes(r.method())) return r.abort(); r.continue() })
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
const nav = async l => { const [b] = await page.$$(`xpath/.//button[contains(@class,"side-item") and normalize-space(.)="${l}"]`); await b.click(); await sleep(1500) }
const shoot = async name => {
  await page.screenshot({ path: `${out}/${name}-before.png` })
  await page.addStyleTag({ content: css }); await sleep(900)
  await page.screenshot({ path: `${out}/${name}-after.png` }); console.log(name)
  await page.evaluate(() => document.querySelectorAll('style').forEach(s => { if (s.textContent.includes('Prototype: concept C')) s.remove() }))
}
for (const p of ['Projects', 'Skills', 'Scheduled']) { await nav(p); await shoot(p.toLowerCase()) }
await nav('Projects'); await page.waitForSelector('.project-card'); const cards = await page.$$('.project-card'); await cards[cards.length - 1].click(); await sleep(1500)
await nav('Agent'); await sleep(2000); await shoot('agent')
await nav('Case inputs'); await sleep(1200); await shoot('case-inputs')
await browser.close()
