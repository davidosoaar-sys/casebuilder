import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { planAction,validateFindings } from './workflow.mjs'
import { caseFileToProject,projectToCaseFile } from '../src/caseFile.js'

const plugin=path.resolve('plugin'),fixture=JSON.parse(fs.readFileSync('plugin/examples/people-findings.json'))
test('each button action routes to an existing command and skill without execution',()=>{
  const registry=JSON.parse(fs.readFileSync('plugin/framework/actions.json'))
  for(const action of registry.actions){
    const plan=planAction(action.id,{company:'Fixture',query:'Alex',caseFile:'fixture.case.json'},plugin)
    assert.equal(plan.executed,false)
    assert.ok(fs.existsSync(plan.skill))
    assert.ok(fs.existsSync(path.join(plugin,'commands',action.command+'.md')))
  }
  assert.throws(()=>planAction('person-lookup',{company:'Fixture'},plugin),/query/)
  assert.throws(()=>planAction('brand-assets',{company:'Fixture',enabledSources:['unknown']},plugin),/enabledSources/)
})
test('fictional findings require demo mode and unknown titles retain a low-confidence mapping',()=>{
  assert.equal(validateFindings(fixture).result.people[0].claims.length,0)
  const valid=validateFindings(fixture,{demo:true})
  assert.equal(valid.ok,true)
  assert.equal(valid.result.people[0].roleMatch.confidence,'low')
  assert.equal(valid.result.people[0].roleMatch.state,'inferred')
  assert.ok(valid.result.people[0].roleMatch.why)
  assert.equal(valid.evidenceChecked,false)
})
test('unsourced and disabled connector claims cannot appear as public web evidence',()=>{
  const input=structuredClone(fixture)
  input.people[0].claims.push({key:'reportsTo',value:'Invented manager'})
  input.people[0].claims.push({key:'signal',value:'Slack message',sourceUrl:'https://workspace.slack.com/archives/example',sourceType:'web'})
  const result=validateFindings(input,{demo:true})
  assert.equal(result.dropped.length,2)
  assert.equal(result.result.people[0].claims.length,2)
  assert.ok(result.result.sourcesSkipped.some(s=>s.source==='slack'&&s.reason==='disabled'))
  assert.deepEqual(result.result.sourcesUsed,['web'])
})
test('brand palette and no-results settings are validated without changing the request',()=>{
  const input={kind:'brand',company:'Fixture',enabledSources:['web'],sourcesUsed:[],sourcesSkipped:[{source:'web',reason:'no-results'}],claims:[{key:'primary',value:'purple',sourceUrl:'https://fixture.example/brand',sourceType:'web'}]}
  const before=structuredClone(input),result=validateFindings(input,{demo:true})
  assert.equal(result.result.claims.length,0)
  assert.equal(result.dropped.length,1)
  assert.deepEqual(input,before)
})
test('lookup without a case plans normally and ambiguity never resolves a person or offers inputs',()=>{
  assert.equal(planAction('person-lookup',{query:'Alex',enabledSources:[]},plugin).request.caseFile,undefined)
  const input=structuredClone(fixture)
  input.people[0].status='ambiguous'
  input.people[0].candidates=[{claims:input.people[0].claims}]
  input.people[0].suggestedInputs=[{key:'engineers',value:500,sourceUrl:'https://fixture.example/team',sourceType:'web'}]
  const person=validateFindings(input,{demo:true}).result.people[0]
  assert.equal(person.roleMatch,null)
  assert.deepEqual(person.claims,[])
  assert.deepEqual(person.suggestedInputs,[])
  assert.equal(person.candidates.length,1)
})
test('source settings report unavailable distinctly and reject contradictory use',()=>{
  const input=structuredClone(fixture)
  input.sourcesSkipped=[{source:'web',reason:'unavailable'}]
  assert.equal(validateFindings(input,{demo:true}).ok,false)
  input.people=[];input.sourcesUsed=[]
  const valid=validateFindings(input,{demo:true})
  assert.equal(valid.ok,true)
  assert.ok(valid.result.sourcesSkipped.some(s=>s.source==='web'&&s.reason==='unavailable'))
})
test('inferred person mapping and named stakeholder survive case-file conversion',()=>{
  const file={caseBuilder:1,company:'Fixture',inputs:{},stakeholders:[{key:'cto',builtin:true,namedPeople:[{name:'Alex Fixture',title:'Chief Exploration Officer'}]}],people:{cto:[{name:'Alex Fixture',title:'Chief Exploration Officer',sources:['https://fixture.example/team'],mapping:{key:'cto',state:'inferred',confidence:'low',why:'Title inference'}}]}}
  const roundtrip=projectToCaseFile(caseFileToProject(file))
  assert.equal(roundtrip.people.cto[0].mapping.state,'inferred')
  assert.equal(roundtrip.stakeholders[0].namedPeople[0].name,'Alex Fixture')
})
test('bundled plugin completes an offline fixture from empty case to branded outputs',async t=>{
  const cli=path.join(plugin,'skills/business-case/scripts/casebuilder.mjs')
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'casebuilder-plugin-test-'))
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}))
  const run=(...args)=>{const r=spawnSync(process.execPath,[cli,...args],{cwd:dir,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout)}
  const file=path.join(dir,'fixture.case.json')
  run('init','Northwind Example','--out',file)
  const initial=JSON.parse(fs.readFileSync(file))
  assert.equal(initial.inputs.engineers.value,'')
  run('set',file,'engineers=500','hourlyCost=100','searchHoursToday=3','searchHoursPortal=2','--confirmed','engineers,hourlyCost,searchHoursToday','--assumed','searchHoursPortal','--origin','Fictional discovery transcript, lines 4–6')
  const raw=JSON.parse(fs.readFileSync(file))
  raw.brand={...raw.brand,headingFont:'Georgia',bodyFont:'Arial',primary:'#224488',background:'#FFFFFF',text:'#111111',surface:'#F5F5F5',muted:'#555555',logo:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='}
  raw.brand.logo='data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60" viewBox="0 0 100 60"><path fill="#224488" d="M0 0h100v60H0z"/></svg>').toString('base64')
  raw.brand.heroImage='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='
  raw.brand.heroSource='https://fixture.example/campaign'
  raw.brand.heroAlt='Fictional campaign image'
  fs.writeFileSync(file,JSON.stringify(raw))
  run('person','add',file,'--stakeholder','cto','--name','Alex Fixture','--title','Chief Exploration Officer','--source','https://fixture.example/team')
  assert.equal(JSON.parse(fs.readFileSync(file)).people.cto[0].mapping.confidence,'low')
  run('validate',file)
  const built=run('build',file,'--format','all','--out',path.join(dir,'out'))
  assert.equal(built.built.length,3)
  for(const item of built.built)assert.ok(fs.statSync(item.file).size>0)
  const site=fs.readFileSync(built.built.find(f=>f.format==='website').file,'utf8')
  assert.ok(site.includes('Georgia'))
  assert.ok(site.includes(raw.brand.logo))
  assert.ok(site.includes(raw.brand.heroImage))
  assert.ok(site.includes("font-family:'Poppins';src:url('data:font/ttf;base64,"))
  assert.ok(site.includes('Alex Fixture'))
  assert.ok(!site.includes('Fictional discovery transcript, lines'))
  const {default:JSZip}=await import('jszip')
  const zip=await JSZip.loadAsync(fs.readFileSync(built.built.find(f=>f.format==='pptx').file))
  assert.ok((await zip.file('ppt/theme/theme1.xml').async('string')).includes('Georgia'))
  const cover=await zip.file('ppt/slides/slide1.xml').async('string')
  assert.ok((cover.match(/<p:pic>/g)||[]).length>=3,'Cover includes separate company logo, Backstage logo and campaign image')
  assert.equal(caseFileToProject(raw).deck[0].design.coverLayout,'split')
  const imports=run('build',file,'--format','google-slides,canva','--out',path.join(dir,'imports'))
  assert.deepEqual(imports.built.map(b=>b.format),['google-slides','canva'])
  for(const artifact of imports.built){assert.ok(fs.existsSync(artifact.file));assert.ok(artifact.importInstructions)}
})
