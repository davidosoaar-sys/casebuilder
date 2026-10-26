import {publicProfileUrl} from './profileMedia.js'
import { websiteThemeCss } from './export/websiteFramework.js'
// Customer branding is scoped to a deck. It never themes the application chrome.
export const DEFAULT_BRAND = {
  primary: '#9bf0de', background: '#111111', surface: '#1e1e1e', text: '#e3e3e3',
  muted: '#a9acb1', headingFont: 'Outfit', bodyFont: 'Arial', logo: '', icon: '',
  fontData: '', fontName: '', website: '', sources: [], status: 'idle', message: '', hideLogo: false
}
export const COLOR_KEYS = ['primary', 'background', 'surface', 'text', 'muted']
// Fonts offered in the brand panel (installed everywhere, or loaded by the app).
// worker/worker.py BRAND_FONTS holds the same list for the agent.
export const BRAND_FONTS = ['Arial', 'Outfit', 'Georgia', 'Verdana', 'Times New Roman', 'Trebuchet MS', 'Segoe UI', 'Courier New']
export const cleanFont = value => String(value || '').replace(/[^a-zA-Z0-9 ,_-]/g, '').slice(0, 100)
export const fontStack = value => {
  const names = cleanFont(value).split(',').map(n=>n.trim()).filter(Boolean)
  const generic = ['ui-sans-serif', 'system-ui', 'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy']
  if (!names.length) return 'sans-serif'
  const stack = names.map(name=>generic.includes(name) ? name : `'${name}'`)
  if (!generic.includes(names.at(-1))) stack.push('sans-serif')
  return stack.join(',')
}
export const officeFont = value => {
  const name = cleanFont(value).split(',')[0].trim()
  return ({'ui-sans-serif':'Arial','system-ui':'Arial','sans-serif':'Arial',serif:'Times New Roman',monospace:'Courier New'})[name] || name || 'Arial'
}
export const safeAsset = value => typeof value === 'string' && value.length < 1_200_000 && /^data:image\/(png|jpeg|webp|svg\+xml);base64,[a-zA-Z0-9+/=]+$/.test(value) ? value : ''
export function normalizeBrand(value) {
  const b = value && typeof value === 'object' ? value : {}
  return {
    ...DEFAULT_BRAND,
    ...Object.fromEntries(COLOR_KEYS.map(k => [k, /^#[0-9a-f]{6}$/i.test(b[k]) ? b[k] : DEFAULT_BRAND[k]])),
    headingFont: cleanFont(b.headingFont) || DEFAULT_BRAND.headingFont,
    bodyFont: cleanFont(b.bodyFont) || DEFAULT_BRAND.bodyFont,
    companyCandidates:(Array.isArray(b.companyCandidates)?b.companyCandidates:[]).slice(0,5).flatMap(c=>{const website=publicProfileUrl(c?.website);return website?[{name:String(c.name||'').slice(0,120),website}]:[]}),
    heroImage:safeAsset(b.heroImage),heroAlt:typeof b.heroAlt==='string'?b.heroAlt.slice(0,240):'',heroSource:publicProfileUrl(b.heroSource),
    logo: safeAsset(b.logo),
    logoVariants:(Array.isArray(b.logoVariants)?b.logoVariants:[]).slice(0,3).flatMap(v=>safeAsset(v?.logo)&&v.logo.length<250000?[{logo:safeAsset(v.logo),sourceUrl:publicProfileUrl(v.sourceUrl),authority:v.authority==='company-profile'?'company-profile':'official-site'}]:[]),
    icon: safeAsset(b.icon),
    hideLogo: b.hideLogo === true,
    logoBackground: /^#[0-9a-f]{6}$/i.test(b.logoBackground)?b.logoBackground:'transparent',
    fontFaces: Array.isArray(b.fontFaces)?b.fontFaces.filter(f=>f&&cleanFont(f.family)&&typeof f.data==='string'&&f.data.length<900000&&/^data:font\/(woff2?|ttf|otf);base64,[a-zA-Z0-9+/=]+$/.test(f.data)).slice(0,3).map(f=>({family:cleanFont(f.family),data:f.data})):[],
    review: b.review?.version===1?{version:1,mode:['agent-selected','deterministic-fallback'].includes(b.review.mode)?b.review.mode:'deterministic-fallback',status:'needs-review',decisions:(Array.isArray(b.review.decisions)?b.review.decisions:[]).filter(d=>d&&typeof d==='object').slice(0,10).map(d=>({field:String(d.field||'').slice(0,40),value:String(d.value||'').slice(0,160),sourceUrl:publicProfileUrl(d.sourceUrl),origin:['observed','readability-adjustment','fallback'].includes(d.origin)?d.origin:'fallback'})),adjustments:(Array.isArray(b.review.adjustments)?b.review.adjustments:[]).filter(x=>typeof x==='string').slice(0,12).map(x=>x.slice(0,300)),warnings:(Array.isArray(b.review.warnings)?b.review.warnings:[]).filter(x=>typeof x==='string').slice(0,12).map(x=>x.slice(0,300)),checks:{logoPresent:!!safeAsset(b.logo),textContrast:b.review.checks?.textContrast===true,secondaryContrast:b.review.checks?.secondaryContrast===true,...Object.fromEntries(['assetBytesValidated','officialSource','displayCheckPerformed','logoDecoded','logoVisible','fontFilesLoaded'].map(k=>[k,b.review.checks?.[k]===true])),visualReviewPerformed:false}}:null,
    linkedinUrl: /^https:\/\/(?:[a-z]{2,3}\.|www\.)?linkedin\.com\/company\//i.test(publicProfileUrl(b.linkedinUrl)) ? publicProfileUrl(b.linkedinUrl) : '',
    sourceNotes: Array.isArray(b.sourceNotes)?b.sourceNotes.filter(n=>publicProfileUrl(n?.url)&&['used','unavailable'].includes(n.status)).slice(0,4).map(n=>({url:publicProfileUrl(n.url),status:n.status,message:String(n.message||'').slice(0,300)})):[],
    fontData: typeof b.fontData === 'string' && b.fontData.length < 900_000 && /^data:font\/(woff2?|ttf|otf);base64,[a-zA-Z0-9+/=]+$/.test(b.fontData) ? b.fontData : '',
    fontName: cleanFont(b.fontName),
    website: typeof b.website === 'string' && /^https:\/\//.test(b.website) ? b.website.slice(0, 500) : '',
    sources: Array.isArray(b.sources) ? b.sources.filter(s => typeof s === 'string' && /^https:\/\//.test(s)).slice(0, 10) : [],
    status: ['idle', 'scanning', 'ready', 'error'].includes(b.status) ? b.status : 'idle',
    message: typeof b.message === 'string' ? b.message.slice(0, 600) : ''
  }
}
export function brandVars(value) {
  const b = normalizeBrand(value)
  return { '--deck-primary': b.primary, '--deck-bg': b.background, '--deck-surface': b.surface, '--deck-text': b.text, '--deck-muted': b.muted, '--deck-heading-font': fontStack(b.headingFont), '--deck-body-font': fontStack(b.bodyFont) }
}
export function fontFaceCss(value) {
  const b = normalizeBrand(value)
  const faces=[...b.fontFaces,...(b.fontData&&b.fontName?[{family:b.fontName,data:b.fontData}]:[])]
  return faces.filter((f,i)=>faces.findIndex(x=>x.family===f.family)===i).map(f=>`@font-face{font-family:'${f.family}';src:url('${f.data}');font-display:swap;}`).join('\n')
}
export function brandLogoHtml(value, fallback = '') {
  const b = normalizeBrand(value)
  if (b.hideLogo) return ''
  return b.logo ? `<img src="${b.logo}" alt="Company logo" style="height:40px;width:auto;max-width:220px;object-fit:contain;${b.logoBackground!=='transparent'?'background:'+b.logoBackground+';padding:8px;border-radius:4px;':''}">` : fallback
}
// Apply the palette after the default CSS, only in exported client documents.
export function brandDocument(html, value) {
  if (!value) return html
  const b = normalizeBrand(value)
  const css = `${fontFaceCss(b)}
    :root{--bg:${b.background};--panel:${b.surface};--ink:${b.text};--strong:${b.text};--dim:${b.muted};--faint:${b.muted};--accent:${b.primary};--mint:${b.primary};--line2:${b.muted};}
    body{font-family:${fontStack(b.bodyFont)}!important}
    h1,h2,h3,.stat strong,.pillar h3,.bento-cell strong,.brief-stat strong,.brief-headline{font-family:${fontStack(b.headingFont)}!important}
    .hero-bg{background:linear-gradient(115deg,${b.background},${b.surface})!important}
    .logo img,.brand img{max-height:32px;max-width:220px;object-fit:contain}
    .bar,.fill,.whatif-btn{background-color:${b.primary}}
    .slide{background-color:${b.background};color:${b.text}}
    .page{background:${b.background};color:${b.text}}
    .page :is(h1,h2,h3,p,li,strong,.cares,.lbl,.val,.meta,.foot,.small,.vs){color:inherit}
    .page :is(h2,.eyebrow,.good strong){color:${b.primary}}
    .page .stat{background:${b.surface};color:${b.text}}
    .blk[data-custom-color] *{color:inherit!important}
    .blk .tag{background:var(--badge-background,rgba(255,217,126,.08));border-color:var(--badge-background,rgba(255,217,126,.25))}
    .blk[data-custom-size] :is(h1,h2,h3,p,li,blockquote){font-size:inherit!important}
    .blk[data-custom-font] :is(h1,h2,h3,p,li,blockquote,strong,span,em,figcaption){font-family:inherit!important}
    .blk[data-custom-weight] :is(h1,h2,h3,p,li,blockquote){font-weight:inherit!important}
  `
  const website = html.includes('<body class="view-website">')
  return html.replace('</head>', `<style>${css}\n${website ? websiteThemeCss(b) : ''}</style></head>`)
}
export function blockDesign(value = {}) {
  value = value && typeof value === 'object' ? value : {}
  const css = {}
  if (/^#[0-9a-f]{6}$/i.test(value.color)) css.color = value.color
  if (value.background === 'transparent' || /^#[0-9a-f]{6}$/i.test(value.background)) css.backgroundColor = value.background
  if (value.badgeBackground === 'transparent' || /^#[0-9a-f]{6}$/i.test(value.badgeBackground)) css['--badge-background'] = value.badgeBackground
  if (Number.isFinite(Number(value.fontSize)) && value.fontSize !== '') css.fontSize = Math.min(120, Math.max(10, Number(value.fontSize))) + 'px'
  if (['left', 'center', 'right'].includes(value.align)) css.textAlign = value.align
  if (['400', '500', '600', '700', '800', '900'].includes(String(value.weight))) css.fontWeight = value.weight
  if (value.font) css.fontFamily = fontStack(value.font)
  return css
}
