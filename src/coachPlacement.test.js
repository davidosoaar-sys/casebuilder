import test from 'node:test'
import assert from 'node:assert/strict'
import {coachPlacement} from './coachPlacement.js'
test('coach stays in viewport beside a desktop action and below a mobile action',()=>{
 for(const width of [1280,390]){
  const r={left:40,right:160,top:60,bottom:100},p=coachPlacement(r,330,220,{width,height:800})
  assert.ok(p.left>=16&&p.top>=16)
  assert.ok(p.left+Math.min(330,width-32)<=width-16)
  assert.ok(p.top+220<=784)
  assert.ok(p.left>=r.right||p.top>=r.bottom)
 }
})
