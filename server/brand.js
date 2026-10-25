import https from 'node:https'
import { runWithSearch } from './agentSearch.js'
import { lookup } from 'node:dns/promises'
import Anthropic from '@anthropic-ai/sdk'
import { normalizeBrand } from '../src/brand.js'
import { agentInstruction } from './agent-commands/index.js'
import { AGENT_COMMANDS } from '../src/agentCommands.js'

export function publicAddress(address) {
  if (address.includes(':')) return /^[23][0-9a-f]{3}:/i.test(address) && !/^2001:(db8|0):/i.test(address)
  const p = address.split('.').map(Number)
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false
  return !([0, 10, 127].includes(p[0]) || p[0] >= 224 ||
    (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && [0, 168].includes(p[1])) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127) ||
    (p[0] === 198 && [18, 19, 51].includes(p[1])) || (p[0] === 203 && p[1] === 0 && p[2] === 113))
}

// Resolve and pin public IPs for every request, including every redirect.
// Website content cannot turn this endpoint into an internal-network proxy.
export async function fetchPublic(input, { limit = 1_500_000, redirects = 3 } = {}) {
  const url = new URL(input)
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new Error('Use a public HTTPS website.')
  const records = await lookup(url.hostname, { all: true })
  if (!records.length || records.some(r => !publicAddress(r.address))) throw new Error('That website address is not public.')
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'CaseBuilder/1.0 (company brand discovery)', Accept: '*/*', 'Accept-Encoding': 'identity' },
      lookup: (_host, options, callback) => options.all ? callback(null, records) : callback(null, records[0].address, records[0].family)
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume()
        if (!redirects) return reject(new Error('Too many website redirects.'))
        fetchPublic(new URL(res.headers.location, url).href, { limit, redirects: redirects - 1 }).then(resolve, reject)
        return
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(`Website returned ${res.statusCode}.`)) }
      const chunks = []
      let length = 0
      res.on('data', c => { length += c.length; if (length > limit) req.destroy(new Error('Brand asset is too large.')); else chunks.push(c) })
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), type: String(res.headers['content-type'] || ''), url: url.href }))
      res.on('error', reject)
    })
    req.setTimeout(7000, () => req.destroy(new Error('Website took too long to respond.')))
    req.on('error', reject)
  })
}
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return m ? m[1] ?? m[2] ?? m[3] ?? '' : ''
}
const absolute = (value, base) => { try { return new URL(value.replace(/&amp;/g, '&'), base).href } catch { return '' } }
const fontName = value => String(value || '').split(',')[0].replace(/["']/g, '').trim()

// Prefer the site's home-link identity over partner logos and product imagery.
export function logoCandidates(html, website, company = '') {
  const host = new URL(website).hostname.replace(/^www\./, '')
  const identity = (company || host.split('.')[0]).toLowerCase().replace(/[^a-z0-9]/g, '')
  const candidates = []
  const add = (tag, score) => {
    const src = attr(tag, 'src') || attr(tag, 'data-src')
    if (src) candidates.push({ url: absolute(src, website), score })
  }
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const tag = '<a ' + match[1] + '>', href = absolute(attr(tag, 'href'), website)
    let home = false
    try { const u = new URL(href); home = u.hostname.replace(/^www\./, '') === host && /^\/(?:home\/?|[a-z]{2}(?:-[a-z]{2})?\/?)?$/i.test(u.pathname) } catch {}
    const label = [attr(tag, 'aria-label'), attr(tag, 'class'), attr(tag, 'data-component-name')].join(' ')
    if (!home || !/logo|home/i.test(label) && !label.toLowerCase().replace(/[^a-z0-9]/g, '').includes(identity)) continue
    for (const image of match[2].matchAll(/<img\b[^>]*>/gi)) add(image[0], 100)
    const svg = match[2].match(/<svg\b[\s\S]*?<\/svg>/i)?.[0]
    if (svg) candidates.push({ svg, score: 95 })
  }
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const visit = item => {
        if (Array.isArray(item)) return item.forEach(visit)
        if (!item || typeof item !== 'object') return
        if (/Organization|Corporation/.test(String(item['@type'])) && String(item.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(identity)) {
          const url = typeof item.logo === 'string' ? item.logo : item.logo?.url || item.logo?.contentUrl
          if (url) candidates.push({ url: absolute(url, website), score: 90 })
        }
        if (item['@graph']) visit(item['@graph'])
      }; visit(JSON.parse(match[1]))
    } catch {}
  }
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0], label = [attr(tag, 'alt'), attr(tag, 'class'), attr(tag, 'src'), attr(tag, 'data-component-name')].join(' ')
    const named = label.toLowerCase().replace(/[^a-z0-9]/g, '').includes(identity)
    if (named && /logo|wordmark/i.test(label)) add(tag, 70)
    else if (!company && /logo|wordmark/i.test(label)) add(tag, 20)
  }
  return candidates.sort((a,b) => b.score - a.score)
}
// The square brand mark (no wordmark), from the site's own icon links. Order:
// SVG icon > large apple-touch-icon > large PNG icon. Favicons under 64px and
// .ico files are skipped: too small to look right on a slide or a card.
// A card colour from the page colour: slightly darker (light pages) or lighter
// (dark pages), keeping the same warmth instead of a fixed grey.
function shade(hex, amount) {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
  const to = amount < 0 ? 0 : 255, t = Math.abs(amount)
  return '#' + c.map(v => Math.round(v + (to - v) * t).toString(16).padStart(2, '0')).join('')
}

export function iconCandidates(html, base) {
  const out = []
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const rel = (attr(tag, 'rel') || '').toLowerCase()
    if (!/(^|\s)(icon|apple-touch-icon|apple-touch-icon-precomposed|mask-icon)(\s|$)/.test(rel)) continue
    const href = absolute(attr(tag, 'href') || '', base)
    if (!href || /\.ico(\?|$)/i.test(href)) continue
    const type = (attr(tag, 'type') || '').toLowerCase()
    const size = Math.max(0, ...String(attr(tag, 'sizes') || '').split(/\s+/).map(v => parseInt(v, 10) || 0))
    const svg = type.includes('svg') || /\.svg(\?|$)/i.test(href)
    if (rel.includes('mask-icon')) continue // single-colour silhouettes, not the real mark
    if (!svg && size && size < 64) continue
    const score = svg ? 1000 : rel.includes('apple-touch-icon') ? 500 + size : size || 100
    out.push({ url: href, score })
  }
  const seen = new Set()
  return out.sort((a, b) => b.score - a.score).filter(c => !seen.has(c.url) && seen.add(c.url)).map(c => c.url)
}

const safeSvg = text => !/<(?:script|foreignObject|iframe|use|image)\b|\bon[a-z]+\s*=|(?:href|src)\s*=|<!ENTITY/i.test(text) && !/url\s*\(/i.test(text.replace(/url\(\s*["']?#[\w-]+["']?\s*\)/gi,''))
export function parseBrand(html, css, website, company = '') {
  const candidates = logoCandidates(html, website, company)
  const icon = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]).find(t => /^(shortcut )?icon$/i.test(attr(t, 'rel')))
  const cssLogo = css.match(/--[\w-]*logo[\w-]*\s*:\s*url\(\s*["']?([^"')\s]+)["']?\s*\)/i)?.[1]
  if (cssLogo) candidates.push({ url: absolute(cssLogo, website), score: 50 })
  // A favicon is a last-resort identity mark, never a partner image.
  if (icon && attr(icon,'href')) candidates.push({ url: absolute(attr(icon,'href'),website),score:0 })
  const logoUrl = candidates.find(c => c.url)?.url || ''
  const colors = [...css.matchAll(/#[0-9a-f]{6}\b/gi)].map(m => m[0].toLowerCase())
  const ranked = [...new Set(colors)].sort((a, b) => colors.filter(c => c === b).length - colors.filter(c => c === a).length)
  const saturated = ranked.filter(c => { const rgb = c.slice(1).match(/../g).map(h => parseInt(h, 16)); return Math.max(...rgb) - Math.min(...rgb) > 65 })
  const named = [...css.matchAll(/--(?:ifm-color-primary|(?:color-)?(?:brand|primary)(?:-color)?|color-accent)\s*:\s*(#[0-9a-f]{6})\b/gi)].at(-1)?.[1]
  const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/gi)].map(m => m[1])
  let face = ''
  const variables = Object.fromEntries([...css.matchAll(/--([\w-]+)\s*:\s*([^;}]+)/g)].map(m => [m[1], m[2]]))
  const firstVariables = Object.fromEntries([...css.matchAll(/--([\w-]+)\s*:\s*([^;}]+)/g)].reverse().map(m => [m[1],m[2]]))
  const darkDefault = /<html[^>]*(?:class=["'][^"']*\bdark\b|data-theme=["']dark)/i.test(html)
  const themeVariables = darkDefault ? variables : firstVariables
  const expand = text => { let s = text || ''; for (let n = 0; n < 5; n++) s = s.replace(/var\(--([\w-]+)(?:,([^)]*))?\)/g, (_all, key, fallback) => variables[key] || fallback || ''); return s }
  const heading = fontName(expand(variables['heading-font'] || variables['font-heading'] || variables['ds-font-family-segoe-variable-display'] || variables['ifm-heading-font-family'] || variables['font-sans'] || css.match(/(?:h1|\.heading|\.headline)[^{]*\{[^}]*font-family\s*:\s*([^;}]+)/i)?.[1] || css.match(/font-family\s*:\s*([^;}]+)/i)?.[1]))
  const body = fontName(expand(variables['ifm-font-family-base'] || variables['ds-font-family-segoe-variable-text'] || variables['font-sans'] || css.match(/body\s*\{[^}]*font-family\s*:\s*([^;}]+)/i)?.[1]))
  face = faces.find(f => fontName(f.match(/font-family\s*:\s*([^;]+)/i)?.[1]).toLowerCase() === (heading || body).toLowerCase() && /woff2?/i.test(f)) || ''
  const color = value => {
    value = expand(value).trim()
    const hex = value.match(/^#([0-9a-f]{6}|[0-9a-f]{3})\b/i)?.[1]
    if (hex) return '#' + (hex.length === 3 ? [...hex].map(c=>c+c).join('') : hex)
    if (/^(white|black)$/i.test(value)) return value.toLowerCase() === 'white' ? '#ffffff' : '#000000'
    const rgb = value.match(/^rgba?\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i)
    if (rgb) return '#' + rgb.slice(1,4).map(n=>Math.min(255,Number(n)).toString(16).padStart(2,'0')).join('')
    const hsl = value.match(/^(?:hsl\()?\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/i)
    if (hsl) {
      const h=Number(hsl[1])/360, sat=Number(hsl[2])/100, l=Number(hsl[3])/100
      const hue=(p,q,t)=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p}
      const q=l<.5?l*(1+sat):l+sat-l*sat,p=2*l-q
      return '#'+[h+1/3,h,h-1/3].map(t=>Math.round((sat?hue(p,q,t):l)*255).toString(16).padStart(2,'0')).join('')
    }
    return ''
  }
  const bodyRule = [...css.matchAll(/(?:^|})\s*(?:html\s*,\s*)?body\s*\{([^}]+)}/gi)].map(m=>m[1]).join(';')
  const background = color(themeVariables['marketing-background'] || variables['color-background'] || variables['background-color'] || variables['ifm-background-color'] || variables.background || bodyRule.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;}]+)/i)?.[1] || '')
  const textColor = color(themeVariables['marketing-foreground'] || variables['color-text'] || variables['text-color'] || variables['ifm-font-color-base'] || bodyRule.match(/(?:^|;)\s*color\s*:\s*([^;}]+)/i)?.[1] || '')
  const light = background && parseInt(background.slice(1,3),16)*.299+parseInt(background.slice(3,5),16)*.587+parseInt(background.slice(5,7),16)*.114 > 150
  return { ...(background ? {background, surface: shade(background, light ? -0.035 : 0.06), text: textColor || (light ? '#161616' : '#ffffff'), muted: light ? '#555555' : '#b8b8b8'} : {}), candidates, primary: color(themeVariables['marketing-primary'] || themeVariables['ds-theme-background-accent-strong-normal'] || '') || named || saturated[0], headingFont: !/var\(/.test(heading) ? heading : '', bodyFont: !/var\(/.test(body) ? body : '', logoUrl, face, colors: ranked.slice(0, 8) }
}

async function findWebsite(company, client = null) {
  // Verified official domains for common demo/test accounts, not guessed assets.
  const known = {microsoft:'https://www.microsoft.com/',shopify:'https://www.shopify.com/',lovable:'https://lovable.dev/',loveable:'https://lovable.dev/'}
  const official = known[String(company).trim().toLowerCase()]
  if (official) return official
  if (/^(https:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(company)) return company.startsWith('https://') ? company : `https://${company}`
  if (!client) throw new Error('Enter the official company website to scan its branding. Company-name search needs an Anthropic API key (add yours in Settings).')
  const run = await runWithSearch({
    client, model: process.env.RESEARCH_MODEL || 'claude-sonnet-5-5', maxTokens: 1200, maxSearches: 2, thinking: null, effort: null,
    system: agentInstruction(AGENT_COMMANDS.DISCOVER_BRAND)+'\nFind the official company homepage. Use web search. Reply only with JSON {"website":"https://..."}. If ambiguous, reply {"website":null}. Do not guess a domain.',
    messages: [{ role: 'user', content: `Company: ${company}` }]
  })
  const seen = new Set(run.evidence.map(e => e.host))
  const text = run.text
  let result
  try { result = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)).website } catch {}
  if (!result || !seen.has(new URL(result).hostname.replace(/^www\./, ''))) throw new Error('Please enter the official website so we use the right company.')
  return result
}

export async function discoverBrand({ company, website }, fetcher = fetchPublic, client = null) {
  const target = website || await findWebsite(company, client)
  let home
  try { home = await fetcher(target) } catch (error) {
    // Official brand pages can remain public when a homepage blocks automated requests.
    if (!/403|429/.test(error.message)) throw error
    try { home = await fetcher(new URL('/brand',target).href) } catch { throw new Error('The official website blocked brand discovery. Enter its brand page or upload a logo; no substitute logo was used.') }
  }
  if (!/html/i.test(home.type)) throw new Error('Enter the company homepage, rather than an asset URL.')
  const html = home.buffer.toString('utf8')
  const sources = [home.url]
  const sheets = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]).filter(t => /stylesheet/i.test(attr(t, 'rel'))).map(t => absolute(attr(t, 'href'), home.url)).filter(Boolean).slice(0, 4)
  let css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n')
  const results = await Promise.allSettled(sheets.map(url => fetcher(url)))
  const cssBases = []
  for (const r of results) if (r.status === 'fulfilled' && /css|text\/plain/i.test(r.value.type)) {
    const text = r.value.buffer.toString('utf8'); css += '\n' + text; cssBases.push({ text, url: r.value.url }); sources.push(r.value.url)
  }
  const parsed = parseBrand(html, css, home.url, company)
  let logo = '', fontData = '', extractedFont = ''
  for (const candidate of parsed.candidates.slice(0, 5)) {
    if (logo) break
    try {
      if (candidate.svg) {
        if (!safeSvg(candidate.svg)) continue
        let svg = candidate.svg.replace(/currentColor/g, parsed.text || '#161616')
        if (!/xmlns=/.test(svg)) svg = svg.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"')
        logo = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
        continue
      }
      const asset = await fetcher(candidate.url, { limit: 600_000 })
      const mime = asset.type.split(';')[0]
      if (/^image\/(png|jpeg|webp|svg\+xml)$/.test(mime) && (!mime.includes('svg') || safeSvg(asset.buffer.toString()))) {
        logo = 'data:' + mime + ';base64,' + asset.buffer.toString('base64'); sources.push(asset.url)
      }
    } catch {}
  }
  let icon = ''
  const iconUrls = iconCandidates(html, home.url)
  // A site's standard icon paths, if the page does not link one.
  if (!iconUrls.length) iconUrls.push(new URL('/icon.svg', home.url).href, new URL('/apple-touch-icon.png', home.url).href)
  for (const url of iconUrls.slice(0, 4)) {
    if (icon) break
    try {
      const asset = await fetcher(url, { limit: 400_000 })
      const mime = asset.type.split(';')[0]
      if (mime === 'image/svg+xml' ? safeSvg(asset.buffer.toString()) : /^image\/(png|jpeg|webp)$/.test(mime)) {
        icon = 'data:' + mime + ';base64,' + asset.buffer.toString('base64'); sources.push(asset.url)
      }
    } catch {}
  }
  if (parsed.face) try {
    extractedFont = fontName(parsed.face.match(/font-family\s*:\s*([^;]+)/i)?.[1])
    const src = parsed.face.match(/url\(\s*["']?([^"')\s]+)["']?\s*\)/i)?.[1]
    const base = cssBases.find(s => s.text.includes(parsed.face))?.url || home.url
    if (src) {
      const font = await fetcher(absolute(src, base), { limit: 600_000 })
      // Only real WOFF/WOFF2 bytes are embedded. Other fonts keep a named fallback.
      const sig = font.buffer.subarray(0, 4).toString('ascii')
      if (sig === 'wOF2' || sig === 'wOFF') { fontData = `data:font/${sig === 'wOF2' ? 'woff2' : 'woff'};base64,${font.buffer.toString('base64')}`; sources.push(font.url) }
    }
  } catch {}
  return normalizeBrand({
    ...parsed, logo, icon, website: home.url, fontData, fontName: extractedFont,
    headingFont: fontData ? extractedFont : parsed.headingFont,
    bodyFont: parsed.bodyFont || (fontData ? extractedFont : 'Arial'), sources,
    status: 'ready', message: `Found ${logo ? 'a logo' : 'no usable logo'}${icon ? ', an icon' : ''}${parsed.primary ? ', a brand color' : ''}${fontData ? ', and a web font' : parsed.headingFont ? ', and a font name' : ''}. Review the result and edit anything below.${!fontData && parsed.headingFont ? ' The font file could not be embedded; devices need this font installed or will use a fallback.' : ''}`
  })
}
