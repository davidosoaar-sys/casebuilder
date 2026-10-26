// Logo fitting without a renderer or a dependency: tighten an SVG's viewBox to
// what it draws, find a single-colour logo's ink, and recolour or back it when
// the ink would disappear on the brand background. Anything we cannot read
// with confidence is left exactly as it was.
import zlib from 'node:zlib'
import { contrast } from '../src/export/websiteFramework.js'

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))?.slice(1).find(v => v != null) ?? null
const setAttr = (tag, name, value) => attr(tag, name) != null
  ? tag.replace(new RegExp(`(\\s${name}\\s*=\\s*)(?:"[^"]*"|'[^']*')`, 'i'), `$1"${value}"`)
  : tag.replace(/^<svg\b/i, `<svg ${name}="${value}"`)
const dropAttr = (tag, name) => tag.replace(new RegExp(`\\s${name}\\s*=\\s*(?:"[^"]*"|'[^']*')`, 'i'), '')
const round = n => Number(n.toFixed(3))

// Points along a path's outline: every vertex, plus samples along curves and
// arcs. Returns null for anything it does not understand.
export function pathPoints(d) {
  const s = String(d || ''), pts = []
  let i = 0
  const ws = () => { while (i < s.length && /[\s,]/.test(s[i])) i++ }
  const num = () => { ws(); const m = /^[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/.exec(s.slice(i)); if (!m) return null; i += m[0].length; return Number(m[0]) }
  const flag = () => { ws(); const c = s[i]; if (c !== '0' && c !== '1') return null; i++; return c === '1' }
  const add = (x, y) => pts.push([x, y])
  const bez = (p, n = 16) => {
    for (let k = 1; k <= n; k++) {
      const t = k / n, u = 1 - t
      if (p.length === 6) add(u * u * p[0] + 2 * u * t * p[2] + t * t * p[4], u * u * p[1] + 2 * u * t * p[3] + t * t * p[5])
      else add(u ** 3 * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t ** 3 * p[6], u ** 3 * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t ** 3 * p[7])
    }
  }
  // SVG arc endpoint to centre form (SVG spec, appendix F.6.5), then sampled.
  const arc = (x1, y1, rx, ry, phi, large, sweep, x2, y2) => {
    rx = Math.abs(rx); ry = Math.abs(ry)
    if (!rx || !ry || (x1 === x2 && y1 === y2)) return add(x2, y2)
    const c = Math.cos(phi * Math.PI / 180), sn = Math.sin(phi * Math.PI / 180)
    const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2, xp = c * dx + sn * dy, yp = -sn * dx + c * dy
    const scale = xp * xp / (rx * rx) + yp * yp / (ry * ry)
    if (scale > 1) { rx *= Math.sqrt(scale); ry *= Math.sqrt(scale) }
    const num2 = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp
    const k = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num2 / (rx * rx * yp * yp + ry * ry * xp * xp)))
    const cxp = k * rx * yp / ry, cyp = -k * ry * xp / rx
    const cx = c * cxp - sn * cyp + (x1 + x2) / 2, cy = sn * cxp + c * cyp + (y1 + y2) / 2
    const angle = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
    const t1 = angle(1, 0, (xp - cxp) / rx, (yp - cyp) / ry)
    let dt = angle((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry)
    if (!sweep && dt > 0) dt -= 2 * Math.PI
    if (sweep && dt < 0) dt += 2 * Math.PI
    for (let n = 1; n <= 24; n++) {
      const t = t1 + dt * n / 24
      add(cx + rx * Math.cos(t) * c - ry * Math.sin(t) * sn, cy + rx * Math.cos(t) * sn + ry * Math.sin(t) * c)
    }
  }
  let cmd = '', x = 0, y = 0, sx = 0, sy = 0, px = 0, py = 0, last = ''
  for (;;) {
    ws()
    if (i >= s.length) break
    if (/[a-z]/i.test(s[i])) { cmd = s[i++]; if (!/[mlhvcsqtaz]/i.test(cmd)) return null }
    else if (!cmd) return null
    const C = cmd.toUpperCase(), rel = cmd !== C
    const ox = rel ? x : 0, oy = rel ? y : 0
    const read = n => { const out = []; for (let k = 0; k < n; k++) { const v = num(); if (v == null) return null; out.push(v) } return out }
    if (C === 'Z') { x = sx; y = sy; last = 'Z'; cmd = ''; continue }
    if (C === 'M' || C === 'L' || C === 'T') {
      const a = read(2); if (!a) return null
      const nx = a[0] + ox, ny = a[1] + oy
      if (C === 'T') { const cx = /[QT]/.test(last) ? 2 * x - px : x, cy = /[QT]/.test(last) ? 2 * y - py : y; bez([x, y, cx, cy, nx, ny]); px = cx; py = cy }
      else add(nx, ny)
      if (C === 'M') { sx = nx; sy = ny; cmd = rel ? 'l' : 'L' }
      x = nx; y = ny
    } else if (C === 'H' || C === 'V') {
      const a = read(1); if (!a) return null
      if (C === 'H') x = a[0] + ox; else y = a[0] + oy
      add(x, y)
    } else if (C === 'C' || C === 'S') {
      const a = read(C === 'C' ? 6 : 4); if (!a) return null
      const c1 = C === 'C' ? [a[0] + ox, a[1] + oy] : /[CS]/.test(last) ? [2 * x - px, 2 * y - py] : [x, y]
      const r = C === 'C' ? a.slice(2) : a
      const c2 = [r[0] + ox, r[1] + oy], e = [r[2] + ox, r[3] + oy]
      bez([x, y, ...c1, ...c2, ...e]); px = c2[0]; py = c2[1]; x = e[0]; y = e[1]
    } else if (C === 'Q') {
      const a = read(4); if (!a) return null
      const c1 = [a[0] + ox, a[1] + oy], e = [a[2] + ox, a[3] + oy]
      bez([x, y, ...c1, ...e]); px = c1[0]; py = c1[1]; x = e[0]; y = e[1]
    } else if (C === 'A') {
      const r = read(3); if (!r) return null
      const large = flag(), sweep = flag(); if (large == null || sweep == null) return null
      const e = read(2); if (!e) return null
      arc(x, y, r[0], r[1], r[2], large, sweep, e[0] + ox, e[1] + oy); x = e[0] + ox; y = e[1] + oy
    }
    last = C
  }
  return pts
}

const numAttr = (tag, name, fallback = 0) => {
  const v = attr(tag, name)
  if (v == null) return fallback
  if (!/^\s*[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?(?:px)?\s*$/i.test(v)) return NaN // %, em, calc: not ours to guess
  return parseFloat(v)
}

// The box of everything an SVG draws, in user units, or null when unsure
// (transforms, text, nested viewports, relative units).
export function svgContentBounds(svg) {
  if ((svg.match(/<svg\b/gi) || []).length !== 1 || /\btransform\s*[=:]|<(?:text|image|use|foreignObject|pattern|marker)\b/i.test(svg)) return null
  const drawn = svg.replace(/<(defs|clipPath|mask|symbol|linearGradient|radialGradient|style)\b[\s\S]*?<\/\1>/gi, '')
  const pts = []
  for (const [tag, name] of [...drawn.matchAll(/<(path|rect|circle|ellipse|line|polygon|polyline)\b[^>]*>/gi)].map(m => [m[0], m[1].toLowerCase()])) {
    if (name === 'path') { const p = pathPoints(attr(tag, 'd')); if (!p) return null; pts.push(...p) }
    else if (name === 'rect') { const x = numAttr(tag, 'x'), y = numAttr(tag, 'y'), w = numAttr(tag, 'width'), h = numAttr(tag, 'height'); pts.push([x, y], [x + w, y + h]) }
    else if (name === 'circle' || name === 'ellipse') { const cx = numAttr(tag, 'cx'), cy = numAttr(tag, 'cy'), rx = numAttr(tag, name === 'circle' ? 'r' : 'rx'), ry = numAttr(tag, name === 'circle' ? 'r' : 'ry'); pts.push([cx - rx, cy - ry], [cx + rx, cy + ry]) }
    else if (name === 'line') pts.push([numAttr(tag, 'x1'), numAttr(tag, 'y1')], [numAttr(tag, 'x2'), numAttr(tag, 'y2')])
    else { const n = String(attr(tag, 'points') || '').trim().split(/[\s,]+/).map(Number); for (let k = 0; k + 1 < n.length; k += 2) pts.push([n[k], n[k + 1]]) }
  }
  if (!pts.length || pts.some(p => !p.every(Number.isFinite))) return null
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  let stroke = 0
  if (/\bstroke\s*[=:]\s*["']?(?!none)[#a-z]/i.test(svg)) stroke = Math.max(1, ...[...svg.matchAll(/stroke-width\s*[=:]\s*["']?([\d.]+)/gi)].map(m => Number(m[1]) || 0)) / 2
  return { x: Math.min(...xs) - stroke, y: Math.min(...ys) - stroke, w: Math.max(...xs) - Math.min(...xs) + 2 * stroke, h: Math.max(...ys) - Math.min(...ys) + 2 * stroke }
}

// Crop the viewBox to the drawing plus a small margin, so a tall icon frame
// (Apple's 14 x 44 with the glyph in the middle) sizes like the glyph.
// The result is never larger than the original and never empty.
export function tightenSvg(svg) {
  const tag = svg.match(/<svg\b[^>]*>/i)?.[0]
  if (!tag) return svg
  let vb = String(attr(tag, 'viewBox') || '').trim().split(/[\s,]+/).map(Number)
  const w0 = numAttr(tag, 'width', NaN), h0 = numAttr(tag, 'height', NaN)
  if (vb.length !== 4 || !vb.every(Number.isFinite)) vb = Number.isFinite(w0) && Number.isFinite(h0) ? [0, 0, w0, h0] : null
  if (!vb || vb[2] <= 0 || vb[3] <= 0) return svg
  const b = svgContentBounds(svg)
  if (!b) return svg
  const pad = Math.max(b.w, b.h) * 0.04
  const x1 = Math.max(vb[0], b.x - pad), y1 = Math.max(vb[1], b.y - pad)
  const x2 = Math.min(vb[0] + vb[2], b.x + b.w + pad), y2 = Math.min(vb[1] + vb[3], b.y + b.h + pad)
  if (x2 - x1 <= 0 || y2 - y1 <= 0) return svg
  if ((x2 - x1) * (y2 - y1) > vb[2] * vb[3] * 0.85) return svg // already tight enough
  let next = setAttr(tag, 'viewBox', [x1, y1, x2 - x1, y2 - y1].map(round).join(' '))
  if (Number.isFinite(w0) && Number.isFinite(h0)) {
    const k = w0 / vb[2]
    next = setAttr(setAttr(next, 'width', round((x2 - x1) * k)), 'height', round((y2 - y1) * (h0 / vb[3])))
  } else next = dropAttr(dropAttr(next, 'width'), 'height')
  return svg.replace(tag, next)
}

const NAMED = { black: '#000000', white: '#ffffff' }
export function toHex(value) {
  const v = String(value || '').trim().toLowerCase()
  if (NAMED[v]) return NAMED[v]
  const h = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/)?.[1]
  if (h) return '#' + (h.length === 3 ? [...h].map(c => c + c).join('') : h)
  const rgb = v.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/)
  if (rgb) return '#' + rgb.slice(1, 4).map(n => Math.min(255, Number(n)).toString(16).padStart(2, '0')).join('')
  return ''
}

// The one colour a logo is drawn in, or '' (several colours, gradients,
// colours we cannot read). Shapes without a fill paint black, as browsers do.
export function svgInk(svg) {
  const values = [...svg.matchAll(/\b(?:fill|stroke)\s*(?:=\s*["']([^"']*)["']|:\s*([^;"'}]+))/gi)].map(m => (m[1] ?? m[2]).trim().toLowerCase())
  const colours = new Set()
  for (const v of values) {
    if (/^(none|transparent)$/.test(v)) continue
    const hex = toHex(v)
    if (!hex) return ''
    colours.add(hex)
  }
  const rootFill = toHex(attr(svg.match(/<svg\b[^>]*>/i)?.[0] || '', 'fill'))
  const styled = /<style\b|<g\b[^>]*\sfill\s*=/i.test(svg)
  const bare = [...svg.matchAll(/<(?:path|rect|circle|ellipse|polygon|polyline)\b[^>]*>/gi)].some(m => !/\s(?:fill\s*=|style\s*=\s*["'][^"']*fill\s*:)/i.test(m[0]))
  if (bare && !styled) colours.add(rootFill || '#000000')
  if (!colours.size) return ''
  const list = [...colours]
  const rgb = c => c.slice(1).match(/../g).map(n => parseInt(n, 16))
  const ref = rgb(list[0])
  return list.every(c => rgb(c).every((v, k) => Math.abs(v - ref[k]) <= 24)) ? list[0] : ''
}

// Paint every fill and stroke (and shapes with none) in one colour. Only used
// on single-colour marks, so the drawing itself is unchanged.
export function recolourSvg(svg, colour) {
  let out = svg.replace(/(\b(?:fill|stroke)\s*=\s*["'])([^"']*)(["'])/gi, (all, a, v, b) => /^(none|transparent)$/i.test(v.trim()) ? all : a + colour + b)
  out = out.replace(/(\b(?:fill|stroke)\s*:\s*)([^;"'}]+)/gi, (all, a, v) => /^(none|transparent)$/i.test(v.trim()) ? all : a + colour)
  const tag = out.match(/<svg\b[^>]*>/i)[0]
  return out.replace(tag, setAttr(tag, 'fill', colour))
}

// A PNG's ink when the mark is one colour on transparency, else ''. Plain
// 8-bit non-interlaced PNGs only; anything else is left to the display check.
export function pngInk(buffer) {
  try {
    if (!buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return ''
    let o = 8, w = 0, h = 0, depth = 0, type = 0, interlace = 0, palette = null, alpha = null
    const idat = []
    while (o + 8 <= buffer.length) {
      const len = buffer.readUInt32BE(o), kind = buffer.toString('ascii', o + 4, o + 8), data = buffer.subarray(o + 8, o + 8 + len)
      if (kind === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; type = data[9]; interlace = data[12] }
      else if (kind === 'PLTE') palette = data
      else if (kind === 'tRNS') alpha = data
      else if (kind === 'IDAT') idat.push(data)
      else if (kind === 'IEND') break
      o += 12 + len
    }
    const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type]
    if (depth !== 8 || interlace || !channels || !w || !h || w * h > 4_000_000) return ''
    const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * channels
    if (raw.length < (stride + 1) * h) return ''
    const rows = Buffer.alloc(stride * h)
    for (let r = 0; r < h; r++) {
      const f = raw[r * (stride + 1)], src = r * (stride + 1) + 1, dst = r * stride
      for (let k = 0; k < stride; k++) {
        const a = k >= channels ? rows[dst + k - channels] : 0, b = r ? rows[dst - stride + k] : 0, c = r && k >= channels ? rows[dst - stride + k - channels] : 0
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        const pred = f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : f === 4 ? (pa <= pb && pa <= pc ? a : pb <= pc ? b : c) : 0
        rows[dst + k] = (raw[src + k] + pred) & 255
      }
    }
    const ink = [], step = Math.max(1, Math.floor((w * h) / 40000))
    let clear = 0, total = 0
    for (let n = 0; n < w * h; n += step) {
      const q = n * channels
      let rgba
      if (type === 0) rgba = [rows[q], rows[q], rows[q], 255]
      else if (type === 4) rgba = [rows[q], rows[q], rows[q], rows[q + 1]]
      else if (type === 2) rgba = [rows[q], rows[q + 1], rows[q + 2], 255]
      else if (type === 6) rgba = [rows[q], rows[q + 1], rows[q + 2], rows[q + 3]]
      else { const i = rows[q]; if (!palette || i * 3 + 2 >= palette.length) return ''; rgba = [palette[i * 3], palette[i * 3 + 1], palette[i * 3 + 2], alpha && i < alpha.length ? alpha[i] : 255] }
      total++
      if (rgba[3] < 128) clear++
      else ink.push(rgba)
    }
    // An opaque image carries its own background; that is not single-colour ink.
    if (!ink.length || clear / total < 0.1) return ''
    const mean = [0, 1, 2].map(k => Math.round(ink.reduce((s, p) => s + p[k], 0) / ink.length))
    const close = ink.filter(p => p.slice(0, 3).every((v, k) => Math.abs(v - mean[k]) <= 48)).length
    return close / ink.length >= 0.9 ? '#' + mean.map(v => v.toString(16).padStart(2, '0')).join('') : ''
  } catch { return '' }
}

// Make a single-colour logo read on the page: an SVG is recoloured to the brand
// text colour (or black / white), a PNG gets a plain field behind it.
// Returns { dataUrl, recoloured?, logoBackground? }.
export function fitLogo(dataUrl, background, text) {
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(dataUrl || '')
  if (!m || !/^#[0-9a-f]{6}$/i.test(background)) return { dataUrl }
  const bytes = Buffer.from(m[2], 'base64')
  if (m[1] === 'image/svg+xml') {
    const svg = bytes.toString('utf8'), ink = svgInk(svg)
    if (!ink || contrast(ink, background) >= 3) return { dataUrl }
    const to = /^#[0-9a-f]{6}$/i.test(text) && contrast(text, background) >= 3 ? text : contrast('#000000', background) >= contrast('#ffffff', background) ? '#000000' : '#ffffff'
    return { dataUrl: 'data:image/svg+xml;base64,' + Buffer.from(recolourSvg(svg, to)).toString('base64'), recoloured: to }
  }
  if (m[1] === 'image/png') {
    const ink = pngInk(bytes)
    if (ink && contrast(ink, background) < 3) return { dataUrl, logoBackground: contrast(ink, '#ffffff') >= contrast(ink, '#000000') ? '#ffffff' : '#000000' }
  }
  return { dataUrl }
}
