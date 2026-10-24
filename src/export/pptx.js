// PowerPoint export. Takes resolved slides (see resolveSlides in deck/model.js)
// and lays their blocks out top to bottom on 16:9 slides using real, editable
// PowerPoint text boxes and shapes. Nothing is a screenshot.
//
// deps lets the caller supply the browser-only bits (rasterising the logo,
// measuring images) so this module can also run under Node for testing.

import { normalizeBrand, blockDesign } from '../brand.js'

const W = 13.333
const H = 7.5
const MX = 0.7
const CW = W - MX * 2
const TOP = 0.6
const BOTTOM = H - 0.55
const FONT = 'Arial'

const C = {
  bg: '111111',
  panel: '1E1E1E',
  track: '323335',
  line: '46484B',
  ink: 'E3E3E3',
  strong: 'FFFFFF',
  dim: 'A9ACB1',
  faint: '797C82',
  accent: '9BF0DE',
  mint: '9BF0DE',
  bad: 'E5399A',
  warn: 'FFBA00'
}

// size in points, plus spacing below, per text style
const STYLE = {
  hero: { size: 50, bold: true, color: C.strong, gap: 0.22 },
  headline: { size: 38, bold: true, color: C.strong, gap: 0.18 },
  title: { size: 30, bold: true, color: C.strong, gap: 0.14 },
  sub: { size: 16, color: C.dim, gap: 0.24 },
  lede: { size: 19, color: C.dim, gap: 0.24 },
  body: { size: 16, color: C.ink, gap: 0.2 },
  note: { size: 14, color: C.dim, gap: 0.2 },
  label: { size: 11, bold: true, color: C.mint, gap: 0.2, caps: true, spacing: 1 },
  eyebrow: { size: 11, bold: true, color: C.dim, gap: 0.2, caps: true, spacing: 1 },
  tag: { size: 11, bold: true, color: C.warn, gap: 0.22, caps: true },
  forwhom: { size: 11, bold: true, color: C.faint, gap: 0.2, caps: true, spacing: 1 },
  caption: { size: 11, color: C.faint, gap: 0.15 }
}

const hex = c => String(c || '').replace('#', '').toUpperCase()
const DEFAULTS = { colors: C, font: FONT, styles: STYLE }

// Rough text height: characters per line from the box width and font size.
function textHeight(str, size, widthIn, bold) {
  const perLine = Math.max(8, Math.floor((widthIn * 72) / (size * (bold ? 0.56 : 0.5))))
  const lines = String(str)
    .split('\n')
    .reduce((n, l) => n + Math.max(1, Math.ceil(l.length / perLine)), 0)
  return (lines * size * 1.22) / 72
}

const parasHeight = (paras, size, widthIn) =>
  paras.reduce((h, p) => {
    if (p.type === 'ul') return h + p.items.reduce((s, i) => s + textHeight(i, size, widthIn - 0.3) + 0.06, 0) + 0.1
    return h + textHeight(p.text, size, widthIn) + 0.12
  }, 0)

function paraRuns(paras, size, color) {
  const runs = []
  paras.forEach(p => {
    if (p.type === 'ul') {
      p.items.forEach(i =>
        runs.push({ text: i, options: { bullet: { indent: 18 }, breakLine: true, fontSize: size, color, paraSpaceAfter: 4 } })
      )
    } else {
      runs.push({ text: p.text, options: { breakLine: true, fontSize: size, color, paraSpaceAfter: 8 } })
    }
  })
  return runs
}

// Each block becomes { h, draw(slide, y, k) }: its height at scale 1 and a
// function that draws it at vertical position y, scaled by k.
async function layoutBlock(b, deps, theme = DEFAULTS) {
  const { colors: C, font: FONT, styles: STYLE } = theme
  switch (b.kind) {
    case 'text': {
      const base = STYLE[b.style] || STYLE.body
      const safeStyle = blockDesign(b.design)
      const st = { ...base, ...(safeStyle.fontSize ? { size: parseFloat(safeStyle.fontSize) * .75 } : {}), ...(safeStyle.color ? { color: hex(safeStyle.color) } : {}) }
      if (b.style === 'body') {
        const paras = b.paras || []
        const h = parasHeight(paras, st.size, CW) + st.gap
        return {
          h,
          draw: (s, y, k) =>
            s.addText(paraRuns(paras, st.size * k, st.color), { x: MX, y, w: CW, h: h * k - st.gap * k, fontFace: FONT, valign: 'top', margin: 0 })
        }
      }
      const t = st.caps ? b.text.toUpperCase() : b.text
      const h = textHeight(t, st.size, CW, st.bold) + st.gap
      return {
        h,
        draw: (s, y, k) =>
          s.addText(t, {
            x: MX, y, w: b.style === 'tag' && safeStyle['--badge-background'] ? Math.min(CW, t.length * st.size / 72 * .62 + .3) : CW, h: h * k - st.gap * k, fontFace: FONT, fontSize: st.size * k, bold: !!st.bold,
            ...(b.style === 'tag' && safeStyle['--badge-background'] ? { fill: { color: hex(safeStyle['--badge-background']) }, margin: 4 } : {}),
            color: st.color, valign: 'top', margin: b.style === 'tag' && safeStyle['--badge-background'] ? 4 : 0, charSpacing: st.spacing || 0, italic: false
          })
      }
    }
    case 'quote': {
      const h = textHeight(b.text, 18, CW - 0.4) + 0.4
      return {
        h,
        draw: (s, y, k) => {
          s.addShape('rect', { x: MX, y, w: 0.06, h: (h - 0.2) * k, fill: { color: C.accent }, line: { color: C.accent, width: 0 } })
          s.addText(b.text, { x: MX + 0.25, y, w: CW - 0.25, h: (h - 0.2) * k, fontFace: FONT, fontSize: 18 * k, italic: true, color: C.strong, valign: 'top', margin: 0 })
        }
      }
    }
    case 'columns': {
      const colW = (CW - 0.5) / 2
      const h = Math.max(parasHeight(b.left, 16, colW), parasHeight(b.right, 16, colW)) + 0.2
      return {
        h,
        draw: (s, y, k) => {
          ;[b.left, b.right].forEach((paras, i) =>
            s.addText(paraRuns(paras, 16 * k, C.ink), { x: MX + i * (colW + 0.5), y, w: colW, h: (h - 0.2) * k, fontFace: FONT, valign: 'top', margin: 0 })
          )
        }
      }
    }
    case 'image': {
      if (!b.src) return { h: 0, draw: () => {} }
      const dims = await deps.imageSize(b.src)
      const maxW = CW
      const maxH = 3.7
      const ratio = dims.w / dims.h
      let w = maxW
      let hh = w / ratio
      if (hh > maxH) {
        hh = maxH
        w = hh * ratio
      }
      const capH = b.caption ? 0.35 : 0
      return {
        h: hh + capH + 0.2,
        draw: (s, y, k) => {
          s.addImage({ data: b.src, x: MX, y, w: w * k, h: hh * k })
          if (b.caption) s.addText(b.caption, { x: MX, y: y + hh * k + 0.05, w: CW, h: 0.3, fontFace: FONT, fontSize: 11, color: C.faint, margin: 0 })
        }
      }
    }
    case 'logo': {
      const png = await deps.logoPng()
      if (!png) return { h: 0, draw: () => {} }
      return { h: 0.7, draw: (s, y, k) => s.addImage({ data: png.data, x: MX, y, w: 0.34 * png.ratio * k, h: 0.34 * k }) }
    }
    case 'divider':
      return { h: 0.35, draw: (s, y) => s.addShape('line', { x: MX, y: y + 0.1, w: CW, h: 0, line: { color: C.line, width: 1 } }) }
    case 'spacer':
      return { h: 0.45, draw: () => {} }
    case 'stats': {
      const items = b.items
      const per = items.length <= 3 ? items.length || 1 : 3
      const rows = Math.ceil(items.length / per)
      const gap = 0.18
      const tw = (CW - gap * (per - 1)) / per
      const th = 1.12
      return {
        h: rows * th + (rows - 1) * gap + 0.3,
        draw: (s, y, k) =>
          items.forEach((it, i) => {
            const x = MX + (i % per) * (tw + gap)
            const yy = y + Math.floor(i / per) * (th + gap) * k
            s.addShape('roundRect', { x, y: yy, w: tw, h: th * k, rectRadius: 0.06, fill: { color: C.panel }, line: { color: C.track, width: 1 } })
            s.addText(it.label.toUpperCase(), { x: x + 0.2, y: yy + 0.14 * k, w: tw - 0.3, h: 0.25, fontFace: FONT, fontSize: 9 * k, bold: true, color: C.faint, charSpacing: 1, margin: 0 })
            s.addText(it.value, {
              x: x + 0.2, y: yy + 0.42 * k, w: tw - 0.3, h: 0.55 * k, fontFace: FONT, fontSize: 28 * k, bold: true, margin: 0,
              color: it.tone === 'good' ? C.accent : it.tone === 'bad' ? C.bad : C.strong
            })
            if (it.eq) s.addText(it.eq, { x: x + 0.2, y: yy + 0.86 * k, w: tw - 0.3, h: 0.2 * k, fontFace: 'Consolas', fontSize: 7 * k, color: C.faint, margin: 0, fit: 'shrink' })
          })
      }
    }
    case 'drivers': {
      // pillar headings and driver rows, in one list
      const items = []
      b.groups.forEach(g => {
        items.push({ head: g })
        g.rows.forEach(d => items.push({ row: d }))
      })
      const hh = 0.42
      const rh = 0.62
      const height = items.reduce((t, it) => t + (it.head ? hh : rh), 0)
      return {
        h: height + 0.95,
        draw: (s, y, k) => {
          let yy = y
          items.forEach(it => {
            if (it.head) {
              const g = it.head
              s.addText(g.label.toUpperCase(), { x: MX, y: yy, w: 5, h: 0.3 * k, fontFace: FONT, fontSize: 10 * k, bold: true, color: g.leads ? C.accent : C.strong, charSpacing: 1, margin: 0, valign: 'middle' })
              s.addText(g.total, { x: W - MX - 1.6, y: yy, w: 1.6, h: 0.3 * k, fontFace: FONT, fontSize: 11 * k, bold: true, color: C.dim, align: 'right', margin: 0, valign: 'middle' })
              yy += hh * k
              return
            }
            const d = it.row
            const trackX = MX + 3.5
            const trackW = CW - 3.5 - 1.7
            s.addText(d.label, { x: MX, y: yy, w: 3.4, h: 0.3 * k, fontFace: FONT, fontSize: 12 * k, bold: d.lead, color: d.lead ? C.strong : C.dim, margin: 0, valign: 'middle' })
            s.addShape('roundRect', { x: trackX, y: yy + 0.07 * k, w: trackW, h: 0.16 * k, rectRadius: 0.08, fill: { color: C.track }, line: { color: C.track, width: 0 } })
            s.addShape('roundRect', {
              x: trackX, y: yy + 0.07 * k, w: Math.max(0.05, trackW * (d.pct / 100)), h: 0.16 * k, rectRadius: 0.08,
              fill: { color: hex(d.key === 'platform' ? C.accent : d.color), transparency: d.lead ? 0 : 55 }, line: { color: hex(d.color), width: 0 }
            })
            s.addText(d.valueStr, { x: W - MX - 1.6, y: yy, w: 1.6, h: 0.3 * k, fontFace: FONT, fontSize: 12 * k, bold: d.lead, color: d.lead ? C.strong : C.dim, align: 'right', margin: 0, valign: 'middle' })
            s.addText(d.detail, { x: trackX, y: yy + 0.3 * k, w: CW - 3.5, h: 0.22 * k, fontFace: 'Consolas', fontSize: 8 * k, color: C.faint, margin: 0, valign: 'top', fit: 'shrink' })
            yy += rh * k
          })
          const ty = y + height * k + 0.08
          s.addShape('line', { x: MX, y: ty, w: CW, h: 0, line: { color: C.track, width: 1 } })
          s.addText('TOTAL ANNUAL VALUE', { x: MX, y: ty + 0.1, w: 5, h: 0.4 * k, fontFace: FONT, fontSize: 10 * k, bold: true, color: C.dim, charSpacing: 1, margin: 0, valign: 'middle' })
          s.addText(b.total, { x: W - MX - 4, y: ty + 0.06, w: 4, h: 0.5 * k, fontFace: FONT, fontSize: 24 * k, bold: true, color: C.strong, align: 'right', margin: 0, valign: 'middle' })
          s.addText(b.totalEq, { x: MX, y: ty + 0.56 * k, w: CW, h: 0.22 * k, fontFace: 'Consolas', fontSize: 8 * k, color: C.faint, margin: 0, fit: 'shrink' })
        }
      }
    }
    case 'pairs': {
      const rh = 0.72
      return {
        h: b.rows.length * rh + 0.5,
        draw: (s, y, k) => {
          const cx = [MX + 4.2, MX + 6.2, MX + 8.3]
          ;['TODAY', 'WITH PORTAL', 'DIFFERENCE'].forEach((t, i) =>
            s.addText(t, { x: cx[i], y, w: 1.9, h: 0.25 * k, fontFace: FONT, fontSize: 9 * k, bold: true, color: C.faint, charSpacing: 1, align: 'right', margin: 0 })
          )
          b.rows.forEach((p, i) => {
            const yy = y + (0.36 + i * rh) * k
            s.addText(p.label + (p.unit ? ' (' + p.unit + ')' : ''), { x: MX, y: yy, w: 4.1, h: 0.32 * k, fontFace: FONT, fontSize: 12 * k, color: C.ink, margin: 0, valign: 'middle', fit: 'shrink' })
            ;[p.today, p.portal, p.diff].forEach((v, j) =>
              s.addText(v, { x: cx[j], y: yy, w: 1.9, h: 0.32 * k, fontFace: FONT, fontSize: 14 * k, bold: j === 2, color: j === 2 ? C.accent : C.strong, align: 'right', margin: 0, valign: 'middle' })
            )
            s.addText(p.saved + ': worth ' + p.value, { x: MX, y: yy + 0.33 * k, w: CW, h: 0.22 * k, fontFace: FONT, fontSize: 9 * k, color: C.faint, margin: 0 })
          })
        }
      }
    }
    case 'versus': {
      const note = `${b.lead} ${b.verdict}`
      const nh = textHeight(note, 14, CW) + 0.1
      return {
        h: 2 * 0.62 + nh + 0.4,
        draw: (s, y, k) => {
          b.rows.forEach((r, i) => {
            const yy = y + i * 0.62 * k
            const trackX = MX + 3.2
            const trackW = CW - 3.2 - 1.7
            s.addText(r.name, { x: MX, y: yy, w: 3.1, h: 0.4 * k, fontFace: FONT, fontSize: 14 * k, color: C.ink, margin: 0, valign: 'middle' })
            s.addShape('roundRect', { x: trackX, y: yy + 0.05 * k, w: trackW, h: 0.3 * k, rectRadius: 0.15, fill: { color: C.track }, line: { color: C.track, width: 0 } })
            s.addShape('roundRect', {
              x: trackX, y: yy + 0.05 * k, w: Math.max(0.05, trackW * (r.pct / 100)), h: 0.3 * k, rectRadius: 0.15,
              fill: { color: r.tone === 'bad' ? 'E0636A' : C.accent }, line: { color: C.accent, width: 0 }
            })
            s.addText(r.valueStr, { x: W - MX - 1.6, y: yy, w: 1.6, h: 0.4 * k, fontFace: FONT, fontSize: 15 * k, bold: true, color: C.strong, align: 'right', margin: 0, valign: 'middle' })
            if (r.eq) s.addText(r.eq, { x: trackX, y: yy + 0.38 * k, w: trackW, h: 0.2 * k, fontFace: 'Consolas', fontSize: 8 * k, color: C.faint, margin: 0, fit: 'shrink' })
          })
          s.addText(
            [
              { text: b.lead + ' ', options: { color: C.dim } },
              { text: b.verdict, options: { color: C.strong, bold: true } }
            ],
            { x: MX, y: y + 2 * 0.62 * k + 0.15, w: CW, h: nh * k, fontFace: FONT, fontSize: 14 * k, valign: 'top', margin: 0 }
          )
        }
      }
    }
    case 'room': {
      const colW = (CW - 0.6) / 2
      const left = b.needs.reduce((h, n) => h + textHeight(n, 15, colW - 0.3) + 0.08, 0) + 0.45
      const right = 0.45 + textHeight(b.objection, 16, colW - 0.4) + 0.3 + 0.45 + textHeight(b.counter, 15, colW) + 0.1
      return {
        h: Math.max(left, right) + 0.2,
        draw: (s, y, k) => {
          s.addText('WHAT THEY NEED TO SEE', { x: MX, y, w: colW, h: 0.3 * k, fontFace: FONT, fontSize: 10 * k, bold: true, color: C.dim, charSpacing: 1, margin: 0 })
          s.addText(
            b.needs.map(n => ({ text: n, options: { bullet: { indent: 18 }, breakLine: true, fontSize: 15 * k, color: C.ink, paraSpaceAfter: 5 } })),
            { x: MX, y: y + 0.4 * k, w: colW, h: (left - 0.4) * k, fontFace: FONT, valign: 'top', margin: 0 }
          )
          const rx = MX + colW + 0.6
          s.addText('THE OBJECTION', { x: rx, y, w: colW, h: 0.3 * k, fontFace: FONT, fontSize: 10 * k, bold: true, color: C.dim, charSpacing: 1, margin: 0 })
          const qh = textHeight(b.objection, 16, colW - 0.4) + 0.2
          s.addShape('rect', { x: rx, y: y + 0.4 * k, w: 0.05, h: qh * k, fill: { color: C.accent }, line: { color: C.accent, width: 0 } })
          s.addText(b.objection, { x: rx + 0.2, y: y + 0.4 * k, w: colW - 0.2, h: qh * k, fontFace: FONT, fontSize: 16 * k, italic: true, color: C.strong, valign: 'middle', margin: 0 })
          const cy = y + (0.4 + qh + 0.3) * k
          s.addText('THE COUNTER', { x: rx, y: cy, w: colW, h: 0.3 * k, fontFace: FONT, fontSize: 10 * k, bold: true, color: C.dim, charSpacing: 1, margin: 0 })
          s.addText(b.counter, { x: rx, y: cy + 0.4 * k, w: colW, h: textHeight(b.counter, 15, colW) * k, fontFace: FONT, fontSize: 15 * k, color: C.ink, valign: 'top', margin: 0 })
        }
      }
    }
    default:
      return { h: 0, draw: () => {} }
  }
}

// deps: { PptxGenJS, logoPng(): {data, ratio} | null, imageSize(src): {w,h} }
export async function buildPptx({ company, slides, deps, brand }) {
  const b = normalizeBrand(brand)
  const officeFont = name => ['system-ui', 'sans-serif'].includes(name) ? 'Arial' : name
  const colors = brand ? { ...DEFAULTS.colors, bg: hex(b.background), panel: hex(b.surface), ink: hex(b.text), strong: hex(b.text), dim: hex(b.muted), faint: hex(b.muted), accent: hex(b.primary), mint: hex(b.primary) } : DEFAULTS.colors
  const styles = Object.fromEntries(Object.entries(DEFAULTS.styles).map(([key, style]) => [key, { ...style, color: style.color === DEFAULTS.colors.strong ? colors.strong : style.color === DEFAULTS.colors.ink ? colors.ink : style.color === DEFAULTS.colors.mint ? colors.mint : style.color === DEFAULTS.colors.faint ? colors.faint : style.color === DEFAULTS.colors.dim ? colors.dim : style.color }]))
  const theme = { colors, font: brand ? officeFont(b.bodyFont) : DEFAULTS.font, styles }
  const C = colors, FONT = theme.font
  const pptx = new deps.PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.title = `${company} - business case`
  pptx.company = 'Spotify'

  let n = 0
  for (const sl of slides) {
    n += 1
    const s = pptx.addSlide()
    s.background = { color: /^#[0-9a-f]{6}$/i.test(sl.design?.background) ? hex(sl.design.background) : C.bg }
    const nativeText = s.addText.bind(s)
    let activeDesign = {}, heading = false
    s.addText = (text, options) => {
      const design = blockDesign(activeDesign)
      return nativeText(text, { ...options,
        ...(brand && heading ? { fontFace: officeFont(b.headingFont) } : {}),
        ...(design.fontFamily ? { fontFace: activeDesign.font } : {}),
        ...(design.color ? { color: hex(design.color) } : {}),
        ...(design.textAlign ? { align: design.textAlign } : {}),
        ...(design.fontWeight ? { bold: Number(design.fontWeight) >= 600 } : {}),
        fit: 'shrink'
      })
    }
    if (sl.variant === 'hero' && !sl.design?.background) {
      // A soft teal glow bottom-right stands in for the gradient.
      s.addShape('ellipse', { x: W - 6.2, y: H - 5.2, w: 9, h: 9, fill: { color: C.panel, transparency: 40 }, line: { color: C.panel, width: 0, transparency: 100 } })
      s.addShape('ellipse', { x: W - 4.2, y: H - 3.8, w: 6, h: 6, fill: { color: C.accent, transparency: 86 }, line: { color: C.accent, width: 0, transparency: 100 } })
    }

    const laid = []
    for (const block of sl.blocks) laid.push({ ...await layoutBlock(block, deps, theme), block })

    const total = laid.reduce((h, l) => h + l.h, 0)
    const avail = BOTTOM - TOP
    const k = total > avail ? Math.max(0.5, avail / total) : 1

    let y = sl.variant === 'hero' && total * k < avail - 1 ? TOP + Math.min(1, (avail - total * k) / 3) : TOP
    for (const l of laid) {
      activeDesign = l.block.design || {}
      heading = l.block.kind === 'text' && ['hero', 'headline', 'title'].includes(l.block.style)
      if (/^#[0-9a-f]{6}$/i.test(activeDesign.background)) s.addShape('rect', { x: MX, y, w: CW, h: l.h * k, fill: { color: hex(activeDesign.background) }, line: { transparency: 100 } })
      l.draw(s, y, k)
      y += l.h * k
    }
    activeDesign = {}; heading = false

    s.addText(`${company}  ·  Business case`, { x: MX, y: H - 0.42, w: 6, h: 0.25, fontFace: FONT, fontSize: 9, color: C.faint, margin: 0 })
    s.addText(String(n), { x: W - MX - 1, y: H - 0.42, w: 1, h: 0.25, fontFace: FONT, fontSize: 9, color: C.faint, align: 'right', margin: 0 })
  }
  return pptx
}
