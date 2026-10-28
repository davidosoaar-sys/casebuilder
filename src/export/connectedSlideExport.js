import {apiHeaders} from '../apiAuth.js'

const encode=bytes=>new Promise((resolve,reject)=>{
  const reader=new FileReader()
  reader.onload=()=>resolve(String(reader.result).split(',')[1])
  reader.onerror=()=>reject(Error('Could not prepare the presentation.'))
  reader.readAsDataURL(new Blob([bytes]))
 })
export async function importPresentation({target,title,bytes,fetchImpl=fetch,headers=apiHeaders,toBase64=encode,}){
 if(target!=='google-slides')throw Error('Only Google Slides direct export is supported.')
 if(bytes.byteLength>2800000)throw Error('This deck is too large for direct export. Download PPTX instead.')
 const fileBase64=await toBase64(bytes)
 async function request(body){
  const response=await fetchImpl('/api/slide-export',{method:'POST',headers:await headers(),body:JSON.stringify(body),signal:AbortSignal.timeout(55000)})
  const result=await response.json()
  if(!response.ok){const error=Error(result.error||'Direct export failed.');error.toolkit=result.toolkit;throw error}
  return result
 }
 const result=await request({target,title,fileBase64})
 const url=new URL(result.url)
 if(url.protocol!=='https:'||url.username||url.password||!(url.hostname==='docs.google.com'&&url.pathname.startsWith('/presentation/')))throw Error('The destination returned an invalid editing link.')
 return {...result,url:url.href}
}
