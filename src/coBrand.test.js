import test from 'node:test'
import assert from 'node:assert/strict'
import {brandLogoHtml} from './brand.js'
import {backstageData} from './coBrand.js'
test('client identity pairs supplied customer logo and Backstage, respecting hideLogo',()=>{
 const logo='data:image/png;base64,aGVsbG8='
 const html=brandLogoHtml({logo})
 assert.ok(html.includes(logo))
 assert.ok(html.includes(backstageData))
 assert.ok(html.includes('×'))
 assert.equal(brandLogoHtml({logo,hideLogo:true}),'')
 assert.equal(brandLogoHtml({}), '')
})
