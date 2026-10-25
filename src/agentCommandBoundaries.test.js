import test from 'node:test'
import assert from 'node:assert/strict'
import {runCommand} from './agentRunner.js'
import {suggestValues,applySuggestions} from './suggest.js'
import {suggest} from '../server/suggest.js'
import {computeModel} from './model.js'
test('chat LinkedIn lookup sends linkedinUrl to the agent boundary',async()=>{
 const before=globalThis.fetch
 try{
  globalThis.fetch=async(url,options)=>{
   assert.equal(url,'/api/person');const body=JSON.parse(options.body)
   assert.equal(body.linkedinUrl,'https://linkedin.com/in/alex-example');assert.equal(body.linkedin,undefined)
   return new Response('{}\n',{status:200})
  }
  await runCommand({command:'LOOKUP_PERSON',linkedin:'https://linkedin.com/in/alex-example'},{name:'Example',fields:[]},{})
 }finally{globalThis.fetch=before}
})
test('filled inputs are not searched and late suggestions cannot replace a manual value or its source',async()=>{
 const field={key:'engineers',type:'number',value:0,source:{state:'input',origin:'User statement',quote:'We have zero engineers'}}
 let calls=0
 const result=await suggestValues({company:'Example',fields:[field],keys:['engineers'],connectors:{},model:computeModel({}),agent:async()=>{calls++;return {suggestions:[]}}})
 assert.equal(calls,0);assert.deepEqual(result.suggestions,{})
 const updated=applySuggestions([field],{suggestions:{engineers:{value:900}},gaps:{},enabled:[]},{keys:['engineers'],now:'2026-10-25'})
 assert.equal(updated[0],field)
 const server=await suggest({company:'Example',filled:{engineers:500},documents:[],web:true,only:['engineers'],labels:{}},{messages:{stream:()=>{throw Error('Must not call model')}}})
 assert.deepEqual(server.suggestions,[])
})
test('explicit chat suggestion keys cannot bypass blank-field scope',async()=>{
 const result=await runCommand({command:'SUGGEST_INPUTS',keys:['engineers']},{name:'Example',fields:[{key:'engineers',type:'number',value:500}]},{})
 assert.deepEqual(result.suggestions,[])
})
