import test from 'node:test'
import assert from 'node:assert/strict'
import PptxGenJS from 'pptxgenjs'
import JSZip from 'jszip'
import {googleSlideFont} from './googleSlideFont.js'
import {ensureImagery} from './ensureImagery.js'
import {buildPptx} from './pptx.js'
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='

test('Google fonts remain exact, proprietary names become a disclosed Poppins fallback',()=>{
 assert.equal(googleSlideFont('Outfit').family,'Outfit')
 assert.equal(googleSlideFont('Roboto').family,'Roboto')
 assert.equal(googleSlideFont('Georgia').family,'Georgia')
 assert.deepEqual(googleSlideFont('SF Pro Text'),{requested:'SF Pro Text',family:'Poppins',substituted:true})
})
test('old covers include the side photo and compatible images with editable Google font text',async()=>{
 const brand={headingFont:'Private Brand Face',bodyFont:'Roboto',heroImage:'data:image/webp;base64,aGVsbG8=',heroAlt:'Campaign'}
 const before=JSON.stringify(brand);let converted=0
 const file=await buildPptx({company:'Example',brand,slides:[{variant:'hero',blocks:[{kind:'logo'},{kind:'text',style:'hero',text:'Example'},{kind:'text',style:'lede',text:'Business case'}]}],deps:{PptxGenJS,importTarget:'google-slides',compatibleImage:async src=>{assert.equal(src,brand.heroImage);converted++;return png},logoPng:async()=>({data:png,ratio:1})}})
 const zip=await JSZip.loadAsync(await file.write({outputType:'nodebuffer'}))
 const xml=await zip.file('ppt/slides/slide1.xml').async('string')
 assert.equal(converted,1)
 assert.ok((xml.match(/<p:pic>/g)||[]).length>=3)
 assert.match(xml,/typeface="Poppins"/);assert.match(xml,/typeface="Roboto"/)
 assert.ok(file.casebuilderFontWarnings.some(w=>w.includes('Private Brand Face')))
 assert.equal(Object.keys(zip.files).some(f=>f.endsWith('.webp')),false)
 assert.equal(JSON.stringify(brand),before)
})
test('image-only research fills missing imagery without replacing authored fonts or colors',async()=>{
 const brand={headingFont:'My font',primary:'#123456',website:'https://example.com/'}
 const found=await ensureImagery({company:'Example',brand,headers:async()=>({}),fetchImpl:async()=>({ok:true,json:async()=>({heroImage:png,heroSource:'https://example.com/photo',headingFont:'Research font',primary:'#abcdef'})})})
 assert.equal(found.brand.headingFont,'My font');assert.equal(found.brand.primary,'#123456');assert.equal(found.patch.heroImage,png)
 assert.equal(brand.heroImage,undefined)
})
test('existing/explicitly removed images are not replaced and failed discovery is disclosed',async()=>{
 for(const brand of [{heroImage:png},{heroImageHidden:true}])await ensureImagery({company:'Example',brand,fetchImpl:()=>assert.fail('Research should not run')})
 const result=await ensureImagery({company:'Example',brand:{headingFont:'My font'},headers:async()=>({}),fetchImpl:async()=>{throw Error('Offline')}})
 assert.match(result.warning,/Offline/);assert.equal(result.brand.headingFont,'My font');assert.equal(result.patch,undefined)
})
