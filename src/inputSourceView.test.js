import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {transformSync} from 'esbuild'
const modules={react:{default:React,...React}}
for(const name of ['valueModel','source','suggest','connectors','inputEditing']) modules['../'+name+'.js']=await import('./'+name+'.js')
const compiled=transformSync(fs.readFileSync(new URL('components/InputSheet.jsx',import.meta.url),'utf8'),{loader:'jsx',format:'cjs',tsconfigRaw:{}}).code
const module={exports:{}}
new Function('require','module','exports',compiled)(id=>modules[id],module,module.exports)
const {SourceLine}=module.exports
const render=state=>renderToStaticMarkup(React.createElement(SourceLine,{field:{key:'engineers',label:'Engineers',value:500,source:{state,origin:'Private origin',quote:'Quoted evidence',link:'https://example.com',pinnedAt:'2026-10-25'}},onState:()=>{},onSuggest:()=>{}}))
test('only suggestion sources have closed, explicit source disclosure',()=>{
 const html=render('suggestion')
 assert.ok(html.includes('Source notes'))
 assert.ok(html.includes('Quoted evidence'))
 assert.ok(!/<details[^>]* open/.test(html))
 for(const state of ['input','assumption']){
  const manual=render(state)
  assert.ok(!manual.includes('Source notes'))
  assert.ok(!manual.includes('Private origin'))
  assert.ok(!manual.includes('https://example.com'))
  assert.ok(manual.includes('state-toggle'))
 }
})
