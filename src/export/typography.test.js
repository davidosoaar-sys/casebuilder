import test from 'node:test'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import PptxGenJS from 'pptxgenjs'
import { brandDocument, fontStack, officeFont } from '../brand.js'
import { buildWebsite, buildOnePager } from './html.js'
import { prepareOnePager } from './prepare.js'
import { resolveStakeholder } from '../deck/stakeholders.js'
import { INPUT_FIELDS, DEMO_VALUES } from '../valueModel.js'
import { buildPptx } from './pptx.js'

const brand={headingFont:'Georgia',bodyFont:'Verdana',fontName:'Uploaded Brand',fontData:'data:font/woff2;base64,d09GMg=='}
test('font stacks retain family boundaries and resolve to an actual Office face',()=>{
  assert.equal(fontStack('Courier New, monospace'),"'Courier New',monospace")
  assert.equal(officeFont('Courier New, monospace'),'Courier New')
  assert.equal(officeFont('serif'),'Times New Roman')
})

test('Website, PDF and Slides preserve the same brand, embedded font and block family stack',()=>{
  for (const viewMode of ['website','pdf','slides']) {
    const html=brandDocument(buildWebsite({company:'Example',slides:[{blocks:[{type:'text',style:'hero',text:'Example',design:{font:'Courier New, monospace'}}]}],stakeholders:[],inputs:{},vmSource:'',viewMode,websiteBrand:brand}),brand)
    assert.ok(html.includes("body{font-family:'Verdana','Poppins',sans-serif!important}"))
    assert.ok(html.includes("font-family:'Georgia','Poppins',sans-serif!important"))
    assert.ok(html.includes(brand.fontData))
    const data=JSON.parse(html.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/)[1])
    assert.equal(data.fontStacks['Courier New, monospace'],"'Courier New',monospace")
    assert.equal(html.includes('fonts.googleapis.com'),false)
  }
})

test('One-pager uses the same company heading and body fonts, including metric headings',()=>{
  const fields=INPUT_FIELDS.map(f=>({...f,value:DEMO_VALUES[f.key]??f.value}))
  const facts=prepareOnePager({inputs:DEMO_VALUES,fields,who:resolveStakeholder({key:'finance',builtin:true})})
  const html=brandDocument(buildOnePager({facts}),brand)
  assert.ok(html.includes("body{font-family:'Verdana','Poppins',sans-serif!important}"))
  assert.match(html,/\.brief-stat strong,\.brief-headline\{font-family:'Georgia','Poppins',sans-serif!important\}/)
  assert.ok(html.includes(brand.fontData))
})

test('PPTX stores heading, body, metrics and explicit block fonts in editable text and the theme',async()=>{
  const pptx=await buildPptx({company:'Example',brand,slides:[{blocks:[
    {kind:'text',style:'title',text:'Heading'},
    {kind:'text',style:'note',text:'Body copy'},
    {kind:'text',style:'title',text:'Custom heading',design:{font:'Courier New, monospace'}},
    {kind:'stats',items:[{label:'Annual value',value:'$123k'}]}
  ]}],deps:{PptxGenJS}})
  const zip=await JSZip.loadAsync(await pptx.write({outputType:'nodebuffer'}))
  const slide=await zip.file('ppt/slides/slide1.xml').async('string')
  const shapes=slide.match(/<p:sp>[\s\S]*?<\/p:sp>/g)
  for(const [text,font] of [['Heading','Georgia'],['Body copy','Verdana'],['Custom heading','Courier New'],['$123k','Georgia']]){
    const shape=shapes.find(s=>s.includes(`<a:t>${text}</a:t>`))
    assert.ok(shape?.includes(`typeface="${font}"`),`${text} uses ${font}`)
  }
  const theme=await zip.file('ppt/theme/theme1.xml').async('string')
  assert.ok(theme.includes('typeface="Georgia"'))
  assert.ok(theme.includes('typeface="Verdana"'))
  assert.equal(slide.includes('typeface="Courier New, monospace"'),false)
})
