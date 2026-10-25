import test from 'node:test'
import assert from 'node:assert/strict'
import {clientStakeholder,clientRequirements} from './stakeholderRequirements.js'
import {newProject,hydrate} from './projects.js'
import {projectToCaseFile,caseFileToProject} from './caseFile.js'
import {buildWebsite,buildOnePager} from './export/html.js'
import {prepareOnePager} from './export/prepare.js'
import {buildEnv,resolveSlides,defaultDeck} from './deck/model.js'
import {buildPptx} from './export/pptx.js'
import {DEMO_VALUES,INPUT_FIELDS} from './valueModel.js'
import {normalizeBrand} from './brand.js'
import {brandHeroCandidates} from '../server/brandAssets.js'
import PptxGenJS from 'pptxgenjs'
import JSZip from 'jszip'
const secret='PRIVATE_STRATEGY_DO_NOT_SHARE'
const stakeholder={key:'cto',role:'CTO',builtin:true,privateNotes:secret,cares:secret,tag:secret,objection:secret,counter:secret,needsToSee:[secret],requirements:[{id:'r1',text:'Review the annual operating cost',status:'In progress'}],lead:[],headline:()=>null}
test('client projection shares recorded requirements and never inferred sales preparation',()=>{
 const client=clientStakeholder(stakeholder)
 assert.ok(!JSON.stringify(client).includes(secret));assert.equal(client.requirements[0].status,'In progress')
 assert.deepEqual(clientRequirements({needsToSee:['Inference']}),[])
 assert.equal(clientRequirements({requirements:[{text:'Review scope',status:'Invented status'}]})[0].status,'Not started')
})
test('private notes and requirements survive hydration and case-file handoff',()=>{
 const project=newProject('Example',{});project.stakeholders=[{...stakeholder,headline:undefined}]
 const restored=hydrate(caseFileToProject(projectToCaseFile(project)))
 assert.equal(restored.stakeholders[0].privateNotes,secret);assert.deepEqual(restored.stakeholders[0].requirements,stakeholder.requirements)
})
test('client website/PDF/slides contain requirements, not private stakeholder metadata',()=>{
 for(const viewMode of ['website','pdf','slides']){
  const html=buildWebsite({company:'Example',slides:defaultDeck(),stakeholders:[stakeholder],inputs:DEMO_VALUES,vmSource:'',viewMode})
  assert.ok(!html.includes(secret));assert.ok(html.includes('Review the annual operating cost'))
 }
})
test('one-pager contains recorded requirements and no objection/counter',()=>{
 const facts=prepareOnePager({inputs:DEMO_VALUES,fields:INPUT_FIELDS,who:stakeholder})
 const html=buildOnePager({facts});assert.ok(!html.includes(secret));assert.ok(html.includes('Review the annual operating cost'));assert.ok(!html.includes('The objection'))
})
test('PowerPoint client room exports requirement statuses rather than internal strategy',async()=>{
 const env=buildEnv(DEMO_VALUES,INPUT_FIELDS,clientStakeholder(stakeholder))
 const file=await buildPptx({company:'Example',slides:resolveSlides(defaultDeck(),env),deps:{PptxGenJS,logoPng:async()=>null}})
 const zip=await JSZip.loadAsync(await file.write({outputType:'nodebuffer'}));const xml=(await Promise.all(Object.keys(zip.files).filter(f=>/^ppt\/slides\/slide\d+\.xml$/.test(f)).map(f=>zip.file(f).async('string')))).join('')
 assert.ok(!xml.includes(secret));assert.ok(xml.includes('Review the annual operating cost'));assert.ok(xml.includes('In progress'))
})
test('brand imagery retains font identity and rejects unsupported asset URLs',()=>{
 const b=normalizeBrand({heroImage:'https://tracker.example/image.jpg',heroSource:'javascript:alert(1)',headingFont:'Company Display',bodyFont:'Company Text'})
 assert.equal(b.heroImage,'');assert.equal(b.heroSource,'');assert.equal(b.headingFont,'Company Display');assert.equal(b.bodyFont,'Company Text')
 const candidates=brandHeroCandidates('<img alt="Nike campaign" src="/hero.jpg"><img alt="Nike shoe" src="/shoe.jpg"><meta property="og:image" content="/logo.png">','https://www.nike.com/','Nike')
 assert.deepEqual(candidates.map(c=>c.url),['https://www.nike.com/hero.jpg'])
})
