import * as coBrand from './coBrand.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {transformSync} from 'esbuild'
import * as branding from './brand.js'
function load(name){const compiled=transformSync(fs.readFileSync(new URL('components/'+name,import.meta.url),'utf8'),{loader:'jsx',format:'cjs',tsconfigRaw:{}}).code;const module={exports:{}};new Function('require','module','exports',compiled)(id=>id==='react'?React:id==='../brand.js'?branding:id==='../coBrand.js'?coBrand:id==='./BrandReview.jsx'?{__esModule:true,default:load('BrandReview.jsx')}:id==='./AgentProgress.jsx'?loadAll('AgentProgress.jsx'):{default:()=>null},module,module.exports);return module.exports.default}
// Every export of a component file (AgentProgress exports several).
function loadAll(name){const compiled=transformSync(fs.readFileSync(new URL('components/'+name,import.meta.url),'utf8'),{loader:'jsx',format:'cjs',tsconfigRaw:{}}).code;const module={exports:{}};new Function('require','module','exports',compiled)(id=>id==='react'?React:{},module,module.exports);return module.exports}
const BrandSetup=load('BrandSetup.jsx'),DeckLogo=load('DeckLogo.jsx')
const logo='data:image/svg+xml;base64,'+Buffer.from('<svg/>').toString('base64')
test('setup previews the actual logo and blocks acceptance while discovery runs',()=>{
 const render=brand=>renderToStaticMarkup(React.createElement(BrandSetup,{company:'Example',brand,onChange:()=>{},onScan:()=>{},onContinue:()=>{}}))
 assert.ok(render({logo,status:'ready'}).includes('alt="Example logo"'))
 assert.ok(render({logo,status:'ready'}).includes('Use this branding'))
 assert.ok(render({status:'scanning'}).includes('disabled=""'))
 assert.ok(render({status:'scanning'}).includes('Finding the official website'),'scanning shows the agent steps')
 assert.ok(render({status:'error'}).includes('Continue without a logo'))
})
test('missing company logos never render a Backstage substitute',()=>{
 assert.equal(renderToStaticMarkup(React.createElement(DeckLogo,{brand:{}})),'')
 assert.ok(renderToStaticMarkup(React.createElement(DeckLogo,{brand:{logo}})).includes(logo))
})


test('brand decisions show source choices and fallback status without claiming visual approval',()=>{
 const brand={logo,status:'ready',review:{version:1,mode:'deterministic-fallback',decisions:[{field:'heading font',value:'Company Display',sourceUrl:'https://company.example/styles.css',origin:'observed'}],adjustments:[],warnings:['Font download unavailable'],checks:{}}}
 const html=renderToStaticMarkup(React.createElement(BrandSetup,{company:'Example',brand,onChange:()=>{},onScan:()=>{},onContinue:()=>{}}))
 assert.ok(html.includes('Brand decisions and checks'));assert.ok(html.includes('Company Display'));assert.ok(html.includes('no validated agent selection'));assert.ok(html.includes('not a visual approval'))
})
