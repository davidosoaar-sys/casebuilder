// Shared design rules for every customer website; no changes to deal values.
const hex = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
export function websiteIdentity(brand,deck=[]) {
  const cover=deck.find(s=>s.variant==='hero'||s.blocks?.some(b=>b.style==='hero'))
  return {...brand,background:hex(cover?.design?.background,brand?.background)}
}
export function luminance(color) {
  const rgb = color.slice(1).match(/../g).map(n => parseInt(n, 16) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4)
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722
}
export function contrast(a, b) {
  const x = luminance(a), y = luminance(b)
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05)
}
const readable = (preferred, surfaces) => surfaces.every(bg => contrast(preferred, bg) >= 4.5) ? preferred : ['#000000', '#ffffff'].sort((a, b) => Math.min(...surfaces.map(bg => contrast(b, bg))) - Math.min(...surfaces.map(bg => contrast(a, bg))))[0]
export function websiteTheme(brand = {}) {
  brand ||= {}
  const background = hex(brand.background, '#111111')
  const light = luminance(background) > .4
  let surface = hex(brand.surface, light ? '#f3f4f6' : '#202224')
  // Keep the surface in the same brightness family to ensure one legible text scale.
  if ((luminance(surface) > .4) !== light) surface = light ? '#f3f4f6' : '#202224'
  if (!['#000000', '#ffffff'].some(color => [background, surface].every(bg => contrast(color, bg) >= 4.5))) surface = background
  const primary = hex(brand.primary, '#9bf0de')
  return {
    background, surface, primary, light,
    text: readable(hex(brand.text, light ? '#17191c' : '#f5f5f5'), [background, surface]),
    muted: readable(hex(brand.muted, light ? '#555d68' : '#b4bac4'), [background, surface]),
    accentText: readable(primary, [background, surface]),
    onPrimary: readable('#111111', [primary]),
    line: light ? '#dce0e5' : '#353a40'
  }
}
export function websiteThemeCss(brand) {
  const t = websiteTheme(brand)
  return `.view-website{--bg:${t.background};--panel:${t.surface};--panel3:${t.line};--ink:${t.text};--strong:${t.text};--dim:${t.muted};--faint:${t.muted};--accent:${t.primary};--mint:${t.accentText};--site-accent-text:${t.accentText};--site-on-primary:${t.onPrimary};--line:${t.line};--line2:${t.line};color-scheme:${t.light ? 'light' : 'dark'}}`
}
export function websiteBlockDesign(design = {}, brand) {
  const theme = websiteTheme(brand)
  const background = hex(design.background, theme.background)
  const color = readable(hex(design.color, theme.text), [background])
  return { ...design, color }
}
export function websiteSection(slide) {
  if (slide.websiteKind) return {kind:slide.websiteKind,nav:slide.websiteNav}
  const blocks = slide.blocks || []
  const kind = slide.variant === 'hero' || blocks.some(b => b.type === 'text' && b.style === 'hero') ? 'overview'
    : blocks.some(b => b.type === 'drivers') ? 'drivers'
    : blocks.some(b => b.type === 'stats') ? 'impact'
    : blocks.some(b => b.type === 'pairs') ? 'comparison'
    : blocks.some(b => b.type === 'versus') ? 'alternative'
    : blocks.some(b => b.type === 'room') ? 'stakeholder' : 'content'
  const names = { overview: 'Overview', impact: 'Business impact', drivers: 'Value drivers', comparison: 'What changes', alternative: 'The alternative', stakeholder: 'Your perspective' }
  const title = blocks.find(b => b.type === 'text' && ['title', 'label', 'headline'].includes(b.style) && b.text?.trim())
  return { kind, nav: names[kind] || title?.text || 'More detail' }
}

