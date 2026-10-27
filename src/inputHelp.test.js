import test from 'node:test'
import assert from 'node:assert/strict'
import {INPUT_FIELDS} from './valueModel.js'
import {inputExplanation} from './inputHelp.js'
test('every standard input has a concise definition, not research advice',()=>{
 for(const field of INPUT_FIELDS){const text=inputExplanation(field);assert.ok(text.length>15&&text.length<150,field.key);assert.ok(!text.includes('\n'));assert.ok(!/LinkedIn|Chris uses/.test(text))}
 assert.equal(inputExplanation({key:'custom',label:'Usage',help:'Monthly usage. Extra context.'}),'Monthly usage.')
})
