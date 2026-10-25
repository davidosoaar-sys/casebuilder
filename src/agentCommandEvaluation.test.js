import test from 'node:test'
import assert from 'node:assert/strict'
import {fixtures,evaluateFixture} from '../scripts/evaluate-agent-commands.mjs'
import {APP_AGENT_TASKS,agentPrompt} from '../server/agent-commands/index.js'
for(const f of fixtures)test('command evaluation: '+f.id,()=>evaluateFixture(f))
test('every task has all six brief sections and a model/schema boundary',()=>{
 for(const [command,t]of Object.entries(APP_AGENT_TASKS)){
  for(const key of ['sources','processing','examples','evaluation','deterministic','judgment'])assert.ok(t.framework[key]?.length,command+' '+key)
  const prompt=agentPrompt(command)
  for(const heading of ['1. Trigger','2. Inputs','3. Processing','4. Expected output','5. Quality gate','6. Deterministic'])assert.ok(prompt.includes(heading),command+' '+heading)
  if(t.status==='active')assert.ok(prompt.includes('Response contract:'))
 }
})
