import test from 'node:test'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import PptxGenJS from 'pptxgenjs'
import {buildPptx} from './pptx.js'

for(const target of ['google-slides','canva'])test(`${target} export retains editable text, brand fonts and chart shapes`,async()=>{
 const file=await buildPptx({company:'Import QA',brand:{headingFont:'Georgia',bodyFont:'Verdana'},slides:[{blocks:[
  {kind:'text',style:'title',text:'Editable brand heading'},
  {kind:'stats',items:[{label:'Annual value',value:'$100k',eq:'500 * 200'}]},
  {kind:'chart',chart:'breakdown',rows:[{label:'Engineering time',value:100000,group:'capacity'}]},
  {kind:'chart',chart:'payback',months:[1,2,3],value:[100,200,300],cost:[50,100,150]},
  {kind:'chart',chart:'confidence',rows:[{label:'Input',count:1},{label:'Empty',count:0}]}
 ]}],deps:{PptxGenJS,importTarget:target}})
 const zip=await JSZip.loadAsync(await file.write({outputType:'nodebuffer'}))
 const xml=(await Promise.all(Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).map(n=>zip.file(n).async('string')))).join('')
 assert.ok(xml.includes('Editable brand heading'));assert.ok(xml.includes('Engineering time'));assert.ok(xml.includes('Cumulative value'))
 assert.ok(xml.includes('typeface="Georgia"'));assert.ok(xml.includes('typeface="Verdana"'));assert.equal(xml.includes('typeface="Consolas"'),false)
 assert.equal(Object.keys(zip.files).some(n=>/^ppt\/charts\/chart\d+\.xml$/.test(n)),false)
 assert.ok(xml.includes('<a:prstGeom prst="rect"'))
})
