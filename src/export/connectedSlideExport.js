import {apiHeaders} from '../apiAuth.js'

const encode=bytes=>new Promise((resolve,reject)=>{
  const reader=new FileReader()
  reader.onload=()=>resolve(String(reader.result).split(',')[1])
  reader.onerror=()=>reject(Error('Could not prepare the presentation.'))
  reader.readAsDataURL(new Blob([bytes]))
 })
export async function importPresentation({target,title,bytes,fetchImpl=fetch,headers=apiHeaders,toBase64=encode,pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))}){
 if(bytes.byteLength>2800000)throw Error('This deck is too large for direct export. Download PPTX instead.')
 const fileBase64=await toBase64(bytes)
 async function request(body){
  const response=await fetchImpl('/api/slide-export',{method:'POST',headers:await headers(),body:JSON.stringify(body),signal:AbortSignal.timeout(55000)})
  const result=await response.json()
  if(!response.ok){const error=Error(result.error||'Direct export failed.');error.toolkit=result.toolkit;throw error}
  return result
 }
 let result=await request({target,title,fileBase64})
 for(let i=0;result.pending&&i<30;i++){
  await pause(2000)
  result=await request({target,action:'poll',ticket:result.ticket})
 }
 if(result.pending)throw Error('Canva is still importing. Check your Canva projects before exporting again.')
 const url=new URL(result.url)
 if(url.protocol!=='https:'||url.username||url.password||!(target==='canva'?['canva.com','www.canva.com'].includes(url.hostname):url.hostname==='docs.google.com'&&url.pathname.startsWith('/presentation/')))throw Error('The destination returned an invalid editing link.')
 return {...result,url:url.href}
}
