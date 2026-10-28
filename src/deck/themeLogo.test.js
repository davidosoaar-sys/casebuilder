import test from 'node:test'
import assert from 'node:assert/strict'
import {monochromeTone} from './themeLogo.js'
import {templateBrand,chooseDeckTemplate} from './template.js'
import {backstageFor,backstageData} from '../coBrand.js'
test('recognize single-tone transparent ink without flattening multicolor artwork',()=>{
 assert.equal(monochromeTone(new Uint8ClampedArray([0,0,0,255,0,0,0,0])),'black')
 assert.equal(monochromeTone(new Uint8ClampedArray([255,255,255,255,0,0,0,0])),'white')
 assert.equal(monochromeTone(new Uint8ClampedArray([255,0,0,255,0,0,0,0])),null)
 assert.equal(monochromeTone(new Uint8ClampedArray([0,0,0,255,255,255,255,255])),null)
})
test('Backstage is a complete preset and Company styling can be recovered',()=>{
 const original={primary:'#f00000',headingFont:'Company Display',bodyFont:'Company Text'}
 const dark=templateBrand(original,'backstage')
 assert.equal(dark.headingFont,'Outfit')
 assert.equal(dark.bodyFont,'Outfit')
 const styled=chooseDeckTemplate({deck:[{blocks:[{design:{font:'Company Display',color:'#000000'}}]}]},dark)
 assert.equal(styled.deck[0].blocks[0].design.font,undefined)
 assert.equal(templateBrand(dark,'company').headingFont,'Company Display')
 assert.equal(templateBrand(dark,'company').primary,'#f00000')
 assert.equal(backstageFor('#ffffff'),backstageData)
 assert.equal(backstageFor('#111111'),backstageData)
})
