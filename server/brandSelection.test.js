import test from 'node:test'
import assert from 'node:assert/strict'
import {curateBrand,applyBrandSelection,buildBrandCatalog}from'./brandSelection.js'
import {discoverBrand}from'./brand.js'
import {fontFaceCss,brandLogoHtml,normalizeBrand}from'../src/brand.js'
import {agentPrompt}from'./agent-commands/index.js'
const website='https://company.example/'
const logo='data:image/svg+xml;base64,'+Buffer.from('<svg viewBox="0 0 160 40"><path d="M0 0h160v40H0z"/></svg>').toString('base64')
const parsed={primary:'#111111',background:'#ffffff',surface:'#f5f5f5',text:'#111111',muted:'#555555',headingFont:'Company Display',bodyFont:'Company Text',colors:[],colorEvidence:[]}
const logos=[{dataUrl:logo,sourceUrl:website+'logo.svg',location:'Official homepage mark',score:100,variant:'dark'}]
const baseline={...parsed,logo,website}
const catalog=buildBrandCatalog({company:'Example',website,parsed,logos})
const proposal={logoId:'logo-1',colors:Object.fromEntries(['primary','background','surface','text','muted'].map(k=>[k,catalog.colors.find(c=>c.roles.includes(k)).id])),fonts:{heading:'font-1',body:'font-2'}}
test('the model selects supported asset IDs and returns a review report, never visual approval',async()=>{
 let called=false
 const client={messages:{create:async request=>{called=true;assert.equal(request.system,agentPrompt('DISCOVER_BRAND','asset-selection'));assert.equal(request.tools,undefined);const input=JSON.parse(request.messages[0].content);assert.equal(input.phase,'asset-selection');assert.ok(!JSON.stringify(input).includes('base64'));return {content:[{type:'text',text:JSON.stringify(proposal)}]}}}}
 const r=await curateBrand({company:'Example',website,parsed,logos,baseline,client})
 assert.ok(called);assert.equal(r.review.mode,'agent-selected');assert.equal(r.brand.primary,parsed.primary);assert.equal(r.brand.headingFont,'Company Display');assert.equal(r.review.checks.visualReviewPerformed,false)
})
test('fabricated IDs and incompatible font roles reject the whole proposed selection',()=>{
 for(const invalid of [{...proposal,logoId:'https://other.example/fake.svg'},{...proposal,fonts:{heading:'font-2',body:'font-1'}}]){
  const r=applyBrandSelection({catalog,logos,baseline,proposal:invalid,mode:'agent-selected'})
  assert.equal(r.review.mode,'deterministic-fallback');assert.equal(r.brand.logo,logo);assert.equal(r.brand.headingFont,parsed.headingFont)
 }
})
test('an unavailable model is labeled as a fallback and still returns usable assets',async()=>{
 const r=await curateBrand({company:'Example',website,parsed,logos,baseline,client:{messages:{create:async()=>{throw Error('Unavailable')}}}})
 assert.equal(r.review.mode,'deterministic-fallback');assert.equal(r.brand.logo,logo);assert.ok(r.review.warnings.some(w=>w.includes('could not finish')))
})
test('logo variants fit the canvas without changing the original mark bytes',()=>{
 const white={...logos[0],variant:'light'}
 const r=applyBrandSelection({catalog,logos:[white],baseline,proposal:null})
 assert.equal(r.brand.logo,logo);assert.equal(r.brand.logoBackground,'#111111');assert.ok(brandLogoHtml(r.brand).includes('background:#111111'))
 const withAlternative=applyBrandSelection({catalog:{...catalog,logos:[catalog.logos[0],{...catalog.logos[0],id:'logo-2'}]},logos:[white,logos[0]],baseline,proposal:null})
 assert.equal(withAlternative.brand.logoBackground,'transparent')
})
test('contrast checks correct text, preserve the brand accent and disclose changes',()=>{
 const r=applyBrandSelection({catalog,logos,baseline:{...baseline,text:'#ffffff',muted:'#ffffff',primary:'#dddddd'},proposal:null})
 assert.ok(r.review.checks.textContrast);assert.ok(r.review.checks.secondaryContrast);assert.equal(r.brand.primary,'#dddddd');assert.ok(r.review.adjustments.length);assert.ok(r.review.warnings.some(w=>w.includes('accent')))
})
test('discovery embeds distinct observed heading and body font files for every HTML format',async()=>{
 const r=await discoverBrand({company:'Example',website},async url=>{
  if(url===website)return {url,type:'text/html',buffer:Buffer.from('<a href="/" title="home"><img src="/logo.svg"></a><style>h1{font-family:Company Display}body{font-family:Company Text}@font-face{font-family:Company Display;src:url(/heading.woff2)}@font-face{font-family:Company Text;src:url(/body.woff2)}</style>')}
  if(url.endsWith('.svg'))return {url,type:'image/svg+xml',buffer:Buffer.from('<svg/>')}
  return {url,type:'font/woff2',buffer:Buffer.from('wOF2'+url)}
 })
 assert.equal(r.fontFaces.length,2);assert.ok(fontFaceCss(r).includes("font-family:'Company Display'"));assert.ok(fontFaceCss(r).includes("font-family:'Company Text'"));assert.equal(normalizeBrand(r).review.checks.visualReviewPerformed,false)
})
test('unknown command phases fail closed',()=>{assert.throws(()=>agentPrompt('DISCOVER_BRAND','untrusted-phase'),/Unknown command phase/)})


test('billing failures are surfaced rather than disguised as successful model selection',async()=>{
 const error=Object.assign(new Error('Request rejected'),{status:400,error:{error:{message:'Your credit balance is too low'}}})
 const r=await curateBrand({company:'Example',website,parsed,logos,baseline,client:{messages:{create:async()=>{throw error}}}})
 assert.equal(r.review.mode,'deterministic-fallback');assert.ok(r.review.warnings.some(w=>w.includes('insufficient credit')))
})
