// Measure the real bounds of the B mark inside backstage-logo.svg (paths left of the wordmark).
import fs from 'node:fs'
import puppeteer from 'puppeteer'
const svg = fs.readFileSync('src/assets/backstage-logo.svg', 'utf8')
const b = await puppeteer.launch({ headless: 'new' }); const p = await b.newPage()
await p.setContent(`<body>${svg}</body>`)
const r = await p.evaluate(() => {
  const out = []
  for (const el of document.querySelectorAll('svg path, svg polygon, svg rect')) {
    const bb = el.getBBox(); out.push([bb.x, bb.y, bb.x + bb.width, bb.y + bb.height])
  }
  return out
})
await b.close()
const mark = r.filter(([x0]) => x0 < 400)
const box = mark.reduce((a, [x0, y0, x1, y1]) => [Math.min(a[0], x0), Math.min(a[1], y0), Math.max(a[2], x1), Math.max(a[3], y1)], [1e9, 1e9, -1e9, -1e9])
console.log('elements', r.length, 'mark elements', mark.length, 'mark bbox', box.map(n => n.toFixed(1)).join(' '))
