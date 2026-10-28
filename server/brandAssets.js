import { publicProfileUrl } from '../src/profileMedia.js'
// Asset validation is deterministic. Provenance establishes where the mark was
// published; these checks establish that it is usable, not a semantic guarantee.
const attr=(tag,key)=>tag.match(new RegExp('\\b'+key+'=["\']([^"\']+)["\']','i'))?.[1]||''
export function inspectBrandImage(buffer,mime,{icon=false}={}){
  mime=mime.split(';')[0].toLowerCase()
  let width=0,height=0,vector=false
  if(mime==='image/svg+xml'){
    const svg=buffer.toString('utf8')
    if(!/^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg\b/i.test(svg)||!/<(?:path|rect|circle|ellipse|polygon|polyline|line|text)\b/i.test(svg))throw Error('The SVG contains no drawable logo.')
    if(/<(?:script|foreignObject|iframe|use|image)\b|\bon[a-z]+\s*=|(?:href|src)\s*=|<!DOCTYPE|<!ENTITY|@import|javascript:/i.test(svg)||/url\s*\(/i.test(svg.replace(/url\(\s*["']?#[\w-]+["']?\s*\)/gi,'')))throw Error('The SVG has unsupported external or active content.')
    const tag=svg.match(/<svg\b[^>]*>/i)[0],box=attr(tag,'viewBox').split(/[ ,]+/).map(Number)
    width=box.length===4?box[2]:parseFloat(attr(tag,'width'));height=box.length===4?box[3]:parseFloat(attr(tag,'height'));vector=true
    if(!Number.isFinite(width)||!Number.isFinite(height)){width=300;height=150}
  }else if(mime==='image/png'&&buffer.length>=24&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){width=buffer.readUInt32BE(16);height=buffer.readUInt32BE(20)}
  else if(mime==='image/jpeg'&&buffer[0]===255&&buffer[1]===216){
    for(let i=2;i+8<buffer.length;){if(buffer[i]!==255)break;const marker=buffer[i+1],size=buffer.readUInt16BE(i+2);if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){height=buffer.readUInt16BE(i+5);width=buffer.readUInt16BE(i+7);break}if(size<2)break;i+=size+2}
  }else if(mime==='image/webp'&&buffer.length>=30&&buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP'){
    const kind=buffer.toString('ascii',12,16)
    if(kind==='VP8X'){width=1+buffer.readUIntLE(24,3);height=1+buffer.readUIntLE(27,3)}
    if(kind==='VP8 '&&buffer[23]===157&&buffer[24]===1&&buffer[25]===42){width=buffer.readUInt16LE(26)&16383;height=buffer.readUInt16LE(28)&16383}
    if(kind==='VP8L'&&buffer[20]===47){const bits=buffer.readUInt32LE(21);width=(bits&16383)+1;height=((bits>>>14)&16383)+1}
  }else throw Error('The image bytes do not match a supported logo format.')
  if(!(width>0&&height>0)||width*height>40_000_000||Math.max(width/height,height/width)>40)throw Error('The logo dimensions are unusable.')
  if(!vector&&(width<(icon?64:120)||height<24))throw Error('The raster logo is too small for a clear presentation.')
  if(mime==='image/png'&&(!buffer.includes(Buffer.from('IHDR'))||!buffer.includes(Buffer.from('IDAT'))||!buffer.includes(Buffer.from('IEND'))))throw Error('The PNG is incomplete.')
  return {mime,width,height,vector}
}

export function brandPageLinks(html,website){
  const base=new URL(website),out=[]
  for(const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)){
    const href=attr('<a '+match[1]+'>','href');if(!href)continue
    try{const u=new URL(href.replace(/&amp;/g,'&'),base),a=u.hostname.replace(/^www\./,''),b=base.hostname.replace(/^www\./,'')
      if(u.protocol!=='https:'||!(a===b||a.endsWith('.'+b)||b.endsWith('.'+a)))continue
      if(/brand[- /]?(?:assets|kit|guidelines|resources)|\/brand\/?$|media[- /]?(?:kit|assets)|press[- /]?kit/i.test(u.pathname+' '+match[2].replace(/<[^>]+>/g,' '))&&!/trademark|legal|login/i.test(u.pathname))out.push(u.href)
    }catch{}
  }
  return [...new Set(out)].slice(0,2)
}

export function brandKitDownloads(html,website,company){
  const key=String(company||new URL(website).hostname.split('.')[0]).toLowerCase().replace(/[^a-z0-9]/g,'')
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].flatMap(m=>{
    const href=attr('<a '+m[1]+'>','href'),label=(m[1]+' '+m[2].replace(/<[^>]+>/g,' ')).toLowerCase()
    if(!/logo|wordmark/i.test(label)||/misuse|incorrect|old[-_ ]|dont|don't|partner|customer/i.test(label)||!href)return []
    try{const u=new URL(href.replace(/&amp;/g,'&'),website);return u.protocol==='https:'&&/\.(svg|png|webp|jpe?g)(?:\?|$)/i.test(u.href)&&(/download|primary|full[- ]?logo/i.test(label)||label.replace(/[^a-z0-9]/g,'').includes(key))?[{url:u.href,score:115,sourcePage:website,authority:'official-brand-kit'}]:[]}catch{return []}
  }).slice(0,8)
}
export function brandHeroCandidates(html,website,company=''){
 const key=company.toLowerCase().replace(/[^a-z0-9]/g,'')
 const candidates=[]
 for(const match of html.matchAll(/<(?:img|meta|source|video)\b[^>]*>/gi)){
  const tag=match[0],context=html.slice(Math.max(0,match.index-500),match.index)
  const meta=/^<meta/i.test(tag),src=meta?(/^(?:og:image|twitter:image)$/i.test(attr(tag,'property')||attr(tag,'name'))?attr(tag,'content'):''):(attr(tag,'srcset')||attr(tag,'data-srcset')).split(',').at(-1)?.trim().split(/\s+/)[0]||attr(tag,'data-src')||attr(tag,'src')||attr(tag,'poster')
  if(!src)continue
  let path=src;try{path=new URL(src,website).pathname}catch{}
  const label=(path+' '+attr(tag,'alt')+' '+attr(tag,'class')).toLowerCase()
  if(/logo|favicon|icon|avatar|portrait|sprite|download-page|opengraph|screenshot|size[-_ ]?chart|swatch|groupcompany|tracking|beacon|pixel_|(?:^|[\/_-])ceo[\/_.-]|headshot|leadership/i.test(label))continue
  const campaign=/hero|masthead|banner|campaign|just-do-it|key[-_ ]?visual|main[-_ ]?visual|(?:^|[\/_-])kv[\/_.-]/i.test(label)||/^<video/i.test(tag)||/(?:class|id|data-[\w-]+)=["'][^"']*(?:hero|masthead|campaign|banner)/i.test(context)
  const product=/product|shoe|sneaker|jordan|headphone|packaging|commerce|storefront/i.test(label)
  const named=key&&label.replace(/[^a-z0-9]/g,'').includes(key)
  if(!campaign&&!meta&&!named&&!product)continue
  try{const url=new URL(src.replace(/&amp;/g,'&'),website);if(url.protocol==='https:')candidates.push({url:url.href,alt:attr(tag,'alt'),score:(campaign?100:product?90:meta?80:60)+(/largetall|portrait|mediumtall/.test(label)?10:0)-(/small|thumbnail/.test(label)?30:0)})}catch{}
 }
 return candidates.sort((a,b)=>b.score-a.score).filter((c,i,list)=>list.findIndex(x=>x.url===c.url)===i).slice(0,6)
}

export function brandImagePages(html,website){
 const host=new URL(website).hostname.replace(/^www\./,'')
 return [...html.matchAll(/<a\b[^>]*>/gi)].flatMap(m=>{
  try{const u=new URL(attr(m[0],'href'),website),h=u.hostname.replace(/^www\./,'')
   return u.protocol==='https:'&&(h===host||h.endsWith('.'+host))&&/about|newsroom|press|campaign|products?|company/i.test(u.pathname)&&!/privacy|legal|login|support/i.test(u.pathname)?[u.href]:[]
  }catch{return []}
 }).filter((u,i,all)=>all.indexOf(u)===i).slice(0,2)
}

export function brandCssHeroCandidates(css, stylesheet) {
 return [...css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/gi)].flatMap(m=>{
  const src=m[1]
  if(!/\.(?:png|jpe?g|webp)(?:\?|$)/i.test(src)||!/hero|campaign|masthead|product/i.test(src)||/logo|icon|sprite|small|thumbnail/i.test(src))return []
  try{const url=new URL(src,stylesheet);return url.protocol==='https:'?[{url:url.href,alt:'Official company campaign image'}]:[]}catch{return []}
 }).filter((c,i,all)=>all.findIndex(x=>x.url===c.url)===i).slice(0,2)
}

// The same byte and public-network checks serve discovery and later replacements.
// A public web page also works for brand imagery: its own hero or social image
// is used, so the agent can pass the page it found in a search.
export async function fetchBrandAsset(url, kind, fetcher, { page = true } = {}) {
  if (!['logo', 'heroImage'].includes(kind)) throw Error('Unknown brand asset.')
  if (!publicProfileUrl(url)) throw Error('Use a public HTTPS image source.')
  const image = await fetcher(url, { limit: kind === 'heroImage' ? (page ? 1500000 : 700000) : 600000 })
  if (!publicProfileUrl(image.url)) throw Error('The image source is not public HTTPS.')
  const mime = image.type.split(';')[0].toLowerCase()
  if (mime === 'text/html' || mime === 'application/xhtml+xml') {
    if (kind !== 'heroImage' || !page) throw Error('That link is a web page, not an image.')
    const html = image.buffer.toString('utf8'), candidates = brandHeroCandidates(html, image.url)
    let last = Error('That page has no usable landscape image.')
    for (const candidate of candidates) {
      try { return await fetchBrandAsset(candidate.url, kind, fetcher, { page: false }) } catch (error) { last = error }
    }
    throw last
  }
  if (kind === 'heroImage' && !/^image\/(png|jpeg|webp)$/.test(mime)) throw Error('Use PNG, JPEG or WebP for brand imagery.')
  const size = inspectBrandImage(image.buffer, mime)
  if (kind === 'heroImage' && (size.width < 480 || size.height < 240 || size.width / size.height < .5 || size.width / size.height > 6)) throw Error('Choose a clear brand image at least 480 × 240 pixels, suitable for a cropped cover panel.')
  return { data: 'data:' + mime + ';base64,' + image.buffer.toString('base64'), source: image.url }
}
