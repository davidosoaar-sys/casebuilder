import test from 'node:test'
import assert from 'node:assert/strict'
import {needsWelcome,finishWelcome} from './firstVisit.js'
test('welcome is remembered per signed-in account without touching deals',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)}
 assert.equal(needsWelcome('chris',storage),true)
 finishWelcome('chris',storage)
 assert.equal(needsWelcome('chris',storage),false)
 assert.equal(needsWelcome('other',storage),true)
 assert.equal(needsWelcome('',storage),false)
 assert.deepEqual([...data.keys()],['casebuilder.welcome.v1:chris'])
})
