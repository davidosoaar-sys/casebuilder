import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import zlib from 'node:zlib'
import { parseBrand, discoverBrand } from './brand.js'
import { applyBrandSelection, buildBrandCatalog } from './brandSelection.js'
import { tightenSvg, svgContentBounds, svgInk, recolourSvg, pngInk, fitLogo, pathPoints } from './logoFit.js'
import { DEFAULT_BRAND, COLOR_KEYS } from '../src/brand.js'

const site = 'https://company.example/'
const APP_TOKENS = ['#111111', '#1e1e1e', '#e3e3e3', '#9bf0de', '#a9acb1']
const palette = b => COLOR_KEYS.map(k => b[k])
const apple = fs.readFileSync(new URL('./fixtures/apple-logo.svg', import.meta.url), 'utf8')
const svgUrl = svg => 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
const fromUrl = url => Buffer.from(url.split(',')[1], 'base64').toString('utf8')

test('a site that never sets a page colour is the browser default white, never the app theme', () => {
  const b = parseBrand('<html><body><a href="/">Home</a></body></html>', 'body{font-family:Brand Sans;color:#1d1d1f}a{color:#0066cc}', site)
  assert.equal(b.background, '#ffffff')
  assert.equal(b.text, '#1d1d1f')
  assert.equal(b.primary, '#0066cc') // the link colour, not our mint
  assert.ok(b.derivedColors.includes('background'))
  for (const c of palette(b)) assert.ok(!APP_TOKENS.includes(c), c)
  // Nothing at all: white page, dark text, the text colour as the accent.
  const bare = parseBrand('<p>Hello</p>', '', site)
  assert.equal(bare.background, '#ffffff')
  assert.equal(bare.primary, bare.text)
  for (const c of palette(bare)) assert.ok(!APP_TOKENS.includes(c), c)
})

test('a dark site keeps its dark palette', () => {
  const b = parseBrand('', ':root{--background:#121212;--primary:#1ed760}body{color:#ffffff}', site)
  assert.equal(b.background, '#121212')
  assert.equal(b.primary, '#1ed760')
  assert.equal(b.text, '#ffffff')
  assert.equal(b.muted, '#b8b8b8')
})

test('only body{background:#000} makes the page dark; a dark-scheme media block does not', () => {
  const dark = parseBrand('', 'body{background:#000}', site)
  assert.equal(dark.background, '#000000')
  assert.equal(dark.text, '#ffffff')
  const media = parseBrand('', 'body{margin:0}@media (prefers-color-scheme: dark){body{background:#000}}', site)
  assert.equal(media.background, '#ffffff')
  // Shorthand, inline style attribute, html rule and a neutral theme-color all count.
  assert.equal(parseBrand('', 'html,body{background:url(/x.png) no-repeat #0b0b0f}', site).background, '#0b0b0f')
  assert.equal(parseBrand('<body style="background-color: rgb(20, 20, 20)">', '', site).background, '#141414')
  assert.equal(parseBrand('', 'main{background:#f5f5f7}', site).background, '#f5f5f7')
  assert.equal(parseBrand('<meta name="theme-color" content="#000000">', '', site).background, '#000000')
  assert.equal(parseBrand('', 'body{background:transparent}', site).background, '#ffffff')
})

test('a coloured theme-color or button becomes the accent when no token names one', () => {
  assert.equal(parseBrand('<meta name="theme-color" content="#e50914">', '', site).primary, '#e50914')
  assert.equal(parseBrand('', '.btn-primary{background:#635bff;color:#fff}', site).primary, '#635bff')
})

test('discovery of a site without page colours carries no CaseBuilder colour into the brand', async () => {
  const r = await discoverBrand({ company: 'Example', website: site }, async url => {
    if (url === site) return { url, type: 'text/html', buffer: Buffer.from('<a href="/" aria-label="Example home">' + apple.replace('xmlns="http://www.w3.org/2000/svg"', '') + '</a><style>body{color:#1d1d1f}a{color:#0066cc}</style>') }
    throw Error('404')
  })
  assert.equal(r.background, '#ffffff')
  assert.equal(r.primary, '#0066cc')
  for (const c of palette(r)) assert.ok(!APP_TOKENS.includes(c), c)
  assert.notEqual(r.primary, DEFAULT_BRAND.primary)
  // The Apple frame is cropped to the glyph.
  const vb = fromUrl(r.logo).match(/viewBox="([^"]+)"/)[1].split(' ').map(Number)
  assert.ok(vb[3] < 20 && vb[3] > 14, vb.join(' '))
})

test('the Apple SVG viewBox is tightened to the glyph with a small margin', () => {
  const b = svgContentBounds(apple)
  assert.ok(b.x > 0.3 && b.x < 0.7 && b.x + b.w > 13.3 && b.x + b.w < 13.7, JSON.stringify(b))
  assert.ok(b.y > 11.5 && b.y < 12.5 && b.y + b.h > 27.5 && b.y + b.h < 28.5, JSON.stringify(b))
  const out = tightenSvg(apple)
  const vb = out.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number)
  assert.ok(vb[1] > 10 && vb[1] < 12 && vb[3] > 16 && vb[3] < 18, vb.join(' '))
  assert.equal(Number(out.match(/height="([^"]+)"/)[1]), vb[3]) // width/height follow the new box
  assert.ok(out.includes(apple.match(/d="([^"]+)"/)[1])) // the drawing is untouched
})

test('SVG tightening leaves what it cannot measure exactly as it was', () => {
  for (const svg of [
    '<svg viewBox="0 0 10 10"><g transform="scale(2)"><path d="M1 1h2v2z"/></g></svg>',
    '<svg viewBox="0 0 100 20"><text x="0" y="10">Logo</text></svg>',
    '<svg viewBox="0 0 10 10"><path d="M1 1 X 4"/></svg>',
    '<svg viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>', // already tight
    '<svg viewBox="0 0 10 10"><path d="M20 20h5v5z"/></svg>', // drawn outside the box
    '<svg><path d="M1 1h2v2z"/></svg>' // no box to crop
  ]) assert.equal(tightenSvg(svg), svg)
  const ok = tightenSvg('<svg viewBox="0 0 100 100" width="100" height="100"><rect x="40" y="40" width="20" height="20"/></svg>')
  assert.match(ok, /viewBox="39.2 39.2 21.6 21.6"/)
  assert.match(ok, /width="21.6"/)
})

test('path parsing handles compact arcs, relative commands and smooth curves', () => {
  const p = pathPoints('M10 10a5 5 0 105 5l-1-1s2 2 3 3q1 1 2 2t1 1z')
  assert.ok(p && p.length > 40)
  assert.deepEqual(p[0], [10, 10])
  assert.equal(pathPoints('M0 0 L'), null)
})

test('single-colour logos are found and recoloured; multicolour ones are not', () => {
  assert.equal(svgInk(apple), '#000000') // no fill paints black
  assert.equal(svgInk('<svg><path fill="#fff" d="M0 0h1v1z"/><path fill="white" d="M0 0h1v1z"/></svg>'), '#ffffff')
  assert.equal(svgInk('<svg><path fill="#f00" d="M0 0h1v1z"/><path fill="#00f" d="M0 0h1v1z"/></svg>'), '')
  assert.equal(svgInk('<svg><path fill="url(#g)" d="M0 0h1v1z"/></svg>'), '')
  const red = recolourSvg('<svg><path fill="#000" d="M0 0h1v1z"/><path fill="none" stroke="#000" d="M0 0"/></svg>', '#e3e3e3')
  assert.match(red, /<svg fill="#e3e3e3">/)
  assert.match(red, /fill="none"/)
  assert.match(red, /stroke="#e3e3e3"/)
})

test('a black logo on a dark brand is recoloured to the text colour; on white it is kept', () => {
  const dark = fitLogo(svgUrl(apple), '#121212', '#f5f5f5')
  assert.equal(dark.recoloured, '#f5f5f5')
  assert.equal(svgInk(fromUrl(dark.dataUrl)), '#f5f5f5')
  const light = fitLogo(svgUrl(apple), '#ffffff', '#1d1d1f')
  assert.equal(light.dataUrl, svgUrl(apple))
  assert.equal(light.recoloured, undefined)
})

// A tiny RGBA PNG: a black square in the middle of transparency.
function png(w, h, pixel) {
  const crc = buf => { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1 } return ~c >>> 0 }
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const body = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(body)); return Buffer.concat([len, body, c]) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = y % 2 ? 2 : 1; const row = Array.from({ length: w }, (_, x) => pixel(x, y)); let prev = [0, 0, 0, 0]; row.forEach((p, x) => { for (let k = 0; k < 4; k++) { const up = y ? pixel(x, y - 1)[k] : 0; raw[y * (w * 4 + 1) + 1 + x * 4 + k] = (p[k] - (y % 2 ? up : prev[k]) + 256) & 255 } prev = p }) }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

test('a near-monochrome PNG gets a contrasting field on a dark canvas', () => {
  const mark = png(40, 20, (x, y) => x > 10 && x < 30 && y > 5 && y < 15 ? [8, 8, 8, 255] : [0, 0, 0, 0])
  assert.equal(pngInk(mark), '#080808')
  const url = 'data:image/png;base64,' + mark.toString('base64')
  assert.equal(fitLogo(url, '#111111', '#ffffff').logoBackground, '#ffffff')
  assert.equal(fitLogo(url, '#ffffff', '#111111').logoBackground, undefined)
  const opaque = png(40, 20, () => [255, 255, 255, 255])
  assert.equal(pngInk(opaque), '') // carries its own background
})

test('brand selection recolours a black mark on a dark canvas instead of adding a white box', () => {
  const parsed = { primary: '#1ed760', background: '#121212', surface: '#1e1e1e', text: '#ffffff', muted: '#b8b8b8', headingFont: 'Brand', bodyFont: 'Brand', colors: [], colorEvidence: [] }
  const logos = [{ dataUrl: svgUrl(apple), sourceUrl: site + 'logo.svg', location: 'Official homepage mark', score: 100, variant: 'unknown' }]
  const catalog = buildBrandCatalog({ company: 'Example', website: site, parsed, logos })
  const r = applyBrandSelection({ catalog, logos, baseline: { ...parsed, website: site }, proposal: null })
  assert.equal(r.brand.logoBackground, 'transparent')
  assert.equal(svgInk(fromUrl(r.brand.logo)), '#ffffff')
  assert.ok(r.review.adjustments.some(a => /single-colour logo/i.test(a)))
})

test('regional font overrides do not replace the default company body font',()=>{
 const result=parseBrand('','body{font-family:Brand Text}body:lang(zh-TW){font-family:Regional Face}','https://company.example/','Company');
 assert.equal(result.bodyFont,'Brand Text');
});
