import test from 'node:test'
import assert from 'node:assert/strict'
import {researchNote} from './researchNote.js'
test('search explanations longer than the old 300-character cap remain complete',()=>{
 const note='Samsung has many business divisions. '.repeat(12)+'Choose a specific division or job title to narrow the search.'
 assert.equal(researchNote(note),note)
})
test('oversized explanations are visibly shortened at a word boundary',()=>{
 const note=researchNote('A useful explanation. '.repeat(200))
 assert.ok(note.length<=2000);assert.ok(note.endsWith('…'));assert.equal(researchNote(null),null)
})
