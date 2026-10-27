import test from 'node:test'
import { homepageNamesCompany, ownDomain } from './brand.js'
import assert from 'node:assert/strict'
import {inspectBrandImage,brandPageLinks,brandKitDownloads} from './brandAssets.js'
import {discoverBrand} from './brand.js'
import {decodePublicBody} from './publicWeb.js'
import {gzipSync} from 'node:zlib'
const svg='<svg viewBox="0 0 160 40"><path d="M0 0h160v40H0z"/></svg>'
test('compressed CSS is decoded and decompression is size bounded',()=>{
 const css='body{font-family:Company Sans}',bytes=gzipSync(css)
 assert.equal(decodePublicBody(bytes,'gzip',1000).toString(),css)
 assert.equal(decodePublicBody(bytes,'',1000).toString(),css)
 assert.throws(()=>decodePublicBody(gzipSync('x'.repeat(10000)),'gzip',100))
})
test('rejects disguised images, empty SVGs, active content and low resolution raster logos',()=>{
 for(const [bytes,type] of [[Buffer.from('not a png'),'image/png'],[Buffer.from('<svg/>'),'image/svg+xml'],[Buffer.from('<svg><image href="https://other.example/x"/></svg>'),'image/svg+xml']])assert.throws(()=>inspectBrandImage(bytes,type))
 const png=Buffer.alloc(24);Buffer.from([137,80,78,71,13,10,26,10]).copy(png);png.writeUInt32BE(16,16);png.writeUInt32BE(16,20)
 assert.throws(()=>inspectBrandImage(png,'image/png'),/too small/)
 assert.equal(inspectBrandImage(Buffer.from(svg),'image/svg+xml').vector,true)
})
test('brand resources are official cross-links and downloaded logo variants exclude misuse',()=>{
 const site='https://company.example/'
 assert.deepEqual(brandPageLinks('<a href="/brand-assets">Brand kit</a><a href="https://third.example/brand">Brand kit</a><a href="/legal">Brand guidelines</a>',site),[site+'brand-assets'])
 assert.deepEqual(brandKitDownloads('<a href="/example-primary.svg">Download primary logo</a><a href="/old.svg">Old logo</a>',site,'Example').map(c=>c.url),[site+'example-primary.svg'])
})
test('discovery follows an official brand kit, rejects a broken primary and uses a valid published variant',async()=>{
 const calls=[]
 const brand=await discoverBrand({company:'Example',website:'https://company.example/'},async url=>{
 calls.push(url)
 if(url.endsWith('/brand-assets'))return {url,type:'text/html',buffer:Buffer.from('<a href="/example-primary.png">Download primary logo</a><a href="/example-white.svg">Download full logo</a>')}
 if(url.endsWith('.png'))return {url,type:'image/png',buffer:Buffer.from('html pretending to be png')}
 if(url.endsWith('example-white.svg'))return {url,type:'image/svg+xml',buffer:Buffer.from(svg)}
 if(url==='https://company.example/')return {url,type:'text/html',buffer:Buffer.from('<a href="/brand-assets">Brand kit</a><link rel="icon" href="/favicon.png">')}
 throw Error('Not found')
 })
 assert.ok(brand.logo);assert.equal(brand.review.decisions[0].sourceUrl,'https://company.example/brand-assets')
 assert.equal(brand.review.checks.assetBytesValidated,true);assert.ok(!brand.review.decisions[0].sourceUrl.endsWith('favicon.png'))
})
test('genuinely ambiguous company results return cited choices without selecting a logo',async()=>{
 const urls=['https://first.example/','https://second.example/']
 const client={messages:{stream:()=>({finalMessage:async()=>({content:[{type:'web_search_tool_result',content:urls.map(url=>({url}))},{type:'text',text:JSON.stringify({website:null,candidates:urls.map((website,i)=>({website,name:'Example '+i}))})}]})})}}
 const result=await discoverBrand({company:'Ambiguous name'},()=>{throw Error('Must not fetch a guessed domain')},client)
 assert.equal(result.logo,'');assert.equal(result.companyCandidates.length,2);assert.match(result.message,/Several companies/)
})
test('a company LinkedIn page cannot substitute LinkedIn’s own home-link logo',async()=>{
 const brand=await discoverBrand({company:'Example',website:'https://company.example/'},async url=>({url,type:'text/html',buffer:Buffer.from(url.includes('linkedin.com')?'<a href="/" aria-label="LinkedIn home">'+svg+'</a>':'<a href="https://www.linkedin.com/company/example">LinkedIn</a>')}))
 assert.equal(brand.logo,'');assert.equal(brand.status,'error')
})
test('normal body-font files outrank regular-weight italic variants and video icon fonts',async()=>{
 const requested=[]
 const brand=await discoverBrand({company:'Example',website:'https://company.example/'},async url=>{
 requested.push(url)
 if(url.endsWith('.woff2'))return {url,type:'font/woff2',buffer:Buffer.from('wOF2fixture')}
 return {url,type:'text/html',buffer:Buffer.from('<a href="/" title="home">'+svg+'</a><style>@font-face{font-family:Company Sans;src:url(/italic.woff2);font-weight:400;font-style:italic}@font-face{font-family:Company Sans;src:url(/normal.woff2);font-weight:400;font-style:normal}body{font-family:Company Sans}.vjs-icon{font-family:VideoJS}</style>')}
 })
 assert.equal(brand.headingFont,'Company Sans');assert.ok(requested.includes('https://company.example/normal.woff2'));assert.ok(!requested.includes('https://company.example/italic.woff2'))
})

test('a homepage found from evidence is accepted only if it names the company', () => {
  assert.equal(homepageNamesCompany('<title>The Coca-Cola Company: Refresh the World</title>', 'Coca-Cola'), true)
  assert.equal(homepageNamesCompany('<head><meta property="og:site_name" content="Notion"><title>Your connected workspace</title></head>', 'Notion'), true)
  assert.equal(homepageNamesCompany('<title>Buy this domain</title>', 'Notion'), false)
  assert.equal(homepageNamesCompany('<title>Pepsi</title>', 'Coca-Cola'), false)
  assert.equal(homepageNamesCompany('<title>A</title>', 'A'), false, 'one-letter names never match')
})

test('only the company\'s own domain counts, never a subdomain of another site', () => {
  for (const h of ['tesla.com', 'www.tesla.com', 'tesla.co.uk', 'notion.so', 'coca-colacompany.com']) assert.equal(ownDomain(h, h.startsWith('coca') ? 'Coca-Cola' : h.replace(/^www\./, '').split('.')[0]), true, h)
  for (const [h, c] of [['tesla.wegic.app', 'Tesla'], ['apple.fandom.com', 'Apple'], ['notapple.com', 'Apple'], ['visa.gov.example.org', 'Visa']]) assert.equal(ownDomain(h, c), false, h)
})

test('replacement assets use the discovery byte checks and reject unsafe sources', async () => {
 const {fetchBrandAsset}=await import('./brandAssets.js')
 const fetcher=async url=>({url,type:'image/svg+xml',buffer:Buffer.from(svg)})
 const result=await fetchBrandAsset('https://company.example/logo.svg','logo',fetcher)
 assert.match(result.data,/^data:image\/svg\+xml;base64,/)
 assert.equal(result.source,'https://company.example/logo.svg')
 await assert.rejects(fetchBrandAsset('http://company.example/logo.svg','logo',fetcher),/HTTPS/)
 await assert.rejects(fetchBrandAsset('https://127.0.0.1/logo.svg','logo',fetcher),/HTTPS/)
 await assert.rejects(fetchBrandAsset('https://company.example/logo.svg','heroImage',fetcher),/PNG/)
 await assert.rejects(fetchBrandAsset('https://company.example/logo.png','logo',async url=>({url,type:'image/png',buffer:Buffer.from('not an image')})))
 await assert.rejects(fetchBrandAsset('https://company.example/logo.svg','logo',async url=>({url,type:'image/svg+xml',buffer:Buffer.from('<svg viewBox="0 0 160 40"><path onclick="bad()"/></svg>')})),/active content/)
})

test('a hero image can come from the public page it is published on', async () => {
 const {fetchBrandAsset}=await import('./brandAssets.js')
 const png=Buffer.alloc(64);Buffer.from([137,80,78,71,13,10,26,10]).copy(png);png.write('IHDR',12);png.writeUInt32BE(1200,16);png.writeUInt32BE(600,20);png.write('IDAT',32);png.write('IEND',48)
 const fetcher=async url=>url.endsWith('.png')?{url,type:'image/png',buffer:png}:{url,type:'text/html; charset=utf-8',buffer:Buffer.from('<meta property="og:image" content="/media/hero.png">')}
 const result=await fetchBrandAsset('https://company.example/about','heroImage',fetcher)
 assert.equal(result.source,'https://company.example/media/hero.png')
 assert.match(result.data,/^data:image\/png;base64,/)
 await assert.rejects(fetchBrandAsset('https://company.example/about','logo',fetcher),/web page/)
 await assert.rejects(fetchBrandAsset('https://company.example/about','heroImage',async url=>({url,type:'text/html',buffer:Buffer.from('<p>none</p>')})),/no usable/)
})
