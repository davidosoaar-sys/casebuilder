import test from 'node:test'
import assert from 'node:assert/strict'
import { createMcpHandler, hashToken } from './mcp.js'
import { INPUT_FIELDS } from '../src/valueModel.js'
const token = 'a'.repeat(64)
const deal = {id:'deal',name:'Example',fields:INPUT_FIELDS.map(f => ({...f,value:'',source:{state:'empty',origin:''}})),stakeholders:[],deck:[],connectors:{},createdAt:1,updatedAt:1}
function fixture({revoked=false, conflict=false, foreign=false}={}) {
  const calls=[]
  const fetchImpl = async (url,options) => {
    const u=new URL(url), q=u.searchParams; calls.push({u,options})
    let result
    if(u.pathname.endsWith('/mcp_tokens')) {
      if(options.method==='GET') { assert.equal(q.get('token_hash'),`eq.${hashToken(token)}`); assert.equal(q.get('revoked_at'),'is.null'); result=revoked?[]:[{id:'token',owner_id:'owner'}] }
      else result=[]
    } else {
      if(options.method !== 'POST') assert.equal(q.get('owner_id'),'eq.owner')
      if(u.pathname.endsWith('/deals')) result=foreign?[]:options.method==='PATCH'?(conflict?[]:[{version:3}]):[{id:'deal',data:structuredClone(deal),version:2}]
      else { if(options.method==='POST') assert.equal(JSON.parse(options.body).owner_id,'owner'); result=[] }
    }
    return {ok:true,status:200,json:async()=>result}
  }
  const handler=createMcpHandler({env:{SUPABASE_URL:'https://db.test',SUPABASE_SECRET_KEY:'secret',APP_URL:'https://app.test'},fetchImpl})
  const request=async (body,extra={}) => {
    const res={headers:{},setHeader(k,v){this.headers[k]=v},status(s){this.code=s;return this},json(b){this.body=b;return this},end(){return this}}
    await handler({method:'POST',url:`/api/mcp?k=${token}`,headers:{},body,...extra},res)
    return res
  }
  const call=(name,args={})=>request({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:`casebuilder_${name}`,arguments:args}})
  return {request,call,calls}
}
const inputs=[{key:'engineers',value:100,state:'input',origin:'Customer'}]
test('SHA-256 known vector',()=>assert.equal(hashToken('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'))
test('initialize, discovery, ping and notification',async()=>{
 const {request}=fixture()
 for(const version of ['2025-11-25','2025-06-18','2025-03-26','2024-11-05']) assert.equal((await request({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:version}})).body.result.protocolVersion,version)
 assert.equal((await request({jsonrpc:'2.0',id:1,method:'tools/list'})).body.result.tools.length,6)
 assert.deepEqual((await request({jsonrpc:'2.0',id:1,method:'ping'})).body.result,{})
 assert.equal((await request({jsonrpc:'2.0',method:'notifications/initialized'})).code,202)
 // Claude sends the newest protocol header; a newer unknown one must not be refused either.
 for(const v of ['2025-11-25','2099-01-01']) assert.equal((await request({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:v}},{headers:{'mcp-protocol-version':v}})).code,200)
 assert.equal((await request({jsonrpc:'2.0',id:1,method:'ping'},{headers:{origin:'https://claude.ai'}})).code,200)
})
test('HTTP and JSON errors, revoked tokens, origin checks',async()=>{
 const {request}=fixture()
 assert.equal((await request({}, {method:'GET'})).code,405)
 assert.equal((await request('{')).body.error.code,-32700)
 assert.equal((await request([])).body.error.code,-32600)
 assert.equal((await request({}, {headers:{origin:'https://evil.test'}})).code,403)
 assert.equal((await fixture({revoked:true}).request({})).code,401)
})
test('read, calculate, list and links are owner scoped',async()=>{
 const {call}=fixture()
 for(const name of ['read_deal','calculate','links']) assert.ok(!(await call(name,{caseId:'deal'})).body.result.isError)
 assert.ok(!(await call('list_deals')).body.result.isError)
 assert.equal((await fixture({foreign:true}).call('read_deal',{caseId:'other'})).body.result.isError,true)
})
test('approval, source metadata, unknown keys and stale versions rejected before write',async()=>{
 for(const args of [
  {approved:false,inputs}, {approved:true,inputs:[{...inputs[0],origin:''}]},
  {approved:true,inputs:[{...inputs[0],value:-1}]}, {approved:true,inputs:[{...inputs[0],key:'unknown'}]}, {approved:true,inputs:[{...inputs[0],extra:1}]},
  {approved:true,inputs,expectedVersion:1}, {approved:true,inputs,extra:1}
 ]) {
  const {call,calls}=fixture()
  assert.equal((await call('apply_inputs',{caseId:'deal',expectedVersion:2,...args})).body.result.isError,true)
  assert.ok(!calls.some(c=>c.u.pathname.endsWith('/deals') && c.options.method==='PATCH'))
 }
})
test('reviewed update preserves full deal and uses atomic version filter',async()=>{
 const {call,calls}=fixture()
 assert.ok(!(await call('apply_inputs',{caseId:'deal',expectedVersion:2,approved:true,inputs})).body.result.isError)
 const write=calls.find(c=>c.u.pathname.endsWith('/deals') && c.options.method==='PATCH')
 assert.equal(write.u.searchParams.get('version'),'eq.2')
 const saved=JSON.parse(write.options.body).data
 assert.deepEqual(saved.deck,deal.deck)
 assert.equal(saved.fields.find(f=>f.key==='engineers').source.origin,'Customer')
 assert.equal((await fixture({conflict:true}).call('apply_inputs',{caseId:'deal',expectedVersion:2,approved:true,inputs})).body.result.isError,true)
})
test('context uses project files and requires approval',async()=>{
 const {call,calls}=fixture()
 const args={caseId:'deal',name:'Notes',text:'Transcript',origin:'Granola',approved:false}
 assert.equal((await call('add_context',args)).body.result.isError,true)
 assert.ok(!(await call('add_context',{...args,approved:true})).body.result.isError)
 const row=JSON.parse(calls.find(c=>c.options.method==='POST').options.body)
 assert.equal(row.kind,'context'); assert.equal(row.deal_id,'deal'); assert.match(row.text,/Granola/)
})
