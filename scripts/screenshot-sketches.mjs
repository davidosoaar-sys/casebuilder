// Screenshot each dashboard hero concept at 1280x800 and 375, after the entrance motion settles.
import puppeteer from 'puppeteer'
import fs from 'node:fs'
import path from 'node:path'
const dir = path.resolve('sketches/001-dashboard-hero')
const out = '/tmp/cb-sketch-dash'; fs.mkdirSync(out, { recursive: true })
const browser = await puppeteer.launch({ headless: 'new' })
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort()) {
  for (const [w, h] of [[1280, 800], [375, 812]]) {
    const page = await browser.newPage(); await page.setViewport({ width: w, height: h })
    await page.goto('file://' + path.join(dir, f), { waitUntil: 'networkidle0' })
    await page.evaluateHandle('document.fonts.ready'); await new Promise(r => setTimeout(r, 1400))
    const o = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, font: document.fonts.check('300 40px Outfit') }))
    const file = `${out}/${f.replace('.html', '')}-${w}.png`
    await page.screenshot({ path: file }); console.log(file, JSON.stringify(o)); await page.close()
  }
}
await browser.close()
