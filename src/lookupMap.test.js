import test from 'node:test'
import assert from 'node:assert/strict'
import {lookupMapData,seniorityFromTitle} from './lookupMap.js'
import {sanitizePerson} from './personLookup.js'
const claim=value=>({value,sourceUrl:'https://example.com/profile',sourceType:'web'})
const person=(name,title,extra={})=>sanitizePerson({name:claim(name),title:claim(title),company:claim('Example'),...extra})
test('vice presidents are distinguished from presidents without inferring a reporting line',()=>{
  assert.equal(seniorityFromTitle('Vice President Engineering').rank,1)
  assert.equal(seniorityFromTitle('President').rank,0)
})
test('lookup map reuses roles, orders sourced people by inferred seniority, keeps reporting evidence, and does not write to deal',()=>{
  const boss=person('Alex','CTO'),lead=person('Sam','Engineering manager',{reportsTo:claim('Alex, CTO')})
  const project={name:'Example',stakeholders:[{key:'cto',builtin:true,namedPeople:[{brief:boss}]}]}
  const before=structuredClone(project)
  const data=lookupMapData(project,[{status:'done',person:lead}])
  assert.deepEqual(data.people.map(p=>p.name.value),['Alex','Sam'])
  assert.equal(data.people[1].reportsTo.sourceUrl,'https://example.com/profile')
  assert.deepEqual(data.stakeholders.map(s=>s.key),['cto','champion'])
  assert.deepEqual(project,before)
})
test('no-deal lookup map includes results, excludes unsourced/ambiguous/failed identities and never invents reports',()=>{
  const found=person('Jo','Quantum evangelist')
  const data=lookupMapData(null,[{status:'done',person:found},{status:'error',person:person('Failed','CTO')},{status:'done',person:{name:claim('No title')}},{status:'done',person:{...found,candidates:[{}]}}])
  assert.equal(data.people.length,1)
  assert.equal(data.people[0].seniority.label,'Seniority unclear')
  assert.equal(data.people[0].reportsTo,null)
  assert.equal(data.people[0].roleMatch.confidence,'low')
})
