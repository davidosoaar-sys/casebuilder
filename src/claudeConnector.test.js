import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultConnectors, connectorByKey, enabledLabels,loadConnections,saveConnections } from './connectors.js'
import { sourceFor } from './personLookup.js'

test('Claude is off by default and its permission persists like other connectors',()=>{
  const old=globalThis.localStorage
  const values=new Map()
  globalThis.localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)}
  try{
    assert.equal(defaultConnectors().claude,false)
    assert.equal(connectorByKey.claude.label,'Claude')
    saveConnections({...defaultConnectors(),claude:true})
    assert.equal(loadConnections().claude,true)
    assert.deepEqual(enabledLabels(loadConnections()),['Claude'])
  }finally{globalThis.localStorage=old}
})

test('a disabled Claude source cannot masquerade as a public web citation',()=>{
  const claim={sourceUrl:'https://claude.ai/share/example',sourceType:'web'}
  assert.equal(sourceFor(claim,['web']),null)
  assert.equal(sourceFor(claim,['claude'])?.sourceType,'claude')
})
