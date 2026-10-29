import test from 'node:test'
import assert from 'node:assert/strict'
import {transformSync} from 'esbuild'
import fs from 'node:fs'
import {createRequire} from 'node:module'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'

const require=createRequire(import.meta.url)
function loadComponent(name){
  const source=fs.readFileSync(new URL('components/'+name,import.meta.url),'utf8')
  const compiled=transformSync(source,{loader:'jsx',format:'cjs',tsconfigRaw:{}}).code
  const module={exports:{}}
  const resolve=id=>id.endsWith('.jsx')?loadComponent(id.replace('./','')):id.endsWith('?raw')?fs.readFileSync(new URL('components/'+id.slice(0,-4),import.meta.url),'utf8'):require(id.startsWith('../')?'./'+id.slice(3):id)
  new Function('require','module','exports',compiled)(resolve,module,module.exports)
  return module.exports
}
const PersonLookup=loadComponent('PersonLookup.jsx').default
const claim=value=>({value,sourceUrl:'https://company.example/team',sourceType:'web'})
const person={name:claim('Alex Example'),title:claim('Head of Platform'),company:claim('Example Co'),tenure:claim('2 years'),roleMatch:{key:'champion',role:'Engineering leader',confidence:'medium',why:'Inferred from the sourced title',sourceUrl:'https://company.example/team'},likelyCares:claim('Inferred: platform capacity'),reportsTo:null,reports:[],publicSignals:[],suggestedInputs:[],sourcesUsed:['web'],sourcesSkipped:[{source:'slack',label:'Slack',reason:'disabled'}],candidates:[]}
const result={request:{name:'Alex Example'},status:'done',person}
function render({project,results=[],query='Alex Example'}={}){
  return renderToStaticMarkup(React.createElement(PersonLookup,{project,lookup:{query,setQuery:()=>{},demo:false,setDemo:()=>{},results,run:()=>{},choose:()=>{},busy:false},onAdd:()=>{},onInput:()=>{}}))
}
test('empty lookup keeps a single-line search with a useful empty state',()=>{
  const html=render()
  assert.ok(html.includes('Who’s joining the conversation?'))
  assert.ok(html.includes('Name, email or LinkedIn URL'))
  assert.ok(!html.includes('<textarea'))
  assert.ok(!html.includes('class="mono-label"'))
})

test('lookup shows an internal read-only role map and sourced reporting facts without adding a person',()=>{
  const html=render({project:{name:'Example',stakeholders:[]},results:[{...result,person:{...person,reportsTo:claim('Taylor, CTO')}}]})
  assert.ok(html.includes('Internal stakeholder map'))
  assert.ok(html.includes('Where they fit'))
  assert.ok(html.includes('Seniority and reporting relationships'))
  assert.ok(html.includes('Lines connect roles to the company'))
  assert.ok(html.includes('Taylor, CTO</a>'))
  assert.equal(html.includes('class="map-x"'),false)
  assert.equal(html.includes('class="map-actions"'),false)
})
test('brief keeps per-claim evidence and explicit inference while hiding unsourced claims',()=>{
  const p={...person,publicSignals:[{value:'Unsupported quote'}],likelyCares:{value:'Unsupported personal preference'}}
  const html=render({results:[{...result,person:p}]})
  assert.ok(html.includes('Source for Alex Example'))
  assert.ok(html.includes('Inferred · medium confidence'))
  assert.ok(!html.includes('Unsupported quote'))
  assert.ok(!html.includes('Unsupported personal preference'))
  assert.ok(html.includes('Slack is disabled, so no internal context was used.'))
})
test('Add to deal is available only for an eligible person with a deal',()=>{
  assert.ok(!render({results:[result]}).includes('Add to this deal'))
  assert.ok(render({project:{name:'Example',stakeholders:[]},results:[result]}).includes('Add to this deal'))
  const html=render({project:{name:'Example',stakeholders:[{namedPeople:[{lookupId:'alex example|example co'}]}]},results:[result]})
  assert.ok(/disabled=""[^>]*>Added to deal/.test(html))
})
test('ambiguous and error states retain selection and query without case-write action',()=>{
  const html=render({results:[{...result,person:{...person,candidates:[{name:claim('Alex One'),title:claim('CTO'),company:claim('Example')}]}}]})
  assert.ok(html.includes('Which person do you mean?'))
  assert.ok(html.includes('Choose Alex One'))
  assert.ok(!html.includes('Add to this deal'))
  const error=render({results:[{request:{name:'Alex Example'},status:'error',error:'Agent unavailable'}]})
  assert.ok(error.includes('value="Alex Example"'))
  assert.ok(error.includes('Agent unavailable'))
})


test('public portrait, current role and sourced professional links render without loading remote image URLs',()=>{
 const dataUrl='data:image/png;base64,'+Buffer.from('fixture').toString('base64')
 const p={...person,photo:{dataUrl,sourceUrl:'https://company.example/team'},links:[{label:'GitHub',url:'https://github.com/alex',sourceUrl:'https://company.example/team'}],email:claim('alex@company.example'),linkedin:claim('https://www.linkedin.com/in/alex')}
 const html=render({results:[{...result,person:p}]})
 assert.ok(html.includes('public profile photo'));assert.ok(html.includes('src="'+dataUrl+'"'))
 assert.ok(html.includes('Head of Platform'));assert.ok(html.includes('GitHub'));assert.ok(html.includes('mailto:alex@company.example'));assert.ok(html.includes('linkedin.com/in/alex'))
 const missing=render({results:[{...result,person:{...p,photo:{dataUrl:'https://tracking.example/photo.png',sourceUrl:'https://company.example/team'}}}]})
 assert.ok(!missing.includes('tracking.example'));assert.ok(missing.includes('Photo not found'))
})
