import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawn} from 'node:child_process'
import readline from 'node:readline'

test('MCP case workflow generates artifacts, retains evidence and rejects unapproved writes',async()=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'cb-mcp-test-'))
 const child=spawn(process.execPath,['plugin/scripts/mcp.mjs'],{env:{...process.env,CASEBUILDER_HOME:home},stdio:['pipe','pipe','pipe']})
 let seq=0;const pending=new Map();let stderr=''
 child.stderr.on('data',s=>stderr+=s)
 readline.createInterface({input:child.stdout}).on('line',s=>{const m=JSON.parse(s);pending.get(m.id)?.(m);pending.delete(m.id)})
 const request=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>reject(Error('MCP timeout '+stderr)),30000);pending.set(id,m=>{clearTimeout(timer);resolve(m.result)});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n')})
 const call=(name,args={})=>request('tools/call',{name,arguments:args})
 try{
  assert.equal((await request('initialize',{protocolVersion:'2025-06-18'})).serverInfo.name,'casebuilder-local')
  assert.equal((await request('tools/list')).tools.length,6)
  const created=JSON.parse((await call('casebuilder_create',{company:'Northwind demo'})).content[0].text)
  const caseId=created.caseId
  const inputs=[{key:'engineers',value:500,state:'suggestion',origin:'Fictional Granola fixture',quote:'We have about 500 engineers.',link:'https://example.com/demo-note'}]
  assert.equal((await call('casebuilder_apply_inputs',{caseId,approved:false,inputs})).isError,true)
  assert.equal((await call('casebuilder_apply_inputs',{caseId,approved:true,inputs})).isError,undefined)
  const data=JSON.parse((await call('casebuilder_read',{caseId})).content[0].text)
  assert.equal(data.inputs.engineers.source.quote,inputs[0].quote)
  assert.equal(data.inputs.engineers.source.state,'suggestion')
  assert.equal((await call('casebuilder_read',{caseId:'../../outside'})).isError,true)
  assert.equal((await call('casebuilder_calculate',{caseId})).isError,undefined)
  const built=await call('casebuilder_build',{caseId,format:'all'})
  assert.equal(built.isError,undefined,built.content[0].text)
  const files=fs.readdirSync(path.join(home,caseId+'-artifacts'))
  assert.ok(files.some(f=>f.endsWith('.pptx')))
  assert.ok(files.some(f=>f.endsWith('.html')))
 }finally{child.kill(); await new Promise(r=>child.once('close',r));fs.rmSync(home,{recursive:true,force:true})}
})
