// CaseBuilder "C" mark, built like Backstage's B:
//  - the letter is a thick silhouette, drawn hollow (mint outline) on top
//  - below it, the same silhouette repeats as solid mint layers, each shifted
//    down, separated by dark gaps, each one hidden by the one above it
//  - everything sits on the same slanted plane as the B
// Writes src/assets/casebuilder-mark.svg and /tmp/cmark-preview.png (C next to B).
import fs from 'node:fs'
import puppeteer from 'puppeteer'

const MINT = '#7df3e1', BG = '#111111'
const OUT = 30      // outline stroke on the top face (letter units)
const GAP = 9       // dark gap around each layer (letter units)
const LAYERS = 4, DROP = 40 // stacked layers and their vertical step (screen units)
const SLANT = 'matrix(0.80,0.48,-0.62,0.62,0,0)' // letter x -> down-right, letter up -> up-right

// Squared C, letter units, SVG y-down. Straight stem, round outer corners,
// straight-cut arm ends: the B's stem-and-bowl vocabulary minus the bowls.
const w = 230, h = 250, t = 84, r = 100, ri = r - t + 30
const C = [
  `M${w},0`, `L${r},0`, `A${r},${r} 0 0 0 0,${r}`,
  `L0,${h - r}`, `A${r},${r} 0 0 0 ${r},${h}`, `L${w},${h}`,
  `L${w},${h - t}`, `L${t + ri},${h - t}`, `A${ri},${ri} 0 0 1 ${t},${h - t - ri}`,
  `L${t},${t + ri}`, `A${ri},${ri} 0 0 1 ${t + ri},${t}`, `L${w},${t}`, 'Z'
].join(' ')

const at = dy => `translate(0,${dy}) ${SLANT}`
let body = ''
for (let i = LAYERS; i >= 1; i--) {
  body += `<g transform="${at(i * DROP)}"><path d="${C}" fill="${MINT}" stroke="${BG}" stroke-width="${GAP * 2}" stroke-linejoin="round"/></g>`
}
// Top face: dark fill (hides the layers), dark gap ring, then the hollow mint outline inset.
body += `<g transform="${at(0)}">
  <path d="${C}" fill="${BG}" stroke="${BG}" stroke-width="${GAP * 2}" stroke-linejoin="round"/>
  <path d="${C}" fill="none" stroke="${MINT}" stroke-width="${OUT}" stroke-linejoin="round" transform="translate(${OUT / 2},${OUT / 2}) scale(${(w - OUT) / w},${(h - OUT) / h})"/>
</g>`

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setContent(`<svg xmlns="http://www.w3.org/2000/svg"><g id="g">${body}</g></svg>`)
const bb = await page.$eval('#g', g => { const b = g.getBBox(); return [b.x, b.y, b.width, b.height] })
const vb = [bb[0] - 3, bb[1] - 3, bb[2] + 6, bb[3] + 6].map(n => n.toFixed(1)).join(' ')
const themed = body.replaceAll(BG, 'var(--logo-bg, #111111)').replaceAll(MINT, 'currentColor')
fs.writeFileSync('src/assets/casebuilder-mark.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${themed}</svg>\n`)

const B = fs.readFileSync('src/assets/backstage-logo.svg', 'utf8').replace('viewBox="0 0 2079.95 456.05"', 'viewBox="-10 0 360 456"')
const Csvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>`
await page.setViewport({ width: 900, height: 420 })
await page.setContent(`<body style="margin:0;background:${BG};color:${MINT};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="display:flex;gap:70px;align-items:center;padding:30px 40px">
    ${B.replace('<svg ', '<svg height="230" ')}
    ${Csvg.replace('<svg ', '<svg height="230" ')}
  </div>
  <div style="display:flex;gap:16px;align-items:center;padding:0 40px">
    ${Csvg.replace('<svg ', '<svg height="62" ')}<span style="font-size:56px;letter-spacing:-0.5px">CaseBuilder</span>
    <span style="width:60px"></span>${B.replace('<svg ', '<svg height="62" ')}<span style="font-size:56px">Backstage</span>
  </div></body>`)
await page.screenshot({ path: '/tmp/cmark-preview.png' })
await browser.close()
console.log('viewBox', vb)
