import test from 'node:test'
import assert from 'node:assert/strict'
import { AGENT_COMMANDS as C } from './agentCommands.js'
import { APP_AGENT_TASKS, agentInstruction } from '../server/agent-commands/index.js'
import { searchPerson } from './personAgent.js'
import { fetchAgent } from './suggest.js'

test('app agent commands distinguish active research from future design contracts',()=>{
  for(const id of Object.values(C))assert.ok(APP_AGENT_TASKS[id])
  assert.deepEqual(Object.entries(APP_AGENT_TASKS).filter(([,task])=>task.status==='active').map(([id])=>id),[C.DISCOVER_BRAND,C.FIND_STAKEHOLDERS,C.LOOKUP_PERSON,C.SUGGEST_INPUTS])
  for(const id of [C.FRAME_CASE,C.DESIGN_WEBSITE,C.ORGANIZE_ONE_PAGER]){
    assert.equal(APP_AGENT_TASKS[id].endpoint,null)
    assert.equal(APP_AGENT_TASKS[id].status,'contract-only')
  }
  assert.throws(()=>agentInstruction('untrusted-command'),/Unknown/)
})
test('research instructions constrain evidence, writes and canonical calculations',()=>{
  assert.ok(agentInstruction(C.DISCOVER_BRAND).includes('official'))
  assert.ok(agentInstruction(C.FIND_STAKEHOLDERS).includes('candidates'))
  assert.ok(agentInstruction(C.LOOKUP_PERSON).includes('lookup alone never adds'))
  assert.ok(agentInstruction(C.SUGGEST_INPUTS).includes('exact quote'))
  for(const id of Object.values(C))assert.ok(agentInstruction(id).includes('Do not change model equations'))
})
test('person lookup and suggestion transports send the named app command and keep payload context',async()=>{
  let body
  for await(const unused of searchPerson({name:'Fixture',command:'override'},{fetchImpl:async(url,options)=>{assert.equal(url,'/api/person');body=JSON.parse(options.body);return new Response('{"name":{"value":"Fixture"}}\n',{status:200})}}))void unused
  assert.equal(body.command,C.LOOKUP_PERSON)
  assert.equal(body.name,'Fixture')
  await fetchAgent({company:'Fixture',command:'override'},{fetchImpl:async(url,options)=>{assert.equal(url,'/api/suggest');body=JSON.parse(options.body);return new Response('{"suggestions":[]}',{status:200})}})
  assert.equal(body.command,C.SUGGEST_INPUTS)
  assert.equal(body.company,'Fixture')
})
