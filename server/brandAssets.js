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
 for(const tag of html.match(/<(?:img|meta)\b[^>]*>/gi)||[]){
  const meta=/^<meta/i.test(tag),src=meta?(/^(?:og:image|twitter:image)$/i.test(attr(tag,'property')||attr(tag,'name'))?attr(tag,'content'):''):attr(tag,'src')||attr(tag,'data-src')
  if(!src)continue
  const label=(src+' '+attr(tag,'alt')+' '+attr(tag,'class')).toLowerCase()
  if(/logo|favicon|icon|avatar|portrait|shoe|sneaker|jordan|sprite|product-detail|download-page|opengraph|screenshot/i.test(label))continue
  const campaign=/hero|masthead|banner|campaign|just-do-it/i.test(label)
  const named=key&&label.replace(/[^a-z0-9]/g,'').includes(key)
  if(!campaign&&!meta&&!named)continue
  try{const url=new URL(src.replace(/&amp;/g,'&'),website);if(url.protocol==='https:')candidates.push({url:url.href,alt:attr(tag,'alt'),score:campaign?100:meta?80:60})}catch{}
 }
 return candidates.sort((a,b)=>b.score-a.score).filter((c,i,list)=>list.findIndex(x=>x.url===c.url)===i).slice(0,2)
}
