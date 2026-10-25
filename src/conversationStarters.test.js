import test from 'node:test'
import assert from 'node:assert/strict'
import {sanitizePerson} from './personLookup.js'
const claim=value=>({value,sourceUrl:'https://example.com/profile',sourceType:'web'})
test('conversation starters use only validated public professional evidence',()=>{
 const p=sanitizePerson({title:claim('Head of Platform'),publicSignals:[claim('A public platform talk'),{value:'Unsupported personal detail'}]},['web'])
 assert.equal(p.conversationStarters.length,1)
 assert.equal(p.conversationStarters[0].context,'A public platform talk')
 assert.equal(p.conversationStarters[0].sourceUrl,'https://example.com/profile')
 assert.equal(p.conversationStarters[0].kind,'public-work')
 assert.equal(sanitizePerson({title:claim('CTO')},[]).conversationStarters.length,0)
})
test('fallback question is explicitly role-based and requires a sourced title',()=>{
 assert.equal(sanitizePerson({}).conversationStarters.length,0)
 assert.equal(sanitizePerson({title:claim('CTO')}).conversationStarters[0].kind,'role-based')
})
