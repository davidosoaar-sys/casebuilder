import test from 'node:test'
import assert from 'node:assert/strict'
import {transparentLogoPreference as rank} from './logoTransparency.js'
test('prefer transparent-friendly vectors without pretending to remove backgrounds',()=>{
 assert.equal(rank('image/svg+xml',Buffer.from('<svg><path d="M0 0"/></svg>')),2)
 assert.equal(rank('image/svg+xml',Buffer.from('<svg><rect fill="white"/></svg>')),0)
 assert.equal(rank('image/jpeg',Buffer.from('opaque')),0)
 const png=Buffer.alloc(30);png[25]=6
 assert.equal(rank('image/png',png),1)
})
