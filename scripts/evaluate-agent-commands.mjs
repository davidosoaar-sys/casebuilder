import fs from 'node:fs'
import assert from 'node:assert/strict'
import {fileURLToPath} from 'node:url'
import {research} from '../server/research.js'
import {suggest} from '../server/suggest.js'
import {parseBrand} from '../server/brand.js'
import {sanitizePerson,addPersonToDeal} from '../src/personLookup.js'
import {agentPrompt} from '../server/agent-commands/index.js'

export async function evaluateFixture(f){
 let calls=0
 const client={messages:{stream:options=>{
  calls++;assert.equal(options.system,agentPrompt(f.command),'Provider must use the complete trusted prompt')
  return {finalMessage:async()=>({stop_reason:'end_turn',content:[{type:'web_search_tool_result',content:(f.observed||[]).map(url=>({url}))},{type:'text',text:JSON.stringify(f.raw)}]})}
 }}}
 if(f.command==='DISCOVER_BRAND')assert.equal(parseBrand(f.html,'',f.website,f.company).logoUrl,f.expected.logoUrl)
 else if(f.command==='FIND_STAKEHOLDERS'){
  const r=await research({company:'Example',role:'VP Engineering'},client);assert.equal(r.people.length,f.expected.people)
  for(const key of ['email','linkedin'])if(key in f.expected)assert.equal(r.people[0][key],f.expected[key])
 }else if(f.command==='LOOKUP_PERSON'){
  const r=sanitizePerson(f.raw,f.enabledSources)
  if('name'in f.expected)assert.equal(r.name?.value||null,f.expected.name)
  if('roleConfidence'in f.expected)assert.equal(r.roleMatch?.confidence||null,f.expected.roleConfidence)
  if('candidates'in f.expected)assert.equal(r.candidates.length,f.expected.candidates)
  if(f.expected.unchanged){const deal={id:'fixture',stakeholders:[]};assert.equal(addPersonToDeal(deal,r),deal)}
 }else if(f.command==='SUGGEST_INPUTS'){
  const r=await suggest({company:'Example',filled:f.filled||{},documents:f.documents||[],web:true,only:f.only,labels:{}},client)
  assert.deepEqual(r.suggestions.map(x=>x.value),f.expected.values)
  assert.deepEqual(r.suggestions.map(x=>x.state),f.expected.states)
 }else throw Error('Unknown evaluation command')
 if('calls'in f.expected)assert.equal(calls,f.expected.calls)
}
export const fixtures=JSON.parse(fs.readFileSync(new URL('../server/agent-commands/evaluation-fixtures.json',import.meta.url),'utf8')).cases
if(process.argv[1]===fileURLToPath(import.meta.url)){
 let failures=0
 for(const f of fixtures)try{await evaluateFixture(f);console.log('PASS '+f.id)}catch(e){failures++;console.error('FAIL '+f.id+': '+e.message)}
 console.log(fixtures.length+' offline checks; '+failures+' failed. Live search accuracy and semantic evidence review are not evaluated by this suite.')
 process.exitCode=failures?1:0
}
