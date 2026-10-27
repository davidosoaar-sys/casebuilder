import test from 'node:test'
import assert from 'node:assert/strict'
import {tipsFor,tipSeen,markTipSeen} from './tourTips.js'
test('project guidance follows real stages rather than Next advancing to future pages',()=>{
 for(const [stage,id]of [['map','stakeholders'],['brand','branding'],['people','people'],['theme','theme']])assert.deepEqual(tipsFor({stage,view:'projects'}).map(t=>t.id),[id])
 assert.deepEqual(tipsFor({view:'details'}).map(t=>t.id),['inputs','research-nav'])
 assert.deepEqual(tipsFor({view:'website'}).map(t=>t.id),['edit-case','format','share'])
 assert.deepEqual(tipsFor({stage:'map'},false),[])
})
test('page tips remain independent of main-tour completion and persist per account',()=>{
 for(const view of ['skills','connections','scheduled','files','research','lookup','agent'])assert.equal(tipsFor({view},false)[0].kind,'page')
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)}
 assert.equal(tipSeen('chris','skills',storage),false)
 markTipSeen('chris','skills',storage)
 assert.equal(tipSeen('chris','skills',storage),true)
 assert.equal(tipSeen('chris','connections',storage),false)
 assert.equal(tipSeen('other','skills',storage),false)
})
