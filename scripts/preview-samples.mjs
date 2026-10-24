import fs from 'node:fs'
import { buildWebsite } from '../src/export/html.js'
import { prepareWebsite } from '../src/export/prepare.js'
import { resolveStakeholder } from '../src/deck/stakeholders.js'
import { newProject } from '../src/projects.js'
import { brandDocument,brandLogoHtml } from '../src/brand.js'
import { SAMPLE_CASES,createSampleCase } from '../src/sampleCases.js'

const vmSource=['format.js','model.js','source.js','valueModel.js'].map(f=>fs.readFileSync('src/'+f,'utf8')).join('\n')
fs.mkdirSync('.build',{recursive:true})
for(const d of SAMPLE_CASES){
  const p=createSampleCase(d,newProject),inputs=Object.fromEntries(p.fields.map(f=>[f.key,f.value]))
  const stakeholders=p.stakeholders.map(resolveStakeholder)
  const args=prepareWebsite({company:p.name,deck:p.deck,inputs,fields:p.fields,stakeholders,who:stakeholders[0]})
  const html=brandDocument(buildWebsite({...args,vmSource,logoSvg:brandLogoHtml(p.brand),websiteBrand:p.brand}),p.brand)
  fs.writeFileSync('.build/sample-'+d.key+'.html',html)
  console.log('http://localhost:5173/.build/sample-'+d.key+'.html')
}
