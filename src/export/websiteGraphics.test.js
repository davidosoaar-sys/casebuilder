import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { renderWebsiteGraphic as graphic } from './websiteGraphics.js'
import { buildWebsite } from './html.js'

test('charts omit missing and invalid values without inventing zeroes',()=>{
  for(const kind of ['impact','drivers','alternative','comparison']) {
    assert.equal(graphic(kind,[{label:'Empty',value:'',before:null,after:2},{value:NaN},{value:undefined}]),'')
  }
  assert.ok(graphic('impact',[{label:'Known zero',value:0,display:'$0'}]).includes('Known zero'))
})
test('driver proportions reflect current values, escape labels and run standalone',()=>{
  const standalone=vm.runInNewContext('('+String(graphic)+')')
  const rows=[{label:'<script>',value:30,display:'$30'},{label:'Other',value:70,display:'$70'}]
  const html=standalone('drivers',rows)
  assert.ok(html.includes('30.0%'))
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(!html.includes('<script>'))
  assert.ok(graphic('drivers',[{...rows[0],value:70},rows[1]]).includes('50.0%'))
})
test('before/after charts retain separate units and omit incomplete pairs',()=>{
  const html=graphic('comparison',[{label:'Search',unit:'hours',before:3,after:1,beforeDisplay:'3',afterDisplay:'1'},{label:'Unknown',before:2,after:undefined}])
  assert.ok(html.includes('Each row uses its own unit and scale.'))
  assert.ok(html.includes('Search: 3 today; 1 with Portal'))
  assert.ok(!html.includes('Unknown'))
})
test('new graphics and their styling are confined to website exports',()=>{
  const options={company:'Example',slides:[],stakeholders:[],inputs:{},vmSource:''}
  assert.ok(buildWebsite(options).includes('function renderWebsiteGraphic'))
  for(const viewMode of ['pdf','slides']) {
    const html=buildWebsite({...options,viewMode})
    assert.ok(!html.includes('function renderWebsiteGraphic'))
    assert.ok(!html.includes('.website-graphic{'))
  }
})
