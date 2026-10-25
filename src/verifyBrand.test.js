import test from 'node:test'
import assert from 'node:assert/strict'
import {assessLogoPixels,verifyBrandForDisplay} from './verifyBrand.js'
const logo='data:image/svg+xml;base64,'+Buffer.from('<svg/>').toString('base64')
test('pixel check rejects transparency and corrects invisible white logos without changing their bytes',async()=>{
 assert.equal(assessLogoPixels([0,0,0,0],'#ffffff').visible,false)
 assert.equal(assessLogoPixels([255,255,255,255],'#ffffff').background,'#111111')
 const brand=await verifyBrandForDisplay({logo,background:'#ffffff'},{logoCheck:async()=>({visible:true,background:'#111111'}),fontCheck:async()=>[]})
 assert.equal(brand.logo,logo);assert.equal(brand.logoBackground,'#111111');assert.equal(brand.review.checks.logoVisible,true);assert.equal(brand.review.checks.visualReviewPerformed,false)
})
test('a decoding failure removes the unusable mark, retains sources and leaves the company-name fallback',async()=>{
 const brand=await verifyBrandForDisplay({logo,sources:['https://company.example/']},{logoCheck:async()=>{throw Error('Decode failed')},fontCheck:async()=>[]})
 assert.equal(brand.logo,'');assert.equal(brand.status,'error');assert.deepEqual(brand.sources,['https://company.example/'])
})
test('unloadable font files are dropped while family names are preserved',async()=>{
 const brand=await verifyBrandForDisplay({logo,headingFont:'Company Display',fontFaces:[{family:'Company Display',data:'data:font/woff2;base64,d09GMg=='}]},{logoCheck:async()=>({visible:true,background:'#111111'}),fontCheck:async()=>[{family:'Company Display',loaded:false}]})
 assert.equal(brand.headingFont,'Company Display');assert.equal(brand.fontFaces.length,0);assert.match(brand.review.warnings[0],/could not load/)
})
test('a sourced visible variant is preferred over a neutral logo field',async()=>{
 const alternative='data:image/svg+xml;base64,'+Buffer.from('<svg><path/></svg>').toString('base64')
 const brand=await verifyBrandForDisplay({logo,background:'#111111',logoVariants:[{logo:alternative,sourceUrl:'https://company.example/brand'}]},{logoCheck:async b=>({visible:true,background:b.logo===alternative?'#111111':'#ffffff'}),fontCheck:async()=>[]})
 assert.equal(brand.logo,alternative);assert.equal(brand.logoBackground,'transparent')
})
