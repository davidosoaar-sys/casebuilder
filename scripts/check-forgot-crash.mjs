// Does "Forgot password?" crash on a given deployment? (no submit). Usage: node scripts/check-forgot-crash.mjs <base>
import puppeteer from 'puppeteer'
const base = process.argv[2] || 'https://casebuilder-three.vercel.app'
const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 820 })
const errors = []; page.on('pageerror', e => errors.push(e.message))
await page.goto(base, { waitUntil: 'networkidle2' }); await page.waitForSelector('.auth-card', { timeout: 20000 })
const [forgot] = await page.$$('xpath/.//button[contains(., "Forgot password")]'); await forgot.click(); await new Promise(r => setTimeout(r, 1200))
const text = await page.evaluate(() => document.body.innerText.slice(0, 200))
console.log(JSON.stringify({ base, errors, shows: text.replace(/\s+/g, ' '), blank: text.trim().length < 5 }))
await page.screenshot({ path: '/tmp/cb-forgot-live.png' })
await browser.close()
