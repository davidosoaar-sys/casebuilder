import test from 'node:test'
import assert from 'node:assert/strict'
import { SAMPLE_CASES,createSampleCase } from './sampleCases.js'
import { newProject } from './projects.js'
import { computeModel } from './model.js'
import { confidence } from './valueModel.js'
import { normalizeBrand } from './brand.js'

test('three branded sample cases have distinct complete models and no verified company claims',()=>{
  const cases=SAMPLE_CASES.map(d=>createSampleCase(d,newProject))
  assert.deepEqual(cases.map(p=>p.sampleCaseKey),['nike','lovable','fortnite'])
  assert.equal(new Set(cases.map(p=>p.id)).size,3)
  const totals=[]
  for(const p of cases){
    assert.equal(confidence(p.fields),0)
    assert.ok(p.fields.every(f=>f.source.state==='assumption'))
    assert.ok(p.fields.every(f=>f.source.origin.includes('Illustrative')))
    assert.equal(normalizeBrand(p.brand).logo,p.projectLogo)
    assert.ok(p.projectLogo.startsWith('data:image/'))
    const model=computeModel(Object.fromEntries(p.fields.map(f=>[f.key,f.value])))
    assert.equal(model.figures.totalValue.incomplete,false)
    totals.push(model.figures.totalValue.value)
    assert.ok(p.deck.some(s=>s.blocks.some(b=>b.text?.includes('fictional assumptions'))))
  }
  assert.equal(new Set(totals).size,3)
})

test('fresh sample generation cannot overwrite another case or a prior edit',()=>{
  const a=createSampleCase(SAMPLE_CASES[0],newProject)
  a.fields.find(f=>f.key==='engineers').value=123
  const b=createSampleCase(SAMPLE_CASES[0],newProject)
  assert.notEqual(a.id,b.id)
  assert.equal(a.fields.find(f=>f.key==='engineers').value,123)
  assert.equal(b.fields.find(f=>f.key==='engineers').value,1800)
})
