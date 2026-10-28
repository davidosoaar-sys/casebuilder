import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto'
import {supabaseServerEnv} from './accountKey.js'

const BASE='https://backend.composio.dev/api/v3.1'
const PPTX='application/vnd.openxmlformats-officedocument.presentationml.presentation'
const targets={'google-slides':'googledrive',canva:'canva'}
const reply=(status,body)=>({status,body})
const signature=(value,key)=>createHmac('sha256',key).update(value).digest('hex')
function jobTicket(job,user,account,key){const value=JSON.stringify({job,user,account,until:Date.now()+15*60e3});return Buffer.from(value).toString('base64url')+'.'+signature(value,key)}
function readTicket(ticket,user,account,key){
 if(typeof ticket!=='string'||ticket.length>3000)throw Error('Invalid import ticket')
 const [encoded,sig]=ticket.split('.'),value=Buffer.from(encoded,'base64url').toString(),expected=signature(value,key)
 if(!/^[a-f0-9]{64}$/.test(sig||'')||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))throw Error('Invalid import ticket')
 const data=JSON.parse(value)
 if(data.user!==user||data.account!==account||data.until<Date.now()||!/^[-\w]+$/.test(data.job))throw Error('Expired or invalid import ticket')
 return data.job
}
function editUrl(url,provider){
 try{const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password)return ''
  return provider==='canva'&&['www.canva.com','canva.com'].includes(u.hostname)||provider==='google-slides'&&u.hostname==='docs.google.com'&&u.pathname.startsWith('/presentation/')?u.href:''
 }catch{return ''}
}

export async function handleSlideExport(req,{env=process.env,fetchImpl=fetch}={}){
 if(req.method!=='POST')return reply(405,{error:'Method not allowed'})
 const {target,action='upload',fileBase64,title,ticket}=req.body||{},toolkit=targets[target]
 if(!toolkit||!['upload','poll'].includes(action)||action==='poll'&&target!=='canva')return reply(400,{error:'Invalid export target or action'})
 const token=/^Bearer\s+(\S+)$/i.exec(req.headers?.authorization||req.headers?.Authorization||'')?.[1]
 if(!token)return reply(401,{error:'Sign in before exporting to your account.'})
 const auth=supabaseServerEnv(env)
 if(!auth.url||!auth.anon)return reply(503,{error:'Account authentication is not configured.'})
 try{
  const who=await fetchImpl(auth.url+'/auth/v1/user',{headers:{apikey:auth.anon,Authorization:'Bearer '+token},signal:AbortSignal.timeout(10000)})
  if(!who.ok)return reply(401,{error:'Sign in again to export.'})
  const user=await who.json()
  if(!user?.id)return reply(401,{error:'Invalid session.'})
  if(!env.COMPOSIO_API_KEY||!env['COMPOSIO_AUTH_'+toolkit.toUpperCase()])return reply(503,{error:`Direct export is not configured. Set up the ${toolkit==='canva'?'Canva':'Google Drive'} connection with import/write permission. You can still download PowerPoint.`,code:'setup_required'})
  async function api(path,body){
   const r=await fetchImpl(BASE+path,{method:body?'POST':'GET',headers:{'x-api-key':env.COMPOSIO_API_KEY,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(25000)})
   if(!r.ok)throw Error('The connection service is unavailable. Retry later.')
   return r.json()
  }
  let account,cursor,seen=new Set()
  do{
   const q=new URLSearchParams({user_ids:user.id,statuses:'ACTIVE',limit:'100',...(cursor?{cursor}:{})})
   const page=await api('/connected_accounts?'+q)
   account=(page.items||[]).find(a=>a.user_id===user.id&&a.status==='ACTIVE'&&!a.is_disabled&&a.toolkit?.slug===toolkit&&a.auth_config?.id===env['COMPOSIO_AUTH_'+toolkit.toUpperCase()])
   cursor=page.next_cursor
   if(cursor&&seen.has(cursor))throw Error('Connections could not be loaded.')
   seen.add(cursor)
  }while(!account&&cursor&&seen.size<20)
  if(!account)return reply(409,{error:`Connect ${toolkit==='canva'?'Canva':'Google Drive'} to export directly.`,code:'connect_required',toolkit})
  async function proxy(endpoint,method,binary,parameters=[]){
   const result=await api('/tools/execute/proxy',{connected_account_id:account.id,user_id:user.id,endpoint,method,parameters,...(binary?{binary_body:binary}:{})})
   if(!Number.isInteger(result.status)||result.status<200||result.status>=300)throw Error(result.status===401||result.status===403?'Reconnect the destination account with permission to create/import presentations.':'The destination could not import this presentation. Retry or download the PPTX.')
   return result.data
  }
  function canvaResult(data){
   const job=data?.job
   if(job?.status==='success'){
    const designs=(job.result?.designs||[]).map(d=>({url:editUrl(d.urls?.edit_url,'canva'),title:d.title})).filter(d=>d.url)
    if(!designs.length)throw Error('Canva finished without an editing link.')
    return reply(200,{url:designs[0].url,designs})
   }
   if(job?.status==='failed')throw Error('Canva could not import the presentation. Download the PPTX to try manually.')
   if(!/^[-\w]+$/.test(job?.id||''))throw Error('Canva returned an invalid import job.')
   return reply(202,{ticket:jobTicket(job.id,user.id,account.id,env.COMPOSIO_API_KEY),pending:true})
  }
  if(action==='poll')return canvaResult(await proxy('https://api.canva.com/rest/v1/imports/'+encodeURIComponent(readTicket(ticket,user.id,account.id,env.COMPOSIO_API_KEY)),'GET'))
  if(typeof fileBase64!=='string'||fileBase64.length>3800000||!/^[A-Za-z0-9+/]+={0,2}$/.test(fileBase64))return reply(413,{error:'The presentation is too large for direct export. Download PPTX instead.'})
  const bytes=Buffer.from(fileBase64,'base64')
  if(!bytes.subarray(0,4).equals(Buffer.from([80,75,3,4])))return reply(400,{error:'Provide a PowerPoint presentation.'})
  const name=String(title||'Business case').replace(/[\r\n\x00-\x1f]/g,'').slice(0,100)
  if(target==='canva')return canvaResult(await proxy('https://api.canva.com/rest/v1/imports','POST',{base64:fileBase64,content_type:'application/octet-stream'},[{name:'Import-Metadata',type:'header',value:JSON.stringify({title_base64:Buffer.from(name.slice(0,50)).toString('base64'),mime_type:PPTX})}]))
  const boundary='casebuilder_'+randomUUID().replaceAll('-','')
  const metadata=JSON.stringify({name,mimeType:'application/vnd.google-apps.presentation'})
  const body=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${PPTX}\r\n\r\n`),bytes,Buffer.from(`\r\n--${boundary}--\r\n`)])
  const data=await proxy('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink','POST',{base64:body.toString('base64'),content_type:'multipart/related; boundary='+boundary})
  if(!/^[-\w]+$/.test(data?.id||''))throw Error('Google Drive did not return a presentation ID.')
  return reply(200,{url:editUrl(data.webViewLink,'google-slides')||`https://docs.google.com/presentation/d/${data.id}/edit`})
 }catch(e){return reply(502,{error:/^(?:Invalid|Expired)/.test(e.message)?'Import session expired. Export again.':/^(?:The |Reconnect |Connections |Canva |Google Drive )/.test(e.message)?e.message:'Direct export failed. Retry or download the PPTX.'})}
}
