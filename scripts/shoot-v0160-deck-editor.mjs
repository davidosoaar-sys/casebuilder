// v0.16.0: capture the slide editor (Case artifacts > Edit slides) as the "before" set, read-only.
// Usage: node scripts/shoot-v0160-deck-editor.mjs [base-url] [out-dir]
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import os from 'node:os'
const base = process.argv[2] || 'http://localhost:5173'
const out = process.argv[3] || '/tmp/cb-v0160-before/deck'
fs.mkdirSync(out, { recursive: true })
const envFile = p => Object.fromEntries(fs.readFileSync(p, 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const T = envFile(`${os.homedir()}/.config/casebuilder/test-account.env`)
const sleep = ms => new Promise(r => setTimeout(r, ms))
const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 800 })
// read-only: block every write to the database
await page.setRequestInterception(true)
page.on('request', r => { const m = r.method(); if (/supabase\.co\/rest/.test(r.url()) && ['POST', 'PATCH', 'DELETE', 'PUT'].includes(m)) { console.log('blocked write', m, new URL(r.url()).pathname); return r.abort() } r.continue() })
await page.goto(base, { waitUntil: 'networkidle2' })
await page.type('#auth-email', 'test@casebuilder.dev'); await page.type('#auth-password', T.TEST_PASSWORD)
await page.click('button[type=submit]'); await page.waitForSelector('.dashboard', { timeout: 20000 })
const nav = async l => { const [b] = await page.$$(`xpath/.//button[contains(@class,"side-item") and normalize-space(.)="${l}"]`); await b.click(); await sleep(1200) }
await nav('Projects'); await page.waitForSelector('.project-card'); const cards = await page.$$('.project-card'); await cards[cards.length - 1].click(); await sleep(1500)
await nav('Case artifacts'); await sleep(1500)
const [edit] = await page.$$('xpath/.//button[contains(., "Edit slides")]'); if (edit) { await edit.click(); await sleep(1500) }
await page.screenshot({ path: `${out}/01-editor-top.png` })
const h = await page.evaluate(() => document.documentElement.scrollHeight); console.log('page height', h)
for (let y = 700, i = 2; y < Math.min(h, 6000); y += 700, i++) { await page.evaluate(v => window.scrollTo(0, v), y); await sleep(300); await page.screenshot({ path: `${out}/${String(i).padStart(2, '0')}-editor-${y}.png` }) }
// hover a block to show its tools
await page.evaluate(() => window.scrollTo(0, 0)); await sleep(300)
const blk = await page.$('.block'); if (blk) { const b = await blk.boundingBox(); await page.mouse.move(b.x + 40, b.y + 10); await sleep(400); await page.screenshot({ path: `${out}/20-block-hover.png` }) }
const counts = await page.evaluate(() => ({ slides: document.querySelectorAll('.slide-wrap').length, blocks: document.querySelectorAll('.block').length, buttons: document.querySelectorAll('.deck button').length, toolbar: [...document.querySelectorAll('.toolbar button, .toolbar select, .toolbar [role=combobox]')].map(b => b.innerText.trim() || b.getAttribute('aria-label')).filter(Boolean) }))
console.log(JSON.stringify(counts))
await browser.close()
