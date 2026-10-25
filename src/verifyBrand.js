import {normalizeBrand} from './brand.js'
import {contrast} from './export/websiteFramework.js'

// Used by both onboarding and chat. Only embedded bytes are decoded here; the
// browser never visits a researched URL or executes a remote page.
const timeout=(promise,ms)=>new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('Display check timed out')),ms)
  promise.then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)})
})
export function assessLogoPixels(pixels,background){
  const colors=[]
  for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>64)colors.push('#'+[pixels[i],pixels[i+1],pixels[i+2]].map(v=>v.toString(16).padStart(2,'0')).join(''))
  if(!colors.length)return {visible:false,background}
  const readable=bg=>colors.filter(c=>contrast(c,bg)>=3).length/colors.length
  const best=['#ffffff','#111111'].sort((a,b)=>readable(b)-readable(a))[0]
  // A multicolor mark can have a visible symbol but an invisible wordmark.
  // Compare all ink, not merely the presence of a handful of visible pixels.
  const transparent=colors.length<pixels.length/4*.95
  if(readable(background)>=.12&&(!transparent||readable(background)>=.6||readable(background)>=readable(best)*.9))return {visible:true,background}
  return {visible:readable(best)>=.12,background:best}
}

async function inspectLogo(brand){
  const img=new Image()
  await timeout(new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('The logo could not be decoded'));img.src=brand.logo}),4000)
  if(!img.naturalWidth||!img.naturalHeight)throw Error('The logo has no visible dimensions')
  const canvas=document.createElement('canvas'),scale=256/Math.max(img.naturalWidth,img.naturalHeight)
  canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale))
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Display checks are unavailable')
  ctx.drawImage(img,0,0,canvas.width,canvas.height)
  const result=assessLogoPixels(ctx.getImageData(0,0,canvas.width,canvas.height).data,brand.logoBackground==='transparent'?brand.background:brand.logoBackground)
  if(!result.visible)throw Error('The logo is blank or cannot be made visible')
  return result
}
async function inspectFonts(brand){
  if(!brand.fontFaces.length)return []
  return Promise.all(brand.fontFaces.map(async face=>{
    try{const font=await timeout(new FontFace(face.family,`url(${face.data})`).load(),4000);document.fonts.add(font);return {family:face.family,loaded:true}}
    catch{return {family:face.family,loaded:false}}
  }))
}
export async function verifyBrandForDisplay(value,{logoCheck=inspectLogo,fontCheck=inspectFonts}={}){
  const brand=normalizeBrand(value)
  if(!brand.logo)return brand
  const review=brand.review||{version:1,mode:'deterministic-fallback',status:'needs-review',decisions:[],adjustments:[],warnings:[],checks:{}}
  review.checks={...review.checks,displayCheckPerformed:true,visualReviewPerformed:false}
  try{
    let [logo,fonts]=await Promise.all([logoCheck(brand),fontCheck(brand)])
    if(!logo.visible)throw Error('The logo is blank')
    // Prefer a different published variant over adding a field to the mark.
    if(logo.background!==brand.background||brand.logoBackground!=='transparent')for(const variant of brand.logoVariants){
      if(variant.authority==='company-profile'&&review.checks.officialSource)continue
      try{
        const alternative=await logoCheck({...brand,logo:variant.logo,logoBackground:'transparent'})
        if(alternative.visible&&alternative.background===brand.background){
          brand.logo=variant.logo;brand.logoBackground='transparent';logo=alternative
          const decision=review.decisions.find(d=>d.field==='Logo');if(decision)decision.sourceUrl=variant.sourceUrl
          review.adjustments.push('Selected another published logo variant after checking the complete mark against the canvas.')
          break
        }
      }catch{/* Keep testing other verified variants. */}
    }
    if(logo.background!==(brand.logoBackground==='transparent'?brand.background:brand.logoBackground)){
      brand.logoBackground=logo.background;review.adjustments.push('Logo pixels checked against the canvas; added a neutral field for legibility without recoloring the mark.')
    }
    const failed=fonts.filter(f=>!f.loaded).map(f=>f.family)
    brand.fontFaces=brand.fontFaces.filter(f=>!failed.includes(f.family))
    if(failed.includes(brand.fontName)){brand.fontData='';brand.fontName=''}
    for(const family of failed)review.warnings.push(family+' could not load. Its name is preserved; a device fallback may be used.')
    review.checks.logoDecoded=true;review.checks.logoVisible=true;review.checks.fontFilesLoaded=failed.length===0&&fonts.length>0
    brand.status='ready';brand.message=failed.length?'Branding found. A font file is unavailable; the font name is preserved.':'Branding found. Logo display checked automatically.'
  }catch(error){
    brand.logo='';brand.status='error';brand.message='No usable logo passed the display check. Your case can continue with the company name.'
    review.checks.logoDecoded=false;review.checks.logoVisible=false;review.warnings.push(error.message)
  }
  return normalizeBrand({...brand,review})
}
