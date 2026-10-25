import {fetchPublic} from './publicWeb.js'
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
