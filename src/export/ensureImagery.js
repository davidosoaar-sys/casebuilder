import {normalizeBrand} from '../brand.js'
import {apiHeaders} from '../apiAuth.js'
export async function ensureImagery({company,brand,fetchImpl=fetch,headers=apiHeaders}){
 const current=normalizeBrand(brand)
 if(current.heroImage||current.heroImageHidden)return {brand:current}
 try{
  const response=await fetchImpl('/api/brand',{method:'POST',headers:await headers(),body:JSON.stringify({company,website:current.website}),signal:AbortSignal.timeout(55000)})
  const result=await response.json()
  if(!response.ok)throw Error(result.error||'Image discovery could not finish.')
  const found=normalizeBrand(result)
  if(!found.heroImage)return {brand:current,warning:'No usable official cover image was found. The cover remains typographic.'}
  const patch={heroImage:found.heroImage,heroAlt:found.heroAlt,heroSource:found.heroSource,heroCandidates:found.heroCandidates,sources:[...new Set([...current.sources,...found.sources])]}
  return {brand:{...current,...patch},patch}
 }catch(e){return {brand:current,warning:'Cover image search could not finish: '+e.message}}
}
