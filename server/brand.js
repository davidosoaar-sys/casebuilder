import https from 'node:https'
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

export function parseBrand(html, css, website) {
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0])
  const logoTag = images.find(t => /logo|wordmark/i.test(attr(t, 'alt') + attr(t, 'class') + attr(t, 'src')))
  const icon = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]).find(t => /^(shortcut )?icon$/i.test(attr(t, 'rel')))
  const cssLogo = css.match(/--[\w-]*logo[\w-]*\s*:\s*url\(\s*["']?([^"')\s]+)["']?\s*\)/i)?.[1]
  const logoUrl = absolute(logoTag ? attr(logoTag, 'src') : cssLogo || (icon ? attr(icon, 'href') : ''), website)
  const colors = [...css.matchAll(/#[0-9a-f]{6}\b/gi)].map(m => m[0].toLowerCase())
  const ranked = [...new Set(colors)].sort((a, b) => colors.filter(c => c === b).length - colors.filter(c => c === a).length)
  const saturated = ranked.filter(c => { const rgb = c.slice(1).match(/../g).map(h => parseInt(h, 16)); return Math.max(...rgb) - Math.min(...rgb) > 65 })
  const named = [...css.matchAll(/--(?:ifm-color-primary|(?:color-)?(?:brand|primary)(?:-color)?|color-accent)\s*:\s*(#[0-9a-f]{6})\b/gi)].at(-1)?.[1]
  const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/gi)].map(m => m[1])
  const face = faces.find(f => /woff2?/i.test(f)) || ''
  const variables = Object.fromEntries([...css.matchAll(/--([\w-]+)\s*:\s*([^;}]+)/g)].map(m => [m[1], m[2]]))
  const expand = text => { let s = text || ''; for (let n = 0; n < 5; n++) s = s.replace(/var\(--([\w-]+)(?:,([^)]*))?\)/g, (_all, key, fallback) => variables[key] || fallback || ''); return s }
  const heading = fontName(expand(variables['heading-font'] || variables['ifm-heading-font-family'] || css.match(/(?:h1|\.heading|\.headline)[^{]*\{[^}]*font-family\s*:\s*([^;}]+)/i)?.[1] || css.match(/font-family\s*:\s*([^;}]+)/i)?.[1]))
  const body = fontName(expand(variables['ifm-font-family-base'] || css.match(/body\s*\{[^}]*font-family\s*:\s*([^;}]+)/i)?.[1]))
  return { primary: named || saturated[0], headingFont: !/var\(/.test(heading) ? heading : '', bodyFont: !/var\(/.test(body) ? body : '', logoUrl, face, colors: ranked.slice(0, 8) }
}

async function findWebsite(company) {
  if (/^(https:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(company)) return company.startsWith('https://') ? company : `https://${company}`
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) throw new Error('Enter the official company website to scan its branding. Company-name search needs the research API key.')
  const client = new Anthropic()
  const message = await client.messages.create({
    model: process.env.RESEARCH_MODEL || 'claude-sonnet-5-5', max_tokens: 1200,
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 2 }],
    system: agentInstruction(AGENT_COMMANDS.DISCOVER_BRAND)+'\nFind the official company homepage. Use web search. Reply only with JSON {"website":"https://..."}. If ambiguous, reply {"website":null}. Do not guess a domain.',
    messages: [{ role: 'user', content: `Company: ${company}` }]
  })
  const seen = new Set()
  for (const b of message.content) {
    if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) for (const r of b.content) if (r.url) { try { seen.add(new URL(r.url).hostname.replace(/^www\./, '')) } catch {} }
    if (b.type === 'text') for (const c of b.citations || []) if (c.url) { try { seen.add(new URL(c.url).hostname.replace(/^www\./, '')) } catch {} }
  }
  const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('')
  let result
  try { result = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)).website } catch {}
  if (!result || !seen.has(new URL(result).hostname.replace(/^www\./, ''))) throw new Error('Please enter the official website so we use the right company.')
  return result
}

export async function discoverBrand({ company, website }, fetcher = fetchPublic) {
  const home = await fetcher(website || await findWebsite(company))
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
  const parsed = parseBrand(html, css, home.url)
  let logo = '', fontData = '', extractedFont = ''
  if (parsed.logoUrl) try {
    const asset = await fetcher(parsed.logoUrl, { limit: 600_000 })
    const mime = asset.type.split(';')[0]
    if (/^image\/(png|jpeg|webp|svg\+xml)$/.test(mime) && !(mime.includes('svg') && /<script|foreignObject|onload\s*=/i.test(asset.buffer.toString()))) { logo = `data:${mime};base64,${asset.buffer.toString('base64')}`; sources.push(asset.url) }
  } catch {}
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
    ...parsed, logo, website: home.url, fontData, fontName: extractedFont,
    headingFont: fontData ? extractedFont : parsed.headingFont,
    bodyFont: parsed.bodyFont || (fontData ? extractedFont : 'Arial'), sources,
    status: 'ready', message: `Found ${logo ? 'a logo' : 'no usable logo'}${parsed.primary ? ', a brand color' : ''}${fontData ? ', and a web font' : parsed.headingFont ? ', and a font name' : ''}. Review the result and edit anything below.`
  })
}
