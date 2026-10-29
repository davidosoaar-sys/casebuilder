import test from 'node:test'
import assert from 'node:assert/strict'
import {tipsFor,tipSeen,markTipSeen,resetTour} from './tourTips.js'
import {needsWelcome,finishWelcome} from './firstVisit.js'

test('global tour introduces Cases and Recurring tasks before creating a case',()=>{
 for(const view of ['dashboard','projects']){
  const tips=tipsFor({view})
  assert.deepEqual(tips.map(t=>t.id),['cases-nav','recurring-nav','project'])
  assert.equal(tips[0].target,'[data-tour="cases-nav"]')
  assert.equal(tips[1].target,'[data-tour="recurring-nav"]')
  assert.equal(tips[0].kind,'navigation')
  assert.equal(tips[1].kind,'navigation')
  assert.match(tips[1].text,/results appear in that case’s Agent/)
 }
})

test('mobile tour opens the real menu, explains its buttons, then returns to case creation',()=>{
 assert.deepEqual(tipsFor({view:'dashboard',mobileNav:true,navMenuOpen:false}).map(t=>t.id),['navigation-menu','project'])
 assert.deepEqual(tipsFor({view:'dashboard',mobileNav:true,navMenuOpen:true}).map(t=>t.id),['cases-nav','recurring-nav','project'])
 assert.deepEqual(tipsFor({view:'dashboard',mobileNav:true,navMenuOpen:true,navigationPending:false}).map(t=>t.id),['cases-nav','recurring-nav','navigation-close','project'])
 assert.deepEqual(tipsFor({view:'dashboard',mobileNav:true,navMenuOpen:false,navigationPending:false}).map(t=>t.id),['project'])
 assert.deepEqual(tipsFor({view:'dashboard',mobileNav:true},false),[])
})
test('project guidance follows real stages rather than Next advancing to future pages',()=>{
 for(const [stage,id]of [['map','stakeholders'],['brand','branding'],['people','people'],['theme','theme']])assert.deepEqual(tipsFor({stage,view:'projects'}).map(t=>t.id),[id])
 assert.deepEqual(tipsFor({view:'details'}).map(t=>t.id),['case-inputs'])
 assert.deepEqual(tipsFor({view:'website'}).map(t=>t.id),['edit-case'])
 assert.deepEqual(tipsFor({stage:'map'},false),[])
})
test('Skip tour suppresses every page and stage while individual tips persist per account',()=>{
 for(const view of ['dashboard','projects','details','website','deck','skills','connections','scheduled','files','research','lookup','agent'])assert.deepEqual(tipsFor({view},false),[])
 for(const stage of ['map','brand','people','theme'])assert.deepEqual(tipsFor({stage},false),[])
 for(const view of ['details','skills','connections','scheduled','files','research','lookup','agent'])assert.equal(tipsFor({view},true)[0].kind,'page')
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)}
 assert.equal(tipSeen('chris','skills',storage),false)
 markTipSeen('chris','skills',storage)
 assert.equal(tipSeen('chris','skills',storage),true)
 assert.equal(tipSeen('chris','connections',storage),false)
 assert.equal(tipSeen('other','skills',storage),false)
})

test('restart tour clears only this user\'s welcome and tips, so the tour shows again',()=>{
 const m=new Map(),storage={get length(){return m.size},key:i=>[...m.keys()][i]??null,getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}
 finishWelcome('u1',storage);markTipSeen('u1','project',storage);markTipSeen('u1','inputs',storage);markTipSeen('u2','project',storage);storage.setItem('casebuilder.theme','dark')
 assert.equal(needsWelcome('u1',storage),false);assert.equal(tipSeen('u1','project',storage),true)
 assert.equal(resetTour('u1',storage),3)
 assert.equal(needsWelcome('u1',storage),true);assert.equal(tipSeen('u1','project',storage),false);assert.equal(tipSeen('u1','inputs',storage),false)
 assert.equal(tipSeen('u2','project',storage),true);assert.equal(storage.getItem('casebuilder.theme'),'dark')
})
