import test from 'node:test'
import assert from 'node:assert/strict'
import {buildEvidenceReview} from './evidenceReview.js'
import {setCaseContext} from './caseContext.js'
import {newProject,hydrate} from './projects.js'
import {DEMO_VALUES} from './valueModel.js'
import {computeModel} from './model.js'
import {defaultDeck,buildEnv,resolveSlides} from './deck/model.js'
import {NO_ONE} from './deck/stakeholders.js'

const fixture=()=>{const p=newProject('Example',{});p.fields=p.fields.map(f=>({...f,value:DEMO_VALUES[f.key]??f.value}));return p}
test('evidence review retains source details and traces inputs through roll-up dependencies',()=>{
 const p=fixture(),source={state:'suggestion',origin:'Public engineering post',quote:'We employ 500 engineers.',link:'https://company.example/engineering',pinnedAt:'2026-10-25'}
 p.fields=p.fields.map(f=>f.key==='engineers'?{...f,value:500,source}:f)
 const before=JSON.stringify(p),review=buildEvidenceReview(p),row=review.rows.find(r=>r.key==='engineers')
 assert.equal(row.quote,source.quote);assert.equal(row.link,source.link);assert.equal(row.pinnedAt,source.pinnedAt)
 assert.ok(row.affected.includes('Total annual value'));assert.ok(row.affected.includes('Net year one'));assert.ok(review.questions.includes(row));assert.equal(JSON.stringify(p),before)
})
test('missing figures stay in questions and unsafe source links do not become clickable',()=>{
 const p=newProject('Empty',{});p.fields=p.fields.map(f=>f.key==='engineers'?{...f,source:{state:'suggestion',link:'javascript:alert(1)'}}:f)
 const review=buildEvidenceReview(p)
 assert.equal(review.figures.length,0);assert.ok(review.pending.some(f=>f.key==='totalValue'));assert.equal(review.rows.find(r=>r.key==='engineers').link,'')
})
test('optional case context saves through hydration without changing equations or authored deck blocks',()=>{
 const p=fixture();p.deck[0].blocks.find(b=>b.type==='text').text='Chris’s own opening'
 const before=JSON.stringify(p.deck),inputs=Object.fromEntries(p.fields.map(f=>[f.key,f.value]))
 p.fields=setCaseContext(p.fields,'workflowContext','Find service owners during checkout incidents')
 const restored=hydrate(p),after=Object.fromEntries(restored.fields.map(f=>[f.key,f.value]))
 assert.equal(after.workflowContext,'Find service owners during checkout incidents');assert.equal(JSON.stringify(restored.deck),before)
 assert.deepEqual(computeModel(after),computeModel(inputs))
})
test('new decks lead with a cost decision and close with modeled value without fabricating savings',()=>{
 const deck=defaultDeck();assert.ok(deck[1].blocks.some(b=>b.type==='versus'));assert.ok(deck[5].blocks.some(b=>b.type==='stats'))
 const render=inputs=>resolveSlides(deck,buildEnv(inputs,[],NO_ONE)).flatMap(s=>s.blocks).filter(b=>b.kind==='text').map(b=>b.text).join(' ')
 const empty=buildEnv({},[],NO_ONE).ctx.decisionHeadline;assert.ok(empty.includes('Compare Portal with running Backstage in-house'));assert.ok(!empty.includes('$0/yr lower'))
 const costly=render({...DEMO_VALUES,selfHostEngineers:1,selfHostSalary:100000,portalCost:200000})
 assert.match(costly,/higher than self-hosting/);assert.match(costly,/not automatically a cash saving/)
})
