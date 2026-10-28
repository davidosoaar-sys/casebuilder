import test from 'node:test'
import assert from 'node:assert/strict'
import {importPresentation} from './connectedSlideExport.js'
const options={bytes:new Uint8Array([1]),title:'Case',headers:async()=>({Authorization:'Bearer session'}),toBase64:async()=>'UEsDBA==',pause:async()=>{}}
const response=(data,status=200)=>({ok:status<400,status,json:async()=>data})
test('direct Google export returns the actual presentation and does not download',async()=>{
 const r=await importPresentation({...options,target:'google-slides',fetchImpl:async(url,request)=>{
  assert.equal(url,'/api/slide-export');assert.equal(request.headers.Authorization,'Bearer session')
  assert.equal(JSON.parse(request.body).target,'google-slides')
  return response({url:'https://docs.google.com/presentation/d/abc/edit'})
 }})
 assert.match(r.url,/presentation\/d\/abc/)
})
test('Canva is not offered as a direct export destination',async()=>{
 await assert.rejects(importPresentation({...options,target:'canva'}),/Only Google Slides/);
});
test('connection-required errors retain the toolkit and invalid links are rejected',async()=>{
 await assert.rejects(importPresentation({...options,target:'google-slides',fetchImpl:async()=>response({error:'Connect Google Drive',toolkit:'googledrive'},409)}),e=>e.toolkit==='googledrive')
 await assert.rejects(importPresentation({...options,target:'google-slides',fetchImpl:async()=>response({url:'https://evil.test/'})}),/invalid editing link/)
})
