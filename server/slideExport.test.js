import test from 'node:test'
import assert from 'node:assert/strict'
import {handleSlideExport} from './slideExport.js'
const env={SUPABASE_URL:'https://auth.test',VITE_SUPABASE_PUBLISHABLE_KEY:'public',COMPOSIO_API_KEY:'private',COMPOSIO_AUTH_GOOGLEDRIVE:'ac_drive',COMPOSIO_AUTH_CANVA:'ac_canva'}
const pptx=Buffer.from([80,75,3,4,1,2,3]).toString('base64')
const req=body=>({method:'POST',headers:{authorization:'Bearer session'},body})
const response=(data,status=200)=>({ok:status<400,status,json:async()=>data})
function fixture(toolkit='googledrive',results=[{status:200,data:{id:'presentation_1'}}],owner='u1'){
 const calls=[]
 const account={id:'ca_own',user_id:owner,status:'ACTIVE',toolkit:{slug:toolkit},auth_config:{id:env['COMPOSIO_AUTH_'+toolkit.toUpperCase()]}}
 return {calls,account,fetchImpl:async(url,options)=>{
  calls.push({url,...options})
  if(url.endsWith('/auth/v1/user'))return response({id:'u1'})
  if(url.includes('/connected_accounts?'))return response({items:[account]})
  if(url.endsWith('/tools/execute/proxy'))return response(results.shift())
  throw Error('Unexpected endpoint')
 }}
}
test('Google import converts a private PPTX into editable Slides for only the session owner',async()=>{
 const f=fixture();const result=await handleSlideExport(req({target:'google-slides',title:'Case',fileBase64:pptx,user_id:'victim',connected_account_id:'victim'}),{env,...f})
 assert.equal(result.status,200);assert.equal(result.body.url,'https://docs.google.com/presentation/d/presentation_1/edit')
 const proxy=JSON.parse(f.calls.at(-1).body)
 assert.equal(proxy.user_id,'u1');assert.equal(proxy.connected_account_id,'ca_own')
 assert.equal(proxy.method,'POST');assert.match(proxy.endpoint,/uploadType=multipart/)
 assert.ok(Buffer.from(proxy.binary_body.base64,'base64').includes(Buffer.from('application/vnd.google-apps.presentation')))
 assert.ok(!JSON.stringify(result).includes('private'))
})
test('missing auth, configuration and connection do not upload anything',async()=>{
 assert.equal((await handleSlideExport({method:'POST',body:{target:'google-slides'}},{env})).status,401)
 const f=fixture('googledrive',[],'other')
 assert.equal((await handleSlideExport(req({target:'google-slides',fileBase64:pptx}),{env,...f})).status,409)
 assert.equal(f.calls.some(c=>c.url.endsWith('/proxy')),false)
 const missing=await handleSlideExport(req({target:'google-slides',fileBase64:pptx}),{env:{...env,COMPOSIO_AUTH_GOOGLEDRIVE:''},...fixture()})
 assert.equal(missing.status,503);assert.equal(missing.body.code,'setup_required')
})
test('Canva and polling are rejected without contacting any service',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;throw Error('Unexpected request')};
 assert.equal((await handleSlideExport(req({target:'canva'}),{env,fetchImpl})).status,400);
 assert.equal((await handleSlideExport(req({target:'google-slides',action:'poll'}),{env,fetchImpl})).status,400);
 assert.equal(calls,0);
});
test('scope errors expose actionable text without credentials or provider payload',async()=>{
 const f=fixture('googledrive',[{status:403,data:{secret:'private-provider-key'}}])
 const r=await handleSlideExport(req({target:'google-slides',fileBase64:pptx}),{env,...f})
 assert.equal(r.status,502);assert.match(r.body.error,/Reconnect/);assert.ok(!JSON.stringify(r).includes('private-provider-key'))
})

test('inactive, disabled and mismatched auth configs cannot export',async()=>{
 for(const patch of [{status:'EXPIRED'},{is_disabled:true},{auth_config:{id:'wrong'}},{toolkit:{slug:'gmail'}}]){
  const f=fixture();Object.assign(f.account,patch);
  const result=await handleSlideExport(req({target:'google-slides',fileBase64:pptx}),{env,...f});
  assert.equal(result.status,409);assert.equal(f.calls.some(c=>c.url.endsWith('/proxy')),false);
 }
});
