import { fetchPublic } from './publicWeb.js'
import {publicProfileUrl} from '../src/profileMedia.js'
export { fetchPublic, publicAddress } from './publicWeb.js'
import {curateBrand} from './brandSelection.js'
import { normalizeBrand } from '../src/brand.js'
import { agentPrompt } from './agent-commands/index.js'
import { AGENT_COMMANDS } from '../src/agentCommands.js'

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return m ? m[1] ?? m[2] ?? m[3] ?? '' : ''
}
const absolute = (value, base) => { try { return new URL(value.replace(/&amp;/g, '&'), base).href } catch { return '' } }
const documentBase = (html,website) => {const tag=html.match(/<base\b[^>]*>/i)?.[0];return tag&&attr(tag,'href')?absolute(attr(tag,'href'),website):website}
const fontName = value => String(value || '').split(',')[0].replace(/["']/g, '').trim()

// Prefer the site's home-link identity over partner logos and product imagery.
export function logoCandidates(html, website, company = '', assetBase = documentBase(html,website)) {
  const host = new URL(website).hostname.replace(/^www\./, '')
  const identity = (company || host.split('.')[0]).toLowerCase().replace(/[^a-z0-9]/g, '')
  const candidates = []
  const add = (tag, score) => {
    const src = attr(tag, 'src') || attr(tag, 'data-src')
    if (src) candidates.push({ url: absolute(src, assetBase), score })
  }
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const tag = '<a ' + match[1] + '>', href = absolute(attr(tag, 'href'), website)
    let home = false
    try { const u = new URL(href); home = u.hostname.replace(/^www\./, '') === host && /^\/(?:home\/?|[a-z]{2}(?:-[a-z]{2})?\/?)?$/i.test(u.pathname) } catch {}
    const label = [attr(tag, 'aria-label'), attr(tag, 'title'), attr(tag, 'class'), attr(tag, 'data-component-name')].join(' ')
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
          if (url) candidates.push({ url: absolute(url, assetBase), score: 90 })
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
const safeSvg = text => !/<(?:script|foreignObject|iframe|use|image)\b|\bon[a-z]+\s*=|(?:href|src)\s*=|<!ENTITY/i.test(text) && !/url\s*\(/i.test(text.replace(/url\(\s*["']?#[\w-]+["']?\s*\)/gi,''))
export function parseBrand(html, css, website, company = '') {
  const assetBase=documentBase(html,website)
  const candidates = logoCandidates(html, website, company, assetBase)
  const icon = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]).find(t => /^(shortcut )?icon$/i.test(attr(t, 'rel')))
  const cssLogo = css.match(/--[\w-]*logo[\w-]*\s*:\s*url\(\s*["']?([^"')\s]+)["']?\s*\)/i)?.[1]
  if (cssLogo) candidates.push({ url: absolute(cssLogo, assetBase), score: 50 })
  // A favicon is a last-resort identity mark, never a partner image.
  if (icon && attr(icon,'href')) candidates.push({ url: absolute(attr(icon,'href'),assetBase),score:0 })
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
  const rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  const familyFor=selector=>rules.filter(m=>selector.test(m[1])).map(m=>[...m[2].matchAll(/font-family\s*:\s*([^;}]+)/gi)].at(-1)?.[1]).filter(Boolean).at(-1)||''
  const headingRule=familyFor(/(?:^|,)\s*(?:h1|\.h1|\.heading|\.headline)(?:$|[:.#\s])/i)
  const bodyRuleFont=familyFor(/(?:^|,)\s*(?:body|html)(?:$|[:.#\s])/i)
  const heading = fontName(expand(variables['heading-font'] || variables['font-heading'] || variables['ds-font-family-segoe-variable-display'] || variables['ifm-heading-font-family'] || headingRule || variables['font-sans'] || css.match(/(?:h1|\.heading|\.headline)[^{]*\{[^}]*font-family\s*:\s*([^;}]+)/i)?.[1] || css.match(/font-family\s*:\s*([^;}]+)/i)?.[1]))
  const body = fontName(expand(variables['ifm-font-family-base'] || variables['ds-font-family-segoe-variable-text'] || bodyRuleFont || variables['font-sans'] || css.match(/body\s*\{[^}]*font-family\s*:\s*([^;}]+)/i)?.[1]))
  face = faces.find(f => fontName(f.match(/font-family\s*:\s*([^;]+)/i)?.[1]).toLowerCase() === (heading || body).toLowerCase() && /url\(/i.test(f)) || ''
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
  const colorEvidence=Object.entries(themeVariables).filter(([key])=>/brand|accent|primary|background|foreground|surface|^bg-|^fg-|text-color|color-text/i.test(key)).flatMap(([token,raw])=>{const value=color(raw);if(!value)return [];const role=/background|^bg-base|^bg-primary/.test(token)?'background':/surface/.test(token)?'surface':/foreground|^fg-primary|text-color|color-text/.test(token)?'text':/accent|primary|brand/.test(token)?'primary':'';return [{token,label:'--'+token,value,role,origin:'observed'}]}).slice(0,40)
  return { ...(background ? {background, surface: light ? '#f5f5f5' : '#1e1e1e', text: textColor || (light ? '#161616' : '#ffffff'), muted: light ? '#555555' : '#b8b8b8'} : {}), candidates, colorEvidence, faces, derivedColors:['surface','muted',...(!textColor?['text']:[])], primary: color(themeVariables['marketing-primary'] || themeVariables['ds-theme-background-accent-strong-normal'] || '') || named || saturated[0], headingFont: !/var\(/.test(heading) ? heading : '', bodyFont: !/var\(/.test(body) ? body : '', logoUrl, face, colors: ranked.slice(0, 8) }
}

const companyLinkedIn = value => {const url=publicProfileUrl(value);return /^https:\/\/(?:[a-z]{2,3}\.|www\.)?linkedin\.com\/company\/[^/?#]+\/?(?:[?#].*)?$/i.test(url)?url:''}
async function findWebsite(company, client = null, identity = {}, {linkedinOnly=false,officialWebsite=''} = {}) {
  // Verified official domains for common demo/test accounts, not guessed assets.
  const known = {microsoft:'https://www.microsoft.com/',shopify:'https://www.shopify.com/',lovable:'https://lovable.dev/',loveable:'https://lovable.dev/',adidas:'https://www.adidas-group.com/en/',addidas:'https://www.adidas-group.com/en/'}
  const official = known[String(company).trim().toLowerCase()]
  if (official && !linkedinOnly) return official
  if (!linkedinOnly && /^(https:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(company)) return company.startsWith('https://') ? company : `https://${company}`
  if (!client) throw new Error('Enter the official company website to scan its branding. Company-name search needs an Anthropic API key (add yours in Settings).')
  const message = await client.messages.create({
    model: process.env.RESEARCH_MODEL || 'claude-sonnet-5-5', max_tokens: linkedinOnly ? 800 : 1200,
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: linkedinOnly ? 1 : 2 }],
    system: agentPrompt(AGENT_COMMANDS.DISCOVER_BRAND),
    messages: [{ role: 'user', content: `Company: ${company}${officialWebsite ? '\nVerified official website: '+officialWebsite+'\nFind only the verified company LinkedIn page; do not replace this website.' : ''}` }]
  }, {signal:AbortSignal.timeout(linkedinOnly ? 12000 : 30000)})
  const seen = new Set(), urls = new Set()
  for (const b of message.content) {
    if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) for (const r of b.content) if (r.url) { urls.add(r.url); try { seen.add(new URL(r.url).hostname.replace(/^www\./, '')) } catch {} }
    if (b.type === 'text') for (const c of b.citations || []) if (c.url) { urls.add(c.url); try { seen.add(new URL(c.url).hostname.replace(/^www\./, '')) } catch {} }
  }
  const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('')
  let result
  try { const parsed=JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));result=parsed.website;const linkedin=companyLinkedIn(parsed.linkedinUrl);if(linkedin&&[...urls].some(u=>u.replace(/\/$/,'')===linkedin.replace(/\/$/,'')))identity.linkedinUrl=linkedin } catch {}
  if(linkedinOnly)return officialWebsite
  if (!result || !seen.has(new URL(result).hostname.replace(/^www\./, ''))) throw new Error('Please enter the official website so we use the right company.')
  return result
}

export async function discoverBrand({ company, website }, fetcher = fetchPublic, client = null) {
  const started=Date.now(),deadline=started+45000,sourceFetcher=fetcher
  fetcher=async(url,options)=>{if(Date.now()>deadline)throw Error('Brand asset budget exhausted');return sourceFetcher(url,options)}
  const identity = {}
  const target = website || await findWebsite(company, client, identity)
  let home
  try { home = await fetcher(target) } catch (error) {
    // Official brand pages can remain public when a homepage blocks automated requests.
    if (!/403|429/.test(error.message)) throw error
    try { home = await fetcher(new URL('/brand',target).href) } catch { throw new Error('The official website blocked brand discovery. Enter its brand page or upload a logo; no substitute logo was used.') }
  }
  if (!/html/i.test(home.type)) throw new Error('Enter the company homepage, rather than an asset URL.')
  const html = home.buffer.toString('utf8')
  const assetBase=documentBase(html,home.url)
  const sources = [home.url]
  const sheets = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]).filter(t => /stylesheet/i.test(attr(t, 'rel'))).map(t => absolute(attr(t, 'href'), assetBase)).filter(Boolean).slice(0, 4)
  let css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n')
  const results = await Promise.allSettled(sheets.map(url => fetcher(url)))
  const cssBases = []
  for (const r of results) if (r.status === 'fulfilled' && /css|text\/plain/i.test(r.value.type)) {
    const text = r.value.buffer.toString('utf8'); css += '\n' + text; cssBases.push({ text, url: r.value.url }); sources.push(r.value.url)
  }
  const parsed = parseBrand(html, css, home.url, company)
  const linkedInFromSite=[...html.matchAll(/<a\b[^>]*>/gi)].map(m=>companyLinkedIn(absolute(attr(m[0],'href'),home.url))).find(Boolean)
  if(!linkedInFromSite&&!identity.linkedinUrl&&client&&Date.now()<deadline-15000)try{await findWebsite(company,client,identity,{linkedinOnly:true,officialWebsite:home.url})}catch{}
  const linkedinUrl=linkedInFromSite||identity.linkedinUrl||''
  const sourceNotes=[]
  if(linkedinUrl&&Date.now()<deadline-10000)try{
    const profile=await fetcher(linkedinUrl,{limit:1000000})
    const profileBrand=/html/i.test(profile.type)?parseBrand(profile.buffer.toString('utf8'),'',profile.url,company||new URL(home.url).hostname.replace(/^www\./,'').split('.')[0]):null
    const candidates=profileBrand?.candidates.filter(c=>c.score>=50).map(c=>({...c,sourcePage:profile.url}))||[]
    if(candidates.length){parsed.candidates=[...parsed.candidates.filter(c=>c.score>0),...candidates,...parsed.candidates.filter(c=>c.score===0)];sources.push(profile.url);sourceNotes.push({url:linkedinUrl,status:'used',message:'Public company LinkedIn page checked for a logo. Fonts and palette come from the official website.'})}
    else sourceNotes.push({url:linkedinUrl,status:'unavailable',message:'No publicly usable company logo found on LinkedIn. No LinkedIn asset was substituted.'})
  }catch{sourceNotes.push({url:linkedinUrl,status:'unavailable',message:'LinkedIn could not be read publicly; no LinkedIn assets were used.'})}
  const unique=parsed.candidates.filter((c,i,list)=>list.findIndex(x=>(x.url||x.svg)===(c.url||c.svg))===i).slice(0,4)
  const loaded=await Promise.allSettled(unique.map(async candidate=>{
    let dataUrl='',svg='',sourceUrl=home.url
    if(candidate.svg){
      if(!safeSvg(candidate.svg))throw Error('Unsupported SVG')
      svg=candidate.svg.replace(/currentColor/g,parsed.text||'#161616')
      if(!/xmlns=/.test(svg))svg=svg.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"')
      dataUrl='data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64')
    }else{
      const asset=await fetcher(candidate.url,{limit:600000}),mime=asset.type.split(';')[0]
      if(!/^image\/(png|jpeg|webp|svg\+xml)$/.test(mime))throw Error('Unsupported logo type')
      if(mime.includes('svg')){svg=asset.buffer.toString();if(!safeSvg(svg))throw Error('Unsupported SVG')}
      dataUrl='data:'+mime+';base64,'+asset.buffer.toString('base64');sourceUrl=asset.url
    }
    const fills=[...svg.matchAll(/(?:fill|stroke)=["'](#[0-9a-f]{3,6}|white|black)["']/gi)].map(m=>m[1].toLowerCase())
    const allWhite=fills.length&&fills.every(c=>['white','#fff','#ffffff'].includes(c)),allBlack=fills.length&&fills.every(c=>['black','#000','#000000'].includes(c))
    const variant=allWhite?'light':allBlack?'dark':!svg&&/white/i.test(candidate.url||'')?'light':!svg&&/black/i.test(candidate.url||'')?'dark':'unknown'
    return {dataUrl,sourceUrl,sourcePage:candidate.sourcePage||home.url,variant,score:candidate.score,location:candidate.sourcePage?'Public company LinkedIn logo':candidate.score>=95?'Official homepage mark':candidate.score===90?'Organization logo':candidate.score===0?'Favicon':'Official site logo'}
  }))
  const logos=loaded.filter(r=>r.status==='fulfilled').map(r=>r.value)
  const baseline={...parsed,logo:logos[0]?.dataUrl||'',website:home.url,linkedinUrl,sourceNotes,sources}
  const curated=await curateBrand({company,website:home.url,parsed,logos,cssSources:cssBases,baseline,client,timeBudget:Math.max(0,Math.min(10000,deadline-Date.now()-7000))})
  const selected=curated.brand
  if(curated.selected&&!sources.includes(curated.selected.sourceUrl))sources.push(curated.selected.sourceUrl)
  const fontFaces=[],fontCache=new Map()
  for(const family of [...new Set([selected.headingFont,selected.bodyFont])]){
    const face=parsed.faces.find(f=>fontName(f.match(/font-family\s*:\s*([^;]+)/i)?.[1]).toLowerCase()===family.toLowerCase())
    const src=face?.match(/url\(\s*["']?([^"')\s]+)["']?\s*\)/i)?.[1]
    if(!src)continue
    const base=cssBases.find(s=>s.text.includes(face))?.url||assetBase,url=absolute(src,base)
    try{
      if(!fontCache.has(url)){
        const font=await fetcher(url,{limit:600000}),sig=font.buffer.subarray(0,4).toString('ascii')
        const type=sig==='wOF2'?'woff2':sig==='wOFF'?'woff':sig==='OTTO'?'otf':font.buffer.subarray(0,4).equals(Buffer.from([0,1,0,0]))?'ttf':''
        if(!type)continue
        fontCache.set(url,'data:font/'+type+';base64,'+font.buffer.toString('base64'));if(!sources.includes(font.url))sources.push(font.url)
      }
      fontFaces.push({family,data:fontCache.get(url)})
    }catch{}
  }
  const headingFile=fontFaces.find(f=>f.family===selected.headingFont)
  for(const family of [...new Set([selected.headingFont,selected.bodyFont])])if(!fontFaces.some(f=>f.family===family))curated.review.warnings.push('The '+family+' font file is unavailable; other devices may use a fallback.')
  return normalizeBrand({...selected,website:home.url,linkedinUrl,sourceNotes,sources,fontFaces,fontData:headingFile?.data||'',fontName:headingFile?.family||'',review:curated.review,
    status:selected.logo?'ready':'error',message:!selected.logo?'Company website found, but no usable company logo could be extracted. Review the brand/media page or upload a logo.':(curated.review.mode==='agent-selected'?'Brand assets selected from verified candidates.':'Brand assets extracted; no validated model selection was available.')+' Review the logo, fonts and palette before continuing.'})

}
