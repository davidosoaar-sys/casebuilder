import test from 'node:test'
import assert from 'node:assert/strict'
import {anthropicFailure} from './providerFailure.js'
test('low-credit 400 explains billing without echoing the provider payload',()=>{
 const result=anthropicFailure({status:400,error:{error:{message:'Your credit balance is too low to access the Anthropic API.'}}})
 assert.equal(result.status,402)
 assert.equal(result.body.code,'insufficient_credits')
 assert.match(result.body.error,/Settings/)
 assert.deepEqual(anthropicFailure({status:400,message:'private request details'}),{status:502,body:{error:'The AI service returned an error (400).'}})
})
