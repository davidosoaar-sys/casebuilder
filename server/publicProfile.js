import {fetchPublic} from './publicWeb.js'
import {searchBackendOrNull} from './agentSearch.js'
import {publicProfileUrl} from '../src/profileMedia.js'
const norm=v=>publicProfileUrl(v).replace(/\/$/,'')
const text=v=>typeof v==='string'?v.trim().slice(0,160):''
const attrs=html=>[...html.matchAll(/(?:href|src|content|data-src)\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1].replace(/&amp;/g,'&'))
// Bind each photo/link to an observed public source, then verify the exact asset
// or outbound URL on that page. A source URL alone is not photo evidence.
export async function enrichPublicProfile(raw,{observedUrls=[],citations={},fetcher=fetchPublic,web=true}={}){
 const out={photo:null,links:[],email:null,emailSourceUrl:null,linkedin:null,linkedinSourceUrl:null}
 if(!web)return out
 const seen=new Set(observedUrls.map(norm).filter(Boolean)),pages=new Map()
 const observed=url=>{const u=publicProfileUrl(url);return u&&seen.has(norm(u))?u:''}
 async function page(url){
  if(!pages.has(url)){
   if(pages.size>=5)return null
   pages.set(url,(async()=>{try{const r=await fetcher(url,{limit:1000000});if(!/html|text\/plain/.test(r.type))return null;const html=r.buffer.toString('utf8');return {html,refs:attrs(html).map(v=>{try{return new URL(v,r.url).href}catch{return ''}})}}catch{return null}})())
  }
  return pages.get(url)
 }
 async function linked(url,sourceUrl){
  if(!publicProfileUrl(url)||!observed(sourceUrl))return false
  if(norm(url)===norm(sourceUrl))return true
  const p=await page(sourceUrl);return !!p?.refs.some(v=>norm(v)===norm(url))
 }
 let photo=raw.photo
 const requested=[...(Array.isArray(raw.links)?raw.links:[])].slice(0,5)
 const name=text(typeof raw.name==='string'?raw.name:raw.name?.value).toLowerCase()
 const identitySource=observed(raw.name?.sourceUrl||raw.source_urls?.[0])
 if(name&&identitySource){
  const p=await page(identitySource)
  if(p){
   const image=[...p.html.matchAll(/<img\b[^>]*>/gi)].find(m=>m[0].match(/alt\s*=\s*["']([^"']+)["']/i)?.[1].trim().toLowerCase()===name)
   const src=image?.[0].match(/(?:src|data-src)\s*=\s*["']([^"']+)["']/i)?.[1]
   if(!photo&&src)photo={url:new URL(src,identitySource).href,sourceUrl:identitySource}
   for(const m of p.html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{
    const visit=item=>{
     if(Array.isArray(item))return item.forEach(visit)
     if(!item||typeof item!=='object')return
     if(String(item['@type'])==='Person'&&text(item.name).toLowerCase()===name){
      const image=typeof item.image==='string'?item.image:item.image?.url||item.image?.contentUrl
      if(image&&!photo){const url=new URL(image,identitySource).href;p.refs.push(url);photo={url,sourceUrl:identitySource}}
      for(const url of Array.isArray(item.sameAs)?item.sameAs:[])requested.push({url,label:'Public profile',sourceUrl:identitySource})
      if(!raw.email&&typeof item.email==='string')raw={...raw,email:item.email.replace(/^mailto:/,''),emailSourceUrl:identitySource}
     }
     if(item['@graph'])visit(item['@graph'])
    };visit(JSON.parse(m[1]))
   }catch{}
  }
 }

 if(raw.linkedin)requested.unshift({url:typeof raw.linkedin==='string'?raw.linkedin:raw.linkedin.value,label:'LinkedIn',sourceUrl:raw.linkedinSourceUrl||raw.linkedin?.sourceUrl||raw.linkedin})
 for(const link of requested.slice(0,8)){
  const url=publicProfileUrl(link?.url),sourceUrl=observed(link?.sourceUrl)
  if(!url||!sourceUrl||!await linked(url,sourceUrl)||out.links.some(l=>l.url===url))continue
  const label=text(link.label)||new URL(url).hostname.replace(/^www\./,'')
  out.links.push({url,label,sourceUrl,sourceType:'web'})
  if(/^https:\/\/(?:[a-z]{2,3}\.|www\.)?linkedin\.com\/in\//i.test(url)){out.linkedin=url;out.linkedinSourceUrl=sourceUrl}
 }
 const email=typeof raw.email==='string'?raw.email:raw.email?.value
 const emailSource=observed(raw.emailSourceUrl||raw.email?.sourceUrl)
 if(typeof email==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&emailSource){
  const cited=String(citations[emailSource]||'').toLowerCase(),p=cited.includes(email.toLowerCase())?null:await page(emailSource)
  if(cited.includes(email.toLowerCase())||p?.html.toLowerCase().includes(email.toLowerCase())){out.email=email;out.emailSourceUrl=emailSource}
 }
 const photoUrl=publicProfileUrl(photo?.url),photoSource=observed(photo?.sourceUrl)
 if(photoUrl&&photoSource&&norm(photoUrl)!==norm(photoSource)&&await linked(photoUrl,photoSource))try{
  const asset=await fetcher(photoUrl,{limit:550000}),mime=asset.type.split(';')[0].toLowerCase(),b=asset.buffer
  const valid=mime==='image/png'&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||mime==='image/jpeg'&&b[0]===255&&b[1]===216&&b[2]===255||mime==='image/webp'&&b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP'
  if(valid&&b.length<=550000)out.photo={dataUrl:'data:'+mime+';base64,'+b.toString('base64'),imageUrl:photoUrl,sourceUrl:photoSource,sourceType:'web'}
 }catch{ /* A blocked or missing headshot never fails the identity result. */ }
 return out
}

// Fallback headshot when the agent returned none: search "<name> <company>", then on
// each result page accept only an <img> whose alt is exactly the person's name, or a
// JSON-LD Person with that exact name and an image, on a page that also names the
// company. The asset must be a real PNG/JPEG/WebP under 550 KB. Anything less is left
// out: initials are better than someone else's face.
const SKIP_PHOTO_HOSTS=/(^|\.)(podcasts\.apple\.com|open\.spotify\.com|podcasts\.google\.com|linkedin\.com|x\.com|twitter\.com|facebook\.com|instagram\.com|youtube\.com|crunchbase\.com|zoominfo\.com|rocketreach\.co|apollo\.io)$/i
const imageOk=(mime,b)=>mime==='image/png'&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||mime==='image/jpeg'&&b[0]===255&&b[1]===216&&b[2]===255||mime==='image/webp'&&b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP'
// Tokens that mean the picture shows more than one person or is not a face.
const GROUP_ALT=/\b(and|with|&|team|panel|group|logo|icon|linkedin|twitter|signature|autograph|book|cover)\b/i
const ICON_SRC=/(logo|icon|sprite|avatar-default|placeholder|linkedin|twitter|facebook|signature|autograph)[^/]*$|\/(banners?|profile_banners|covers?)\//i
const slug=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'')
// Ranked match: 3 = alt is exactly the name, 2 = alt is the name plus a suffix
// ("Farhan Thawar LeadDev", "Farhan Thawar headshot"), 1 = the file name carries
// the full name ("Farhan-Thawar-300x300.jpg"). Group shots and icons never match.
// File name is the person's name plus only size/format noise:
// "Farhan Thawar.jpg", "dana-ruiz-300x300.jpg", "Dana_Ruiz_headshot_2024.webp".
// "Satya_Nadella,_CEO_of_Microsoft_at_event.jpg" is rejected (likely a scene).
const FILE_NOISE=/^(?:\d+|\d+x\d+|x|w|h|e\d+|headshot|portrait|photo|profile|pic|image|img|scaled|crop|cropped|square|thumb|official|web|hires|large|small|medium|bw|color|colour|jpe?g|png|webp|avif|f|auto|q|dpr|c|lfill|fill|g|faces?)$/
function nameOnlyFile(src,want){
 let file='';try{file=decodeURIComponent(src.split(/[?#]/)[0].split('/').pop()||'')}catch{return false}
 const words=file.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(Boolean)
 const name=want.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(Boolean)
 const at=words.findIndex((w,i)=>name.every((n,j)=>words[i+j]===n))
 if(at<0)return false
 return words.filter((w,i)=>i<at||i>=at+name.length).every(w=>FILE_NOISE.test(w))
}
export function photoOnPage(html,name){
 const want=text(name).toLowerCase();if(!want)return ''
 const wantSlug=slug(want);let best='',rank=0
 for(const m of html.matchAll(/<img\b[^>]*>/gi)){
  const tag=m[0].replace(/\s+/g,' ')
  const src=(tag.match(/\b(?:data-src|data-lazy-src|src)\s*=\s*["']([^"']+)["']/i)?.[1]||'').replace(/&amp;/g,'&')
  if(!src||/^data:/i.test(src)||ICON_SRC.test(src.split(/[?#]/)[0]))continue
  const alt=(tag.match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1]||'').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().toLowerCase()
  let r=0
  if(alt===want)r=3
  else if(alt.startsWith(want)&&/^[^a-z]/.test(alt.slice(want.length))&&!GROUP_ALT.test(alt.slice(want.length)))r=2
  else if((!alt||!GROUP_ALT.test(alt))&&nameOnlyFile(src,want))r=1
  if(r>rank){rank=r;best=src;if(r===3)break}
 }
 if(best)return best
 // Page about this person (title or h1 starts with the name): trust its share image.
 const title=(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]||'')+'|'+(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'').replace(/<[^>]+>/g,'')
 if(title.split('|').some(t=>t.replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().toLowerCase().startsWith(want))){
  const og=html.match(/<meta\b[^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/i)?.[0].match(/\bcontent=["']([^"']+)["']/i)?.[1]
  if(og&&!ICON_SRC.test(og.split(/[?#]/)[0])&&!/default|social-image|share-image|brand/i.test(og))return og.replace(/&amp;/g,'&')
 }
 for(const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{
  let found=''
  const visit=item=>{if(found||!item||typeof item!=='object')return;if(Array.isArray(item))return item.forEach(visit)
   if(String(item['@type'])==='Person'&&text(item.name).toLowerCase()===want){const img=typeof item.image==='string'?item.image:item.image?.url||item.image?.contentUrl;if(img)found=img}
   for(const v of Object.values(item))if(v&&typeof v==='object')visit(v)}
  visit(JSON.parse(m[1]));if(found)return found
 }catch{}
 return ''
}
export async function findPublicPhoto({name,company,sourceUrls=[]},{search=searchBackendOrNull(),fetcher=fetchPublic,maxPages=6}={}){
 if(!text(name)||!text(company))return null
 // Pages the agent already cited for this person come first; they need no search key.
 const urls=[...sourceUrls.filter(u=>typeof u==='string')]
 if(search)try{for(const r of await search.search(`"${text(name)}" ${text(company)}`,{count:10}))if(r?.url)urls.push(r.url)}catch{}
 const co=text(company).toLowerCase(),who=text(name).toLowerCase(),seen=new Set()
 let tried=0
 for(const raw of urls){
  let url;try{url=new URL(raw)}catch{continue}
  if(url.protocol!=='https:'||SKIP_PHOTO_HOSTS.test(url.hostname)||seen.has(url.href))continue
  seen.add(url.href)
  if(++tried>maxPages)break
  try{
   const page=await fetcher(url.href,{limit:1500000});if(!/html/.test(page.type))continue
   const html=page.buffer.toString('utf8'),lower=html.toLowerCase()
   if(!lower.includes(co)||!lower.includes(who))continue
   const src=photoOnPage(html,name);if(!src)continue
   const imageUrl=new URL(src,page.url||url.href).href
   if(!publicProfileUrl(imageUrl))continue
   const asset=await fetcher(imageUrl,{limit:550000}),mime=asset.type.split(';')[0].toLowerCase(),b=asset.buffer
   if(imageOk(mime,b)&&b.length<=550000)return {dataUrl:'data:'+mime+';base64,'+b.toString('base64'),imageUrl,sourceUrl:url.href,sourceType:'web'}
  }catch{/* next page */}
 }
 return null
}
