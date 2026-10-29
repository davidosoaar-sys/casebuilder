import test from 'node:test'
import assert from 'node:assert/strict'
import {researchPublicInputs,applyPublicInputs} from './publicInputs.js'
import {validateAgentItems} from '../server/suggest.js'
const link='https://example.com/report'
const field=(key,value='')=>({key,value,source:{state:value===''?'empty':'input',origin:'Chris'}})
test('automatic research requests only blank public metrics and sends no connector material',async()=>{
  let payload
  await researchPublicInputs({company:'Example',fields:[field('engineers'),field('newHiresPerYear',20),field('hourlyCost'),{...field('engineers'),deleted:true}],agent:async p=>(payload=p,{suggestions:[]})})
  assert.deepEqual(payload.only,['engineers'])
  assert.equal(payload.publicOnly,true)
  assert.deepEqual(payload.documents,[])
  assert.equal(payload.filled.newHiresPerYear,20)
})
test('public suggestions stay unconfirmed, preserve edits made while searching and reject unsourced/benchmark items',()=>{
  const result={suggestions:[{key:'engineers',kind:'public',value:500,state:'input',quote:'500 engineers',link,origin:'Public report'},{key:'newHiresPerYear',kind:'benchmark',value:80,quote:'80 hires',link}]}
  const fs=[field('engineers'),field('newHiresPerYear'),field('hourlyCost',100)]
  const out=applyPublicInputs(fs,result,'2026-10-29T00:00:00Z')
  assert.equal(out[0].value,500)
  assert.equal(out[0].source.state,'suggestion')
  assert.equal(out[0].source.link,link)
  assert.equal(out[1],fs[1])
  assert.equal(out[2],fs[2])
  const typed=field('engineers',600)
  assert.equal(applyPublicInputs([typed],result)[0],typed)
  assert.equal(applyPublicInputs([field('engineers')],{suggestions:[{...result.suggestions[0],link:''}]})[0].value,'')
})
test('automatic public validation rejects total employees, R&D counts and vacancies; exact engineers remain suggestions',()=>{
  const item=(key,evidence,value=500)=>({key,value,link,evidence})
  const context={documents:[],seen:new Set(['example.com/report']),publicOnly:true,only:['engineers','newHiresPerYear','hourlyCost'],citations:{[link]:'Our engineering team includes 500 engineers. In 2025 we hired 500 engineers.'}}
  const valid=validateAgentItems({suggestions:[item('engineers','Our engineering team includes 500 engineers.') ]},context)
  assert.equal(valid[0].state,'suggestion')
  assert.equal(valid[0].quote,'Our engineering team includes 500 engineers.')
  assert.deepEqual(validateAgentItems({suggestions:[item('engineers','We employ 500 engineers in a new department.')]},context),[])
  for(const evidence of ['500 employees','500 research and development employees','500 open engineering jobs','Our engineers work alongside 500 employees']){
    assert.deepEqual(validateAgentItems({suggestions:[item('engineers',evidence)]},context),[])
  }
  assert.deepEqual(validateAgentItems({suggestions:[item('newHiresPerYear','500 engineering vacancies')]},context),[])
  assert.equal(validateAgentItems({suggestions:[item('newHiresPerYear','In 2025 we hired 500 engineers.')]},context)[0].value,500)
  assert.deepEqual(validateAgentItems({suggestions:[item('hourlyCost','500 engineers')]},context),[])
})
