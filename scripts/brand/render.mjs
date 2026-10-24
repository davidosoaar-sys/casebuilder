import puppeteer from 'puppeteer'
import fs from 'node:fs'
const b = await puppeteer.launch({ headless: 'new' }); const p = await b.newPage()
for (const [f, w, h] of [['/tmp/bmark.svg', 360, 456], ['/tmp/bfull.svg', 1040, 228]]) {
  await p.setViewport({ width: w, height: h }); await p.setContent(`<body style="margin:0;background:#111">${fs.readFileSync(f, 'utf8')}</body>`)
  await p.screenshot({ path: f.replace('.svg', '.png') })
}
await b.close()
